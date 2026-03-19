"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { KeyRound, Shield } from "lucide-react";
import { motion } from "framer-motion";

export default function LoginPage() {
  const [aicotoba, setAicotoba] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const word = aicotoba.trim();
    if (!word) return;

    // 「さま」「様」「sama」で終わる場合は家族モード
    const isFamily = word.endsWith("さま") || word.endsWith("様") || word.toLowerCase().endsWith("sama");
    
    // ユーザーID（合言葉から末尾の識別子を除いたもの）
    const userId = isFamily 
      ? word.replace(/(さま|様|sama)$/i, "") 
      : word;

    if (isFamily) {
      localStorage.setItem("samurai_role", "family");
      localStorage.setItem("samurai_username", userId);
      router.push("/family");
    } else {
      localStorage.setItem("samurai_role", "elderly");
      localStorage.setItem("samurai_username", userId);
      router.push("/");
    }
  };

  return (
    <main className="min-h-screen bg-samurai-black text-samurai-white flex flex-col items-center justify-center p-6 font-sans">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md bg-white/5 p-8 rounded-[40px] border-2 border-samurai-gold/30 shadow-2xl backdrop-blur-sm"
      >
        <div className="text-center mb-10">
          <div className="inline-block p-4 bg-samurai-gold/20 rounded-full mb-4">
            <Shield size={48} className="text-samurai-gold" />
          </div>
          <h1 className="text-3xl font-black text-samurai-gold font-samurai mb-2">安中・侍の足跡</h1>
          <p className="text-sm font-bold text-gray-400">一族の合言葉を申せ</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <input
              type="text"
              value={aicotoba}
              onChange={(e) => {
                setAicotoba(e.target.value);
                setError("");
              }}
              placeholder="例：あんなか太郎"
              className="w-full bg-black/50 border-2 border-gray-600 rounded-3xl px-6 py-5 text-2xl font-black text-center text-white placeholder:text-gray-600 focus:outline-none focus:border-samurai-gold transition-colors"
              autoComplete="off"
              autoFocus
            />
          </div>

          {error && (
            <motion.p 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-samurai-red font-bold text-sm text-center bg-samurai-red/10 py-2 rounded-xl"
            >
              {error}
            </motion.p>
          )}

          <button 
            type="submit"
            disabled={!aicotoba}
            className="w-full bg-samurai-gold text-samurai-black py-5 rounded-3xl font-black text-2xl shadow-[0_0_20px_rgba(249,171,0,0.3)] disabled:opacity-50 disabled:shadow-none active:scale-95 transition-all font-samurai flex items-center justify-center gap-3"
          >
            <KeyRound size={28} />
            門を開く
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-white/10 text-center">
          <p className="text-[10px] text-gray-500 mb-4 leading-relaxed">
            ※家族で決めた好きな言葉を入れてください。<br/>
            末尾に「さま」をつけると家族用画面になります。
          </p>
          <div className="space-y-2">
            <div className="flex flex-col items-center gap-1">
              <span className="text-[10px] text-gray-400 uppercase tracking-widest">本人（例）</span>
              <span className="bg-gray-800 px-4 py-1 rounded-full text-xs font-bold text-samurai-gold border border-samurai-gold/20">あんなか太郎</span>
            </div>
            <div className="flex flex-col items-center gap-1 mt-2">
              <span className="text-[10px] text-gray-400 uppercase tracking-widest">家族（例）</span>
              <span className="bg-gray-800 px-4 py-1 rounded-full text-xs font-bold text-samurai-white border border-white/10">あんなか太郎さま</span>
            </div>
          </div>
        </div>
      </motion.div>
    </main>
  );
}
