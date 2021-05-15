import './App.css';
import React from 'react';
import moment from "moment";
import {Popup} from 'react-map-gl';

function MapPopup({popupInfo, onClose}) {
    const formatDate = (date) => {
        return moment(date).format("DD MMMM YYYY")
    };

    return <Popup tipSize={5} anchor="top" longitude={popupInfo.longitude} latitude={popupInfo.latitude}
                  closeOnClick={false} onClose={onClose}>
        <a href={popupInfo.link}>{popupInfo.name}</a>
        {popupInfo.firstDate ? <><br/>
                1st dose: {formatDate(popupInfo.firstDate)} <br/>
                2nd dose: {formatDate(popupInfo.secondDate)}</>
            : ''}
    </Popup>
}


export default MapPopup;
