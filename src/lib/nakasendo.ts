/**
 * 安中市の中山道（安中宿〜松井田宿〜坂本宿）を管理
 */
export const NAKASENDO_GOALS = [
  { name: "安中宿", distance: 0 },
  { name: "松井田宿", distance: 3.5 }, // 安中宿から3.5km
  { name: "坂本宿", distance: 8.5 }, // 安中宿から8.5km
];

/**
 * 現在の累積距離から次の目的地（宿場町）の進捗を計算する
 */
export function calculateNakasendoProgress(currentDistance: number) {
  const nextGoal = NAKASENDO_GOALS.find(goal => goal.distance > currentDistance) || NAKASENDO_GOALS[NAKASENDO_GOALS.length - 1];
  const prevGoal = NAKASENDO_GOALS[NAKASENDO_GOALS.map(g => g.name).indexOf(nextGoal.name) - 1] || NAKASENDO_GOALS[0];
  
  const distanceInCurrentSegment = nextGoal.distance - prevGoal.distance;
  const progressInSegment = currentDistance - prevGoal.distance;
  
  // セグメント内の進捗率（0-100%）
  const progressPercent = distanceInCurrentSegment > 0 
    ? Math.min(100, Math.max(0, (progressInSegment / distanceInCurrentSegment) * 100))
    : 100;

  return {
    nextGoalName: nextGoal.name,
    distanceToNext: Math.max(0, nextGoal.distance - currentDistance),
    progressPercent: progressPercent
  };
}

/**
 * 2点間の緯度経度から距離(km)を計算する（ハバーサイン公式）
 */
export function calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371; // 地球の半径 (km)
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * 座標配列（path）から総移動距離(km)を計算する
 */
export function calculateTotalPathDistance(path: { lat: number; lng: number }[]): number {
  let total = 0;
  for (let i = 0; i < path.length - 1; i++) {
    total += calculateDistance(
      path[i].lat, path[i].lng,
      path[i+1].lat, path[i+1].lng
    );
  }
  return total;
}
