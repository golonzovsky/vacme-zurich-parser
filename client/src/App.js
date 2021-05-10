import './App.css';
import React, {useEffect, useState, useCallback} from 'react';
import {Col, Empty, Layout, List, Row, Typography} from 'antd';
import {ScheduleOutlined,} from '@ant-design/icons';
import axios from 'axios';
import moment from "moment";
import Pins from "./Pins";
import MapGL, {
    Popup,
    FlyToInterpolator,
    NavigationControl,
    FullscreenControl,
    ScaleControl,
    GeolocateControl
} from 'react-map-gl';
import mapboxgl from 'mapbox-gl';
import locations_mapping from "./locationMapping";
// eslint-disable-next-line import/no-webpack-loader-syntax
mapboxgl.workerClass = require('worker-loader!mapbox-gl/dist/mapbox-gl-csp-worker').default;

const {Header, Content} = Layout;
const {Title, Paragraph, Text} = Typography;

function App() {
    const [data, setData] = useState({locations: []});
    //const dummyData = {"last_refresh":1620664264843,"locations":[{"firstDate":1620734400000,"name":"_Impfzentrum Meilen","secondDate":1623153600000},{"firstDate":1620820800000,"name":"_Impfzentrum Horgen","secondDate":1623240000000}],"refresh_interval_sec":600,"source":"https://github.com/golonzovsky/vacme-zurich-parser","vaccination_group":"N"}

    useEffect(() => {
        async function fetchData() {
            const result = await axios(
                '/api/',
            );
            setData(result.data);
        }
        fetchData();
    }, [null]);

    const [popupInfo, setPopupInfo] = useState(null);
    const [viewport, setViewport] = useState({
        latitude: 47.377909732589615,
        longitude: 8.540479916024365,
        zoom: 11
    });
    const onSelectLocation = useCallback((locationName) => {
        let locationByName = Object.fromEntries(
            locations_mapping.map(e => [e.name, e])
        )

        if (!(locationName in locationByName)) {
            //todo report event of lookup table entry miss to mothership
            console.log("map lookup per entry filed", locationName)
            return
        }

        let selectedLocation = locationByName[locationName];

        setViewport({
            longitude: selectedLocation.longitude,
            latitude: selectedLocation.latitude,
            zoom: 14,
            transitionInterpolator: new FlyToInterpolator({speed: 1.2}),
            transitionDuration: 'auto'
        });

        setPopupInfo(selectedLocation);
    }, []);

    return (
        <Layout style={{minHeight: "100vh"}}>
            <Header style={{position: 'fixed', zIndex: 1, width: '100%'}}>
                <Title level={2} style={{color: 'white', paddingTop: '12px'}}>zh.vacme.ch appointments</Title>
            </Header>
            <Content>
                <Row>
                    <Col lg={{span: 6, offset: 0}} style={{minHeight: "100vh", padding: '30px'}}>
                        <Title level={3} style={{paddingTop: '50px'}}>Available slots for group N:</Title>
                        <LocationList locations={data.locations} onSelectLocation={onSelectLocation}/>
                        <Text type="secondary" style={{paddingTop: '15px', display: 'block'}}>Last refresh: {moment(data.last_refresh).fromNow()}</Text>
                    </Col>
                    <Col lg={{span: 18, offset: 0}} style={{minHeight: "100vh"}}>
                        <MapGL {...viewport} width="100%" height="100%" onViewportChange={(viewport) => setViewport(viewport)}>
                            <Pins data={locations_mapping} onClick={setPopupInfo}/>

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
                                </Popup>
                            )}
                        </MapGL>
                    </Col>
                </Row>
            </Content>
        </Layout>
    );
}

function LocationList(props) {
    const {locations, onSelectLocation} = props;

    const formatDate = (date) => {
        return moment(date).format("DD MMMM YYYY")
    };

    return <div>
        {locations && locations.length ?
            <List
                itemLayout="horizontal"
                dataSource={locations}
                renderItem={item => (
                    <List.Item onClick={() => onSelectLocation(item.name)}>
                        <List.Item.Meta
                            avatar={<ScheduleOutlined style={{fontSize: '32px'}}/>}
                            title={item.name}
                            description={<>1st dose: {formatDate(item.firstDate)} <br/> 2nd dose: {formatDate(item.secondDate)}</>}
                        />
                    </List.Item>
                )}/>
            : <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={'No locations available'}/>}
    </div>
}

export default App;
