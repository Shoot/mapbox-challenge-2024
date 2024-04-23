import mapboxgl from 'mapbox-gl';
import MapboxLanguage from '@mapbox/mapbox-gl-language';
mapboxgl.accessToken = "pk.eyJ1IjoibWFwYXRob24yMDI0LXRlYW01IiwiYSI6ImNsdmFtM2drMjE2cmsya216dW9mbTk4dW8ifQ.xAHiLx6THdPQKrnNVMTgNg";
const MapComponent = (props) => {
  let {lat, lon, url} = props
  let zoom = 11;
  if (lat>56||lat<51||lon>33||lon<23) {
    lat=53.900400
    lon=27.559192
    zoom=7
  }
  const map = new mapboxgl.Map({
    container: document.getElementById('map'),
    zoom: zoom,
    center: [lon, lat],
    style: "mapbox://styles/mapathon2024-team5/clvc3jldh00v801qz7qqggaso",
  });
  map.addControl(new MapboxLanguage());
  map.addControl(new mapboxgl.NavigationControl());
  map.on("load", () => {
    map.addSource("earthquakes", {
      type: "geojson",
      data: "http://146.59.12.51:8000/do/visionpro1t.geojson",
      cluster: true,
      clusterRadius: 70,
      clusterProperties: {
        // keep separate counts for each magnitude category in a cluster
        min_price: ["min", ["get", "price"]],
      },
    });
    map.loadImage(
      "luxa.org-opacity-changed-bg.png",
      (error, image) => {
        if (error) throw error;

        map.addImage("rect", image);

        map.addLayer({
          id: "points",
          type: "symbol",
          source: "earthquakes", // reference the data source
          filter: ["!=", "cluster", true],
          layout: {
            "icon-image": "rect", // reference the image
            "text-field": [
              "format",
              ["concat", ["to-string", ["get", "price"]], " руб."],
            ],
            "text-font": ["Open Sans Semibold", "Arial Unicode MS Bold"],
            "text-size": 14,
            "icon-text-fit": "both",
            "icon-size": 1.4,
          },
          paint: {
            "text-color": "red",
          },
        });
      },
    );
  });
  map.on("click", "points", (e) => {
    console.log(e);
    const coordinates = e.features[0].geometry.coordinates.slice();
    const price = e.features[0].properties.price;
    const href_img = e.features[0].properties.pic;
    const address = e.features[0].properties.address;
    const tsunami = e.features[0].properties.tsunami === 1 ? "yes" : "no";

    // Ensure that if the map is zoomed out such that
    // multiple copies of the feature are visible, the
    // popup appears over the copy being pointed to.
    while (Math.abs(e.lngLat.lng - coordinates[0]) > 180) {
      coordinates[0] += e.lngLat.lng > coordinates[0] ? 360 : -360;
    }

    new mapboxgl.Popup()
      .setLngLat(coordinates)
      .setHTML(
        `<img style="width : 100%"src="${href_img}" alt="Italian Trulli"><br>Цена: ${price} руб.<br>Адрес: ${address}`,
      )
      .addTo(map);
  });
  // objects for caching and keeping track of HTML marker objects (for performance)
  const markers = {};
  let markersOnScreen = {};

  function updateMarkers() {
    const newMarkers = {};
    const features = map.querySourceFeatures("earthquakes");

    // for every cluster on the screen, create an HTML marker for it (if we didn't yet),
    // and add it to the map if it's not there already
    for (const feature of features) {
      const coords = feature.geometry.coordinates;
      const props = feature.properties;
      if (!props.cluster) continue;
      const id = props.cluster_id;

      let marker = markers[id];
      if (!marker) {
        const el = createDonutChart(props);
        marker = markers[id] = new mapboxgl.Marker({
          element: el,
        }).setLngLat(coords);
      }
      newMarkers[id] = marker;

      if (!markersOnScreen[id]) marker.addTo(map);
    }
    // for every marker we've added previously, remove those that are no longer visible
    for (const id in markersOnScreen) {
      if (!newMarkers[id]) markersOnScreen[id].remove();
    }
    markersOnScreen = newMarkers;
  }

  const points = {};
  let pointsOnScreen = {};
  function updatePoints() {
    const newPoints = {};
    const features = map.querySourceFeatures("earthquakes");

    for (const feature of features) {
      const coords = feature.geometry.coordinates;
      const props = feature.properties;
      if (props.cluster) continue;
      const id = props.address;

      let point = points[id];
      if (!point) {
        const el = createPoint(props);
        point = points[id] = new mapboxgl.Marker({
          element: el,
        }).setLngLat(coords);
      }

      newPoints[id] = point;

      if (!pointsOnScreen[id]) {
        point.addTo(map);
      }
    }

    for (const id in pointsOnScreen) {
      if (!newPoints[id]) {
        pointsOnScreen[id].remove();
      }
    }
    pointsOnScreen = newPoints;
  }

  // after the GeoJSON data is loaded, update markers on the screen on every frame
  map.on("render", () => {
    if (!map.isSourceLoaded("earthquakes")) return;
    updateMarkers();
    // updatePoints();
  });

  // code for creating an SVG donut chart from feature properties
  function createDonutChart(props) {
    const { point_count } = props;
    const r = 30;
    const fontSize = Math.max(16, r * 0.6);
    const h = r;

    let html = `<svg width="${4 * h}" height="${h}">`;
    html += `<rect x="1" y="1" rx="5" ry="5" width="${4 * h - 2}" height="${h - 2}"
            style="fill:white;stroke:black;stroke-width:1;opacity:0.7" />`;
    html += `<circle cx="${h / 2}" cy="${h / 2}" r="${h / 2 - 2}" stroke="green" stroke-width="2" fill="green"/>`;
    html += `<text dominant-baseline="middle" text-anchor="middle" x = "${h / 2}" y = "${h / 2 + 1}" fill="white" font-size="${12}">${point_count}</text>`;
    html += `<text dominant-baseline="middle" text-anchor="middle" x = "${2.5 * h}" y = "${h / 2 + 1}" fill="black" font-size="10">От ${props.min_price} руб.</text>`;
    const el = document.createElement("div");
    el.innerHTML = html;
    return el.firstChild;
  }

  function createPoint(props) {
    let html = `<svg width="70" height="20">
    <rect x="0" y="0" rx="5" ry="5" width="70" height="20"
            style="fill:#90d466;stroke:black;stroke-width:1;opacity:0.5" />
  </svg>`;
    const el = document.createElement("div");
    el.innerHTML = html;
    return el.firstChild;
  }
}
export default MapComponent;