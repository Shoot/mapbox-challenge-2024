/* global chrome */
import React, {useEffect, useRef} from 'react';
import mapboxgl from "mapbox-gl";
import MapboxLanguage from "@mapbox/mapbox-gl-language";

mapboxgl.accessToken = "pk.eyJ1IjoibWFwYXRob24yMDI0LXRlYW01IiwiYSI6ImNsdmFtM2drMjE2cmsya216dW9mbTk4dW8ifQ.xAHiLx6THdPQKrnNVMTgNg";

function App() {
  let lat = 53;
  let lon = 27;
  let error = "";
  let zoom = 11;
  let currentTabUrl = "https://catalog.onliner.by/"
  if (lat > 56 || lat < 51 || lon > 33 || lon < 23 || 1) {
    lat = 53.900400
    lon = 27.559192
    zoom = 7
  }
  const mapContainerRef = useRef(null);
  useEffect(() => {
    const map = new mapboxgl.Map({
      container: mapContainerRef.current,
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
      while (Math.abs(e.lngLat.lng - coordinates[0]) > 180) {
        coordinates[0] += e.lngLat.lng > coordinates[0] ? 360 : -360;
      }
      new mapboxgl.Popup()
        .setLngLat(coordinates)
        .setHTML(
          `<img style="width : 100%" src="${href_img}" alt="Italian Trulli"><br>Цена: ${price} руб.<br>Адрес: ${address}`,
        )
        .addTo(map);
    });
    const markers = {};
    let markersOnScreen = {};
    function updateMarkers() {
      const newMarkers = {};
      const features = map.querySourceFeatures("earthquakes");
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
      for (const id in markersOnScreen) {
        if (!newMarkers[id]) markersOnScreen[id].remove();
      }
      markersOnScreen = newMarkers;
    }
    map.on("render", () => {
      if (!map.isSourceLoaded("earthquakes")) return;
      updateMarkers();
    });
    return () => map.remove();
  }, []);
  function createDonutChart(props) {
    const {point_count} = props;
    const h = 30;
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
  return (
    !error
      ?
      currentTabUrl && currentTabUrl.startsWith("https://catalog.onliner.by")
        ?
        <div>
          <h1>Onliner-map</h1>
          <div ref={mapContainerRef} style={{width: '100%', height: '460px'}}/>
          ;
        </div>
        :
        <h1>Please make sure you're on a product page on catalog.onliner.by and try again</h1>
      :
      <h1>{error}</h1>
  );
}

export default App