import { supabase } from "./supabase";

export interface WildlifeAlert {
  id: string;
  type: 'bear' | 'boar';
  lat: number;
  lng: number;
  radius: number;
  occurred_at: string;
}

/**
 * 安中市の最新の野生動物出没情報を取得する
 */
export async function getLatestWildlifeAlerts(): Promise<WildlifeAlert[]> {
  const { data, error } = await supabase
    .from('wildlife_alerts')
    .select('*')
    .gt('occurred_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()); // 過去24時間以内

  if (error || !data) return [];
  return data as WildlifeAlert[];
}
