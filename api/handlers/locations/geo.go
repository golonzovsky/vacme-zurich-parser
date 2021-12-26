package locations

import (
	"context"
	"encoding/json"
	"fmt"
	log "github.com/sirupsen/logrus"
	"googlemaps.github.io/maps"
	"io/ioutil"
)

type PlaceClient struct {
	geoMapping      map[string]geoLocation
	geoLookupFailed map[string]bool
	geoClient       *maps.Client
}

func NewPlaceClient(placeApiKey string, seedMappingLocation string) *PlaceClient {
	var geoLocations []geoLocation
	plan, _ := ioutil.ReadFile(seedMappingLocation)
	err := json.Unmarshal(plan, &geoLocations)
	if err != nil {
		log.Fatal("Location mapping seed read failure", err)
	}

	geoClient, err := maps.NewClient(maps.WithAPIKey(placeApiKey))
	if err != nil {
		log.Fatalf("cannot initialize google maps client, check access token or disable lookups: %s", err)
	}

	geoMapping := make(map[string]geoLocation)
	for _, location := range geoLocations {
		geoMapping[location.Name] = location
	}

	return &PlaceClient{
		geoMapping,
		make(map[string]bool),
		geoClient,
	}
}

type geoLocation struct {
	Name      string  `json:"name"`
	Latitude  float64 `json:"latitude,omitempty"`
	Longitude float64 `json:"longitude,omitempty"`
	Link      string  `json:"link,omitempty"`
}

func (s *PlaceClient) geoByName(name string) (*geoLocation, error) {
	if geoData, ok := s.geoMapping[name]; ok { //todo locking?
		return &geoData, nil
	}

	if s.geoLookupFailed[name] {
		log.Debugf("geo lookup failed and will not be repeated for %s", name)
		return nil, nil
	}

	log.Warnf("missing location in GEO mapping '%s', doing lookup", name)
	geoData, err := s.doGeoLookup(name)
	if err != nil || geoData == nil {
		s.geoLookupFailed[name] = true
		log.Warnf("Geo lookup failed for '%s'. Will not do it again until restart: %v", name, err)
		return nil, err
	}
	s.geoMapping[name] = *geoData
	geoJson, _ := json.Marshal(geoData)
	log.Infof("Geo lookup successful for '%s'. Caching in memory. Please add to seed mapping: %s ", name, geoJson)
	return geoData, nil
}

func (s *PlaceClient) doGeoLookup(name string) (*geoLocation, error) {
	searchRes, searchErr := s.geoClient.FindPlaceFromText(context.Background(), &maps.FindPlaceFromTextRequest{
		Input:     name,
		InputType: maps.FindPlaceFromTextInputTypeTextQuery,
		Fields:    []maps.PlaceSearchFieldMask{maps.PlaceSearchFieldMaskGeometryLocation, maps.PlaceSearchFieldMaskPlaceID, maps.PlaceSearchFieldMaskName},
	})

	if searchErr != nil {
		return nil, fmt.Errorf("failed geo search lookup for '%s': %v", name, searchErr)
	}
	if len(searchRes.Candidates) != 1 {
		return nil, fmt.Errorf("unresolved ambuguity in geo search lookup result for '%s': %v", name, s.toPlaceNames(searchRes))
	}
	searchResult := searchRes.Candidates[0]

	placeDetailsRes, detailsErr := s.geoClient.PlaceDetails(context.Background(), &maps.PlaceDetailsRequest{
		PlaceID: searchResult.PlaceID,
		Fields:  []maps.PlaceDetailsFieldMask{maps.PlaceDetailsFieldMaskURL},
	})
	if detailsErr != nil {
		log.Warnf("failed geo details lookup for '%s': %v", name, detailsErr)
		return nil, detailsErr
	}

	return &geoLocation{
		Name:      name,
		Latitude:  searchResult.Geometry.Location.Lat,
		Longitude: searchResult.Geometry.Location.Lng,
		Link:      placeDetailsRes.URL,
	}, nil
}

func (s *PlaceClient) toPlaceNames(searchRes maps.FindPlaceFromTextResponse) []string {
	var candidateNames []string
	for _, c := range searchRes.Candidates {
		candidateNames = append(candidateNames, c.Name)
	}
	return candidateNames
}
