package locations

import (
	"context"
	"encoding/json"
	"fmt"
	"github.com/gin-gonic/gin"
	"github.com/golonzovsky/vacme/prometheus"
	log "github.com/sirupsen/logrus"
	"io/ioutil"
	"net/http"
	"os"
	"sync"
	"time"
)

var apiBase = os.Getenv("PARSER_API_BASE") //todo extract to config viper

var respCache = RespCache{data: &fullLocationResp{LocationResponseMetadata: &LocationResponseMetadata{}}}
var httpClient = &http.Client{Timeout: 3 * time.Second}

// todo move state to struct

type RespCache struct {
	mu   sync.Mutex
	data *fullLocationResp
}

func (resp fullLocationResp) timeTillNextRefresh() time.Duration {
	nextRefreshTime := time.Unix(resp.LastRefresh/1000, resp.LastRefresh%1000).Add(time.Second * time.Duration(resp.RefreshIntervalSec))
	return nextRefreshTime.Sub(time.Now())
}

func (resp fullLocationResp) isValid() bool {
	if resp.LastRefresh == 0 {
		log.Debugf("initial cache warmup")
		return false
	}

	tillNextRefresh := resp.timeTillNextRefresh()
	refreshIsInFuture := tillNextRefresh > 0
	if refreshIsInFuture {
		log.Debugf("time till next refresh %s", tillNextRefresh)
		prometheus.DataStaleForMs.Set(0)
	} else {
		log.Debugf("data is stale for %s, refreshing", -tillNextRefresh)
		prometheus.DataStaleForMs.Set(-tillNextRefresh.Seconds())
	}
	return resp.timeTillNextRefresh() > 0
}

func (resp fullLocationResp) initialized() bool {
	return resp.LastRefresh != 0
}

func Handler(c *gin.Context) {
	locations, err := getLocations(c)
	if err != nil {
		log.Warn(err)
	}

	if locations != nil {
		c.JSON(200, locations)
	} else {
		c.JSON(500, nil)
	}
}

func getLocations(ctx context.Context) (*fullLocationResp, error) {
	respCache.mu.Lock() //todo this is naive locking. improve
	defer respCache.mu.Unlock()
	defer updatePrometheus()

	if respCache.data.isValid() {
		return respCache.data, nil
	}

	resp, err := fetchLocationData(ctx)
	if err == nil {
		respCache.data = resp
		return respCache.data, nil
	}

	if respCache.data.initialized() {
		log.Warnf("downstream call failed %s, but we have stale data to return", err)
		return respCache.data, fmt.Errorf("downstream call failed %s, but we have stale data to return", err)
	}

	return nil, fmt.Errorf("downstream call failed %s, and we dont have stale data to return", err)
}

func updatePrometheus() {
	prometheus.LocationsTotalCount.Set(float64(len(respCache.data.Locations)))

	var activeLocations int
	for _, loc := range respCache.data.Locations {
		if loc.activeLocation.SecondDate != 0 {
			activeLocations++
		}
	}
	prometheus.LocationsActiveCount.Set(float64(activeLocations))
}

func fetchLocationData(ctx context.Context) (*fullLocationResp, error) {
	var dropDownLocations, dropDownLocationsErr = fetchDropDownLocations(ctx)
	if dropDownLocationsErr != nil {
		return nil, dropDownLocationsErr
	}

	metadata, activeLocationByName, activeLocationErr := fetchActiveLocationsMapping(ctx)
	if activeLocationErr != nil {
		return nil, activeLocationErr
	}

	var enhancedLocations = make([]location, 0)
	for _, loc := range dropDownLocations {
		geoInfo, _ := geoByName(loc.Name)
		activeLoc, _ := activeLocationByName[loc.Name]
		enhancedLocations = append(enhancedLocations, location{
			Id:             loc.Id,
			Name:           loc.Name,
			NoFreeSlot:     loc.NoFreeSlot,
			geoLocation:    geoInfo,
			activeLocation: &activeLoc,
		})
	}

	resp := fullLocationResp{
		LocationResponseMetadata: metadata,
		Locations:                enhancedLocations,
	}
	prometheus.LastSuccessfulFetchTime.SetToCurrentTime()
	return &resp, nil
}

func fetchActiveLocationsMapping(ctx context.Context) (*LocationResponseMetadata, map[string]activeLocation, error) {
	var activeLocationResp, activeLocationErr = fetchActiveLocations(ctx)
	if activeLocationErr != nil {
		return nil, nil, activeLocationErr
	}

	var activeMapping = make(map[string]activeLocation)
	for _, location := range activeLocationResp.Locations {
		activeMapping[location.Name] = location
	}

	return activeLocationResp.LocationResponseMetadata, activeMapping, nil
}

func fetchDropDownLocations(ctx context.Context) ([]location, error) {
	req, err := http.NewRequest(http.MethodGet, apiBase+"/api/locations", nil)
	if err != nil {
		return nil, err
	}
	req = req.WithContext(ctx)
	httpResp, err := httpClient.Do(req)
	if err != nil {
		return nil, err
	}
	defer httpResp.Body.Close()
	body, err := ioutil.ReadAll(httpResp.Body)
	if err != nil {
		return nil, err
	}

	var locations []location
	jsonErr := json.Unmarshal(body, &locations)
	if jsonErr != nil {
		return nil, jsonErr
	}
	return locations, nil
}

func fetchActiveLocations(ctx context.Context) (*activeLocationResponse, error) {
	req, err := http.NewRequest(http.MethodGet, apiBase+"/api/", nil)
	if err != nil {
		return nil, err
	}
	req = req.WithContext(ctx)
	httpResp, err := httpClient.Do(req)
	if err != nil {
		return nil, err
	}
	defer httpResp.Body.Close()
	body, err := ioutil.ReadAll(httpResp.Body)
	if err != nil {
		return nil, err
	}

	var resp activeLocationResponse
	jsonErr := json.Unmarshal(body, &resp)
	if jsonErr != nil {
		return nil, jsonErr
	}
	return &resp, nil
}

type activeLocation struct {
	Name       string `json:"name"`
	FirstDate  int64  `json:"firstDate,omitempty"`
	SecondDate int64  `json:"secondDate,omitempty"`
}

type location struct {
	Name       string `json:"name"`
	Id         string `json:"id"`
	NoFreeSlot bool   `json:"noFreieTermine"`
	*activeLocation
	*geoLocation
}

type LocationResponseMetadata struct {
	VaccinationGroup   string `json:"vaccination_group"`
	LastRefresh        int64  `json:"last_refresh"`
	RefreshIntervalSec int    `json:"refresh_interval_sec"`
}

type fullLocationResp struct {
	*LocationResponseMetadata
	Locations []location `json:"locations"`
}

type activeLocationResponse struct {
	*LocationResponseMetadata
	Locations []activeLocation `json:"locations"`
}
