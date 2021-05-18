package locations

import (
	"encoding/json"
	log "github.com/sirupsen/logrus"
	"io/ioutil"
)

const mappingLocation = "locationMapping.json" //todo map from configmap or/and configurable viper
//const mappingLocation = "/home/ax/project/next/vacme/api/locationMapping.json"

var geoMapping map[string]geoLocation

type geoLocation struct {
	Name      string  `json:"name"`
	Latitude  float64 `json:"latitude,omitempty"`
	Longitude float64 `json:"longitude,omitempty"`
	Link      string  `json:"link,omitempty"`
}

func geoByName(name string) (*geoLocation, error) {

	geoData, ok := geoMapping[name]
	if !ok {
		log.Warnf("missing location in GEO mapping '%s'", name)
		//todo use place API to fetch geo and url here
		//curl -G --data-urlencode 'input=Zürich, Pfauen Apotheke' --data-urlencode 'inputtype=textquery' --data-urlencode 'fields=name,place_id,geometry/location' --data-urlencode 'key=???' https://maps.googleapis.com/maps/api/place/findplacefromtext/json | jq
		//curl -G --data-urlencode 'place_id=ChIJcz-8JqygmkcRZwT5YWrkaok' --data-urlencode 'fields=url' --data-urlencode 'key=???' https://maps.googleapis.com/maps/api/place/details/json | jq
		//but better just use https://github.com/googlemaps/google-maps-services-go
	}

	return &geoData, nil
}

func init() {
	var geoLocations []geoLocation
	plan, _ := ioutil.ReadFile(mappingLocation)
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
