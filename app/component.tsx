"use client";

import { useEffect, useMemo, useState } from "react";
import { GeoJsonLayer, ScatterplotLayer } from "@deck.gl/layers";
import { GoogleMapsOverlay } from "@deck.gl/google-maps";
import { APIProvider, Map, useMap } from "@vis.gl/react-google-maps";
import { Feature, Geometry } from "geojson";

declare global {
  interface Window {
    google: any;
  }
}

// Define the shape of a Colombia Department based on your GeoJSON properties
interface ColombiaDeptProperties {
  NOMBRE_DPT: string;
  DPTO?: string; // Department code
  [key: string]: any; // Allows for other properties without error
}

interface DeckGLOverlayProps {
  setSelectedDept: (dept: ColombiaDeptProperties | null) => void;
  setIsDrawerOpen: (open: boolean) => void;
  setServiceError: (error: string | null) => void;
}

function DeckGLOverlay({
  setSelectedDept,
  setIsDrawerOpen,
  setServiceError,
}: DeckGLOverlayProps) {
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
      new GeoJsonLayer<ColombiaDeptProperties>({
        id: "colombia-departments",
        data: "/api/location",
        filled: true,
        stroked: true,
        getFillColor: [100, 150, 255, 150],
        getLineColor: [255, 255, 255],
        getLineWidth: 2000,
        getText: (f: Feature<Geometry, ColombiaDeptProperties>) =>
          f.properties.NOMBRE_DPT,
        getTextColor: [255, 255, 255],
        lineWidthMinPixels: 1,
        pickable: true,
        onClick: (info) => {
          if (info.object) {
            setSelectedDept(info.object.properties);
            setIsDrawerOpen(true);
          }
        },
      }),
      new ScatterplotLayer({
        id: "user-points",
        data: "/api/users",
        getPosition: (d) => [d.M_DIR_LON, d.M_DIR_LAT],
        getFillColor: [255, 0, 0],
        getRadius: 100,
        radiusMinPixels: 5,
        pickable: true,
        onError: (error: Error) => {
          console.error("Scatterplot load failure:", error);
          setServiceError(
            "El servicio de usuarios no esta disponible en este momento. Por favor intenta de nuevo mas tarde.",
          );
        },
        onDataLoad: () => {
          setServiceError(null);
        },
        onHover: (info) =>
          info.object &&
          console.log(`${info.object.M_NAME} is in ${info.object.department}`),
      }),
    ],
    [setSelectedDept, setIsDrawerOpen, setServiceError],
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
  const [selectedDept, setSelectedDept] =
    useState<ColombiaDeptProperties | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState<boolean>(false);
  const [serviceError, setServiceError] = useState<string | null>(null);

  return (
    <div id="map-container">
      {/* 1. The Map */}
      <APIProvider apiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || ""}>
        <Map
          defaultCenter={initialCenter}
          defaultZoom={initialZoom}
          mapId={process.env.NEXT_PUBLIC_GOOGLE_MAP_ID}
        >
          <DeckGLOverlay
            setSelectedDept={setSelectedDept}
            setIsDrawerOpen={setIsDrawerOpen}
            setServiceError={setServiceError}
          />
        </Map>
      </APIProvider>

      {/* 2. Floating General Info Card (Top Left) */}
      <div className="absolute top-4 left-4 z-10 w-64 bg-white/90 p-4 shadow-xl rounded-lg backdrop-blur-md border border-gray-200">
        <h2 className="font-bold text-lg text-blue-900">Descripcion General</h2>
        <p className="text-sm text-gray-600">
          Haz click en un departamento para ver las estadisticas de los pastores
          por departamento.
          {serviceError && (
            <div className="mt-4 bg-red-50 border-l-4 border-red-500 p-4 rounded shadow-xl flex items-start justify-between backdrop-blur-sm bg-white/95">
              <div className="flex">
                <div className="flex-shrink-0 text-red-500 font-bold text-xl mr-3">
                  ⚠️
                </div>
                <div>
                  <p className="font-bold text-red-800">Error del sistema</p>
                  <p className="text-sm text-red-700 mt-1">{serviceError}</p>
                </div>
              </div>
              <button
                onClick={() => setServiceError(null)}
                className="text-red-400 hover:text-red-600 font-bold ml-4"
              >
                ✕
              </button>
            </div>
          )}
        </p>
      </div>

      {/* 3. Sliding Drawer (Right Side) */}
      <div
        className={`absolute top-0 right-0 h-full w-80 bg-white shadow-2xl z-20 transition-transform duration-300 transform ${isDrawerOpen ? "translate-x-0" : "translate-x-full"}`}
      >
        {selectedDept && (
          <div className="p-6">
            <button
              onClick={() => setIsDrawerOpen(false)}
              className="absolute top-4 right-4 text-gray-500 hover:text-black"
            >
              ✕
            </button>

            <h2 className="text-2xl font-bold text-blue-800 mb-4">
              {selectedDept.NOMBRE_DPT}
            </h2>

            <div className="space-y-4">
              <div className="bg-blue-50 p-4 rounded-lg">
                <p className="text-sm text-blue-600 uppercase font-semibold">
                  Metricas generales
                </p>
                <p className="text-xl font-mono">
                  {selectedDept.DPTO || "N/A"}
                </p>
              </div>

              {/* You can filter your user list here to show count for THIS department */}
              <p className="text-gray-700">Espacio para metricas detalladas.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
