import React, {useEffect, useState} from 'react';
import ReactMapGL from 'react-map-gl';
import MapGL, {
    Popup,
    NavigationControl,
    FullscreenControl,
    ScaleControl,
    GeolocateControl
} from 'react-map-gl';
import mapboxgl from 'mapbox-gl';
import Pins from "./Pins";
// eslint-disable-next-line import/no-webpack-loader-syntax
mapboxgl.workerClass = require('worker-loader!mapbox-gl/dist/mapbox-gl-csp-worker').default;

function Map(props) {
    //todo fill full mapping and highlight available
    const [viewport, setViewport] = useState({
        latitude: 47.377909732589615,
        longitude: 8.540479916024365,
        zoom: 12
    });

    const [popupInfo, setPopupInfo] = useState(null);

    const locations_mapping = [
        {'name': "Zürich, TopPharm Morgental Apotheke", 'latitude': 47.3437185858769,'longitude':  8.529828454511142, 'link': 'https://goo.gl/maps/8VFBvGnSGrZJLHW98'},
        {'name': "Zürich, Apotheke Kirche Fluntern", 'latitude': 47.376437590746185,'longitude':  8.559069364309437, 'link': 'https://goo.gl/maps/tU66ABCKzmhidS1J6'},
        {'name': "Affoltern, Amavita Apotheke Affoltern a. A.", 'latitude': 47.27729486909392,'longitude':  8.44968738334539, 'link': 'https://g.page/amavita-affoltern-am-albis'},
        {'name': "Zürich, Apotheke zur Bleiche", 'latitude': 47.368428232551324, 'longitude':  8.534694566157896, 'link': 'https://goo.gl/maps/42BU5Tmci8ZE1Ko56'},
        {'name': "Effretikon, Benu Apotheke Effi-Märt", 'latitude': 47.42881379059841, 'longitude':  8.685836027524802, 'link': 'https://goo.gl/maps/YFky8dGyKuGMZjad6'},
        {'name': "Kloten, Benu Apotheke Kloten", 'latitude': 47.452971813328276, 'longitude': 8.581836059495295, 'link': 'https://goo.gl/maps/gENTuELiw6fT1ZE79'},
        {'name': "Dübendorf, TopPharm Waldmann Apotheke", 'latitude': 47.399305960903966, 'longitude':  8.621705931219541, 'link': 'https://goo.gl/maps/oCD7QzPbS4ujNkJb8'},
        {'name': "Affoltern a.A., Vitalis Apotheke", 'latitude': 47.2745075198469, 'longitude':  8.446807888327584, 'link': 'https://g.page/vitalisapotheke?share'},
        {'name': "_Impfzentrum Uster", 'latitude': 47.360851559068145, 'longitude':  8.728580911621616, 'link': 'https://g.page/impfzentrum-uster?share'},
        {'name': "Thalwil, Coop Vitality Thalwil", 'latitude': 47.29708628094759, 'longitude':  8.562413369291244, 'link': 'https://goo.gl/maps/NDYwd4bLrrMdBUoVA'},
        {'name': "Zürich, Amavita Apotheke Schamendingen", 'latitude': 47.404616624050036,'longitude':  8.57303371587817, 'link': 'https://g.page/amavita-schwamendingen?share'},
        //{'name': "Zürich, Olympia Apotheke", 'latitude': 47.3,'longitude':  8.55, 'link': ''},
        //{'name': "_Impfzentrum Dietikon", 'latitude': 47.3,'longitude':  8.55, 'link': ''},
        //{'name': "Männedorf, Apotheke Drogerie Leue", 'latitude': 47.3,'longitude':  8.55, 'link': ''},
        //{'name': "_Impfzentrum Bülach", 'latitude': 47.3,'longitude':  8.55, 'link': ''},
        //{'name': "Zürich, Coop Vitality Wiedikon", 'latitude': 47.3,'longitude':  8.55, 'link': ''},
        //{'name': "Zürich, Benu Carmen Apotheke", 'latitude': 47.3,'longitude':  8.55, 'link': ''},
        //{'name': "Zürich, Sternen Apotheke z'Örlike", 'latitude': 47.3,'longitude':  8.55, 'link': ''},
        //{'name': "Zürich, Apotheke Affoltern", 'latitude': 47.3,'longitude':  8.55, 'link': ''},
        //{'name': "Wädenswil, Pill Apotheke Oberdorf", 'latitude': 47.3,'longitude':  8.55, 'link': ''},
        //{'name': "Zürich, Apotheke Schafroth", 'latitude': 47.3,'longitude':  8.55, 'link': ''},
        //{'name': "_Referenz-Impfzentrum Zürich", 'latitude': 47.3,'longitude':  8.55, 'link': ''},
        //{'name': "Zürich, Neumarkt Apotheke", 'latitude': 47.3,'longitude':  8.55, 'link': ''},
        //{'name': "Zürich, Paracelsus Apotheke Forsan AG", 'latitude': 47.3,'longitude':  8.55, 'link': ''},
        //{'name': "Zürich, Wartau Rotpunkt Apotheke", 'latitude': 47.3,'longitude':  8.55, 'link': ''},
        //{'name': "Zürich, Hirsch-Apotheke", 'latitude': 47.3,'longitude':  8.55, 'link': ''},
        //{'name': "Bülach, Büli Apotheke", 'latitude': 47.3,'longitude':  8.55, 'link': ''},
        //{'name': "Rüti, Apotheke xtrapharm", 'latitude': 47.3,'longitude':  8.55, 'link': ''},
        //{'name': "Zürich, Apotheke zum Pilgerbrunnen AG", 'latitude': 47.3,'longitude':  8.55, 'link': ''},
        //{'name': "Zürich, TopPharm Apotheke Paradeplatz", 'latitude': 47.3,'longitude':  8.55, 'link': ''},
        //{'name': "Zürich, Medbase Apotheke Zürich Helvetiaplatz", 'latitude': 47.3,'longitude':  8.55, 'link': ''},
        //{'name': "Zürich, Albis Apotheke GmbH", 'latitude': 47.3,'longitude':  8.55, 'link': ''},
        //{'name': "Zürich, Amavita Apotheke Zürich Altstetten", 'latitude': 47.3,'longitude':  8.55, 'link': ''},
        //{'name': "Zürich, Amavita Apotheke Bahnhofplatz", 'latitude': 47.3,'longitude':  8.55, 'link': ''},
        //{'name': "Uitikon, Waldegg Rotpunkt Apotheke", 'latitude': 47.3,'longitude':  8.55, 'link': ''},
        //{'name': "Küsnacht, Apotheke Hotz", 'latitude': 47.3,'longitude':  8.55, 'link': ''},
        //{'name': "Zürich, Drogama Apotheke Drogerie", 'latitude': 47.3,'longitude':  8.55, 'link': ''},
        //{'name': "Zürich, Amavita Apotheke Shopville", 'latitude': 47.3,'longitude':  8.55, 'link': ''},
        //{'name': "Zürich, Bahnhof Apotheke Oerlikon", 'latitude': 47.3,'longitude':  8.55, 'link': ''},
        //{'name': "Dietikon, Löwen-Apotheke", 'latitude': 47.3,'longitude':  8.55, 'link': ''},
        //{'name': "Zürich, Klus-Apotheke AG - Impfzentrum", 'latitude': 47.3,'longitude':  8.55, 'link': ''},
        //{'name': "Bassersdorf, Rosengarten Apotheke", 'latitude': 47.3,'longitude':  8.55, 'link': ''},
        //{'name': "Zürich, DROPA Apotheke am Limmatplatz", 'latitude': 47.3,'longitude':  8.55, 'link': ''},
        //{'name': "Zürich, Stauffacher Apotheke", 'latitude': 47.3,'longitude':  8.55, 'link': ''},
        //{'name': "Rüti, Apotheke Altorfer AG", 'latitude': 47.3,'longitude':  8.55, 'link': ''},
        //{'name': "Zürich, Benu Eulen-Apotheke", 'latitude': 47.3,'longitude':  8.55, 'link': ''},
        //{'name': "Thalwil, Central-Apotheke Thalwil AG", 'latitude': 47.3,'longitude':  8.55, 'link': ''},
        //{'name': "Schwerzenbach, TopPharm Bahnhof Apotheke", 'latitude': 47.3,'longitude':  8.55, 'link': ''},
        //{'name': "Horgen, Pill Apotheke Waldegg", 'latitude': 47.3,'longitude':  8.55, 'link': ''},
        //{'name': "Hinwil, Puls Apotheke&Drogerie AG", 'latitude': 47.3,'longitude':  8.55, 'link': ''},
        //{'name': "_Impfzentrum Affoltern", 'latitude': 47.3,'longitude':  8.55, 'link': ''},
        //{'name': "Zürich, Medbase Apotheke Zürich Kreis 11", 'latitude': 47.3,'longitude':  8.55, 'link': ''},
        //{'name': "Männedorf, Toppharm See-Apotheke", 'latitude': 47.3,'longitude':  8.55, 'link': ''},
        //{'name': "Zürich, TopPharm Limmatplatz Apotheke", 'latitude': 47.3,'longitude':  8.55, 'link': ''},
        //{'name': "_Impfzentrum Triemli Zürich", 'latitude': 47.3,'longitude':  8.55, 'link': ''},
        //{'name': "Zürich, 8046 DROPA Apotheke Drogerie Zürich-Affoltern", 'latitude': 47.3,'longitude':  8.55, 'link': ''},
        //{'name': "Zürich, Coop Vitality Apotheke Letzipark", 'latitude': 47.3,'longitude':  8.55, 'link': ''},
        //{'name': "Zürich, Apotheke Leimbach", 'latitude': 47.3,'longitude':  8.55, 'link': ''},
        //{'name': "Effretikon, Rike-Apotheke AG", 'latitude': 47.3,'longitude':  8.55, 'link': ''},
        //{'name': "Zumikon, Amavita Apotheke Zumikon", 'latitude': 47.3,'longitude':  8.55, 'link': ''},
        //{'name': "Wetzikon, Apotheke Kempten", 'latitude': 47.3,'longitude':  8.55, 'link': ''},
        //{'name': "Zürich, Hirschwiesen Apotheke AG", 'latitude': 47.3,'longitude':  8.55, 'link': ''},
        //{'name': "_Impfzentrum Messe Zürich", 'latitude': 47.3,'longitude':  8.55, 'link': ''},
        //{'name': "_Impfzentrum Meilen", 'latitude': 47.3,'longitude':  8.55, 'link': ''},
        //{'name': "_Impfzentrum Winterthur", 'latitude': 47.3,'longitude':  8.55, 'link': ''},
        //{'name': "Zürich, Apotheke Schaffhauserplatz", 'latitude': 47.3,'longitude':  8.55, 'link': ''},
        //{'name': "Winterthur, Bachtel Apotheke", 'latitude': 47.3,'longitude':  8.55, 'link': ''},
        //{'name': "Schlieren, Apotheke Lilie Zentrum", 'latitude': 47.3,'longitude':  8.55, 'link': ''},
        //{'name': "Winterthur, Medbase Apotheke Altstadt Winterthur", 'latitude': 47.3,'longitude':  8.55, 'link': ''},
        //{'name': "Zürich, Fontana Apotheke", 'latitude': 47.3,'longitude':  8.55, 'link': ''},
        //{'name': "Horgen, Toppharm Apotheke zum Erzberg A&A medical AG", 'latitude': 47.3,'longitude':  8.55, 'link': ''},
        //{'name': "Zürich, TopPharm Leonhards Apotheke", 'latitude': 47.3,'longitude':  8.55, 'link': ''},
        //{'name': "Erlenbach, Amavita Apotheke Erlibacher Märt", 'latitude': 47.3,'longitude':  8.55, 'link': ''},
        //{'name': "Zürich, St. Peter-Apotheke", 'latitude': 47.3,'longitude':  8.55, 'link': ''},
        //{'name': "Dietikon, City Apotheke Dr.Max Ruckstuhl AG", 'latitude': 47.3,'longitude':  8.55, 'link': ''},
        //{'name': "Zürich, Victoria Apotheke im Circle", 'latitude': 47.3,'longitude':  8.55, 'link': ''},
        //{'name': "Urdorf, Dropa Urdorf AG", 'latitude': 47.3,'longitude':  8.55, 'link': ''},
        //{'name': "Zürich, Coop Vitality Apotheke Zürich Bahnhofstrasse", 'latitude': 47.3,'longitude':  8.55, 'link': ''},
        //{'name': "Zürich, Triemli-Apotheke & Drogerie", 'latitude': 47.3,'longitude':  8.55, 'link': ''},
        //{'name': "Zürich, Balgrist Apotheke AG", 'latitude': 47.3,'longitude':  8.55, 'link': ''},
        //{'name': "Zürich, Medbase Apotheke Zürich Seebach", 'latitude': 47.3,'longitude':  8.55, 'link': ''},
        //{'name': "Zürich, ApoDoc Hardbrücke", 'latitude': 47.3,'longitude':  8.55, 'link': ''},
        //{'name': "Wädenswil, Amavita Bahnhof Wädenswil", 'latitude': 47.3,'longitude':  8.55, 'link': ''},
        //{'name': "Dielsdorf, Apotheke zum Gerichtshaus, Impfzentrum Dielsdorf", 'latitude': 47.3,'longitude':  8.55, 'link': ''},
        //{'name': "_Impfzentrum Horgen", 'latitude': 47.3,'longitude':  8.55, 'link': ''},
        //{'name': "Zürich, Apotheke Altstetten 1", 'latitude': 47.3,'longitude':  8.55, 'link': ''},
        //{'name': "Zürich, Amavita Apotheke Neumarkt Oerlikon", 'latitude': 47.3,'longitude':  8.55, 'link': ''},
        //{'name': "Zürich, Amavita Bahnhof Apotheke", 'latitude': 47.3,'longitude':  8.55, 'link': ''},
        //{'name': "Zürich, Apotheke zum Mörser GmbH", 'latitude': 47.3,'longitude':  8.55, 'link': ''},
        //{'name': "Zürich, Medbase Apotheke Zürich Niederdorf", 'latitude': 47.3,'longitude':  8.55, 'link': ''},
        //{'name': "Uster, Coop Vitality Apotheke Uster", 'latitude': 47.3,'longitude':  8.55, 'link': ''},
        //{'name': "_Impfzentrum Wetzikon", 'latitude': 47.3,'longitude':  8.55, 'link': ''},
        //{'name': "Apotheke im KSW AG", 'latitude': 47.3,'longitude':  8.55, 'link': ''},

    ]

    return <ReactMapGL{...viewport} width="100%" height="100%" onViewportChange={(viewport) => setViewport(viewport)}>
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
                test info
            </Popup>
        )}
    </ReactMapGL>
}

export default Map