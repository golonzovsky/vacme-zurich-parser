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
        zoom: 11
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
        {'name': "Zürich, Olympia Apotheke", 'latitude': 47.37380123337674,'longitude':  8.531016144713028, 'link': 'https://g.page/olympia-apotheke-zh'},
        {'name': "_Impfzentrum Dietikon", 'latitude': 47.407159156971176, 'longitude':  8.387007400536746, 'link': 'https://goo.gl/maps/86MuJYMweQdbBUcZA'},
        {'name': "Männedorf, Apotheke Drogerie Leue", 'latitude': 47.25306639641497,'longitude':  8.696799830656497, 'link': 'https://goo.gl/maps/YUTf1bgSF6ZasTvB9'},
        {'name': "_Impfzentrum Bülach", 'latitude': 47.51575581724411,'longitude':  8.537399436203753, 'link': 'https://goo.gl/maps/CTJcnX6MpQcDDKA49'},
        {'name': "Zürich, Coop Vitality Wiedikon", 'latitude': 47.37081031140111,'longitude':  8.51626667539599, 'link': 'https://goo.gl/maps/Lv6Soy4tFB1pk5v78'},
        {'name': "Zürich, Benu Carmen Apotheke", 'latitude': 47.368117543556224, 'longitude':  8.560145848408167, 'link': 'https://goo.gl/maps/QgBFJXTQGy42pM1w6'},
        {'name': "Zürich, Sternen Apotheke z'Örlike", 'latitude': 47.40980093341721,'longitude':  8.547130728811506, 'link': 'https://g.page/sternen-apo'},
        {'name': "Wädenswil, Pill Apotheke Oberdorf", 'latitude': 47.228601164531575 ,'longitude':  8.66912182880848, 'link': 'https://goo.gl/maps/k6c44PiFzUHxxWJM8'},
        {'name': "_Referenz-Impfzentrum Zürich", 'latitude': 47.376231613652344,'longitude':  8.54538742567631, 'link': 'https://goo.gl/maps/M6KGZvtFbSpRcfft7'},
        {'name': "Zürich, Apotheke Schafroth", 'latitude': 47.388062452841446,'longitude':  8.487042786481945, 'link': 'https://goo.gl/maps/xJWhi5gcTPtYQm7u5'},
        {'name': "Zürich, Neumarkt Apotheke", 'latitude': 47.388501789195466,'longitude':  8.487477587042479, 'link': 'https://goo.gl/maps/gyeWFgCJh5Qhg1k89'},
        {'name': "Zürich, Paracelsus Apotheke Forsan AG", 'latitude': 47.37951684258761,'longitude':  8.527934275396076, 'link': 'https://goo.gl/maps/hWjTTdu6MKtbp6eh9'},
        {'name': "Zürich, Wartau Rotpunkt Apotheke", 'latitude': 47.402624334779134,'longitude':  8.493384987042745, 'link': 'https://g.page/wartau-apotheke?share'},
        {'name': "Zürich, Hirsch-Apotheke", 'latitude': 47.39651344377926,'longitude':  8.541094919573233, 'link': 'https://goo.gl/maps/5gnSPg3bkDtf9yAe9'},
        {'name': "Bülach, Büli Apotheke", 'latitude': 47.521084250872185, 'longitude':  8.539738796282776, 'link': 'https://goo.gl/maps/3JbCWZfnmUW63CL98'},
        {'name': "Rüti, Apotheke xtrapharm", 'latitude': 47.25868649468779, 'longitude':  8.849733515315071, 'link': 'https://goo.gl/maps/hPVgHX4ne8ynDsgc8'},
        {'name': "Zürich, Apotheke zum Pilgerbrunnen AG", 'latitude': 47.378428350486544,'longitude':  8.511287080938855, 'link': 'https://g.page/pilgerbrunnen?share'},
        {'name': "Zürich, TopPharm Apotheke Paradeplatz", 'latitude': 47.369981570176435,'longitude':  8.540755067444918, 'link': 'https://goo.gl/maps/YDAAQ2z8TRKmTQ2K9'},
        {'name': "Zürich, Medbase Apotheke Zürich Helvetiaplatz", 'latitude': 47.376177259897446,'longitude':  8.525641594432729, 'link': 'https://goo.gl/maps/TKQcyzFDjGUhL12N9'},
        {'name': "Zürich, Albis Apotheke GmbH", 'latitude': 47.376149125349116, 'longitude':  8.488447219572839, 'link': 'https://g.page/albis-apotheke'},
        {'name': "_Impfzentrum Horgen", 'latitude': 47.26276970807709, 'longitude':  8.591934531217234, 'link': 'https://goo.gl/maps/YT2jvSg2kXo8ZEsb8'},
        {'name': "_Impfzentrum Wetzikon", 'latitude': 47.31518772182702,'longitude':  8.79995562696232, 'link': 'https://goo.gl/maps/J9sD4ByixUrAQaes9'},
        {'name': "_Impfzentrum Affoltern", 'latitude': 47.27459107778738,'longitude':  8.44419515951752, 'link': 'https://goo.gl/maps/BfaywYYmtnyXa8po7'},
        {'name': "_Impfzentrum Triemli Zürich", 'latitude': 47.36618711407555,'longitude':  8.4979265116217, 'link': 'https://goo.gl/maps/U6mXU7mo8drtSMVs7'},
        {'name': "_Impfzentrum Messe Zürich", 'latitude': 47.41165664956518, 'longitude':  8.553435671701461, 'link': 'https://g.page/impfzentrum-zuerich?share'},
        {'name': "_Impfzentrum Meilen", 'latitude': 47.26914130142422, 'longitude':  8.642818633065, 'link': 'https://goo.gl/maps/8hgWyQqDc8nkJ8ZT7'},
        {'name': "_Impfzentrum Winterthur", 'latitude': 47.48810612836621,'longitude':  8.705645834916306, 'link': 'https://g.page/Impfzentrumwinterthur'},
        {'name': "Zürich, Apotheke Schaffhauserplatz", 'latitude': 47.39185615394899, 'longitude':  8.538639792585437, 'link': 'https://goo.gl/maps/4DbKxkdyEbZkchWU8'},
        {'name': "Zürich, Amavita Apotheke Zürich Altstetten", 'latitude': 47.391463565019215,'longitude':  8.489835888329619, 'link': 'https://g.page/amavita-altstetten'},
        {'name': "Zürich, Amavita Apotheke Bahnhofplatz", 'latitude': 47.37674027418106, 'longitude':  8.540103756629621, 'link': 'https://g.page/amavita-bahnhofplatz-zurich'},
        {'name': "Uitikon, Waldegg Rotpunkt Apotheke", 'latitude': 47.36851920995422,'longitude':  8.463403626963204, 'link': 'https://g.page/waldeggapotheke'},
        {'name': "Küsnacht, Apotheke Hotz", 'latitude': 47.31851435234516, 'longitude':  8.582350203669833, 'link': 'https://goo.gl/maps/pWUh3nKKMLLw1BPr7'},
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
        //{'name': "Zürich, Medbase Apotheke Zürich Kreis 11", 'latitude': 47.3,'longitude':  8.55, 'link': ''},
        //{'name': "Männedorf, Toppharm See-Apotheke", 'latitude': 47.3,'longitude':  8.55, 'link': ''},
        //{'name': "Zürich, TopPharm Limmatplatz Apotheke", 'latitude': 47.3,'longitude':  8.55, 'link': ''},
        //{'name': "Zürich, 8046 DROPA Apotheke Drogerie Zürich-Affoltern", 'latitude': 47.3,'longitude':  8.55, 'link': ''},
        //{'name': "Zürich, Coop Vitality Apotheke Letzipark", 'latitude': 47.3,'longitude':  8.55, 'link': ''},
        //{'name': "Zürich, Apotheke Leimbach", 'latitude': 47.3,'longitude':  8.55, 'link': ''},
        //{'name': "Effretikon, Rike-Apotheke AG", 'latitude': 47.3,'longitude':  8.55, 'link': ''},
        //{'name': "Zumikon, Amavita Apotheke Zumikon", 'latitude': 47.3,'longitude':  8.55, 'link': ''},
        //{'name': "Wetzikon, Apotheke Kempten", 'latitude': 47.3,'longitude':  8.55, 'link': ''},
        //{'name': "Zürich, Hirschwiesen Apotheke AG", 'latitude': 47.3,'longitude':  8.55, 'link': ''},
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
        //{'name': "Zürich, Apotheke Altstetten 1", 'latitude': 47.3,'longitude':  8.55, 'link': ''},
        //{'name': "Zürich, Amavita Apotheke Neumarkt Oerlikon", 'latitude': 47.3,'longitude':  8.55, 'link': ''},
        //{'name': "Zürich, Amavita Bahnhof Apotheke", 'latitude': 47.3,'longitude':  8.55, 'link': ''},
        //{'name': "Zürich, Apotheke zum Mörser GmbH", 'latitude': 47.3,'longitude':  8.55, 'link': ''},
        //{'name': "Zürich, Medbase Apotheke Zürich Niederdorf", 'latitude': 47.3,'longitude':  8.55, 'link': ''},
        //{'name': "Uster, Coop Vitality Apotheke Uster", 'latitude': 47.3,'longitude':  8.55, 'link': ''},
        //{'name': "Apotheke im KSW AG", 'latitude': 47.3,'longitude':  8.55, 'link': ''},

        //{'name': "Zürich, Apotheke Affoltern", 'latitude': 47.3,'longitude':  8.55, 'link': ''},

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
                <a href={popupInfo.link}>{popupInfo.name}</a>
            </Popup>
        )}
    </ReactMapGL>
}

export default Map