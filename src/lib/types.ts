export type Location = { lat: number; lng: number };

export type SamuraiActivity = {
  id: string;
  userId: string;
  startTime: string;
  endTime?: string;
  path: Location[];
  voiceToneScore: number;
  totalDistance: number;
  isWarning: boolean;
};

export const ANNAKA_COORDS = {
  lat: 36.3274,
  lng: 138.8893
};