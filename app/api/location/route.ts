import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";

export async function GET() {
  try {
    // Get the path of the JSON file.
    const filePath = path.join(process.cwd(), "data", "colombia.geo.json");
    // Read the file content
    const fileContent = await fs.readFile(filePath, "utf8");
    // Parse and return the data
    const data = JSON.parse(fileContent);
    return NextResponse.json(data);
  } catch (error) {
    console.error("Failed to load GeoJSON:", error);
    return NextResponse.json(
      { error: "Failed to load map data" },
      { status: 500 },
    );
  }
}
