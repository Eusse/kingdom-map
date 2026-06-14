"use client";

import { useEffect, useMemo, useState } from "react";
import { GeoJsonLayer, ScatterplotLayer } from "@deck.gl/layers";
import { GoogleMapsOverlay } from "@deck.gl/google-maps";
import { APIProvider, Map, useMap } from "@vis.gl/react-google-maps";
import { Feature, Geometry } from "geojson";
import { Drawer } from "./components/drawer";
import { ColombiaDeptProperties, User } from "./types";

declare global {
  interface Window {
    google: typeof google;
  }
}

interface DeckGLOverlayProps {
  setSelectedDept: (dept: ColombiaDeptProperties | null) => void;
  setIsDrawerOpen: (open: boolean) => void;
  setServiceError: (error: string | null) => void;
  departmentCounts: Record<string, number>;
  maxCount: number;
  usersData: User[];
}

function getFeedbackColor(
  count: number,
  maxCount: number,
): [number, number, number, number] {
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
        getFillColor: (feature: Feature<Geometry, ColombiaDeptProperties>) => {
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
        onError: () => {
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
  const [users, setUsers] = useState<User[]>([]);
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
        setServiceError(
          "No se pudo cargar la informacion de los usuarios en este momento. Intenta de nuevo mas tarde.",
        );
      }
    }
    loadUsers();
  }, []);

  // 2. Generate a map of { "BOGOTA": 45, "ANTIOQUIA": 12 } and find the maximum
  const { departmentCounts, maxCount, internationalCount } = useMemo(() => {
    const counts: Record<string, number> = {};
    let max = 0;
    let international = 0;

    users.forEach((user) => {
      if (user.department === "International") {
        international++;
      } else if (
        user.department &&
        user.department !== "Unknown" &&
        user.department !== "Invalid Coordinates"
      ) {
        counts[user.department] = (counts[user.department] || 0) + 1;

        // Keep tracking local max for the choropleth map scaling
        if (counts[user.department] > max) max = counts[user.department];
      }
    });

    return {
      departmentCounts: counts,
      maxCount: max,
      internationalCount: international,
    };
  }, [users]);

  // Inject international group into your leaderboard list array
  const sortedStats = useMemo(() => {
    const localStats = Object.entries(departmentCounts).map(
      ([name, count]) => ({
        name,
        count,
        isInternational: false,
      }),
    );

    // Sort local departments first
    localStats.sort((a, b) => b.count - a.count);

    // Append international item to the very bottom if there are any users found there
    if (internationalCount > 0) {
      localStats.push({
        name: "Fuera de Colombia 🌐",
        count: internationalCount,
        isInternational: true,
      });
    }

    return localStats;
  }, [departmentCounts, internationalCount]);

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

      {/* Error alert toast */}
      {serviceError && (
        <div className="absolute top-4 right-4 z-50 max-w-sm bg-red-50/95 border border-red-200 text-red-800 p-4 rounded-xl shadow-2xl backdrop-blur-md flex items-start space-x-3">
          <span className="text-base mt-0.5">⚠️</span>
          <div className="flex-1">
            <h4 className="font-bold text-xs text-red-900">
              Error del Servicio
            </h4>
            <p className="text-[11px] font-medium mt-0.5 leading-relaxed">
              {serviceError}
            </p>
          </div>
          <button
            onClick={() => setServiceError(null)}
            className="text-red-400 hover:text-red-600 transition-colors font-bold text-xs p-0.5"
          >
            ✕
          </button>
        </div>
      )}

      {/* 2. Floating Live Leaderboard Panel (Pushed down to top-24 to safely clear map toggles) */}
      <div className="absolute top-24 left-4 z-10 w-72 bg-white/95 rounded-xl shadow-2xl border border-slate-100 flex flex-col max-h-[60vh] backdrop-blur-md">
        {/* Header Block */}
        <div className="p-4 border-b border-slate-100">
          <h2 className="font-bold text-slate-800 text-base flex items-center">
            <span className="mr-2">📊</span> Distribución Regional
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Métricas en tiempo real
          </p>
        </div>

        {/* Scrollable Aggregated Statistics List */}
        <div className="flex-1 overflow-y-auto p-3 space-y-1.5 custom-scrollbar">
          {sortedStats.length === 0 ? (
            <div className="text-center py-8 text-slate-400 text-xs">
              Buscando información de los pastores...
            </div>
          ) : (
            sortedStats.map((dept, idx) => (
              <div
                key={dept.name}
                className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-100/50 hover:bg-slate-100/70 transition-colors"
              >
                <div className="flex items-center space-x-2.5 truncate">
                  {/* Small Index Counter Badge */}
                  <span className="text-[10px] font-bold text-slate-400 w-4 text-right">
                    {idx + 1}.
                  </span>
                  <span className="text-xs font-semibold text-slate-700 truncate capitalize">
                    {dept.name.toLowerCase()}
                  </span>
                </div>

                {/* Quantitative Data Pill Tag */}
                <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-mono font-bold bg-blue-50 text-blue-700 border border-blue-100">
                  {dept.count}
                </span>
              </div>
            ))
          )}
        </div>

        {/* Simple Footnote Info Bar */}
        <div className="p-2.5 bg-slate-50 border-t border-slate-100 rounded-b-xl text-[10px] text-center text-slate-400 font-medium">
          Usuarios registrados en total: {users.length}
        </div>
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
