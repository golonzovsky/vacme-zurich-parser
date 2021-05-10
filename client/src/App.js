import './App.css';
import {Col, Empty, Layout, Row, Typography, List, Avatar} from 'antd';
import ReactMapGL from 'react-map-gl';
import React, {useEffect, useState} from 'react';
import axios from 'axios';

const {Header, Content} = Layout;
const {Title, Paragraph, Text} = Typography;

function App() {
    const [data, setData] = useState({locations: []});
    const dummyData = {"last_refresh":"Mon, 10 May 2021 15:34:51 GMT","locations":[{"firstDate":"Wed, 12 May 2021 12:00:00 GMT","name":"_Impfzentrum Meilen","secondDate":"Thu, 10 Jun 2021 12:00:00 GMT"},{"firstDate":"Fri, 14 May 2021 12:00:00 GMT","name":"_Impfzentrum Dietikon","secondDate":"Fri, 11 Jun 2021 12:00:00 GMT"}],"refresh_interval_sec":600,"source":"https://github.com/golonzovsky/vacme-zurich-parser","vaccination_group":"N"}

    useEffect( () => {
        async function fetchData(){
            //const result = await axios(
            //    '/api',
            //);
            //setData(result.data);
            //console.log(result)

            setData(dummyData)
        }
        fetchData();
    }, [null]);

    return (
        <Layout style={{minHeight: "100vh"}} >
            <Header style={{ position: 'fixed', zIndex: 1, width: '100%' }}>
                <Title level={2} style={{color: 'white', paddingTop: '12px'}}>zh.vacme.ch appointments</Title>
            </Header>
            <Content >
                <Row>
                    <Col lg={{span: 6, offset: 0}} style={{minHeight: "100vh", padding: '30px'}}>
                        <LocationList locations={data.locations} last_refresh={data.last_refresh}/>
                    </Col>
                    <Col lg={{span: 18, offset: 0}} style={{minHeight: "100vh"}}>
                        <Map/>
                    </Col>
                </Row>
            </Content>
        </Layout>
    );
}

function Map() {
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

function LocationList(props) {
    return <div>
        <Title level={3}>last refresh {props.last_refresh}</Title>
        {props.locations.length ?
            <List
                itemLayout="horizontal"
                dataSource={props.locations}
                renderItem={item => (
                    <List.Item>
                        <List.Item.Meta
                            avatar={<Avatar src="https://zos.alipayobjects.com/rmsportal/ODTLcjxAfvqbxHnVXCYX.png" />}
                            title={<a href="https://ant.design">{item.title}</a>}
                            description={item.name}
                        />
                    </List.Item>
                )}/>
            : <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={'No locations available'}/>}

    </div>
}

export default App;
