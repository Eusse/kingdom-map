import MapComponent from "./component";

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string }>;
}) {
  const params = await searchParams;

  const zoom = params.zoom ? Number(params.zoom) : 6.5;
  const lat = params.lat ? Number(params.lat) : 4.711;
  const lng = params.lng ? Number(params.lng) : -74.072;

  return <MapComponent initialZoom={zoom} initialCenter={{ lat, lng }} />;
}
