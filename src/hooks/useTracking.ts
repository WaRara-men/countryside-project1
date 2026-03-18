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

    const id = navigator.geolocation.watchPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setPath((prev) => [...prev, { lat: latitude, lng: longitude }]);
      },
      (error) => console.error("GPSエラー:", error),
      { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
    );

    setWatchId(id);
  }, []);

  const stopTracking = useCallback(() => {
    if (watchId !== null) {
      navigator.geolocation.clearWatch(watchId);
      setWatchId(null);
    }
    setIsTracking(false);
    return path;
  }, [watchId, path]);

  return { path, isTracking, startTracking, stopTracking };
}