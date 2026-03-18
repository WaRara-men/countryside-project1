import { supabase } from "./supabase";

/**
 * 今まさに修行中（直近15分以内に開始され、まだ終了していない）のユーザー数を取得
 */
export async function getActiveSamuraiCount(): Promise<number> {
  const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000).toISOString();
  
  const { count, error } = await supabase
    .from('activities')
    .select('*', { count: 'exact', head: true })
    .is('end_time', null)
    .gt('start_time', fifteenMinutesAgo); // 直近15分以内に開始されたもののみ

  if (error) {
    console.error("仲間カウント取得失敗:", error);
    return 0;
  }
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
