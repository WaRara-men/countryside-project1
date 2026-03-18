"use client";

import { useState, useCallback } from "react";

export type Location = { lat: number; lng: number };

export function useTracking() {
  const [path, setPath] = useState<Location[]>([]);
  const [isTracking, setIsTracking] = useState(false);
  const [watchId, setWatchId] = useState<number | null>(null);

  const startTracking = useCallback(() => {
    if (typeof window === "undefined" || !navigator.geolocation) {
      alert("お使いの端末では場所の記録ができません。");
      return;
    }

    setIsTracking(true);
    setPath([]);
    localStorage.removeItem("samurai_pending_path"); // 新規修行なのでリセット

    const id = navigator.geolocation.watchPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        const newLocation = { lat: latitude, lng: longitude };
        
        setPath((prev) => {
          const updatedPath = [...prev, newLocation];
          // スマホの保存領域に即座にバックアップ（電波が切れても安心）
          localStorage.setItem("samurai_pending_path", JSON.stringify(updatedPath));
          return updatedPath;
        });
      },
      (error) => console.error("GPSエラー:", error),
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );

    setWatchId(id);
  }, []);

  const stopTracking = useCallback(() => {
    if (watchId !== null) {
      navigator.geolocation.clearWatch(watchId);
      setWatchId(null);
    }
    setIsTracking(false);
    localStorage.removeItem("samurai_pending_path"); // 完了したので削除
    return path;
  }, [watchId, path]);

  return { path, isTracking, startTracking, stopTracking };
}