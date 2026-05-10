"use client";

import { useEffect, useMemo } from "react";
import { GeoJsonLayer, ScatterplotLayer } from "@deck.gl/layers";
import { GoogleMapsOverlay } from "@deck.gl/google-maps";
import { APIProvider, Map, useMap } from "@vis.gl/react-google-maps";

import { Feature, Geometry } from "geojson";

declare global {
  interface Window {
    google: any;
  }
}

type LocationProperties = {
  NOMBRE_DPT: string;
};

function DeckGLOverlay() {
  const map = useMap();

  const overlay = useMemo(
    () =>
      new GoogleMapsOverlay({
        interleaved: true,
      }),
    [],
  );

  const layers = useMemo(
    () => [
      new GeoJsonLayer<LocationProperties>({
        id: "colombia-departments",
        data: "/api/location",
        filled: true,
        stroked: true,
        getFillColor: [100, 150, 255, 150],
        getLineColor: [255, 255, 255],
        getLineWidth: 2000,
        getText: (f: Feature<Geometry, LocationProperties>) =>
          f.properties.NOMBRE_DPT,
        getTextColor: [255, 255, 255],
        lineWidthMinPixels: 1,
        pickable: true,
        onClick: (info) =>
          console.log(`${info.object.properties.NOMBRE_DPT} clicked`),
      }),
      new ScatterplotLayer({
        id: "user-points",
        data: "/api/users",
        getPosition: (d) => [d.M_DIR_LON, d.M_DIR_LAT],
        getFillColor: [255, 0, 0],
        getRadius: 100,
        radiusMinPixels: 5,
        pickable: true,
        onHover: (info) =>
          info.object &&
          console.log(`${info.object.M_NAME} is in ${info.object.department}`),
      }),
    ],
    [],
  );

  useEffect(() => {
    overlay.setProps({ layers });
  }, [layers, overlay]);

  useEffect(() => {
    const google = window.google;
    if (!map) return;

    // Helper to attach the overlay safely
    const attachOverlay = () => {
      if (map.getProjection()) {
        overlay.setMap(map);
      } else {
        // If projection isn't ready, wait for it
        const listener = google.maps.event.addListenerOnce(
          map,
          "projection_changed",
          () => overlay.setMap(map),
        );
        return listener;
      }
    };

    const listenerInstance = attachOverlay();

    return () => {
      overlay.setMap(null);
      if (listenerInstance) google.maps.event.removeListener(listenerInstance);
    };
  }, [map, overlay]);

  return null;
}

export default function MapComponent({
  initialZoom,
  initialCenter,
}: {
  initialZoom: number;
  initialCenter: { lat: number; lng: number };
}) {
  return (
    <div style={{ height: "100vh", width: "100%" }}>
      <APIProvider apiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || ""}>
        <Map
          defaultCenter={initialCenter}
          defaultZoom={initialZoom}
          mapId={process.env.NEXT_PUBLIC_GOOGLE_MAP_ID}
        >
          <DeckGLOverlay />
        </Map>
      </APIProvider>
    </div>
  );
}
