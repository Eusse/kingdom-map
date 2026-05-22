import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";
import * as turf from "@turf/turf";

export async function GET() {
  try {
    // 1. Load your Department GeoJSON
    const geoPath = path.join(process.cwd(), "data", "colombia.geo.json");
    const geoContent = await fs.readFile(geoPath, "utf8");
    const departmentsGeoJSON = JSON.parse(geoContent);

    // 2. Fetch the users
    const data = await fetch(
      "https://api.legacysoftware.online/integrations/pastoresGeoData.php",
    );
    if (!data.ok) {
      return NextResponse.json(
        {
          error: "service_unavailable",
          message: "External user database is offline.",
        },
        { status: 503 }, // 503 Service Unavailable
      );
    }
    const users = await data.json();
    // 3. Match users to departments
    const enrichedUsers = users.map((user: any) => {
      try {
        const lng = parseFloat(user.M_DIR_LON);
        const lat = parseFloat(user.M_DIR_LAT);
        if (isNaN(lng) || isNaN(lat))
          return { ...user, department: "Invalid Coordinates" };

        const point = turf.point([lng, lat]);
        let deptName = null;

        for (const feature of departmentsGeoJSON.features) {
          if (turf.booleanPointInPolygon(point, feature)) {
            deptName = feature.properties.NOMBRE_DPT;
            break;
          }
        }

        // 🌟 Capture anyone whose point didn't land in a local polygon shape
        return { ...user, department: deptName || "International" };
      } catch (err) {
        return { ...user, department: "Invalid Coordinates" };
      }
    });
    return NextResponse.json(enrichedUsers);
  } catch (error: any) {
    console.error("DETAILED ERROR:", error);
    return NextResponse.json(
      {
        error: "Spatial check failed",
        details: error.message, // This will tell us if it's a fetch error or a turf error
        stack: error.stack,
      },
      { status: 500 },
    );
  }
}
