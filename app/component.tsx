"use client";

import { PolygonLayer } from "@deck.gl/layers";
import { GoogleMapsOverlay } from "@deck.gl/google-maps";
import { APIProvider, Map, MapProps } from "@vis.gl/react-google-maps";

type ZipCode = {
  zipcode: number;
  population: number;
  area: number;
  contour: [number, number][];
};

export default function MapComponent({
  initialZoom,
  initialCenter,
}: {
  initialZoom: number;
  initialCenter: { lat: number; lng: number };
}) {
  const GOOGLE_MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  const GOOGLE_MAP_ID = process.env.NEXT_PUBLIC_GOOGLE_MAP_ID;

  const layer = new PolygonLayer<ZipCode>({
    id: "PolygonLayer",
    data: "https://raw.githubusercontent.com/visgl/deck.gl-data/master/website/sf-zipcodes.json",
    getPolygon: (d: ZipCode) => d.contour,
    getElevation: (d: ZipCode) => d.population / d.area / 10,
    getFillColor: (d: ZipCode) => [d.population / d.area / 60, 140, 0],
    getLineColor: [255, 255, 255],
    getLineWidth: 20,
    lineWidthMinPixels: 1,
    pickable: false,
  });

  return (
    <div id="map-container">
      <APIProvider apiKey={GOOGLE_MAPS_API_KEY || ""}>
        <Map
          defaultCenter={initialCenter}
          defaultZoom={initialZoom}
          mapId={GOOGLE_MAP_ID || ""}
          onLoad={(map: MapProps) => {
            new GoogleMapsOverlay({ layers: [layer] }).setMap(map);
          }}
        />
      </APIProvider>
    </div>
  );
}
