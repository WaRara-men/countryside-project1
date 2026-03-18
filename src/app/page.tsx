"use client";

import { useState } from "react";
import { ShieldAlert, Footprints, Home, Mic, Award } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useTracking } from "@/hooks/useTracking";
import { supabase } from "@/lib/supabase";
import { useVoiceAnalysis } from "@/hooks/useVoiceAnalysis";
import { supabase } from "@/lib/supabase";
import { getLatestMessages, SamuraiMessage, markAsRead } from "@/lib/messages"; // 追加

export default function ElderlyPage() {
  const [status, setStatus] = useState<"resting" | "walking" | "recording" | "praised">("resting");
  const [messages, setMessages] = useState<SamuraiMessage[]>([]); // 家族からの手紙
  const { path, startTracking, stopTracking } = useTracking();
  const { volume, startRecording, stopRecording } = useVoiceAnalysis();

  // 家族からのメッセージを読み込む
  useEffect(() => {
    const fetchMessages = async () => {
      const data = await getLatestMessages();
      setMessages(data);
    };
    fetchMessages();
  }, [status]);

  const handleStart = async () => {
    // 読んだメッセージを既読にする
    for (const msg of messages) {
      await markAsRead(msg.id);
    }
    setMessages([]);
    setStatus("walking");
    startTracking();
  };
  const handleEnd = async () => {
    const finalPath = stopTracking();
    setStatus("recording");
    
    // 実際にマイクを起動して録音・解析開始
    await startRecording();

    // 5秒後に自動で録音を終了してデータを保存
    setTimeout(async () => {
      const peakVolume = stopRecording();
      
      // 最大音量に基づいた「元気度スコア」を算出
      // （小さな声なら低く、ハリのある声なら高くなるように調整）
      const score = Math.min(100, Math.max(60, Math.floor(peakVolume * 1.5)));

      // Supabaseへデータを保存
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
      } catch (err) {
        console.error("保存失敗:", err);
      }

      setStatus("praised");
    }, 5000);
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
            <motion.div key="resting" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="text-center w-full px-4">
              
              {/* 家族からの最新の手紙（吹き出し演出） */}
              {messages.length > 0 && (
                <motion.div 
                  initial={{ scale: 0.8, rotate: -2 }}
                  animate={{ scale: 1, rotate: 1 }}
                  className="bg-samurai-gold text-samurai-black p-6 rounded-[40px] rounded-bl-none mb-10 shadow-xl relative"
                >
                  <p className="text-elderly-base font-black leading-tight">
                    「{messages[0].content}」
                  </p>
                  <p className="text-sm mt-2 text-right opacity-80">— {messages[0].sender_name}より</p>
                  {/* 吹き出しのしっぽ */}
                  <div className="absolute -bottom-4 left-0 w-8 h-8 bg-samurai-gold clip-path-triangle" style={{ clipPath: 'polygon(0 0, 0% 100%, 100% 0)' }}></div>
                </motion.div>
              )}

              <div className="bg-samurai-gold/10 p-8 rounded-full mb-4 inline-block">
                <Home className="w-32 h-32 text-samurai-gold" />
              </div>
              <p className="text-elderly-lg font-bold">準備はよいか？</p>
            </motion.div>
          )}

          {status === "walking" && (
            <motion.div key="walking" initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} className="text-center w-full">
              <div className="relative inline-block mb-4">
                {/* 侍の行軍アニメーション */}
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
                  {/* 1万歩(約7km)をゴールとした進捗バー */}
                  <motion.div 
                    className="h-full bg-samurai-green"
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min(100, (path.length * 0.01 / 7) * 100)}%` }}
                  />
                </div>
                <p className="text-sm text-gray-400 mt-4">安中宿から松井田宿へ向けて進軍中...</p>
              </div>
            </motion.div>
          )}

          {status === "recording" && (
            <motion.div key="recording" className="text-center relative">
              {/* 声の大きさに反応する波形（同心円） */}
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
              
              <Mic className="w-40 h-40 text-samurai-red relative z-10" />
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