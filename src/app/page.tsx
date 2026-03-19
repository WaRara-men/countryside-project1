"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { ShieldAlert, Footprints, Home, Mic, Award, WifiOff, Wifi, AlertTriangle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useTracking } from "@/hooks/useTracking";
import { supabase } from "@/lib/supabase";
import { useVoiceAnalysis } from "@/hooks/useVoiceAnalysis";
import { getLatestMessages, SamuraiMessage, markAsRead } from "@/lib/messages";
import { getActiveSamuraiCount, getUserSamuraiRank } from "@/lib/activities";
import { syncPathToSupabase, setupSyncListener } from "@/lib/offlineSync";
import { calculateTotalPathDistance, calculateNakasendoProgress, calculateDistance } from "@/lib/nakasendo";
import { getLatestWildlifeAlerts, WildlifeAlert } from "@/lib/wildlife";

export default function ElderlyPage() {
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [status, setStatus] = useState<"resting" | "walking" | "recording" | "praised">("resting");
  const [isStarting, setIsStarting] = useState(false);
  const [currentActivityId, setCurrentActivityId] = useState<string | null>(null);
  const [messages, setMessages] = useState<SamuraiMessage[]>([]);
  const [activeSamurai, setActiveSamurai] = useState(0);
  const [userRank, setUserRank] = useState({ rank: "門下生", totalSteps: 0, nextRankSteps: 5000 });
  const [goalKm, setGoalKm] = useState(1);
  const [isOnline, setIsOnline] = useState(true);
  const [alerts, setAlerts] = useState<WildlifeAlert[]>([]);
  
  const { path, startTracking, stopTracking, setPath } = useTracking();
  const { volume, startRecording, stopRecording } = useVoiceAnalysis();

  const currentDistance = useMemo(() => calculateTotalPathDistance(path), [path]);
  const progress = useMemo(() => calculateNakasendoProgress(currentDistance), [currentDistance]);
  const currentSteps = useMemo(() => Math.floor(currentDistance * 1500), [currentDistance]);

  // 接近検知（現在地がアラートの半径 + 200m以内に入ったら警告）
  const isNearDanger = useMemo(() => {
    if (path.length === 0 || alerts.length === 0) return false;
    const currentLoc = path[path.length - 1];
    return alerts.some(alert => {
      const distKm = calculateDistance(currentLoc.lat, currentLoc.lng, alert.lat, alert.lng);
      const dangerZoneKm = (alert.radius + 200) / 1000;
      return distKm < dangerZoneKm;
    });
  }, [path, alerts]);

  useEffect(() => {
    // 認証チェック
    const role = localStorage.getItem("samurai_role");
    if (!role) {
      router.replace("/login");
      return;
    } else if (role === "family") {
      router.replace("/family");
      return;
    }
    setIsAuthorized(true);

    const savedStatus = localStorage.getItem("samurai_status");
    const savedId = localStorage.getItem("samurai_activity_id");
    
    if (savedStatus === "walking" && savedId) {
      setStatus("walking");
      setCurrentActivityId(savedId);
      startTracking();
    }

    const fetchData = async () => {
      try {
        const username = localStorage.getItem("samurai_username") || "不明な侍";

        const [msgData, count, rankInfo, alertData] = await Promise.all([
          getLatestMessages().catch(() => []),
          getActiveSamuraiCount().catch(() => 0),
          getUserSamuraiRank(username).catch(() => ({ rank: "門下生", totalSteps: 0, nextRankSteps: 5000 })),
          getLatestWildlifeAlerts().catch(() => [])
        ]);
        setMessages(msgData);
        setActiveSamurai(count);
        setUserRank(rankInfo);
        setAlerts(alertData);
      } catch (err) {
        console.error("データ取得失敗:", err);
      }
    };
    fetchData();
  }, []);

  if (!isAuthorized) return null; // 認証されるまで何も表示しない

  useEffect(() => {
    localStorage.setItem("samurai_status", status);
    if (currentActivityId) {
      localStorage.setItem("samurai_activity_id", currentActivityId);
    } else {
      localStorage.removeItem("samurai_activity_id");
    }
  }, [status, currentActivityId]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    setIsOnline(navigator.onLine);
    return setupSyncListener(() => {
      setIsOnline(true);
      if (currentActivityId) syncPathToSupabase(currentActivityId, path);
    });
  }, [currentActivityId, path]);

  useEffect(() => {
    if (status === "walking" && currentActivityId && path.length > 0) {
      syncPathToSupabase(currentActivityId, path);
    }
  }, [path, status, currentActivityId]);

  const handleStart = async () => {
    if (isStarting) return;
    setIsStarting(true);
    
    try {
      const username = localStorage.getItem("samurai_username") || "不明な侍";

      // 1. まず現在地を1点取得する（家族画面での「取得中」防止）
      let initialPath: {lat: number, lng: number}[] = [];
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, { enableHighAccuracy: true });
      }).catch(() => null);

      if (position) {
        initialPath = [{ lat: position.coords.latitude, lng: position.coords.longitude }];
      }

      const { data, error } = await supabase
        .from("activities")
        .insert([{ 
          start_time: new Date().toISOString(),
          path: initialPath,
          distance: 0,
          username: username
        }])
        .select()
        .single();

      if (error) throw new Error(error.message);

      if (data) {
        setCurrentActivityId(data.id);
        setStatus("walking");
        startTracking(); // 追跡開始
        if (initialPath.length > 0) {
          // useTracking内のpathも初期化（家族画面での「取得中」防止）
          setPath(initialPath);
        }
        messages.forEach(msg => markAsRead(msg.id).catch(() => {}));
        setMessages([]);
      }
    } catch (err: any) {
      alert(`出陣の準備に失敗しました。\n理由: ${err.message}`);
    } finally {
      setIsStarting(false);
    }
  };

  const handleEnd = async () => {
    const finalPath = stopTracking();
    setStatus("recording");
    await startRecording();

    setTimeout(async () => {
      const peakVolume = stopRecording();
      const score = Math.min(100, Math.max(60, Math.floor(peakVolume * 1.5)));

      if (currentActivityId) {
        await supabase
          .from("activities")
          .update({
            end_time: new Date().toISOString(),
            path: finalPath,
            voice_score: score,
            distance: calculateTotalPathDistance(finalPath), // 正確な距離を保存
            is_warning: score < 70,
          })
          .eq("id", currentActivityId);
      }

      setStatus("praised");
      setCurrentActivityId(null);
      localStorage.removeItem("samurai_status");
    }, 5000);
  };

  return (
    <main className="min-h-screen bg-samurai-black text-samurai-white p-6 flex flex-col items-center justify-between font-sans">
      <div className="w-full space-y-4">
        <div className="flex justify-between items-center bg-samurai-gold/20 p-3 rounded-2xl border border-samurai-gold/30">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-sm font-bold text-samurai-gold">仲間: {activeSamurai}名</span>
          </div>
          {!isOnline && (
            <div className="flex items-center gap-1 text-samurai-red animate-bounce">
              <WifiOff size={14} />
              <span className="text-[10px] font-black uppercase">保存中</span>
            </div>
          )}
          {isOnline && status === "walking" && (
            <div className="flex items-center gap-1 text-samurai-green">
              <Wifi size={14} />
              <span className="text-[10px] font-black uppercase">修行中</span>
            </div>
          )}
        </div>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center gap-8 w-full">
        <AnimatePresence mode="wait">
          {status === "resting" && (
            <motion.div key="resting" className="text-center w-full px-4 space-y-6">
              {/* 1. 侍の称号（累計実績） */}
              <div className="bg-samurai-gold/10 border-2 border-samurai-gold/30 p-4 rounded-[32px]">
                <p className="text-xs text-samurai-gold font-bold uppercase tracking-tighter mb-1">現在の階級</p>
                <h2 className="text-3xl font-black text-samurai-gold font-samurai">{userRank.rank}</h2>
                <div className="mt-2 bg-black/40 rounded-full h-2 w-full overflow-hidden border border-samurai-gold/20">
                  <div 
                    className="h-full bg-samurai-gold shadow-[0_0_10px_rgba(255,215,0,0.5)] transition-all duration-1000" 
                    style={{ width: `${Math.min(100, (userRank.totalSteps / userRank.nextRankSteps) * 100)}%` }}
                  ></div>
                </div>
                <p className="text-[10px] text-gray-400 mt-1">累計 {userRank.totalSteps.toLocaleString()} 歩</p>
              </div>

              {/* 2. メッセージ */}
              {messages.length > 0 && (
                <div className="bg-samurai-gold text-samurai-black p-5 rounded-[32px] rounded-bl-none shadow-xl relative text-left">
                  <p className="text-sm font-black italic">「{messages[0].content}」</p>
                  <p className="text-[10px] mt-1 text-right opacity-70">— {messages[0].sender_name}</p>
                </div>
              )}

              {/* 3. 本日の目標選択 */}
              <div className="space-y-3">
                <p className="text-elderly-base font-bold text-gray-400">本日の修行目標</p>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { km: 1, steps: 1500, label: "初級" },
                    { km: 3, steps: 4500, label: "中級" },
                    { km: 7, steps: 10500, label: "上級" }
                  ].map((target) => (
                    <button
                      key={target.km}
                      onClick={() => setGoalKm(target.km)}
                      className={`p-4 rounded-3xl border-4 transition-all ${
                        goalKm === target.km 
                          ? "border-samurai-green bg-samurai-green/20 scale-105" 
                          : "border-white/5 bg-white/5"
                      }`}
                    >
                      <p className="text-[10px] font-bold text-gray-400">{target.label}</p>
                      <p className="text-xl font-black">{target.steps.toLocaleString()}</p>
                      <p className="text-[10px] font-bold opacity-60">歩</p>
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {status === "walking" && (
            <motion.div key="walking" className="text-center w-full">
              {isNearDanger && (
                <motion.div 
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-red-600 text-white p-4 rounded-[32px] mb-6 shadow-2xl flex items-center justify-center gap-4 animate-pulse border-4 border-red-800"
                >
                  <AlertTriangle size={40} className="text-samurai-gold" />
                  <div className="text-left">
                    <p className="font-black text-2xl leading-none tracking-widest uppercase">危険接近</p>
                    <p className="text-sm font-bold mt-1">野生動物の出没エリアに近づいています</p>
                  </div>
                </motion.div>
              )}
              <div className="relative inline-block mb-4">
                <Footprints className="w-48 h-48 text-samurai-green animate-bounce" />
                <div className="absolute -top-4 -right-4 bg-samurai-red text-white px-6 py-2 rounded-full text-2xl font-black shadow-lg">
                  {currentDistance < 1 ? "足軽" : currentDistance < 3 ? "侍" : "将軍"}
                </div>
              </div>
              <div className="bg-white/5 rounded-[40px] p-8 backdrop-blur-sm border border-white/10">
                <p className="text-elderly-base text-samurai-gold font-bold mb-2">現在の修行距離</p>
                <div className="flex flex-col items-center">
                  <p className="text-[5rem] font-black leading-none">
                    {currentDistance.toFixed(2)} <span className="text-elderly-lg">km</span>
                  </p>
                  <div className="bg-samurai-green/20 px-6 py-2 rounded-full mt-4 border border-samurai-green/30">
                    <p className="text-elderly-lg font-black text-samurai-green">
                      約 {currentSteps.toLocaleString()} 歩
                    </p>
                  </div>
                </div>

                <div className="mt-8 pt-6 border-t border-white/10 w-full">
                  <div className="flex justify-between items-end mb-2">
                    <p className="text-elderly-base font-bold text-samurai-gold">
                      次の目標：{progress.nextGoalName}
                    </p>
                    <p className="text-elderly-lg font-black">
                      あと {progress.distanceToNext.toFixed(2)} <span className="text-sm">km</span>
                    </p>
                  </div>
                  <div className="w-full bg-gray-800 h-6 rounded-full overflow-hidden border-2 border-white/5">
                    <motion.div 
                      className="h-full bg-samurai-gold shadow-[0_0_15px_rgba(255,215,0,0.5)]" 
                      initial={{ width: 0 }}
                      animate={{ width: `${progress.progressPercent}%` }} 
                    />
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {status === "recording" && (
            <div className="text-center">
              <Mic className="w-40 h-40 text-samurai-red animate-pulse mx-auto" />
              <p className="text-elderly-lg font-bold mt-4">「ただいま」とお話しください</p>
            </div>
          )}

          {status === "praised" && (
            <div className="text-center">
              <Award className="w-48 h-48 text-samurai-gold mx-auto mb-6" />
              <h2 className="text-elderly-xl font-black text-samurai-gold font-samurai">実に見事なり！</h2>
              <button onClick={() => setStatus("resting")} className="mt-12 bg-samurai-white text-samurai-black px-12 py-4 rounded-full text-elderly-base font-bold shadow-xl">家で休む</button>
            </div>
          )}
        </AnimatePresence>
      </div>

      {status !== "praised" && status !== "recording" && (
        <div className="w-full pb-8">
          {status === "resting" ? (
            <button onClick={handleStart} className="w-full bg-samurai-gold text-samurai-black py-10 rounded-3xl shadow-2xl active:scale-95 transition-transform">
              <span className="text-elderly-xl font-black font-samurai">いざ、出陣！</span>
            </button>
          ) : (
            <button onClick={handleEnd} className="w-full bg-samurai-white text-samurai-black py-10 rounded-3xl shadow-2xl border-8 border-samurai-green active:scale-95 transition-transform">
              <span className="text-elderly-xl font-black font-samurai">無事に帰還</span>
            </button>
          )}
        </div>
      )}
    </main>
  );
}