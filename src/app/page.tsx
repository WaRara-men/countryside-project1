"use client";

import { useState, useEffect, useMemo } from "react";
import { ShieldAlert, Footprints, Home, Mic, Award, WifiOff, Wifi } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useTracking } from "@/hooks/useTracking";
import { supabase } from "@/lib/supabase";
import { useVoiceAnalysis } from "@/hooks/useVoiceAnalysis";
import { getLatestMessages, SamuraiMessage, markAsRead } from "@/lib/messages";
import { getActiveSamuraiCount } from "@/lib/activities";
import { syncPathToSupabase, setupSyncListener } from "@/lib/offlineSync";

export default function ElderlyPage() {
  const [status, setStatus] = useState<"resting" | "walking" | "recording" | "praised">("resting");
  const [currentActivityId, setCurrentActivityId] = useState<string | null>(null);
  const [messages, setMessages] = useState<SamuraiMessage[]>([]);
  const [activeSamurai, setActiveSamurai] = useState(0);
  const [goalKm, setGoalKm] = useState(3);
  const [isOnline, setIsOnline] = useState(true);
  
  const { path, startTracking, stopTracking } = useTracking();
  const { volume, startRecording, stopRecording } = useVoiceAnalysis();

  // 現在の距離と歩数を計算（確実に画面に出すためにuseMemoを使用）
  const currentDistance = useMemo(() => path.length * 0.01, [path]);
  const currentSteps = useMemo(() => Math.floor(currentDistance * 1400), [currentDistance]);

  // 1. 起動時に修行状態を復元（堅牢さの核心）
  useEffect(() => {
    const savedStatus = localStorage.getItem("samurai_status");
    const savedId = localStorage.getItem("samurai_activity_id");
    
    if (savedStatus === "walking" && savedId) {
      setStatus("walking");
      setCurrentActivityId(savedId);
      startTracking(); // 追跡を再開
    }

    const fetchData = async () => {
      try {
        const [msgData, count] = await Promise.all([
          getLatestMessages().catch(() => []),
          getActiveSamuraiCount().catch(() => 0)
        ]);
        setMessages(msgData);
        setActiveSamurai(count);
      } catch (err) {
        console.error("データ取得失敗:", err);
      }
    };
    fetchData();
  }, []);

  // 状態が変わるたびに保存
  useEffect(() => {
    localStorage.setItem("samurai_status", status);
    if (currentActivityId) {
      localStorage.setItem("samurai_activity_id", currentActivityId);
    } else {
      localStorage.removeItem("samurai_activity_id");
    }
  }, [status, currentActivityId]);

  // 2. 電波状態の監視
  useEffect(() => {
    if (typeof window === "undefined") return;
    setIsOnline(navigator.onLine);
    return setupSyncListener(() => {
      setIsOnline(true);
      if (currentActivityId) syncPathToSupabase(currentActivityId, path);
    });
  }, [currentActivityId, path]);

  // 3. リアルタイム位置同期
  useEffect(() => {
    if (status === "walking" && currentActivityId && path.length > 0) {
      syncPathToSupabase(currentActivityId, path);
    }
  }, [path, status, currentActivityId]);

  const handleStart = async () => {
    try {
      const { data, error } = await supabase
        .from("activities")
        .insert([{ 
          start_time: new Date().toISOString(),
          path: [],
          distance: 0
        }])
        .select()
        .single();

      if (error) throw error;

      if (data) {
        setCurrentActivityId(data.id);
        setStatus("walking");
        startTracking();
        messages.forEach(msg => markAsRead(msg.id).catch(() => {}));
        setMessages([]);
      }
    } catch (err) {
      alert("出陣の準備に失敗しました。電波の良い場所で再度お試しください。");
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
            distance: finalPath.length * 0.01,
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
      
      {/* 画面上部：アラートと同期状態 */}
      <div className="w-full space-y-4">
        <div className="flex justify-between items-center bg-samurai-gold/20 p-3 rounded-2xl border border-samurai-gold/30">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-sm font-bold text-samurai-gold">仲間: {activeSamurai}名</span>
          </div>
          {!isOnline && (
            <div className="flex items-center gap-1 text-samurai-red animate-bounce">
              <WifiOff size={14} />
              <span className="text-[10px] font-black uppercase">保存中（電波待ち）</span>
            </div>
          )}
          {isOnline && status === "walking" && (
            <div className="flex items-center gap-1 text-samurai-green">
              <Wifi size={14} />
              <span className="text-[10px] font-black uppercase">修行を記録中</span>
            </div>
          )}
        </div>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center gap-8 w-full">
        <AnimatePresence mode="wait">
          {status === "resting" && (
            <motion.div key="resting" className="text-center w-full px-4">
              {messages.length > 0 && (
                <div className="bg-samurai-gold text-samurai-black p-6 rounded-[40px] rounded-bl-none mb-6 shadow-xl relative text-left">
                  <p className="text-elderly-base font-black">「{messages[0].content}」</p>
                  <p className="text-sm mt-2 text-right opacity-80">— {messages[0].sender_name}</p>
                </div>
              )}
              <div className="bg-samurai-gold/10 p-6 rounded-full mb-2 inline-block">
                <Home className="w-24 h-24 text-samurai-gold" />
              </div>
              <p className="text-elderly-lg font-bold">準備はよいか？</p>
            </motion.div>
          )}

          {status === "walking" && (
            <motion.div key="walking" className="text-center w-full">
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
                  {/* ここ：歩数表示を確実に、大きく、色付きで描画 */}
                  <div className="bg-samurai-green/20 px-6 py-2 rounded-full mt-4 border border-samurai-green/30">
                    <p className="text-elderly-lg font-black text-samurai-green">
                      約 {currentSteps.toLocaleString()} 歩
                    </p>
                  </div>
                </div>
                <div className="w-full bg-gray-800 h-4 rounded-full mt-6 overflow-hidden">
                  <motion.div className="h-full bg-samurai-green" animate={{ width: `${Math.min(100, (currentDistance / goalKm) * 100)}%` }} />
                </div>
              </div>
            </motion.div>
          )}

          {/* ...録音中・称賛画面は簡略化して維持... */}
          {status === "recording" && (
            <div className="text-center">
              <Mic className="w-40 h-40 text-samurai-red animate-pulse mx-auto" />
              <p className="text-elderly-lg font-bold mt-4">「ただいま」とお話しください</p>
            </div>
          )}

          {status === "praised" && (
            <div className="text-center">
              <Award className="w-48 h-48 text-samurai-gold mx-auto mb-6" />
              <h2 className="text-elderly-xl font-black text-samurai-gold">実に見事なり！</h2>
              <button onClick={() => setStatus("resting")} className="mt-12 bg-samurai-white text-samurai-black px-12 py-4 rounded-full text-elderly-base font-bold">家で休む</button>
            </div>
          )}
        </AnimatePresence>
      </div>

      {/* アクションボタン */}
      {status !== "praised" && status !== "recording" && (
        <div className="w-full pb-8">
          {status === "resting" ? (
            <button onClick={handleStart} className="w-full bg-samurai-gold text-samurai-black py-10 rounded-3xl shadow-2xl active:scale-95">
              <span className="text-elderly-xl font-black">いざ、出陣！</span>
            </button>
          ) : (
            <button onClick={handleEnd} className="w-full bg-samurai-white text-samurai-black py-10 rounded-3xl shadow-2xl border-8 border-samurai-green">
              <span className="text-elderly-xl font-black">無事に帰還</span>
            </button>
          )}
        </div>
      )}
    </main>
  );
}