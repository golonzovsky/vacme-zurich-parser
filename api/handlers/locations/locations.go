package locations

import (
	"context"
	"encoding/json"
	"fmt"
	"github.com/gin-gonic/gin"
	log "github.com/sirupsen/logrus"
	"io/ioutil"
	"net/http"
	"sync"
	"time"
)

type Fetcher struct {
	apiBase     string
	cache       RespCache
	httpClient  http.Client
	placeClient *PlaceClient
}

type RespCache struct {
	mu   sync.Mutex
	data *fullLocationsResp
}

func NewFetcher(parserApiBase string, placeApiKey string, seedPlaceMappingLocation string) *Fetcher {
	return &Fetcher{
		parserApiBase,
		RespCache{data: &fullLocationsResp{LocationResponseMetadata: &LocationResponseMetadata{}}},
		http.Client{Timeout: 3 * time.Second},
		NewPlaceClient(placeApiKey, seedPlaceMappingLocation),
	}
}

func (resp fullLocationsResp) timeTillNextRefresh() time.Duration {
	nextRefreshTime := time.Unix(resp.LastRefresh/1000, resp.LastRefresh%1000).Add(time.Second * time.Duration(resp.RefreshIntervalSec))
	return nextRefreshTime.Sub(time.Now())
}

func (resp fullLocationsResp) isValid() bool {
	if resp.LastRefresh == 0 {
		log.Debugf("initial cache warmup") // todo why are you there??
		return false
	}

	tillNextRefresh := resp.timeTillNextRefresh()
	refreshIsInFuture := tillNextRefresh > 0
	if refreshIsInFuture {
		log.Debugf("time till next refresh %s", tillNextRefresh)
		DataStaleForMs.Set(0) // todo why are you there??
	} else {
		log.Debugf("data is stale for %s, refreshing", -tillNextRefresh)
		DataStaleForMs.Set(-tillNextRefresh.Seconds())
	}
	return resp.timeTillNextRefresh() > 0
}

func (resp fullLocationsResp) initialized() bool {
	return resp.LastRefresh != 0
}

func (f *Fetcher) Handler(c *gin.Context) {
	locations, err := f.getLocations(c)
	if err != nil {
		log.Warn(err)
	}

	if locations != nil {
		c.JSON(200, locations)
	} else {
		c.JSON(500, nil)
	}
}

func (f *Fetcher) getLocations(ctx context.Context) (*fullLocationsResp, error) {
	f.cache.mu.Lock() //todo this is naive locking. improve
	defer f.cache.mu.Unlock()
	defer f.updatePrometheus()

	if f.cache.data.isValid() {
		return f.cache.data, nil
	}

	resp, err := f.fetchLocationData(ctx)
	if err == nil {
		f.cache.data = resp
		return f.cache.data, nil
	}

	if f.cache.data.initialized() {
		log.Warnf("downstream call failed %s, but we have stale data to return", err)
		return f.cache.data, fmt.Errorf("downstream call failed %s, but we have stale data to return", err)
	}

	return nil, fmt.Errorf("downstream call failed %s, and we dont have stale data to return", err)
}

func (f *Fetcher) updatePrometheus() {
	TotalCount.Set(float64(len(f.cache.data.Locations)))

	var activeLocations int
	for _, loc := range f.cache.data.Locations {
		if loc.activeLocation.SecondDate != 0 {
			activeLocations++
		}
	}
	ActiveCount.Set(float64(activeLocations))
}

func (f *Fetcher) fetchLocationData(ctx context.Context) (*fullLocationsResp, error) {
	var dropDownLocations, dropDownLocationsErr = f.fetchDropDownLocations(ctx)
	if dropDownLocationsErr != nil {
		return nil, dropDownLocationsErr
	}

	metadata, activeLocationByName, activeLocationErr := f.fetchActiveLocationsMapping(ctx)
	if activeLocationErr != nil {
		return nil, activeLocationErr
	}

	var enhancedLocations = make([]location, 0)
	for _, loc := range dropDownLocations {
		geoInfo, _ := f.placeClient.LocationByName(loc.Name)
		activeLoc, _ := activeLocationByName[loc.Name]
		enhancedLocations = append(enhancedLocations, location{
			Id:             loc.Id,
			Name:           loc.Name,
			NoFreeSlot:     loc.NoFreeSlot,
			GeoLocation:    geoInfo,
			activeLocation: &activeLoc,
		})
	}

	resp := fullLocationsResp{
		LocationResponseMetadata: metadata,
		Locations:                enhancedLocations,
	}
	LastSuccessfulFetchTime.SetToCurrentTime()
	return &resp, nil
}

func (f *Fetcher) fetchActiveLocationsMapping(ctx context.Context) (*LocationResponseMetadata, map[string]activeLocation, error) {
	var activeLocationResp, activeLocationErr = f.fetchActiveLocations(ctx)
	if activeLocationErr != nil {
		return nil, nil, activeLocationErr
	}

	var activeMapping = make(map[string]activeLocation)
	for _, location := range activeLocationResp.Locations {
		activeMapping[location.Name] = location
	}

	return activeLocationResp.LocationResponseMetadata, activeMapping, nil
}

func (f *Fetcher) fetchDropDownLocations(ctx context.Context) ([]location, error) {
	req, err := http.NewRequest(http.MethodGet, f.apiBase+"/api/locations", nil)
	if err != nil {
		return nil, err
	}
	req = req.WithContext(ctx)
	httpResp, err := f.httpClient.Do(req)
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

func (f *Fetcher) fetchActiveLocations(ctx context.Context) (*activeLocationResponse, error) {
	req, err := http.NewRequest(http.MethodGet, f.apiBase+"/api/", nil)
	if err != nil {
		return nil, err
	}
	req = req.WithContext(ctx)
	httpResp, err := f.httpClient.Do(req)
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
	*GeoLocation
}

type LocationResponseMetadata struct {
	VaccinationGroup   string `json:"vaccination_group"`
	LastRefresh        int64  `json:"last_refresh"`
	RefreshIntervalSec int    `json:"refresh_interval_sec"`
}

type fullLocationsResp struct {
	*LocationResponseMetadata
	Locations []location `json:"locations"`
}

type activeLocationResponse struct {
	*LocationResponseMetadata
	Locations []activeLocation `json:"locations"`
}
