"use client";

import { useEffect, useState } from "react";
import { Heart, Activity, HeartPulse, MapPin, Calendar, Clock, TrendingUp } from "lucide-react";
import MapView from "@/components/MapView";
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
  const [chartActivities, setChartActivities] = useState<{date: string, score: number}[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchActivities = async () => {
    const { data } = await supabase
      .from("activities")
      .select("*")
      .order("start_time", { ascending: false })
      .limit(50); // 集計のために多めに取得

    if (data) {
      const now = new Date();
      
      // 1. タイムライン用のフィルタリング
      // - 完了しているものはすべて保持
      // - 未完了（修行中）は最新の1つだけで、かつ開始から1時間以内のみ
      let activeFound = false;
      const timelineData = data.filter((act: ActivityData) => {
        if (act.end_time) return true;
        if (!activeFound) {
          const startTime = new Date(act.start_time);
          const diffHours = (now.getTime() - startTime.getTime()) / (1000 * 60 * 60);
          if (diffHours < 1) {
            activeFound = true;
            return true;
          }
        }
        return false;
      });

      // 2. グラフ用の集計（日ごとにまとめる）
      const dailyStats: { [key: string]: { score: number, count: number, date: string } } = {};
      data.filter(act => act.end_time).forEach(act => {
        const dateStr = new Date(act.start_time).toLocaleDateString("ja-JP", { month: "numeric", day: "numeric" });
        if (!dailyStats[dateStr]) {
          dailyStats[dateStr] = { score: 0, count: 0, date: dateStr };
        }
        dailyStats[dateStr].score += act.voice_score;
        dailyStats[dateStr].count += 1;
      });

      const chartData = Object.values(dailyStats).map(day => ({
        date: day.date,
        score: Math.round(day.score / day.count),
        id: day.date
      })).slice(-7); // 直近7日分

      setActivities(timelineData.slice(0, 10)); // タイムラインには最新10件
      setChartActivities(chartData); // グラフ専用のステート
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchActivities();

    const channel = supabase
      .channel("family-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "activities" },
        () => {
          fetchActivities();
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
    const date = new Date(isoString);
    return date.toLocaleTimeString("ja-JP", { 
      hour: "2-digit", 
      minute: "2-digit",
      hour12: false 
    });
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
          <Clock className="text-blue-500" size={18} /> 最近のリズム（履歴）
        </h2>
        <div className="space-y-8">
          {activities.map((act, index) => (
            <div key={act.id} className="relative pl-6 border-l-2 border-dashed border-gray-100">
              <div className="absolute -left-[9px] -top-2 bg-white py-1">
                <span className="text-[10px] font-black text-gray-300 uppercase">
                  {new Date(act.start_time).toLocaleDateString("ja-JP", { month: "short", day: "numeric" })}
                </span>
              </div>
              <div className="space-y-4 pt-4">
                <div className="relative">
                  <div className="absolute -left-[31px] top-1 w-4 h-4 rounded-full bg-blue-500 border-4 border-white shadow-sm"></div>
                  <p className="text-sm font-bold text-gray-800">{formatTime(act.start_time)} 出陣</p>
                </div>
                <div className="relative">
                  <div className={`absolute -left-[31px] top-1 w-4 h-4 rounded-full ${act.end_time ? 'bg-samurai-green' : 'bg-gray-200'} border-4 border-white shadow-sm`}></div>
                  <p className="text-sm font-bold text-gray-800">
                    {act.end_time ? `${formatTime(act.end_time)} 帰還` : '修行中...'}
                    {act.voice_score > 0 && <span className="ml-2 text-xs text-samurai-gold">元気度: {act.voice_score}</span>}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 3. 【復元】元気の変化（グラフ） */}
      <section className="bg-white p-6 rounded-[40px] shadow-sm border border-gray-100 mb-6">
        <h2 className="text-gray-500 font-bold mb-4 flex items-center gap-2 text-sm uppercase">
          <TrendingUp className="text-red-500" size={18} /> 元気の変化（1週間）
        </h2>
        <div className="flex items-end justify-between h-32 gap-2">
          {chartActivities.map((day, i) => (
            <div key={day.date} className="flex-1 flex flex-col items-center gap-2">
              <div 
                className={`w-full rounded-t-lg transition-all duration-1000 ${i === chartActivities.length - 1 ? 'bg-samurai-green' : 'bg-gray-100'}`}
                style={{ height: `${day.score || 10}%` }}
              ></div>
              <span className="text-[10px] font-bold text-gray-400">
                {day.date}
              </span>
            </div>
          ))}
          {chartActivities.length === 0 && (
            <div className="w-full text-center text-gray-300 text-xs pb-4">データ蓄積中...</div>
          )}
        </div>
      </section>

      {/* 4. 地図（リアルタイム軌跡） */}
      <section className="bg-white p-4 rounded-[40px] shadow-lg mb-6">
        <h2 className="text-lg font-bold mb-4 px-2 flex items-center gap-2">
          <MapPin className="text-samurai-gold" size={20} /> 今の足跡
        </h2>
        <MapView path={latest?.path || []} />
      </section>

      <div className="fixed bottom-6 left-6 right-6">
        <button onClick={() => window.location.href='tel:0000000000'} className="w-full bg-samurai-black text-white py-5 rounded-3xl font-bold shadow-xl active:scale-95 transition-transform">
          電話をかける
        </button>
      </div>
    </main>
  );
}