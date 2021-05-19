package locations

import (
	"context"
	"encoding/json"
	"fmt"
	log "github.com/sirupsen/logrus"
	"googlemaps.github.io/maps"
	"io/ioutil"
	"os"
)

const mappingLocation = "locationMapping.json" //todo map from configmap or/and configurable viper
//const mappingLocation = "/home/ax/project/next/vacme/api/locationMapping.json"

var placeApiKey = os.Getenv("PLACE_API_KEY")

var geoMapping = make(map[string]geoLocation)
var geoLookupFailed = make(map[string]bool)
var geoClient *maps.Client

type geoLocation struct {
	Name      string  `json:"name"`
	Latitude  float64 `json:"latitude,omitempty"`
	Longitude float64 `json:"longitude,omitempty"`
	Link      string  `json:"link,omitempty"`
}

func geoByName(name string) (*geoLocation, error) {
	if geoData, ok := geoMapping[name]; ok { //todo locking?
		return &geoData, nil
	}

	if geoLookupFailed[name] {
		log.Debugf("geo lookup failed and will not be repeated for %s", name)
		return nil, nil
	}

	log.Warnf("missing location in GEO mapping '%s', doing lookup", name)
	geoData, err := doGeoLookup(name)
	if err != nil || geoData == nil {
		geoLookupFailed[name] = true
		log.Warnf("Geo lookup failed for %s. Will not do it again until restart: %v", name, err)
		return nil, err
	}
	geoMapping[name] = *geoData
	geoJson, _ := json.Marshal(geoData)
	log.Infof("Geo lookup successful for '%s'. Caching in memory. Please add to seed mapping: %s ", name, geoJson)
	return geoData, nil
}

func doGeoLookup(name string) (*geoLocation, error) {
	searchRes, searchErr := geoClient.FindPlaceFromText(context.Background(), &maps.FindPlaceFromTextRequest{
		Input:     name,
		InputType: maps.FindPlaceFromTextInputTypeTextQuery,
		Fields:    []maps.PlaceSearchFieldMask{maps.PlaceSearchFieldMaskGeometryLocation, maps.PlaceSearchFieldMaskPlaceID, maps.PlaceSearchFieldMaskName},
	})

	if searchErr != nil {
		return nil, fmt.Errorf("failed geo search lookup for '%s': %v", name, searchErr)
	}
	if len(searchRes.Candidates) != 1 {
		return nil, fmt.Errorf("unresolved ambuguity in geo search lookup result for '%s': %v", name, searchRes.Candidates)
	}
	searchResult := searchRes.Candidates[0]

	placeDetailsRes, detailsErr := geoClient.PlaceDetails(context.Background(), &maps.PlaceDetailsRequest{
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

func init() {
	var geoLocations []geoLocation
	plan, _ := ioutil.ReadFile(mappingLocation)
	err := json.Unmarshal(plan, &geoLocations)
	if err != nil {
		log.Fatal("Location mapping seed read failure", err)
	}

	for _, location := range geoLocations {
		geoMapping[location.Name] = location
	}

	geoClient, err = maps.NewClient(maps.WithAPIKey(placeApiKey))
	if err != nil {
		log.Fatalf("cannot initialize google maps client, check access token or disable lookups: %s", err)
	}

}
