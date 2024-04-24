/* global chrome */
import React, {useEffect, useRef, useState} from 'react';
import mapboxgl from "mapbox-gl";
import MapboxLanguage from "@mapbox/mapbox-gl-language";
mapboxgl.accessToken = process.env.REACT_APP_MAPBOX_TOKEN;

function App() {
  const [loading, setLoading] = useState(true);
  const [loadingData, setLoadingData] = useState(true);
  const [activeTabUrl, setActiveTabUrl] = useState(null);
  useEffect(() => {
    const getActiveTabUrl = async () => {
      const tabs = await chrome.tabs.query({active: true, currentWindow: true});
      const activeTab = tabs[0];
      const url = activeTab.url;
      setActiveTabUrl(url);
      setLoading(false);
    };
    getActiveTabUrl();
    chrome.tabs.onActivated.addListener(getActiveTabUrl);
    return () => {
      chrome.tabs.onActivated.removeListener(getActiveTabUrl);
    };
  }, []);
  const lat = 53.900400
  const lon = 27.559192
  const zoom = 11;
  const mapContainerRef = useRef(null);
  useEffect(() => {
    if (loading) {
      return
    }
    if (!activeTabUrl || !activeTabUrl.startsWith("https://catalog.onliner.by")) {
      document.getElementById("root").innerHTML = `<h1>Please make sure you're on a product page on catalog.onliner.by and try again</h1>`
      return
    }
    console.log(activeTabUrl)
    const map = new mapboxgl.Map({
      container: mapContainerRef.current,
      zoom: zoom,
      center: [lon, lat],
      style: "mapbox://styles/mapathon2024-team5/clvc3jldh00v801qz7qqggaso",
    });
    map.addControl(new MapboxLanguage());
    map.addControl(new mapboxgl.NavigationControl());
    map.on("load", () => {
      fetch("http://146.59.12.51:8000/do/" + activeTabUrl + ".geojson").then((rawData) => {
        rawData.json().then((data) => {
          console.log("Fetched")
          console.log(data)
          setLoadingData(false)
          map.addSource("stores", {
            type: "geojson",
            data: data,
            cluster: true,
            clusterRadius: 70,
            clusterProperties: {
              min_price: ["min", ["get", "price"]],
            },
          });
          map.loadImage(
            "opacity-changed-bg.png",
            (error, image) => {
              if (error) throw error;

              map.addImage("rect", image);

              map.addLayer({
                id: "points",
                type: "symbol",
                source: "stores", // reference the data source
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
                  "icon-allow-overlap": true,
                },
                paint: {
                  "text-color": "red",
                },
              });
            },
          );
        });
      });
    });
    map.on("click", "points", (e) => {
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
      const features = map.querySourceFeatures("stores");
      for (const feature of features) {
        const coords = feature.geometry.coordinates;
        const props = feature.properties;
        if (!props.cluster) continue;
        const id = props.cluster_id;
        let marker = markers[id];
        if (!marker) {
          const el = shit(props);
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
      if (!map.isSourceLoaded("stores")) return;
      updateMarkers();
    });
    return () => map.remove();
  }, [loading, activeTabUrl]);

  function shit(props) {
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
    <>
      <h1>Onliner-map {loading || loadingData ? "[Loading...]" : "[Ready]"}</h1>
      <div ref={mapContainerRef} style={{width: '100%', height: '100%'}}/>
    </>
  );
}

export default App