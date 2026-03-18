/**
 * 安中市の中山道（安中宿〜松井田宿〜坂本宿）を管理
 */
export const NAKASENDO_GOALS = [
  { name: "安中宿", distance: 0 },
  { name: "松井田宿", distance: 3.5 }, // 安中宿から3.5km
  { name: "坂本宿", distance: 8.5 }, // 安中宿から8.5km
];

export function calculateNakasendoProgress(currentDistance: number) {
  const nextGoal = NAKASENDO_GOALS.find(goal => goal.distance > currentDistance) || NAKASENDO_GOALS[NAKASENDO_GOALS.length - 1];
  const prevGoal = NAKASENDO_GOALS[NAKASENDO_GOALS.map(g => g.name).indexOf(nextGoal.name) - 1] || NAKASENDO_GOALS[0];
  
  const distanceToNext = nextGoal.distance - currentDistance;
  const progressPercent = Math.min(100, Math.max(0, (currentDistance / nextGoal.distance) * 100));

  return {
    nextGoalName: nextGoal.name,
    distanceToNext: Math.max(0, distanceToNext),
    progressPercent: progressPercent
  };
}
