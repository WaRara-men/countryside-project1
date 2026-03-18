"use client";

import { useState, useEffect } from "react";
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

  // 1. 初期化・仲間の数・メッセージ取得（失敗しても止まらないように）
  useEffect(() => {
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
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, [status]);

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
      // 1. 修行レコードを新規作成
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
        // 読んだメッセージを既読にする
        messages.forEach(msg => markAsRead(msg.id).catch(() => {}));
        setMessages([]);
      }
    } catch (err) {
      alert("出陣の準備に失敗しました。電波の良い場所で再度お試しください。");
      console.error(err);
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
    }, 5000);
  };

  return (
    <main className="min-h-screen bg-samurai-black text-samurai-white p-6 flex flex-col items-center justify-between font-sans">
      
      {/* 上部アラートエリア */}
      <div className="w-full space-y-4">
        <div className="flex justify-between items-center bg-samurai-gold/20 p-3 rounded-2xl border border-samurai-gold/30">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-sm font-bold text-samurai-gold">修行中の仲間: {activeSamurai}名</span>
          </div>
          {!isOnline && (
            <div className="flex items-center gap-1 text-samurai-red animate-bounce">
              <WifiOff size={14} />
              <span className="text-[10px] font-black">電波待ち</span>
            </div>
          )}
          {isOnline && status === "walking" && (
            <div className="flex items-center gap-1 text-samurai-green">
              <Wifi size={14} />
              <span className="text-[10px] font-black">同期中</span>
            </div>
          )}
        </div>

        <div className="w-full bg-samurai-red/20 border-2 border-samurai-red p-4 rounded-2xl flex items-center gap-4">
          <ShieldAlert className="text-samurai-red w-10 h-10 flex-shrink-0" />
          <p className="text-elderly-base font-bold leading-tight text-center w-full">
            周囲に注意して歩きましょう
          </p>
        </div>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center gap-8 w-full">
        <AnimatePresence mode="wait">
          {status === "resting" && (
            <motion.div key="resting" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="text-center w-full px-4">
              
              {messages.length > 0 && (
                <motion.div className="bg-samurai-gold text-samurai-black p-6 rounded-[40px] rounded-bl-none mb-6 shadow-xl relative text-left">
                  <p className="text-elderly-base font-black">「{messages[0].content}」</p>
                  <p className="text-sm mt-2 text-right opacity-80">— {messages[0].sender_name}</p>
                </motion.div>
              )}

              <div className="bg-white/5 p-6 rounded-[40px] border border-white/10 mb-6 text-center">
                <p className="text-sm font-bold text-gray-400 mb-4 uppercase tracking-widest text-center">今日の修行目標</p>
                <div className="flex justify-around gap-2">
                  {[
                    { label: "足軽", km: 1 },
                    { label: "侍", km: 3 },
                    { label: "将軍", km: 7 }
                  ].map((tier) => (
                    <button
                      key={tier.km}
                      onClick={() => setGoalKm(tier.km)}
                      className={`flex-1 py-4 rounded-2xl text-sm font-black transition-all ${
                        goalKm === tier.km ? 'bg-samurai-gold text-samurai-black scale-105 shadow-lg' : 'bg-gray-800 text-gray-400'
                      }`}
                    >
                      {tier.label}<br/>{tier.km}km
                    </button>
                  ))}
                </div>
              </div>

              <div className="bg-samurai-gold/10 p-6 rounded-full mb-2 inline-block">
                <Home className="w-24 h-24 text-samurai-gold" />
              </div>
              <p className="text-elderly-lg font-bold">準備はよいか？</p>
            </motion.div>
          )}

          {status === "walking" && (
            <motion.div key="walking" initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} className="text-center w-full">
              <div className="relative inline-block mb-4">
                <motion.div animate={{ x: [-10, 10, -10] }} transition={{ duration: 2, repeat: Infinity, ease: "linear" }}>
                  <Footprints className="w-48 h-48 text-samurai-green" />
                </motion.div>
                <div className="absolute -top-4 -right-4 bg-samurai-red text-white px-6 py-2 rounded-full text-2xl font-black shadow-lg">
                  {path.length * 0.01 < 1 ? "足軽" : path.length * 0.01 < 3 ? "侍" : "将軍"}
                </div>
              </div>
              
              <div className="bg-white/5 rounded-[40px] p-8 backdrop-blur-sm border border-white/10">
                <p className="text-elderly-base text-samurai-gold font-bold mb-2">現在の修行距離</p>
                <div className="flex flex-col items-center">
                  <p className="text-[5rem] font-black leading-none">
                    {(path.length * 0.01).toFixed(2)} <span className="text-elderly-lg">km</span>
                  </p>
                  {/* ここ：歩数表示を確実に描画 */}
                  <p className="text-elderly-lg font-bold text-samurai-green mt-2">
                    約 {Math.floor(path.length * 0.01 * 1400).toLocaleString()} 歩
                  </p>
                </div>
                <div className="w-full bg-gray-800 h-4 rounded-full mt-4 overflow-hidden">
                  <motion.div className="h-full bg-samurai-green" initial={{ width: 0 }} animate={{ width: `${Math.min(100, (path.length * 0.01 / goalKm) * 100)}%` }} />
                </div>
                <p className="text-sm text-gray-400 mt-4">目標 {goalKm}km に向けて進軍中...</p>
              </div>
            </motion.div>
          )}

          {/* ...録音中・称賛画面（維持） */}
          {status === "recording" && (
            <motion.div key="recording" className="text-center relative">
              <Mic className="w-40 h-40 text-samurai-red relative z-10 mx-auto" />
              <p className="text-elderly-lg font-bold mt-4">「ただいま」とお話しください</p>
            </motion.div>
          )}

          {status === "praised" && (
            <motion.div key="praised" initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-center">
              <Award className="w-48 h-48 text-samurai-gold mx-auto mb-6" />
              <h2 className="text-elderly-xl font-black text-samurai-gold mb-4">実に見事なり！</h2>
              <button onClick={() => setStatus("resting")} className="mt-12 bg-samurai-white text-samurai-black px-12 py-4 rounded-full text-elderly-base font-bold shadow-xl">家で休む</button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* アクションボタン */}
      {status !== "praised" && status !== "recording" && (
        <div className="w-full pb-8">
          {status === "resting" ? (
            <button onClick={handleStart} className="w-full bg-samurai-gold text-samurai-black py-10 rounded-3xl shadow-2xl active:scale-95 transition-transform">
              <span className="text-elderly-xl font-black">いざ、出陣！</span>
            </button>
          ) : (
            <button onClick={handleEnd} className="w-full bg-samurai-white text-samurai-black py-10 rounded-3xl shadow-2xl border-8 border-samurai-green active:scale-95 transition-transform">
              <span className="text-elderly-xl font-black">無事に帰還</span>
            </button>
          )}
        </div>
      )}
    </main>
  );
}