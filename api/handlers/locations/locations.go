package locations

import (
	"encoding/json"
	"fmt"
	"github.com/gin-gonic/gin"
	"github.com/golonzovsky/vacme/handlers"
	log "github.com/sirupsen/logrus"
	"io/ioutil"
	"net/http"
	"sync"
	"time"
)

const apiBase = "http://vacme-parser:5000" //todo extract to config viper
//const apiBase = "http://localhost:5000"

var respCache = RespCache{data: &fullLocationResp{LocationResponseMetadata: &LocationResponseMetadata{}}}

type RespCache struct {
	mu   sync.Mutex
	data *fullLocationResp
}

func (resp *fullLocationResp) isValid() bool {
	if resp.LastRefresh == 0 {
		log.Debugf("initial cache warmup")
		return false
	}

	nextRefresh := time.Unix(resp.LastRefresh/1000, resp.LastRefresh%1000).Add(time.Second * time.Duration(resp.RefreshIntervalSec))
	refreshIsInFuture := time.Now().Before(nextRefresh)

	if refreshIsInFuture {
		log.Debugf("time till next refresh %s", nextRefresh.Sub(time.Now()))
	} else {
		log.Debugf("data is stale for %s, refreshing", time.Now().Sub(nextRefresh))
	}
	return refreshIsInFuture
}

func (resp *fullLocationResp) initialized() bool {
	return resp.LastRefresh != 0
}

func Locations(c *gin.Context) {
	locations, err := getLocations()
	if err != nil {
		log.Warn(err)
	}

	if locations != nil {
		c.JSON(200, locations)
	} else {
		c.JSON(500, nil)
	}
}

func getLocations() (*fullLocationResp, error) {
	respCache.mu.Lock() //todo this is naive locking. improve
	defer respCache.mu.Unlock()
	defer updatePrometheus()

	if respCache.data.isValid() {
		return respCache.data, nil
	}

	resp, err := fetchLocationData()
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
	handlers.LocationsTotalCount.Set(float64(len(respCache.data.Locations)))

	var activeLocations int
	for _, loc := range respCache.data.Locations {
		if loc.activeLocation.SecondDate != 0 {
			activeLocations++
		}
	}
	handlers.LocationsActiveCount.Set(float64(activeLocations))
}

func fetchLocationData() (*fullLocationResp, error) {
	var dropDownLocations, dropDownLocationsErr = fetchDropDownLocations()
	if dropDownLocationsErr != nil {
		return nil, dropDownLocationsErr
	}

	metadata, activeLocationByName, activeLocationErr := fetchActiveLocationsMapping()
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
	handlers.LastSuccessfulFetchTime.SetToCurrentTime()
	return &resp, nil
}

func fetchActiveLocationsMapping() (*LocationResponseMetadata, map[string]activeLocation, error) {
	var activeLocationResp, activeLocationErr = fetchActiveLocations()
	if activeLocationErr != nil {
		return nil, nil, activeLocationErr
	}

	var activeMapping = make(map[string]activeLocation)
	for _, location := range activeLocationResp.Locations {
		activeMapping[location.Name] = location
	}

	return activeLocationResp.LocationResponseMetadata, activeMapping, nil
}

func fetchDropDownLocations() ([]location, error) {
	httpResp, err := http.Get(apiBase + "/api/locations")
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

func fetchActiveLocations() (*activeLocationResponse, error) {
	httpResp, err := http.Get(apiBase + "/api/")
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
