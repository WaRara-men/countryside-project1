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
 * 特定のユーザーの累計移動距離からランク（称号）を判定する
 */
export async function getUserSamuraiRank(username: string) {
  const { data, error } = await supabase
    .from('activities')
    .select('distance')
    .eq('username', username)
    .not('end_time', 'is', null);

  if (error || !data) return { rank: "新米門下生", totalSteps: 0, nextRankSteps: 5000 };

  const totalDistance = data.reduce((sum, act) => sum + (act.distance || 0), 0);
  const totalSteps = Math.floor(totalDistance * 1500); // 1km = 1500歩で計算

  let rank = "新米門下生";
  let nextRankSteps = 5000;

  if (totalSteps >= 50000) {
    rank = "伝説の将軍";
    nextRankSteps = 0;
  } else if (totalSteps >= 20000) {
    rank = "筆頭家老";
    nextRankSteps = 50000;
  } else if (totalSteps >= 5000) {
    rank = "一人前の侍";
    nextRankSteps = 20000;
  }

  return { rank, totalSteps, nextRankSteps };
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
