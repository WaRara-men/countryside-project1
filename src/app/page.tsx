"use client";

import { useState } from "react";
import { ShieldAlert, Footprints, Home, Mic, Award } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useTracking } from "@/hooks/useTracking";
import { supabase } from "@/lib/supabase"; // 追加

export default function ElderlyPage() {
  const [status, setStatus] = useState<"resting" | "walking" | "recording" | "praised">("resting");
  const { path, startTracking, stopTracking } = useTracking();

  const handleStart = () => {
    setStatus("walking");
    startTracking();
  };

  const handleEnd = async () => {
    const finalPath = stopTracking();
    setStatus("recording");

    // 1. 疑似的な元気度スコアを算出（本来は音声解析結果）
    const score = Math.floor(Math.random() * 21) + 75; // 75-95点

    // 2. Supabaseへデータを保存
    try {
      const { error: insertError } = await supabase.from("activities").insert([
        {
          path: finalPath,
          voice_score: score,
          distance: finalPath.length * 0.01,
          is_warning: score < 70,
        },
      ]);
      if (insertError) throw insertError;
      console.log("修行の成果を家族に届けました！");
    } catch (err) {
      console.error("保存失敗:", err);
    }

    // 録音後の「称賛」画面へ
    setTimeout(() => {
      setStatus("praised");
    }, 4000);
  };

  return (
    <main className="min-h-screen bg-samurai-black text-samurai-white p-6 flex flex-col items-center justify-between font-sans">
      
      {/* 安全アラート：安中市のリアルを反映 */}
      <div className="w-full bg-samurai-red/20 border-2 border-samurai-red p-4 rounded-2xl flex items-center gap-4">
        <ShieldAlert className="text-samurai-red w-12 h-12 flex-shrink-0" />
        <p className="text-elderly-base font-bold leading-tight">
          【注意】安中市内で<br />イノシシの目撃情報があります
        </p>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center gap-8 w-full">
        <AnimatePresence mode="wait">
          {status === "resting" && (
            <motion.div key="resting" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="text-center">
              <div className="bg-samurai-gold/10 p-8 rounded-full mb-4 inline-block">
                <Home className="w-32 h-32 text-samurai-gold" />
              </div>
              <p className="text-elderly-lg font-bold">準備はよいか？</p>
            </motion.div>
          )}

          {status === "walking" && (
            <motion.div key="walking" initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} className="text-center">
              <div className="relative inline-block">
                <Footprints className="w-40 h-40 text-samurai-green animate-bounce" />
                <div className="absolute -top-4 -right-4 bg-samurai-green text-white px-4 py-2 rounded-full text-xl font-bold">
                  修行中
                </div>
              </div>
              <p className="text-elderly-xl font-black mt-4">{path.length} 地点通過</p>
              <p className="text-elderly-base text-gray-400">安中の道を刻んでいます...</p>
            </motion.div>
          )}

          {status === "recording" && (
            <motion.div key="recording" className="text-center">
              <Mic className="w-40 h-40 text-samurai-red animate-pulse mx-auto" />
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