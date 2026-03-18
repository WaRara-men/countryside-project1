"use client";

import { GoogleMap, useJsApiLoader, Polyline, Marker, Circle } from "@react-google-maps/api";
import { useMemo, useCallback, useState, useEffect } from "react";
import { ANNAKA_COORDS, Location } from "@/lib/types";

const containerStyle = { 
  width: "100%", 
  height: "400px", 
  borderRadius: "24px",
  overflow: "hidden"
};

export type WildlifeAlert = {
  id: string;
  type: 'bear' | 'boar';
  lat: number;
  lng: number;
  radius: number;
};

type MapViewProps = {
  path: Location[];
  alerts?: WildlifeAlert[];
};

export default function MapView({ path, alerts = [] }: MapViewProps) {
  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || ""
  });

  const [map, setMap] = useState<google.maps.Map | null>(null);

  const center = useMemo(() => {
    if (path && path.length > 0) {
      return path[path.length - 1]; // 最新の位置をセンターに
    }
    return ANNAKA_COORDS;
  }, [path]);

  // pathが変わったら地図をその地点に移動させる
  useEffect(() => {
    if (map && center) {
      map.panTo(center);
    }
  }, [map, center]);

  const onLoad = useCallback(function callback(map: google.maps.Map) {
    setMap(map);
  }, []);

  const onUnmount = useCallback(function callback() {
    setMap(null);
  }, []);

  if (!isLoaded) {
    return (
      <div style={containerStyle} className="bg-gray-100 flex items-center justify-center text-gray-400 animate-pulse">
        地図を読み込み中...
      </div>
    );
  }

  return (
    <GoogleMap
      mapContainerStyle={containerStyle}
      center={center}
      zoom={15}
      onLoad={onLoad}
      onUnmount={onUnmount}
      options={{
        disableDefaultUI: true,
        zoomControl: true,
        styles: [
          {
            featureType: "poi",
            elementType: "labels",
            stylers: [{ visibility: "off" }]
          }
        ]
      }}
    >
      {/* 1. 侍の足跡（赤い太い線） */}
      {path && path.length > 1 && (
        <Polyline
          path={path}
          options={{
            strokeColor: "#EF4444",
            strokeOpacity: 0.9,
            strokeWeight: 8,
            lineJoin: "round",
            lineCap: "round"
          }}
        />
      )}

      {/* 2. 現在地マーカー（侍のアイコンの代わり） */}
      {path && path.length > 0 && (
        <Marker 
          position={path[path.length - 1]} 
          icon={{
            path: google.maps.SymbolPath.CIRCLE,
            fillColor: "#EF4444",
            fillOpacity: 1,
            strokeColor: "white",
            strokeWeight: 2,
            scale: 10
          }}
        />
      )}

      {/* 3. 野生動物アラート */}
      {alerts.map((alert) => (
        <Circle
          key={alert.id}
          center={{ lat: alert.lat, lng: alert.lng }}
          radius={alert.radius}
          options={{
            fillColor: "#DC2626",
            fillOpacity: 0.2,
            strokeColor: "#DC2626",
            strokeOpacity: 0.5,
            strokeWeight: 2,
          }}
        />
      ))}
    </GoogleMap>
  );
}
