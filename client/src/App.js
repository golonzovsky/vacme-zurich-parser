import './App.css';
import React, {useEffect, useState} from 'react';
import {Col, Empty, Layout, List, Row, Typography} from 'antd';
import {ScheduleOutlined,} from '@ant-design/icons';
import axios from 'axios';
import moment from "moment";
import Map from "./Map";

const {Header, Content} = Layout;
const {Title, Paragraph, Text} = Typography;

function App() {
    const [data, setData] = useState({locations: []});

    useEffect(() => {
        async function fetchData() {
            const result = await axios(
                '/api/',
            );
            setData(result.data);
        }

        fetchData();
    }, [null]);

    return (
        <Layout style={{minHeight: "100vh"}}>
            <Header style={{position: 'fixed', zIndex: 1, width: '100%'}}>
                <Title level={2} style={{color: 'white', paddingTop: '12px'}}>zh.vacme.ch appointments</Title>
            </Header>
            <Content>
                <Row>
                    <Col lg={{span: 6, offset: 0}} style={{minHeight: "100vh", padding: '30px'}}>
                        <Title level={3} style={{paddingTop: '50px'}}>Available slots for group N:</Title>
                        <LocationList locations={data.locations}/>
                        <Text type="secondary" style={{paddingTop: '15px', display: 'block'}}>Last refresh: {moment(data.last_refresh).fromNow()}</Text>
                    </Col>
                    <Col lg={{span: 18, offset: 0}} style={{minHeight: "100vh"}}>
                        <Map/>
                    </Col>
                </Row>
            </Content>
        </Layout>
    );
}

function LocationList(props) {
    const {locations} = props;

    const formatDate = (date) => {
        return moment(date).format("DD MMMM YYYY")
    };

    return <div>
        {locations && locations.length ?
            <List
                itemLayout="horizontal"
                dataSource={locations}
                renderItem={item => (
                    <List.Item>
                        <List.Item.Meta
                            avatar={<ScheduleOutlined style={{fontSize: '32px'}}/>}
                            title={item.name}
                            description={<>1 dose: {formatDate(item.firstDate)} <br/> 2
                                dose: {formatDate(item.secondDate)}</>}
                        />
                    </List.Item>
                )}/>
            : <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={'No locations available'}/>}
    </div>
}

export default App;
