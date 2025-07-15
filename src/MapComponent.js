import React, { useEffect, useRef, useState } from "react";
import { MapContainer, TileLayer, GeoJSON } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { ImageOverlay } from 'react-leaflet';
import * as turf from "@turf/turf";
// Normalize variable names
function normalizeVariableName(raw) {
  const lookup = {
    sst: ["sst", "SST", "Sst", "sea surface temperature", "sea_temperature", "seatemp", "seaTemp", "seaTempKelvin"],
    cmi: ["cmi", "CMI", "reflectance", "radiance", "cloud moisture imagery", "abi_cmi"],
    dust: ["dust", "DUST", "ducmass", "DUCMASS", "dust mass", "aerosol", "aerosol optical depth", "aod"],
    landcover: ["landcover", "land cover", "land_cover", "lc", "NLCD", "IGBP", "vegetation_type"],
    algaebloom: ["algaebloom", "algae", "algae bloom", "chlorophyll", "chl", "bloom"],
    acha: ["acha", "ACHA", "cloud top height", "cloud height", "cldtop_ht", "CTH", "cloud_top_ht", "cloud_top_pressure"],
    actp: ["actp", "ACTP", "cloud type", "cld_type", "CT"],
    acm: ["acm", "ACM", "cloud mask", "clear sky mask", "clear_mask", "cldmask"],
    achp: ["achp", "ACHP", "cloud phase", "cld_phase", "phase"],
    adp: ["adp", "ADP", "aerosol", "aerosol detection", "dust", "smoke", "aod_flag"],
    dsi: ["dsi", "DSI", "stability index", "lifted index", "LI", "CAPE", "CIN"],
    rrqpef: ["rrqpef", "RRQPE", "rain rate", "precipitation rate", "precip_rate"],
    tpwf: ["tpwf", "total precipitable water", "TPW", "PW"],
    lstf: ["lstf", "land surface temperature", "LST", "surface temp"],
    ccl: ["ccl", "CCL", "cloud condensation level", "cloud base", "cloud base height", "CBH"]
  };

  const cleaned = raw.trim().toLowerCase();
  for (const [canonical, aliases] of Object.entries(lookup)) {
    if (aliases.map(a => a.toLowerCase()).includes(cleaned)) return canonical;
  }
  return cleaned;
}

