import './App.css';
import React, {useEffect, useState} from 'react';
import {Col, Layout, Modal, Row, Typography} from 'antd';
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
    useEffect(() => {
        Modal.info({
            title: 'Data is outdated',
            width: 800,
            closable: false,
            content: (
                <div>
                    <div style={{paddingTop: '30px'}}>
                        <Text>It seems, <a href='https://zh.vacme.ch'>https://zh.vacme.ch</a> 'improved' their bot detection, which prevents our scraping.</Text>
                    </div>
                    <div style={{paddingTop: '30px'}}>
                        <Text>Check other parser <a href='https://rimpfli.web.app'>https://rimpfli.web.app</a> - it seems they still manage to crawl.</Text>
                    </div>
                    <div style={{paddingTop: '30px'}}>
                        <Text type='secondary'>We are working on a fix. Until its done - data will be stale/partial.</Text>
                    </div>
                </div>
            ),
        });
    }, []);

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
                        <Text type="secondary" style={{paddingTop: '15px', display: 'block'}}>Last
                            scan: {moment(data.last_refresh).fromNow()} (auto-refresh)</Text>
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
