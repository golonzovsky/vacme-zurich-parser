import React, {useEffect, useState} from 'react';
import ReactMapGL from 'react-map-gl';
import mapboxgl from 'mapbox-gl';
// eslint-disable-next-line import/no-webpack-loader-syntax
mapboxgl.workerClass = require('worker-loader!mapbox-gl/dist/mapbox-gl-csp-worker').default;

function Map() {
    //todo fill with data
    const [viewport, setViewport] = React.useState({
        latitude: 47.377909732589615,
        longitude: 8.540479916024365,
        zoom: 12
    });

    return <ReactMapGL
        {...viewport}
        width="100%"
        height="100%"
        onViewportChange={(viewport) => setViewport(viewport)}
    />
}

export default Map