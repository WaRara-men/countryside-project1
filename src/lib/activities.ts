import { supabase } from "./supabase";

/**
 * 今まさに修行中（end_timeが空）のユーザー数を取得
 */
export async function getActiveSamuraiCount(): Promise<number> {
  const { count, error } = await supabase
    .from('activities')
    .select('*', { count: 'exact', head: true })
    .is('end_time', null);

  if (error) return 0;
  return count || 0;
}

/**
 * 地域の最新の修行記録（他ユーザー分）を取得
 */
export async function getCommunityPaths() {
  const { data, error } = await supabase
    .from('activities')
    .select('path, voice_score')
    .not('end_time', 'is', null)
    .order('end_time', { ascending: false })
    .limit(10);

  if (error || !data) return [];
  return data;
}
