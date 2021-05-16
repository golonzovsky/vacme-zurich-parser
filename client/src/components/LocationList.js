import moment from "moment";
import {Empty, List} from "antd";
import {ScheduleOutlined} from "@ant-design/icons";

function LocationList({locations, onSelectLocation}) {

    const formatDate = (date) => {
        return moment(date).format("DD MMMM YYYY")
    };

    const activeLocations = locations ? locations.filter( l => Boolean(l.secondDate)).sort( (l1, l2) => l1.firstDate - l2.firstDate) : []

    return <div>
        {activeLocations.length ?
            <List
                itemLayout="horizontal"
                dataSource={activeLocations}
                renderItem={item => (
                    <List.Item onClick={() => onSelectLocation(item)} style={{cursor: 'pointer'}}>
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

export default LocationList