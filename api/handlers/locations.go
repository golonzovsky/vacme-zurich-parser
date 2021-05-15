package handlers

import (
	"encoding/json"
	"github.com/gin-gonic/gin"
	log "github.com/sirupsen/logrus"
	"io/ioutil"
	"net/http"
	"sync"
	"time"
)

var geoMapping map[string]geoLocation
var respCache = RespCache{data: &fullLocationResp{}}

type RespCache struct {
	mu   sync.Mutex
	data *fullLocationResp
}

func (resp *fullLocationResp) isValid() bool {
	nextRefresh := time.Unix(resp.LastRefresh/1000, resp.LastRefresh%1000).Add(time.Second * time.Duration(resp.RefreshIntervalSec))
	log.Debugf("next refresh %s, now is %s", nextRefresh, time.Now())
	return time.Now().Before(nextRefresh)
}

func Locations(c *gin.Context) {

	respCache.mu.Lock()
	defer respCache.mu.Unlock()

	if !respCache.data.isValid() {
		resp, err := fetchLocationData()
		if err != nil {
			c.JSON(500, nil)
			return
		}
		respCache.data = resp
	}

	c.JSON(200, respCache.data)
}

func fetchLocationData() (*fullLocationResp, error) {
	var wg = &sync.WaitGroup{} // todo this parallel run is fun, but kinda useless
	wg.Add(2)

	var dropDownLocationsErr, activeLocationErr error

	var dropDownLocations []location
	go func() {
		defer wg.Done()
		dropDownLocations, dropDownLocationsErr = fetchDropDownLocations()
	}()

	var activeLocationResp *activeLocationResponse
	go func() {
		defer wg.Done()
		activeLocationResp, activeLocationErr = fetchActiveLocations()
	}()

	wg.Wait()

	if dropDownLocationsErr != nil {
		return nil, dropDownLocationsErr
	}
	if activeLocationErr != nil {
		return nil, activeLocationErr
	}

	var activeMapping = make(map[string]activeLocation)
	for _, location := range activeLocationResp.Locations {
		activeMapping[location.Name] = location
	}

	var enhancedLocations []location
	for _, loc := range dropDownLocations {
		geoData, ok := geoMapping[loc.Name]
		if !ok {
			log.Warnf("missing location in GEO mapping '%s'", loc.Name)
			//todo use place API to fetch geo here
		}
		active, _ := activeMapping[loc.Name]
		enhancedLocations = append(enhancedLocations, location{
			Id:             loc.Id,
			Name:           loc.Name,
			NoFreeSlot:     loc.NoFreeSlot,
			geoLocation:    &geoData,
			activeLocation: &active,
		})
	}

	resp := fullLocationResp{
		VaccinationGroup:   activeLocationResp.VaccinationGroup,
		LastRefresh:        activeLocationResp.LastRefresh,
		RefreshIntervalSec: activeLocationResp.RefreshIntervalSec,
		Locations:          enhancedLocations,
	}
	return &resp, nil
}

func fetchDropDownLocations() ([]location, error) {
	//resp, err := http.Get("http://vacme-parser:5000/api/locations") todo switch to internal and hide python
	resp, err := http.Get("https://vacme.kloud.top/api/locations")
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()
	body, err := ioutil.ReadAll(resp.Body)
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
	//resp, err := http.Get("http://vacme-parser:5000/api/") todo switch to internal and hide python
	httpResp, err := http.Get("https://vacme.kloud.top/api/")
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
	FirstDate  int64  `json:"first_date,omitempty"`
	SecondDate int64  `json:"second_date,omitempty"`
}

type geoLocation struct {
	Name      string  `json:"name"`
	Latitude  float64 `json:"latitude,omitempty"`
	Longitude float64 `json:"longitude,omitempty"`
	Link      string  `json:"link,omitempty"`
}

type location struct {
	Name       string `json:"name"`
	Id         string `json:"id"`
	NoFreeSlot bool   `json:"noFreieTermine"`
	*activeLocation
	*geoLocation
}

type fullLocationResp struct {
	VaccinationGroup   string `json:"vaccination_group"`
	LastRefresh        int64  `json:"last_refresh"`
	RefreshIntervalSec int    `json:"refresh_interval_sec"`
	Locations          []location
}

type activeLocationResponse struct {
	VaccinationGroup   string `json:"vaccination_group"`
	LastRefresh        int64  `json:"last_refresh"`
	RefreshIntervalSec int    `json:"refresh_interval_sec"`
	Locations          []activeLocation
}

func init() {
	var geoLocations []geoLocation
	plan, _ := ioutil.ReadFile("/home/ax/project/next/vacme/api/locationMapping.json") //todo map from configmap
	err := json.Unmarshal(plan, &geoLocations)
	if err != nil {
		log.Fatal("Location mapping seed read failure", err)
	}

	var mapping = make(map[string]geoLocation)
	for _, location := range geoLocations {
		mapping[location.Name] = location
	}
	geoMapping = mapping

}
