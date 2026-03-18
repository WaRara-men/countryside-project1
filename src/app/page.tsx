"use client";

import { useState, useEffect } from "react";
import { ShieldAlert, Footprints, Home, Mic, Award } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useTracking } from "@/hooks/useTracking";
import { supabase } from "@/lib/supabase";
import { useVoiceAnalysis } from "@/hooks/useVoiceAnalysis";
import { getLatestMessages, SamuraiMessage, markAsRead } from "@/lib/messages";
import { getActiveSamuraiCount } from "@/lib/activities";

export default function ElderlyPage() {
  const [status, setStatus] = useState<"resting" | "walking" | "recording" | "praised">("resting");
  const [currentActivityId, setCurrentActivityId] = useState<string | null>(null); // 追加
  const [messages, setMessages] = useState<SamuraiMessage[]>([]);
  const [activeSamurai, setActiveSamurai] = useState(0);
  const [goalKm, setGoalKm] = useState(3);
  const { path, startTracking, stopTracking } = useTracking();
  const { volume, startRecording, stopRecording } = useVoiceAnalysis();

  // 位置情報が変わるたびにSupabaseへ送信（リアルタイム追跡）
  useEffect(() => {
    if (status === "walking" && currentActivityId && path.length > 0) {
      const updatePath = async () => {
        await supabase
          .from("activities")
          .update({ 
            path: path,
            distance: path.length * 0.01 
          })
          .eq("id", currentActivityId);
      };
      updatePath();
    }
  }, [path, status, currentActivityId]);

  const handleStart = async () => {
    // 家族からのメッセージ既読化
    for (const msg of messages) {
      await markAsRead(msg.id);
    }
    setMessages([]);

    // 1. 修行レコードを「開始」状態で新規作成
    const { data, error } = await supabase
      .from("activities")
      .insert([{ 
        start_time: new Date().toISOString(),
        path: [],
        distance: 0
      }])
      .select()
      .single();

    if (data) {
      setCurrentActivityId(data.id);
      setStatus("walking");
      startTracking();
    }
  };

  const handleEnd = async () => {
    const finalPath = stopTracking();
    setStatus("recording");
    await startRecording();

    setTimeout(async () => {
      const peakVolume = stopRecording();
      const score = Math.min(100, Math.max(60, Math.floor(peakVolume * 1.5)));

      // 2. 既存の修行レコードを「終了」状態で更新
      if (currentActivityId) {
        try {
          const { error: updateError } = await supabase
            .from("activities")
            .update({
              end_time: new Date().toISOString(),
              path: finalPath,
              voice_score: score,
              distance: finalPath.length * 0.01,
              is_warning: score < 70,
            })
            .eq("id", currentActivityId);
          if (updateError) throw updateError;
        } catch (err) {
          console.error("更新失敗:", err);
        }
      }

      setStatus("praised");
      setCurrentActivityId(null);
    }, 5000);
  };

  return (
    <main className="min-h-screen bg-samurai-black text-samurai-white p-6 flex flex-col items-center justify-between font-sans">
      
      {/* 画面上部：仲間と安全のアラート */}
      <div className="w-full space-y-4">
        <div className="flex justify-between items-center bg-samurai-gold/20 p-3 rounded-2xl border border-samurai-gold/30">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-sm font-bold text-samurai-gold">安中で修行中の仲間: {activeSamurai}名</span>
          </div>
          <span className="text-xs text-gray-400 font-bold">安中・侍連合軍</span>
        </div>

        <div className="w-full bg-samurai-red/20 border-2 border-samurai-red p-4 rounded-2xl flex items-center gap-4">
          <ShieldAlert className="text-samurai-red w-10 h-10 flex-shrink-0" />
          <p className="text-elderly-base font-bold leading-tight">
            【注意】イノシシ情報あり
          </p>
        </div>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center gap-8 w-full">
        <AnimatePresence mode="wait">
          {status === "resting" && (
            <motion.div key="resting" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="text-center w-full px-4">
              
              {/* 家族からの最新の手紙 */}
              {messages.length > 0 && (
                <motion.div 
                  initial={{ scale: 0.8, rotate: -2 }}
                  animate={{ scale: 1, rotate: 1 }}
                  className="bg-samurai-gold text-samurai-black p-6 rounded-[40px] rounded-bl-none mb-6 shadow-xl relative text-left"
                >
                  <p className="text-elderly-base font-black leading-tight">
                    「{messages[0].content}」
                  </p>
                  <p className="text-sm mt-2 text-right opacity-80">— {messages[0].sender_name}より</p>
                  <div className="absolute -bottom-4 left-0 w-8 h-8 bg-samurai-gold clip-path-triangle" style={{ clipPath: 'polygon(0 0, 0% 100%, 100% 0)' }}></div>
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
                        goalKm === tier.km 
                        ? 'bg-samurai-gold text-samurai-black scale-105 shadow-lg' 
                        : 'bg-gray-800 text-gray-400'
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
                <motion.div
                  animate={{ x: [-10, 10, -10] }}
                  transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                >
                  <Footprints className="w-48 h-48 text-samurai-green" />
                </motion.div>
                <div className="absolute -top-4 -right-4 bg-samurai-red text-white px-6 py-2 rounded-full text-2xl font-black shadow-lg">
                  {path.length * 0.01 < 1 ? "足軽" : path.length * 0.01 < 3 ? "侍" : "将軍"}
                </div>
              </div>
              
              <div className="bg-white/5 rounded-[40px] p-8 backdrop-blur-sm border border-white/10">
                <p className="text-elderly-base text-samurai-gold font-bold mb-2">現在の修行距離</p>
                <p className="text-[5rem] font-black leading-none mb-2">
                  {(path.length * 0.01).toFixed(2)} <span className="text-elderly-lg">km</span>
                </p>
                <div className="w-full bg-gray-800 h-4 rounded-full mt-4 overflow-hidden">
                  <motion.div 
                    className="h-full bg-samurai-green"
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min(100, (path.length * 0.01 / goalKm) * 100)}%` }}
                  />
                </div>
                <p className="text-sm text-gray-400 mt-4">目標 {goalKm}km に向けて進軍中...</p>
              </div>
            </motion.div>
          )}

          {status === "recording" && (
            <motion.div key="recording" className="text-center relative">
              <motion.div 
                className="absolute inset-0 bg-samurai-red/30 rounded-full"
                animate={{ scale: 1 + (volume / 100) }}
                transition={{ type: "spring", damping: 10 }}
              />
              <motion.div 
                className="absolute inset-0 bg-samurai-red/20 rounded-full"
                animate={{ scale: 1 + (volume / 50) }}
                transition={{ type: "spring", damping: 10 }}
              />
              <Mic className="w-40 h-40 text-samurai-red relative z-10 mx-auto" />
              <p className="text-elderly-lg font-bold mt-4">「ただいま」と<br />お話しください</p>
            </motion.div>
          )}

          {status === "praised" && (
            <motion.div key="praised" initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-center">
              <Award className="w-48 h-48 text-samurai-gold mx-auto mb-6" />
              <h2 className="text-elderly-xl font-black text-samurai-gold mb-4">実に見事なり！</h2>
              <p className="text-elderly-lg font-bold leading-relaxed px-4">
                安中の道に、確かな足跡を刻みましたぞ！<br />
                家族も安心しております。
              </p>
              <button 
                onClick={() => setStatus("resting")}
                className="mt-12 bg-samurai-white text-samurai-black px-12 py-4 rounded-full text-elderly-base font-bold shadow-xl"
              >
                家で休む
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* 巨大アクションボタン */}
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
      
      {status === "recording" && (
        <div className="w-full pb-8">
          <div className="w-full bg-gray-700 text-white py-10 rounded-3xl text-center font-bold text-elderly-lg">
            声を届けています...
          </div>
        </div>
      )}
    </main>
  );
}