"use client";

import { useEffect, useState } from "react";
import { Heart, Activity, HeartPulse, MapPin, Calendar } from "lucide-react";
import MapView from "@/components/MapView";
import { supabase } from "@/lib/supabase";

interface ActivityData {
  start_time: string;
  voice_score: number;
  distance: number;
  path: { lat: number; lng: number }[];
}

export default function FamilyDashboard() {
  const [latestActivity, setLatestActivity] = useState<ActivityData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLatestActivity = async () => {
      try {
        const { data } = await supabase
          .from("activities")
          .select("*")
          .order("start_time", { ascending: false })
          .limit(1)
          .single();

        if (data) {
          setLatestActivity(data as ActivityData);
        }
      } catch (err) {
        console.error("データ取得失敗:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchLatestActivity();

    const channel = supabase
      .channel("realtime-activities")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "activities" },
        (payload) => {
          setLatestActivity(payload.new as ActivityData);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">修行記録を確認中...</div>;
  }

  const voiceScore = latestActivity?.voice_score ?? 0;
  const distance = latestActivity?.distance ?? 0;
  const path = latestActivity?.path ?? [];

  return (
    <main className="min-h-screen bg-gray-50 p-6 pb-24 font-sans">
      <header className="mb-8">
        <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
          <Heart className="text-red-500 fill-red-500" />
          父さんの修行日誌
        </h1>
        <p className="text-gray-500">
          最終更新：{latestActivity ? new Date(latestActivity.start_time).toLocaleString("ja-JP") : "データなし"}
        </p>
      </header>

      <section className="grid grid-cols-1 gap-6 mb-8">
        <div className="bg-white p-6 rounded-[32px] shadow-sm border border-gray-100">
          <h2 className="text-gray-500 font-bold mb-4 flex items-center gap-2 text-sm uppercase tracking-wider">
            <HeartPulse className="text-red-500" size={18} /> 今日の健康分析
          </h2>
          <div className="flex justify-between items-end">
            <div>
              <span className="text-5xl font-black text-gray-900">{voiceScore || "--"}</span>
              <span className="text-xl font-bold text-gray-400"> / 100 点</span>
            </div>
            <div className="text-right">
              <p className="text-green-600 font-bold text-sm">修行の成果</p>
              <p className="text-gray-400 text-xs">
                {voiceScore >= 80 ? "声にハリがありました" : "いつも通りです"}
              </p>
            </div>
          </div>
          <div className="mt-6 h-2 w-full bg-gray-100 rounded-full overflow-hidden flex">
            <div 
              className="h-full bg-samurai-green transition-all duration-1000" 
              style={{ width: `${voiceScore}%` }}
            ></div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white p-5 rounded-3xl shadow-sm border border-gray-100">
            <div className="flex items-center gap-2 text-blue-600 mb-2 font-bold text-sm">
              <MapPin size={16} /> 修行距離
            </div>
            <div className="text-2xl font-black text-gray-900">{distance.toFixed(1)}km</div>
          </div>
          <div className="bg-white p-5 rounded-3xl shadow-sm border border-gray-100">
            <div className="flex items-center gap-2 text-orange-600 mb-2 font-bold text-sm">
              <Activity size={16} /> 座標点
            </div>
            <div className="text-2xl font-black text-gray-900">{path.length}</div>
          </div>
        </div>
      </section>

      <section className="bg-white p-4 rounded-[32px] shadow-lg mb-8">
        <h2 className="text-lg font-bold mb-4 px-2 flex items-center gap-2">
          <Calendar className="text-samurai-gold" size={20} /> 今日の足跡
        </h2>
        <MapView path={path} />
      </section>

      <div className="fixed bottom-8 left-6 right-6">
        <button 
          onClick={() => window.location.href = `tel:0000000000`}
          className="w-full bg-samurai-black text-white py-5 rounded-3xl font-bold shadow-xl active:scale-95 transition-transform flex items-center justify-center gap-3"
        >
          父さんに電話をかける
        </button>
      </div>
    </main>
  );
}