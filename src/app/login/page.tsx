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
    const word = aicotoba.trim().toLowerCase();

    if (word === "さむらい" || word === "侍" || word === "samurai") {
      localStorage.setItem("samurai_role", "elderly");
      localStorage.setItem("samurai_username", "安中侍");
      router.push("/");
    } else if (word === "かぞく" || word === "家族" || word === "family") {
      localStorage.setItem("samurai_role", "family");
      router.push("/family");
    } else {
      setError("合言葉が違い申す。もう一度お試しあれ。");
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
          <p className="text-sm font-bold text-gray-400">入城の合言葉を申せ</p>
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
              placeholder="ここに入力..."
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
          <p className="text-xs text-gray-500 mb-2">※体験用のお試し合言葉</p>
          <div className="flex justify-center gap-4 text-sm font-bold">
            <span className="bg-gray-800 px-3 py-1 rounded-lg">さむらい</span>
            <span className="bg-gray-800 px-3 py-1 rounded-lg">かぞく</span>
          </div>
        </div>
      </motion.div>
    </main>
  );
}
