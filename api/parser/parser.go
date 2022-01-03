package parser

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	log "github.com/sirupsen/logrus"
	"io/ioutil"
	"net/http"
	"net/url"
	"os"
	"strings"
	"time"
)

type VacmeParser struct {
	refreshTokenUrl string

	refreshToken   string
	accessToken    string
	registrationId string
	httpClient     http.Client
}

func NewVacmeParser() *VacmeParser {
	refreshToken := os.Getenv("refresh_token")
	registrationId := os.Getenv("registration_id")
	return &VacmeParser{
		"https://zh.vacme.ch/auth/realms/vacme/protocol/openid-connect/token",
		refreshToken,
		"",
		registrationId,
		http.Client{Timeout: 3 * time.Second},
	}
}

func (p *VacmeParser) ensureToken(ctx context.Context) error {
	if p.accessToken == "" {
		return p.doRefreshToken(ctx)
	}
	return nil
}

func (p *VacmeParser) invalidateRefreshToken() {
	p.refreshToken = ""
	// todo update token secret
}

func (p *VacmeParser) doRefreshToken(ctx context.Context) error {
	if p.refreshToken == "" {
		return errors.New("refresh token absent. Need relogin")
	}

	req, err := p.buildRefreshTokenReq(ctx)
	if err != nil {
		return err
	}
	httpResp, err := p.httpClient.Do(req)
	if err != nil {
		return err
	}
	defer httpResp.Body.Close()

	bodyBytes, err := ioutil.ReadAll(httpResp.Body)
	if err != nil {
		return err
	}
	body := string(bodyBytes)
	if httpResp.StatusCode == 403 && strings.Contains(body, "<iframe src=\"/lb/403.html") {
		log.Errorf("token refresh failed. IP is blocked, please recreate NAT ip. status %d", httpResp.StatusCode)
		//todo change NAT ip programmatically here
		p.invalidateRefreshToken()
		return errors.New("IP blocked, recreate NAT ip")
	}
	if httpResp.StatusCode == 400 {
		errorResponse := &errorRes{}
		err = json.Unmarshal([]byte(body), &errorResponse)
		if err != nil {
			log.Errorf("error parsing 400 error response %e", err)
		}
		log.Errorf("400 error on refresh token: %s (%s)", errorResponse.Error, errorResponse.ErrorDescription)
		p.invalidateRefreshToken()
		return errors.New(errorResponse.ErrorDescription)
	}
	if httpResp.StatusCode != 200 {
		log.Errorf("token refresh failed. status:%d, headers:%v, text:%s", httpResp.StatusCode, httpResp.Header, body)
		p.invalidateRefreshToken()
		return errors.New("unexpected token refresh error")
	}
	if httpResp.Header.Get("content-type") == "text/html" && strings.Contains(body, "<!-- CAPTCHA -->") {
		//todo extract captcha gif and call captcha solver model here
		return errors.New("captcha need to be solved")
	}
	res := refreshTokenRes{}
	err = json.Unmarshal([]byte(body), &res)
	if err != nil {
		return err
	}

	p.accessToken = res.AccessToken
	// todo update token secret

	log.Infof("update access token successful, expires in %d; refresh expires in %d",
		res.ExpiresIn, res.RefreshExpiresIn)

	return nil
}

func (p *VacmeParser) buildRefreshTokenReq(ctx context.Context) (*http.Request, error) {
	form := url.Values{}
	form.Add("grant_type", "refresh_token")
	form.Add("refresh_token", p.refreshToken)
	form.Add("client_id", "vacme-initial-app-prod")
	req, err := http.NewRequest(http.MethodPost, p.refreshTokenUrl, strings.NewReader(form.Encode()))
	req.Header.Add("Content-Type", "application/x-www-form-urlencoded")
	if err != nil {
		return nil, err
	}
	return req.WithContext(ctx), nil
}

func (p *VacmeParser) authHeader() string {
	return fmt.Sprintf("Bearer %s", p.accessToken)
}

type refreshTokenRes struct {
	AccessToken      string `json:"access_token"`
	ExpiresIn        int    `json:"expires_in"`
	RefreshExpiresIn int    `json:"refresh_expires_in"`
	RefreshToken     string `json:"refresh_token"`
	TokenType        string `json:"token_type"`
	IdToken          string `json:"id_token"`
	NotBeforePolicy  int    `json:"not-before-policy"`
	SessionState     string `json:"session_state"`
	Scope            string `json:"scope"`
}

type errorRes struct {
	Error            string `json:"error"`
	ErrorDescription string `json:"error_description"`
}
