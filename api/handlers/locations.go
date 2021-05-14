package handlers

import (
	"encoding/json"
	"github.com/gin-gonic/gin"
	log "github.com/sirupsen/logrus"
	"io/ioutil"
	"net/http"
)

var geoMapping map[string]geoLocation
var locations []location

func Locations(c *gin.Context) {
	dropDownLocations, err := fetchDropDownLocations()
	if err != nil {
		c.JSON(500, nil)
		return
	}

	activeResp, err := fetchActiveLocations()
	var activeMapping = make(map[string]activeLocation)
	if err != nil {
		c.JSON(500, nil)
		return
	}
	for _, location := range activeResp.Locations {
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

	c.JSON(200, fullLocationResp{
		VaccinationGroup:   activeResp.VaccinationGroup,
		LastRefresh:        activeResp.LastRefresh,
		RefreshIntervalSec: activeResp.RefreshIntervalSec,
		Locations:          enhancedLocations,
	})
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
	plan, _ := ioutil.ReadFile("locationMapping.json") //todo map from configmap
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
