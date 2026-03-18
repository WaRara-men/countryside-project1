import { supabase } from "./supabase";

/**
 * スマホに一時保存されている足跡をSupabaseへ同期する
 */
export async function syncPathToSupabase(activityId: string, path: any[]) {
  if (typeof window === "undefined" || !navigator.onLine) return false;

  try {
    const { error } = await supabase
      .from("activities")
      .update({ 
        path: path,
        distance: path.length * 0.01 
      })
      .eq("id", activityId);

    if (error) throw error;
    console.log("同期成功: 頑張りを家族に届けました");
    return true;
  } catch (err) {
    console.warn("同期失敗（電波待ち）:", err);
    return false;
  }
}

/**
 * オンライン復帰イベントの監視
 */
export function setupSyncListener(callback: () => void) {
  if (typeof window === "undefined") return;
  window.addEventListener("online", callback);
  return () => window.removeEventListener("online", callback);
}
