# ui

This is `react` app to display available slots in human-readable form and on a map. 
First messy draft, need to split into components and cleanup. Probably move location mapping to api. 

![ui screenshot](../ui_example.png)

## local run 
Add `.env` file with `REACT_APP_MAPBOX_ACCESS_TOKEN` key.   
Run `yarn start`.  

If you want to point UI to your local backend deployment - edit `setupProxy.js` target.