const mapBoxApiKey = 'pk.eyJ1IjoiYWFyeWFucyIsImEiOiJja3pwd2xkeGswZTlwMm9yeDF6NnRjMDlhIn0.WGKgidynUJvizPaVAnRG0w';
const endPointUrl = 'https://data.calgary.ca/resource/c2es-76ed.geojson';

let calgaryCordinates = [51.049999, -114.066666];
let zoomLevel = 12;
let map;
let markers;

async function handleSearchButtonClick(){
    $("#result").html(`<b>Loading building into map....`);
    const fromDate = $("#from-date").val();
    const toDate = $("#to-date").val();
    const buildingPermitsData = await callAPIService(fromDate,toDate);
    const totalBuildingPermits = (buildingPermitsData && buildingPermitsData.features && buildingPermitsData.features.length) || 0;
    $("#result").html(`<b>Total building permits found: ${totalBuildingPermits}</b>`);
    
    // Removing existing marker points if any
    if(markers){
        map.removeLayer(markers);
    }
    
    if(totalBuildingPermits === 0)
        return;

    // Using Leaflet Plug-in:https://github.com/jawj/OverlappingMarkerSpiderfier-Leaflet to avoid overlapping markers.
    const popup = new L.popup();
    const oms = new OverlappingMarkerSpiderfier(map);
    oms.addListener('click', function(marker) {
        popup.setContent(marker.popupcontent);
        popup.setLatLng(marker.getLatLng());
        map.openPopup(popup);
    });
    oms.addListener('spiderfy', function(markers) {
        map.closePopup();
    });

    // Using Leaflet Plug-in:https://github.com/Leaflet/Leaflet.markercluster, to avoid cluttering of points.
    markers = L.markerClusterGroup();

    // Marking points on map
    for(let i=0;i<totalBuildingPermits;i++){
        const feature = buildingPermitsData.features[i];
        if(feature && feature.geometry && feature.geometry.coordinates){
            const {geometry,properties} = feature;
            const coordinates = [geometry.coordinates[1], geometry.coordinates[0]]
            const marker = L.marker(coordinates);
            marker.popupcontent = `<b>Issued date</b>: ${(properties.issueddate).split("T")[0]}<br/>
                <b>Work class group</b>: ${properties.workclassgroup || "N/A"}</br>
                <b>Contractor name</b>: ${properties.contractorname || "N/A"}<br/>
                <b>Community name</b>: ${properties.communityname || "N/A"}<br/>
                <b>Orignal address</b>: ${properties.originaladdress || "N/A"}`;
            oms.addMarker(marker);
            markers.addLayer(marker);
        }
        map.addLayer(markers);
    }
}

async function callAPIService(fromDate,toDate){
    let data = []
    try{
        const response = await fetch(`${endPointUrl}?$where=issueddate > '${fromDate}' and issueddate < '${toDate}'`);
        if (response.status === 200){
            data = await response.json();
        }else{
            $("#result").html("<b style='color:red;'>Network error</b>")
        }
    }catch(e){
        $("#result").html("<b style='color:red;'>Network error</b>")
    }
    return data
}

// Lab 3
function handleToggleButton(source){
    if(source === 'building-permits'){
        $("#building-permits").prop("checked", true);
        $("#vehicle-incidents").prop("checked", false);
        $("#search-box").css({"display": "block"});
        $("#traffic-incidents").css({"display": "none"});
        main();
    }else if(source === 'vehicle-incidents'){
        $("#building-permits").prop("checked", false);
        $("#vehicle-incidents").prop("checked", true);
        $("#search-box").css({"display": "none"});
        $("#traffic-incidents").css({"display": "block"});
        loadVehicleIncidentsMap();
    }
}

// Lab 3
function loadVehicleIncidentsMap(){
    if(map){
        map.remove();
    }
    map = L.map('map')
        .setView(calgaryCordinates, 13);
    L.tileLayer('https://api.mapbox.com/styles/v1/aaryans/ckzyhqrzc00dn15p7loqaqasa/tiles/{z}/{x}/{y}?access_token={accessToken}', {
        attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, ' +
        'Imagery © <a href="https://www.mapbox.com/">Mapbox</a>',
        maxZoom: 18,
        id: 'mapbox/navigation-night-v1',
        tileSize: 512,
        zoomOffset: -1,
        accessToken: mapBoxApiKey
    }).addTo(map);
}

function main(){
    if(map){
        map.remove();
    }
    
    $("#result").html(' ');
    map = L.map('map', {
        center: calgaryCordinates,
        zoom: zoomLevel
    });
    
    L.tileLayer('https://api.mapbox.com/styles/v1/{id}/tiles/{z}/{x}/{y}?access_token={accessToken}', {
        attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, ' +
        'Imagery © <a href="https://www.mapbox.com/">Mapbox</a>',
        maxZoom: 18,
        id: 'mapbox/navigation-night-v1',
        tileSize: 512,
        zoomOffset: -1,
        accessToken: mapBoxApiKey
    }).addTo(map);

    const todayDate = new Date();
    const thirtyDaysBeforeTodayDate = new Date(todayDate.setDate(todayDate.getDate() - 60));
    $("#from-date").attr('value',thirtyDaysBeforeTodayDate.toJSON().slice(0,10).replace(/-/g,'-'));
    $("#to-date").attr('value',(new Date()).toJSON().slice(0,10).replace(/-/g,'-'));
    $("#building-permits").prop("checked", true);
}

main()