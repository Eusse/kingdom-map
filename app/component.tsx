"use client";

import { useEffect, useMemo, useState } from "react";
import { GeoJsonLayer, ScatterplotLayer } from "@deck.gl/layers";
import { GoogleMapsOverlay } from "@deck.gl/google-maps";
import { APIProvider, Map, useMap } from "@vis.gl/react-google-maps";
import { Feature, Geometry } from "geojson";
import { Drawer } from "./components/drawer";

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
  departmentCounts: Record<string, number>;
  maxCount: number;
  usersData: any[];
}

function getFeedbackColor(count: number, maxCount: number) {
  // 1. If there are exactly zero users, paint the department a clean slate gray
  if (count === 0) {
    return [148, 163, 184, 120]; // Tailwind slate-400 with ~45% opacity
  }
  // 2. If maxCount is somehow 0 but count isn't, fallback safety
  if (maxCount === 0) return [239, 68, 68, 160];
  // 3. Calculate percentage (0.0 to 1.0)
  // To make the gradient pop, we normalize it starting from 1 user up to maxCount
  const ratio = maxCount === 1 ? 1 : (count - 1) / (maxCount - 1);
  // Linear interpolation between Red [239, 68, 68] and Green [34, 197, 94]
  const r = Math.round(239 + (34 - 239) * ratio);
  const g = Math.round(68 + (197 - 68) * ratio);
  const b = Math.round(68 + (94 - 68) * ratio);

  return [r, g, b, 160]; // 160 alpha out of 255 for transparency
}

function DeckGLOverlay({
  setSelectedDept,
  setIsDrawerOpen,
  setServiceError,
  departmentCounts,
  maxCount,
  usersData,
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
        getLineColor: [255, 255, 255],
        getLineWidth: 2000,
        getText: (f: Feature<Geometry, ColombiaDeptProperties>) =>
          f.properties.NOMBRE_DPT,
        getTextColor: [255, 255, 255],
        lineWidthMinPixels: 1,
        pickable: true,
        getFillColor: (feature: any) => {
          const deptName = feature.properties.NOMBRE_DPT;
          const count = departmentCounts[deptName] || 0;
          return getFeedbackColor(count, maxCount);
        },
        updateTriggers: {
          getFillColor: [departmentCounts, maxCount],
        },
        onClick: (info) => {
          if (info.object) {
            const deptName = info.object.properties.NOMBRE_DPT;
            // Enrich the side drawer state with the real-time count
            setSelectedDept({
              ...info.object.properties,
              userCount: departmentCounts[deptName] || 0,
            });
            setIsDrawerOpen(true);
          }
        },
      }),
      new ScatterplotLayer({
        id: "user-points",
        data: usersData,
        getPosition: (d) => [d.M_DIR_LON, d.M_DIR_LAT],
        getFillColor: [255, 0, 0],
        getRadius: 100,
        radiusMinPixels: 5,
        pickable: true,
        onError: (error: Error) => {
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
    [
      departmentCounts,
      maxCount,
      usersData,
      setSelectedDept,
      setIsDrawerOpen,
      setServiceError,
    ],
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
  const [users, setUsers] = useState<any[]>([]);
  const [selectedDept, setSelectedDept] =
    useState<ColombiaDeptProperties | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState<boolean>(false);
  const [serviceError, setServiceError] = useState<string | null>(null);

  const usersInSelectedDept = useMemo(() => {
    if (!selectedDept) return [];
    return users.filter((user) => user.department === selectedDept.NOMBRE_DPT);
  }, [users, selectedDept]);

  // 1. Fetch user data manually on mount
  useEffect(() => {
    async function loadUsers() {
      try {
        const res = await fetch("/api/users");
        if (!res.ok) throw new Error();
        const data = await res.json();
        setUsers(data);
      } catch {
        setServiceError("Could not load user distribution statistics.");
      }
    }
    loadUsers();
  }, []);

  // 2. Generate a map of { "BOGOTA": 45, "ANTIOQUIA": 12 } and find the maximum
  const { departmentCounts, maxCount } = useMemo(() => {
    const counts: Record<string, number> = {};
    let max = 0;

    users.forEach((user) => {
      if (
        user.department &&
        user.department !== "Unknown" &&
        user.department !== "Invalid Coordinates"
      ) {
        counts[user.department] = (counts[user.department] || 0) + 1;
        if (counts[user.department] > max) max = counts[user.department];
      }
    });

    return { departmentCounts: counts, maxCount: max };
  }, [users]);

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
            departmentCounts={departmentCounts}
            maxCount={maxCount}
            usersData={users}
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
      <Drawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        department={selectedDept}
        departmentUsers={usersInSelectedDept}
      />
    </div>
  );
}
