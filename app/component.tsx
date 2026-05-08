"use client";

import { GeoJsonLayer } from "@deck.gl/layers";
import { GoogleMapsOverlay } from "@deck.gl/google-maps";
import { APIProvider, Map, MapProps } from "@vis.gl/react-google-maps";

export default function MapComponent({
  initialZoom,
  initialCenter,
}: {
  initialZoom: number;
  initialCenter: { lat: number; lng: number };
}) {
  const GOOGLE_MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  const GOOGLE_MAP_ID = process.env.NEXT_PUBLIC_GOOGLE_MAP_ID;

  const geoJsonLayer = new GeoJsonLayer({
    id: "colombia-departments",
    data: "/api/location",
    filled: true,
    stroked: true,
    getFillColor: [100, 150, 255, 100],
    getLineColor: [255, 255, 255],
    getLineWidth: 2000,
    lineWidthMinPixels: 1,
    pickable: true,
    autoHighlight: true,
    onClick: (info) =>
      console.log("Clicked:", info.object.properties.NOMBRE_DPT),
  });

  return (
    <div id="map-container">
      <APIProvider apiKey={GOOGLE_MAPS_API_KEY || ""}>
        <Map
          defaultCenter={initialCenter}
          defaultZoom={initialZoom}
          mapId={GOOGLE_MAP_ID || ""}
          onLoad={(map: MapProps) => {
            new GoogleMapsOverlay({ layers: [geoJsonLayer] }).setMap(map);
          }}
        />
      </APIProvider>
    </div>
  );
}
