# ui

This is `react` app to display available slots in human-readable form and on a map.

UPD: client code switched to use caching proxy and all geo mapping logic moved there as well. If you want to run UI directly on top of python api - check history before https://github.com/golonzovsky/vacme-zurich-parser/commit/433a6bf652e5b406826493598e6e879a092e9de6 (it was messy thou)

![ui screenshot](../ui_example.png)

## local run 
Add `.env` file with `REACT_APP_MAPBOX_ACCESS_TOKEN` key.   
Run `yarn start`.  

If you want to point UI to your local backend deployment - edit `setupProxy.js` target.

If you want to run client in docker locally - the easiest option is to use `yarn start` from container:
```
docker build -f Dockerfile_local . 
...
Successfully built 07c6afd44e39
...
docker run --rm -it --network=host 07c6afd44e39
firefox localhost:3000 
```