// Color mapping function
function getColorForValue(variable, value) {
  if (value == null || isNaN(value)) return "#ccc";
  variable = normalizeVariableName(variable);

  switch (variable) {
    case "sst":
    case "lstf":
      if (value < 0) return "#313695";
      if (value < 5) return "#4575b4";
      if (value < 10) return "#74add1";
      if (value < 15) return "#abd9e9";
      if (value < 20) return "#e0f3f8";
      if (value < 25) return "#fee090";
      if (value < 28) return "#fdae61";
      if (value < 32) return "#f46d43";
      return "#a50026";

    case "cmi":
      if (value < 0.1) return "#0000ff";
      if (value < 0.2) return "#00bfff";
      if (value < 0.3) return "#00ff00";
      if (value < 0.4) return "#ffff00";
      if (value < 0.5) return "#ff8000";
      return "#ff0000";

    case "dust":
    case "adp":
      if (value < 0.1) return "#ffffcc";
      if (value < 0.3) return "#ffeda0";
      if (value < 0.5) return "#feb24c";
      if (value < 0.7) return "#f03b20";
      return "#bd0026";

    case "landcover":
      return { 0: "#ffffff", 1: "#7fc97f", 2: "#beaed4", 3: "#fdc086", 4: "#ffff99", 5: "#386cb0", 6: "#f0027f" }[value] || "#999999";

    case "algaebloom":
      if (value < 0.2) return "#d0f0c0";
      if (value < 0.4) return "#a2d39c";
      if (value < 0.6) return "#62c370";
      if (value < 0.8) return "#2e8540";
      return "#005a32";

    case "acha":
    case "dsi":
    case "rrqpef":
    case "tpwf":
      if (value < 0.2) return "#e0f3db";
      if (value < 0.4) return "#a8ddb5";
      if (value < 0.6) return "#7bccc4";
      if (value < 0.8) return "#43a2ca";
      return "#0868ac";

    case "acm":
      if (value < 0.5) return "#0000ff";
      if (value < 1.5) return "#00bfff";
      if (value < 2.5) return "#ffa500";
      return "#8b0000";

    default:
      const clamped = Math.max(0, Math.min(50, value));
      const r = Math.round((clamped / 50) * 255);
      const g = 0;
      const b = Math.round((1 - clamped / 50) * 255);
      return `rgb(${r},${g},${b})`;
  }
}
const MapComponent = ({ showSST, showDust, showPredSST, uploadedGeoJSON, variableName }) => {
  const mapRef = useRef();
  const tooltipLayersRef = useRef([]);
  const [land, setLand] = useState(null);
  const [coast, setCoast] = useState(null);
  const [state, setState] = useState(null);
  const [countries, setCountries] = useState(null);
  const [mapReady, setMapReady] = useState(false);
  const [water, setWater] = useState(null);
  

  useEffect(() => {
    fetch("/geojson/land_mask_simplified.geojson").then(res => res.json()).then(setLand).catch(console.error);
    fetch("/geojson/coastline_simplified.geojson").then(res => res.json()).then(setCoast).catch(console.error);
    fetch("/geojson/state_mask_simplified.geojson").then(res => res.json()).then(setState).catch(console.error);
    fetch("/geojson/ocean.geojson").then(res => res.json()).then(setWater).catch(console.error);
  }, []);

  useEffect(() => {
  fetch("/geojson/simplified_countries.geojson")
    .then(res => res.json())
    .then(data => {
      console.log("Raw GeoJSON fetch result:", data);
      setCountries(data);
    })
    .catch(console.error);
  }, []);

  useEffect(() => {
    const legend = L.control({ position: "bottomright" });
    legend.onAdd = function () {
      const div = L.DomUtil.create("div", "info legend");
      div.innerHTML = `<b>${variableName}</b>`;
      return div;
    };

    if (mapRef.current) legend.addTo(mapRef.current);
    return () => legend.remove();
  }, [variableName]);

  return (
    <div style={{ height: "calc(100vh - 60px - 40px)", width: "100%" }}>
      <MapContainer
      
        center={[15, -35]} // Move center slightly south
        zoom={2}
        zoomControl={false}
        minZoom={2}
        maxZoom={8}
        crs={L.CRS.EPSG4326}
        worldCopyJump={false}
        noWrap={true}
        maxBounds={[[-85, -180], [85, 180]]} // Crop top & bottom
        maxBoundsViscosity={1.0}
        style={{ height: "100%", width: "100%" }}
        whenCreated={(mapInstance) => { mapRef.current = mapInstance; setMapReady(true);}}
      >
      <TileLayer
        url="https://gibs.earthdata.nasa.gov/wmts/epsg4326/best/VIIRS_CityLights_2012/default/2020-01-01/250m/{z}/{y}/{x}.jpg"
        attribution="NASA GIBS / VIIRS"
        tileSize={256}
        noWrap={true}
      />
        {showSST && (
            <ImageOverlay
              url="http://127.0.0.1:5000/sst_today_overlay"
              bounds={[[-90, -180], [90, 180]]}
              opacity={0.8}
              zIndex={500}
              noWrap={true}
            />
        )}
        {showPredSST && (
          <ImageOverlay
           url="http://127.0.0.1:5000/predicted_sst_tomorrow_overlay"
           bounds={[[-90, -180], [90, 180]]}
           opacity={0.8}
           zIndex={498}
            noWrap={true}
          />
        )}

        {showDust && (
           <ImageOverlay
             url="http://127.0.0.1:5000/dust_today_overlay"  // Flask should serve this path
             bounds={[[-90, -180], [90, 180]]}
             opacity={0.8}
             zIndex={499}
             noWrap={true}
           />
        )}

        {uploadedGeoJSON && (
          <GeoJSON
            data={uploadedGeoJSON}
            pointToLayer={(feature, latlng) => {
              const key = normalizeVariableName(variableName);
              const value = feature.properties[key] ?? Object.values(feature.properties)[0];
              const color = getColorForValue(key, value);
              return L.circleMarker(latlng, { radius: 4, fillColor: color, color: color, weight: 0.5, fillOpacity: 0.8 });
            }}
            onEachFeature={(feature, layer) => {
              if (feature.properties) {
                const label = Object.entries(feature.properties).map(([k, v]) => `${k}: ${v}`).join("<br/>");
                layer.bindPopup(label);
              }
            }}
          />
        )}

        {land && <GeoJSON data={land} style={{ fillColor: "transparent", color: "gray", weight: 0.5 }} pane="overlayPane" minZoom={3} maxZoom={6}/>}
        {coast && (<GeoJSON
                    data={coast}
                    style={{
                      color: "black",
                      weight: 1,
                      fillColor: "#eeeeee", // light gray land
                      fillOpacity: 1,
                    }}
                  />
                )}
        {state && (<GeoJSON
                    data={state}
                    style={{ color: "black", weight: 0.8 }}
                    zIndex={601}
                 />
                )}
        {countries && (<GeoJSON
                        data={countries}
                        style={() => ({
                         color: "#888",
                         weight: 0.7,
                         fillColor: "transparent"
                      })}
                      onEachFeature={(feature, layer) => {
                        const area = turf.area(feature);
                        if (area < 500000000000) return;

                        const name = feature.properties.NAME || 
                                      feature.properties.name ||
                                      feature.properties.ADMIN ||
                                      "Country";
                        const tooltip = L.tooltip({
                           permanent: true,
                           direction: "top",
                           className: "country-label",
                           opacity: 1,
                        }).setContent(name).setLatLng(turf.centroid(feature).geometry.coordinates.reverse());
                        layer.bindTooltip(tooltip);
                        tooltipLayersRef.current.push(tooltip);
                        }}
                     />
                   )}
        {water && (<GeoJSON
                    data={water}
                    style={{
                    fillColor: "#cceeff",
                    color: "#cceeff",
                    weight: 0,
                    fillOpacity: 0.6
       }}
       pane="tilePane"
  />
)}
      </MapContainer>
    </div>
  );
};

export default MapComponent;
