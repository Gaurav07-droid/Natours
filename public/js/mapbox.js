//Gaurav0@7 mapbox passsword    ;
/* eslint-disable */

mapboxgl.accessToken =
  'pk.eyJ1IjoiaWdhdXJhdiIsImEiOiJjbDJzcGlrZmwwMTJlM2RrNDM4bGgyb2JzIn0.NvO9tWXOw9R8-7ADAxiIWg';

export const displayMap = (locations) => {
  var map = new mapboxgl.Map({
    container: 'map',
    style: 'mapbox://styles/igaurav/cl2st1qot001q14nzjtoon49a',
    scrollZoom: false,
    //   center: [-118.113491, 34.111745],
    //   zoom: 4,
    //interactive:false
  });

  const bounds = new mapboxgl.LngLatBounds();

  locations.forEach((loc) => {
    //creates the marker
    const el = document.createElement('div');
    el.className = 'marker';

    //adding the marker to the map
    new mapboxgl.Marker({
      element: el,
      anchor: 'bottom',
    })
      .setLngLat(loc.coordinates)
      .addTo(map);

    //adding popup to the map
    new mapboxgl.Popup({ closeOnClick: false, offset: 30 })
      .setLngLat(loc.coordinates)
      .setHTML(`<h5>Day ${loc.day}: ${loc.description}</h5>`)
      .addTo(map);

    //extends the map bounds to the current locations (zooming to locations)
    bounds.extend(loc.coordinates);
  });

  map.fitBounds(bounds, {
    padding: {
      top: 200,
      bottom: 150,
      left: 200,
      right: 200,
    },
  });
};
