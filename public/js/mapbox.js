/* eslint-disable */

export const displayMap = locations => {
    mapboxgl.accessToken =
        'pk.eyJ1IjoiZmFiaWFucGluMSIsImEiOiJjazhidndhMHQwZGFsM2tvMWNvbzIxZzV1In0.HOTBdecbpmDsp0zuzC9QwA';

    var map = new mapboxgl.Map({
        container: 'map',
        style: 'mapbox://styles/fabianpin1/ck8bwf1no0y851jpdlgtz2v76',
        // center: [-118.292382, 34.054915],
        // zoom: 6
    });

    const bounds = new mapboxgl.LngLatBounds()

    locations.forEach(loc => {

        // Create Marker
        const el = document.createElement('div');
        el.className = 'marker';

        // Add Marker
        new mapboxgl.Marker({
            element: el,
            anchor: 'bottom'
        }).setLngLat(loc.coordinates).addTo(map);

        // Add Popup
        new mapboxgl.Popup({
                offset: 30
            })
            .setLngLat(loc.coordinates)
            .setHTML(`<p>Día ${loc.day}: ${loc.description}</p>`)
            .addTo(map)

        // Extend map bounds to include current location
        bounds.extend(loc.coordinates)
    });


    map.fitBounds(bounds, {
        padding: {
            top: 200,
            bottom: 150,
            left: 200,
            right: 200
        }
    })
}