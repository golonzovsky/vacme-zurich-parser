import './App.css';
import React, {useEffect, useState} from 'react';
import {Col, Layout, Row, Typography} from 'antd';
import axios from 'axios';
import moment from "moment";
import LocationList from "./LocationList";
import GithubRibbon from "./GithubRibbon";
import Map from "./Map";
//import dummyResp from "./example_response.json"

const {Header, Content} = Layout;
const {Title, Text} = Typography;

function App() {
    const [data, setData] = useState({locations: []});
    const [selectedLocation, setSelectedLocation] = useState(null);

    useEffect(() => {
        const fetchData = async () => {
            const result = await axios('/api/v2/locations');
            setData(result.data);
        }
        fetchData();
        const interval = setInterval(() => {
            fetchData()
        }, 30 * 1000) // todo currently 30 sec poll, switch to SSE
        return () => clearInterval(interval)
    }, []);
/*
    useEffect(() => {
        setData(dummyResp)
    }, []);*/

    return (
        <Layout style={{minHeight: "100vh"}}>
            <Header style={{position: 'fixed', zIndex: 1, width: '100%'}}>
                <Title level={2} className="main-header">zh.vacme.ch appointments</Title>
                <GithubRibbon/>
            </Header>
            <Content>
                <Row>
                    <Col lg={{span: 6, offset: 0}} style={{height: "100vh", padding: '30px', overflow: 'auto'}}>
                        <Title level={3} style={{paddingTop: '50px'}}>Available slots for group N:</Title>
                        <LocationList locations={data.locations} onSelectLocation={setSelectedLocation}/>
                        <Text type="secondary" style={{paddingTop: '15px', display: 'block'}}>Last scan: {moment(data.last_refresh).fromNow()} (auto-refresh)</Text>
                    </Col>
                    <Col lg={{span: 18, offset: 0}} style={{height: "100vh"}}>
                        <Map locations={data.locations} selectedLocation={selectedLocation}/>
                    </Col>
                </Row>
            </Content>
        </Layout>
    );
}

export default App;
