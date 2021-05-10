# ui

This is `react` app to display available slots in human-readable form and on a map. 
First messy draft, need to split into components and cleanup. Probably move location mapping to api. 

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
