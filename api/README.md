# api 

This one is to hide non-scalable python api behind scalable go caching layer.   

Python app has one pod for scraping https://zh.vacme.ch, so it will be down from time to time due to node restarts and redeployments. We cannot easily scale python scraper, cause it needs to deal with refresh tokens sharing and needs to be nice to vacme.ch (not to ddos it). Therefore this caching layer will just use python as origin. 

Geo lookup logic is moved here as well. It has seed mappings  (see locationMapping.json). If location is new and not there, we are doing geo lookup by name in google api:

```bash
curl -G --data-urlencode 'input=Zürich, Pfauen Apotheke' --data-urlencode 'inputtype=textquery' --data-urlencode 'fields=name,place_id,geometry/location' --data-urlencode 'key=???' https://maps.googleapis.com/maps/api/place/findplacefromtext/json | jq
curl -G --data-urlencode 'place_id=ChIJcz-8JqygmkcRZwT5YWrkaok' --data-urlencode 'fields=url' --data-urlencode 'key=???' https://maps.googleapis.com/maps/api/place/details/json | jq
```

Quick check if we have missing locations in seed mapping: `api/check_location_mapping.sh`