"use client";

import { useEffect, useState } from "react";
import { Heart, Activity, HeartPulse, MapPin, Calendar, ShieldAlert, Clock, TrendingUp } from "lucide-react";
import MapView, { WildlifeAlert } from "@/components/MapView";
import { supabase } from "@/lib/supabase";

interface ActivityData {
  id: string;
  start_time: string;
  end_time: string | null;
  voice_score: number;
  distance: number;
  path: { lat: number; lng: number }[];
}

export default function FamilyDashboard() {
  const [activities, setActivities] = useState<ActivityData[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchActivities = async () => {
    const { data } = await supabase
      .from("activities")
      .select("*")
      .order("start_time", { ascending: false })
      .limit(7);

    if (data) {
      setActivities(data as ActivityData[]);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchActivities();

    // リアルタイム購読：親が歩いている最中の更新（UPDATE）もキャッチする
    const channel = supabase
      .channel("family-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "activities" },
        () => {
          fetchActivities(); // 何か変更があれば再取得
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  if (loading) return <div className="min-h-screen flex items-center justify-center font-bold">状況を確認中...</div>;

  const latest = activities[0];
  const formatTime = (isoString: string | null) => {
    if (!isoString) return "--:--";
    return new Date(isoString).toLocaleTimeString("ja-JP", { hour: "2-digit", minute: "2-digit" });
  };

  return (
    <main className="min-h-screen bg-gray-50 p-4 pb-24 font-sans max-w-lg mx-auto">
      {/* 1. 現在のステータス */}
      <header className="mb-6 bg-white p-6 rounded-[40px] shadow-sm border border-gray-100">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h1 className="text-xl font-bold text-gray-800">父さんの安否</h1>
            <p className="text-sm text-gray-500">群馬県安中市</p>
          </div>
          <div className={`${latest?.end_time ? 'bg-samurai-green/10 text-samurai-green' : 'bg-samurai-gold/10 text-samurai-gold'} px-4 py-2 rounded-full text-sm font-black animate-pulse`}>
            {latest?.end_time ? '帰宅済み' : '修行中'}
          </div>
        </div>

        <div className="flex items-center gap-6">
          <div className="flex-1 text-center">
            <p className="text-[10px] text-gray-400 font-bold uppercase mb-1">元気度</p>
            <div className="flex items-baseline justify-center gap-1">
              <span className="text-4xl font-black text-gray-900">{latest?.voice_score || "--"}</span>
            </div>
          </div>
          <div className="w-px h-10 bg-gray-100"></div>
          <div className="flex-1 text-center">
            <p className="text-[10px] text-gray-400 font-bold uppercase mb-1">距離</p>
            <div className="flex items-baseline justify-center gap-1">
              <span className="text-4xl font-black text-gray-900">{latest?.distance?.toFixed(2) || "0.0"}</span>
              <span className="text-xs font-bold text-gray-400">km</span>
            </div>
          </div>
        </div>
      </header>

      {/* 2. 【本物のタイムライン】 */}
      <section className="bg-white p-6 rounded-[40px] shadow-sm border border-gray-100 mb-6">
        <h2 className="text-gray-500 font-bold mb-4 flex items-center gap-2 text-sm uppercase">
          <Clock className="text-blue-500" size={18} /> 本日のリズム（実測）
        </h2>
        <div className="relative pl-6 border-l-2 border-dashed border-gray-100 space-y-6">
          <div className="relative">
            <div className="absolute -left-[31px] top-1 w-4 h-4 rounded-full bg-blue-500 border-4 border-white shadow-sm"></div>
            <p className="text-sm font-bold text-gray-800">{formatTime(latest?.start_time)} 出陣</p>
            <p className="text-[10px] text-gray-400">実際にボタンが押された時刻です</p>
          </div>
          <div className="relative">
            <div className={`absolute -left-[31px] top-1 w-4 h-4 rounded-full ${latest?.end_time ? 'bg-samurai-green' : 'bg-gray-200'} border-4 border-white shadow-sm`}></div>
            <p className="text-sm font-bold text-gray-800">{formatTime(latest?.end_time)} 帰還</p>
            <p className="text-[10px] text-gray-400">{latest?.end_time ? '無事に自宅へ戻られました' : '現在は移動中です'}</p>
          </div>
        </div>
      </section>

      {/* 3. 地図（リアルタイム軌跡） */}
      <section className="bg-white p-4 rounded-[40px] shadow-lg mb-6">
        <h2 className="text-lg font-bold mb-4 px-2 flex items-center gap-2">
          <MapPin className="text-samurai-gold" size={20} /> 今の足跡
        </h2>
        <MapView path={latest?.path || []} />
        <p className="mt-4 text-[10px] text-gray-400 text-center">
          ※10メートル移動するごとに地図が更新されます
        </p>
      </section>

      {/* アクション */}
      <div className="fixed bottom-6 left-6 right-6">
        <button onClick={() => window.location.href='tel:0000000000'} className="w-full bg-samurai-black text-white py-5 rounded-3xl font-bold shadow-xl active:scale-95 transition-transform">
          電話をかける
        </button>
      </div>
    </main>
  );
}