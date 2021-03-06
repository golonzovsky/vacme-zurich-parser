import './App.css';
import React, {useEffect, useState} from 'react';
import MapGL, {
    FlyToInterpolator,
    FullscreenControl,
    GeolocateControl,
    NavigationControl,
    ScaleControl
} from 'react-map-gl';
import Pins from "./Pins";
import MapPopup from "./MapPopup";

import mapboxgl from 'mapbox-gl';
// eslint-disable-next-line import/no-webpack-loader-syntax
mapboxgl.workerClass = require('worker-loader!mapbox-gl/dist/mapbox-gl-csp-worker').default;

function Map({locations, selectedLocation}) {

    const [popupInfo, setPopupInfo] = useState(null);
    const [viewport, setViewport] = useState({
        latitude: 47.377909732589615,
        longitude: 8.540479916024365,
        zoom: 12
    });

    useEffect(() => {
        if (!selectedLocation || !selectedLocation.latitude)
            return

        setViewport({
            longitude: selectedLocation.longitude,
            latitude: selectedLocation.latitude,
            zoom: 14,
            transitionInterpolator: new FlyToInterpolator({speed: 1.2}),
            transitionDuration: 'auto'
        });

        setPopupInfo(selectedLocation);
    }, [selectedLocation]);

    return <MapGL {...viewport} dragRotate={false} width="100%" height="100%"
                  onViewportChange={(viewport) => setViewport(viewport)}>

        <Pins data={locations} onClick={setPopupInfo}/>

        {popupInfo && <MapPopup popupInfo={popupInfo} onClose={setPopupInfo}/>}

        <GeolocateControl style={{top: 62, right: 0, padding: '10px', }} />
        <FullscreenControl style={{top: 98, right: 0, padding: '10px'}} />
    </MapGL>
}


export default Map;
