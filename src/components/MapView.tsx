"use client";

import { GoogleMap, LoadScript, Polyline, Marker, Circle } from "@react-google-maps/api";
import { ANNAKA_COORDS, Location } from "@/lib/types";

const containerStyle = { width: "100%", height: "400px", borderRadius: "24px" };

// 野生動物アラートの型定義
export type WildlifeAlert = {
  id: string;
  type: 'bear' | 'boar';
  lat: number;
  lng: number;
  radius: number; // 危険エリアの半径 (メートル)
};

type MapViewProps = {
  path: Location[];
  alerts?: WildlifeAlert[]; // 追加
};

export default function MapView({ path, alerts = [] }: MapViewProps) {
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
        {/* 1. 侍の足跡（赤い線） */}
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

        {/* 2. 最終地点のマーカー */}
        {path.length > 0 && <Marker position={path[path.length - 1]} />}

        {/* 3. 野生動物の危険エリア（赤い円）を追加 */}
        {alerts.map((alert) => (
          <Circle
            key={alert.id}
            center={{ lat: alert.lat, lng: alert.lng }}
            radius={alert.radius}
            options={{
              fillColor: "#d93025",
              fillOpacity: 0.2,
              strokeColor: "#d93025",
              strokeOpacity: 0.5,
              strokeWeight: 2,
            }}
          />
        ))}
      </GoogleMap>
    </LoadScript>
  );
}