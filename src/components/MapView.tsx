"use client";

import { GoogleMap, LoadScript, Polyline, Marker } from "@react-google-maps/api";
import { ANNAKA_COORDS, Location } from "@/lib/types";

const containerStyle = { width: "100%", height: "400px", borderRadius: "24px" };

type MapViewProps = {
  path: Location[];
};

export default function MapView({ path }: MapViewProps) {
  // Google Maps APIキーが未設定の場合はダミーの枠を表示
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "";

  if (!apiKey) {
    return (
      <div style={containerStyle} className="bg-gray-200 flex items-center justify-center text-gray-500 font-bold p-8 text-center">
        地図を準備中...<br />(Google Maps APIキーの設定が必要です)
      </div>
    );
  }

  return (
    <LoadScript googleMapsApiKey={apiKey}>
      <GoogleMap
        mapContainerStyle={containerStyle}
        center={path.length > 0 ? path[path.length - 1] : ANNAKA_COORDS}
        zoom={14}
      >
        {path.length > 1 && (
          <Polyline
            path={path}
            options={{
              strokeColor: "#d93025",
              strokeOpacity: 0.8,
              strokeWeight: 6,
            }}
          />
        )}
        {path.length > 0 && (
          <Marker position={path[path.length - 1]} />
        )}
      </GoogleMap>
    </LoadScript>
  );
}