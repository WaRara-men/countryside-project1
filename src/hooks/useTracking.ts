"use client";

import { useState, useCallback, useEffect } from "react";

export type Location = { lat: number; lng: number };

export function useTracking() {
  const [path, setPath] = useState<Location[]>([]);
  const [isTracking, setIsTracking] = useState(false);
  const [watchId, setWatchId] = useState<number | null>(null);

  // 起動時に保存された足跡を復元
  useEffect(() => {
    const savedPath = localStorage.getItem("samurai_pending_path");
    if (savedPath) {
      try {
        setPath(JSON.parse(savedPath));
      } catch (e) {
        console.error("足跡の復元に失敗しました");
      }
    }
  }, []);

  const startTracking = useCallback(() => {
    if (typeof window === "undefined" || !navigator.geolocation) {
      alert("お使いの端末では場所の記録ができません。");
      return;
    }

    setIsTracking(true);
    // 既存のpathがあればそれを引き継ぐ（完全リセットしない）
    
    const id = navigator.geolocation.watchPosition(
      (position) => {
        const { latitude, longitude, accuracy } = position.coords;
        
        // 精度が悪い（50m以上誤差がある）データは無視して「1メートルも逃さない」精度を守る
        if (accuracy > 50) return;

        const newLocation = { lat: latitude, lng: longitude };
        
        setPath((prev) => {
          // 前回と同じ地点なら保存しない（バッテリー節約）
          const lastLocation = prev[prev.length - 1];
          if (lastLocation && lastLocation.lat === lat && lastLocation.lng === lng) return prev;

          const updatedPath = [...prev, newLocation];
          localStorage.setItem("samurai_pending_path", JSON.stringify(updatedPath));
          return updatedPath;
        });
      },
      (error) => console.error("GPSエラー:", error),
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    );

    setWatchId(id);
  }, []);

  const stopTracking = useCallback(() => {
    if (watchId !== null) {
      navigator.geolocation.clearWatch(watchId);
      setWatchId(null);
    }
    setIsTracking(false);
    const finalPath = [...path];
    localStorage.removeItem("samurai_pending_path");
    return finalPath;
  }, [watchId, path]);

  return { path, isTracking, startTracking, stopTracking, setPath };
}
