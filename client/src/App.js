import './App.css';
import React, {useCallback, useEffect, useState} from 'react';
import {Col, Layout, Row, Typography, Modal} from 'antd';
import axios from 'axios';
import moment from "moment";
import Pins from "./Pins";
import MapGL, {FlyToInterpolator, Popup} from 'react-map-gl';
import locations_mapping from "./locationMapping.json";
import LocationList from "./LocationList";
import GithubRibbon from "./GithubRibbon";

import mapboxgl from 'mapbox-gl';
// eslint-disable-next-line import/no-webpack-loader-syntax
mapboxgl.workerClass = require('worker-loader!mapbox-gl/dist/mapbox-gl-csp-worker').default;

const {Header, Content} = Layout;
const {Title, Text} = Typography;

function App() {
    const [enhancedLocations, setEnhancedLocations] = useState([]);
    const [data, setData] = useState({locations: []});
    //const dummyData = {"last_refresh":1620682132562,"locations":[{"firstDate":1620820800000,"name":"_Impfzentrum Uster","secondDate":1623240000000},{"firstDate":1620907200000,"name":"_Impfzentrum Winterthur","secondDate":1623758400000},{"firstDate":1621598400000,"name":"_Impfzentrum Wetzikon","secondDate":1624017600000},{"firstDate":1621944000000,"name":"_Referenz-Impfzentrum Z\u00fcrich","secondDate":1624363200000},{"firstDate":1622030400000,"name":"_Impfzentrum Horgen","secondDate":1624449600000},{"firstDate":1622721600000,"name":"_Impfzentrum Affoltern","secondDate":1625486400000},{"firstDate":1622721600000,"name":"_Impfzentrum Messe Z\u00fcrich","secondDate":1625140800000},{"firstDate":1622808000000,"name":"_Impfzentrum Dietikon","secondDate":1625227200000}],"refresh_interval_sec":600,"source":"https://github.com/golonzovsky/vacme-zurich-parser","vaccination_group":"N"}

    useEffect(() => {
        const fetchData = async () => {
            const result = await axios('/api/');
            setData(result.data);
            enhanceLocationsMappingWithActive(result);
        }
        fetchData();
        const interval = setInterval(() => {fetchData()}, 60*1000)
        return () => clearInterval(interval)
    }, []);
    useEffect(() => {
        Modal.info({
            title: 'Main website is updated',
            width: 800,
            closable: false,
            content: (
                <div>
                    <p/>
                    <p/>
                    <p>It seems, you no longer can select locations without appointments.</p>
                    <p/>
                    <p/>
                    <p>Please check it there <a href='https://zh.vacme.ch'>https://zh.vacme.ch</a></p>
                    <p/>
                    <Text type="secondary" >Unfortunately, this update broke our parser, we'll try to fix it if possible.</Text><p/>
                    <Text type="secondary" >Current data on this page is no longer up to date.</Text><p/>
                </div>
            ),
        });
    }, []);

    function enhanceLocationsMappingWithActive(result) {
        //result = {'data': dummyData}
        if (!result.data.locations || result.data.locations.length === 0) {
            setEnhancedLocations(locations_mapping);
            return
        }

        let activeLocationsByName = Object.fromEntries(
            result.data.locations.map(e => [e.name, e])
        )
        let enhancedLocations = locations_mapping.map(location => {
            if (!(location.name in activeLocationsByName)) {
                return {...location, active: false}
            }
            let activeByName = activeLocationsByName[location.name];
            return {...location, firstDate: activeByName.firstDate, secondDate: activeByName.secondDate, active: true}
        });
        setEnhancedLocations(enhancedLocations);
    }

    const [popupInfo, setPopupInfo] = useState(null);
    const [viewport, setViewport] = useState({
        latitude: 47.377909732589615,
        longitude: 8.540479916024365,
        zoom: 11
    });
    const onSelectLocation = useCallback((location) => {
        console.log("on select", location)
        let locationByName = Object.fromEntries(
            locations_mapping.map(e => [e.name, e])
        )

        if (!(location.name in locationByName)) {
            //todo report event of lookup table entry miss to mothership (or move all of this location enhancements to api)
            console.log("map lookup per entry filed", location.name)
            return
        }

        let selectedLocation = locationByName[location.name];

        setViewport({
            longitude: selectedLocation.longitude,
            latitude: selectedLocation.latitude,
            zoom: 14,
            transitionInterpolator: new FlyToInterpolator({speed: 1.2}),
            transitionDuration: 'auto'
        });

        setPopupInfo({
            ...location,
            ...selectedLocation
        });
    }, []);

    const formatDate = (date) => {
        return moment(date).format("DD MMMM YYYY")
    };

    return (
        <Layout style={{minHeight: "100vh"}}>
            <Header style={{position: 'fixed', zIndex: 1, width: '100%'}}>
                <Title level={2} className="main-header">zh.vacme.ch appointments</Title>
                <GithubRibbon/>
            </Header>
            <Content>
                <Row>
                    <Col lg={{span: 6, offset: 0}} style={{minHeight: "100vh", padding: '30px'}}>
                        <Title level={3} style={{paddingTop: '50px'}}>Available slots for group N:</Title>
                        <LocationList locations={data.locations} onSelectLocation={onSelectLocation}/>
                        <Text type="secondary" style={{paddingTop: '15px', display: 'block'}}>Last scan: {moment(data.last_refresh).fromNow()}</Text>
                    </Col>
                    <Col lg={{span: 18, offset: 0}} style={{minHeight: "100vh"}}>
                        <MapGL {...viewport} width="100%" height="100%" onViewportChange={(viewport) => setViewport(viewport)}>
                            <Pins data={enhancedLocations} onClick={setPopupInfo}/>

                            {popupInfo && (
                                <Popup
                                    tipSize={5}
                                    anchor="top"
                                    longitude={popupInfo.longitude}
                                    latitude={popupInfo.latitude}
                                    closeOnClick={false}
                                    onClose={setPopupInfo}
                                >
                                    <a href={popupInfo.link}>{popupInfo.name}</a>
                                    { popupInfo.firstDate ? <><br/>
                                    1st dose: {formatDate(popupInfo.firstDate)} <br/>
                                    2nd dose: {formatDate(popupInfo.secondDate)}</>
                                        : ''}
                                </Popup>
                            )}
                        </MapGL>
                    </Col>
                </Row>
            </Content>
        </Layout>
    );
}

export default App;
