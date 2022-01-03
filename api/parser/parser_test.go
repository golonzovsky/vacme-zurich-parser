package parser

import (
	"context"
	"errors"
	"net/http"
	"net/http/httptest"
	"testing"
)

const (
	validRes = ` 
{"access_token":"access_token_value",
 "expires_in":300,
 "refresh_expires_in":1800,
 "refresh_token":"refresh_token_value",
 "token_type":"bearer",
 "id_token":"id_token_value",
 "not-before-policy":0,
 "session_state":"72bfd5ff-65b1-4e7f-b67f-ea17aeecdc98",
 "scope":"openid profile email"}`
	invalidTokenRes = `{"error":"invalid_grant","error_description":"Invalid refresh token"}`
	blockedRes      = `<iframe src="/lb/403.html"/>`
	captchaRes      = `<!-- CAPTCHA -->`
)

func TestRefreshToken(t *testing.T) {
	data := []struct {
		name                string
		response            string
		responseCode        int
		responseContentType string
		err                 error
	}{
		{"200", validRes, http.StatusOK, "application/json", nil},
		{"400 invalid token", invalidTokenRes, http.StatusBadRequest, "application/json", errors.New("Invalid refresh token")},
		{"403 blocked", blockedRes, http.StatusForbidden, "application/json", errors.New("IP blocked, recreate NAT ip")},
		{"200 captcha", captchaRes, http.StatusOK, "text/html", errors.New("captcha need to be solved")},
		{"unexpected status", "", http.StatusNoContent, "application/json", errors.New("unexpected token refresh error")},
		// remaining cases
	}
	for _, d := range data {
		t.Run(d.name, func(t *testing.T) {

			server := httptest.NewServer(
				http.HandlerFunc(func(rw http.ResponseWriter, req *http.Request) {
					rw.Header().Add("content-type", d.responseContentType)
					rw.WriteHeader(d.responseCode)
					rw.Write([]byte(d.response))
				}))

			parser := &VacmeParser{
				server.URL,
				"refresh_token_for_test",
				"",
				"EQQQQQ",
				*server.Client(),
			}

			err := parser.doRefreshToken(context.Background())

			if d.err == nil && err != nil {
				t.Errorf("unexpected error: `%s`", err)
			}
			if d.err != nil && err == nil {
				t.Errorf("missine error: `%s`", d.err)
			}
			if d.err != nil && err != nil && d.err.Error() != err.Error() {
				t.Errorf("unexpected error message `%s`, expected `%s`", err, d.err)
			}
			if d.err == nil && parser.accessToken != "access_token_value" {
				t.Errorf("token parsing failure `%s`, expected `access_token_value`", parser.accessToken)
			}

			server.Close()
		})
	}

}
