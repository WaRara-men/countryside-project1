"use client";

import { useEffect, useState, useMemo } from "react";
import { Heart, Activity, HeartPulse, MapPin, Calendar, Clock, TrendingUp } from "lucide-react";
import MapView from "@/components/MapView";
import { supabase } from "@/lib/supabase";
import { getNearestGoalName } from "@/lib/nakasendo";
import { getAddressFromCoords } from "@/lib/location";

interface ActivityData {
  id: string;
  start_time: string;
  end_time: string | null;
  voice_score: number;
  distance: number;
  path: { lat: number; lng: number }[];
}

interface ChartData {
  date: string;
  score: number;
}

export default function FamilyDashboard() {
  const [activities, setActivities] = useState<ActivityData[]>([]);
  const [chartActivities, setChartActivities] = useState<ChartData[]>([]);
  const [address, setAddress] = useState<string>("位置情報を確認中...");
  const [loading, setLoading] = useState(true);

  const safeDate = (dateStr: string | null) => {
    if (!dateStr) return null;
    const d = new Date(dateStr);
    return isNaN(d.getTime()) ? null : d;
  };

  const fetchActivities = async () => {
    try {
      const { data, error } = await supabase
        .from("activities")
        .select("*")
        .order("start_time", { ascending: false })
        .limit(100);

      if (error) throw error;

      if (data) {
        const now = new Date();
        const timelineData = data.filter((act: ActivityData) => {
          if (act.end_time) return true;
          const startDate = safeDate(act.start_time);
          if (startDate) {
            return (now.getTime() - startDate.getTime()) / (1000 * 60 * 60) < 2;
          }
          return false;
        });

        const dailyStats: { [key: string]: { total: number, count: number } } = {};
        data.forEach(act => {
          if (act.voice_score > 0) {
            const d = safeDate(act.start_time);
            if (d) {
              const key = `${d.getMonth() + 1}/${d.getDate()}`;
              if (!dailyStats[key]) dailyStats[key] = { total: 0, count: 0 };
              dailyStats[key].total += act.voice_score;
              dailyStats[key].count += 1;
            }
          }
        });

        const last7Days: ChartData[] = [];
        for (let i = 6; i >= 0; i--) {
          const d = new Date();
          d.setDate(d.getDate() - i);
          const key = `${d.getMonth() + 1}/${d.getDate()}`;
          last7Days.push({
            date: key,
            score: dailyStats[key] ? Math.round(dailyStats[key].total / dailyStats[key].count) : 0
          });
        }

        setActivities(timelineData.slice(0, 15));
        setChartActivities(last7Days);
      }
    } catch (err) {
      console.error("Fetch Error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActivities();
    const channel = supabase
      .channel("family-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "activities" }, () => fetchActivities())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  // latestをuseMemoで計算し、安定させる
  const latest = useMemo(() => {
    if (activities.length === 0) return null;
    return activities.find(a => a.end_time) || activities[0];
  }, [activities]);

  useEffect(() => {
    let isMounted = true;
    const updateAddress = async () => {
      if (latest?.path && Array.isArray(latest.path) && latest.path.length > 0) {
        try {
          const lastPoint = latest.path[latest.path.length - 1];
          if (lastPoint && typeof lastPoint.lat === 'number' && typeof lastPoint.lng === 'number') {
            const addr = await getAddressFromCoords(lastPoint.lat, lastPoint.lng);
            if (isMounted) setAddress(addr);
          }
        } catch (e) {
          if (isMounted) setAddress("住所を取得できませんでした");
        }
      }
    };
    updateAddress();
    return () => { isMounted = false; };
  }, [latest?.id, latest?.path?.length]);

  if (loading) return <div className="min-h-screen flex items-center justify-center font-bold">状況を確認中...</div>;

  const formatTime = (isoString: string | null) => {
    const d = safeDate(isoString);
    if (!d) return "--:--";
    return d.toLocaleTimeString("ja-JP", { hour: "2-digit", minute: "2-digit", hour12: false });
  };

  return (
    <main className="min-h-screen bg-gray-50 p-4 pb-24 font-sans max-w-lg mx-auto">
      <header className="mb-6 bg-white p-6 rounded-[40px] shadow-sm border border-gray-100">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h1 className="text-xl font-bold text-gray-800">父さんの安否</h1>
            <p className="text-sm text-gray-600 font-bold mt-1">{address}</p>
            {latest?.path && Array.isArray(latest.path) && latest.path.length > 0 && (
              <p className="text-[10px] text-samurai-gold font-black uppercase tracking-widest mt-0.5">
                領内: {getNearestGoalName(latest.path[latest.path.length-1].lat, latest.path[latest.path.length-1].lng)}
              </p>
            )}
          </div>
          <div className={`${latest?.end_time ? 'bg-samurai-green/10 text-samurai-green' : 'bg-samurai-gold/10 text-samurai-gold'} px-4 py-2 rounded-full text-sm font-black animate-pulse`}>
            {latest?.end_time ? '帰宅済み' : '修行中'}
          </div>
        </div>

        <div className="flex items-center gap-6">
          <div className="flex-1 text-center">
            <p className="text-[10px] text-gray-400 font-bold uppercase mb-1">元気度</p>
            <div className="flex items-baseline justify-center gap-1">
              <span className="text-4xl font-black text-gray-900">{latest?.voice_score ?? "--"}</span>
            </div>
          </div>
          <div className="w-px h-10 bg-gray-100"></div>
          <div className="flex-1 text-center">
            <p className="text-[10px] text-gray-400 font-bold uppercase mb-1">距離</p>
            <div className="flex items-baseline justify-center gap-1">
              <span className="text-4xl font-black text-gray-900">{latest?.distance?.toFixed(2) ?? "0.00"}</span>
              <span className="text-xs font-bold text-gray-400">km</span>
            </div>
          </div>
        </div>
      </header>

      <section className="bg-white p-6 rounded-[40px] shadow-sm border border-gray-100 mb-6">
        <h2 className="text-gray-500 font-bold mb-6 flex items-center gap-2 text-sm uppercase">
          <Clock className="text-blue-500" size={18} /> 最近の修行履歴
        </h2>
        <div className="space-y-10">
          {activities.length === 0 && <p className="text-gray-300 text-xs text-center py-4">まだ履歴がありません</p>}
          {activities.map((act, index) => {
            const actDate = safeDate(act.start_time);
            const prevDate = index > 0 ? safeDate(activities[index-1].start_time) : null;
            const showDate = index === 0 || (actDate && prevDate && actDate.toDateString() !== prevDate.toDateString());
            
            return (
              <div key={act.id} className="relative">
                {showDate && actDate && (
                  <div className="mb-4 flex items-center gap-2">
                    <span className="bg-gray-100 text-gray-500 text-[10px] font-black px-3 py-1 rounded-full uppercase">
                      {actDate.toLocaleDateString("ja-JP", { month: "short", day: "numeric", weekday: "short" })}
                    </span>
                    <div className="flex-1 h-px bg-gray-50"></div>
                  </div>
                )}
                <div className="pl-6 border-l-2 border-gray-50 space-y-4 ml-4">
                  <div className="relative">
                    <div className="absolute -left-[33px] top-1 w-4 h-4 rounded-full bg-blue-500 border-4 border-white shadow-sm"></div>
                    <p className="text-sm font-bold text-gray-800">{formatTime(act.start_time)} 出陣</p>
                  </div>
                  <div className="relative">
                    <div className={`absolute -left-[33px] top-1 w-4 h-4 rounded-full ${act.end_time ? 'bg-samurai-green' : 'bg-gray-200'} border-4 border-white shadow-sm`}></div>
                    <p className="text-sm font-bold text-gray-800">
                      {act.end_time ? `${formatTime(act.end_time)} 帰還` : '修行中...'}
                      {act.voice_score > 0 && <span className="ml-2 text-xs text-samurai-gold font-black">元気 {act.voice_score}</span>}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <section className="bg-white p-6 rounded-[40px] shadow-sm border border-gray-100 mb-6">
        <h2 className="text-gray-500 font-bold mb-4 flex items-center gap-2 text-sm uppercase">
          <TrendingUp className="text-red-500" size={18} /> 元気の変化（1週間）
        </h2>
        <div className="flex items-end justify-between h-32 gap-3 px-2 pt-4">
          {chartActivities.map((day, i) => (
            <div key={day.date} className="flex-1 flex flex-col items-center gap-2">
              <div className="relative w-full flex flex-col justify-end h-24 bg-gray-50/50 rounded-t-lg">
                <div 
                  className={`w-full rounded-t-lg transition-all duration-1000 ${i === chartActivities.length - 1 ? 'bg-samurai-green' : 'bg-gray-200'}`}
                  style={{ height: `${day.score > 0 ? day.score : 5}%` }}
                ></div>
              </div>
              <span className="text-[10px] font-bold text-gray-400">{day.date}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-white p-4 rounded-[40px] shadow-lg mb-6">
        <h2 className="text-lg font-bold mb-4 px-2 flex items-center gap-2">
          <MapPin className="text-samurai-gold" size={20} /> 今の足跡
        </h2>
        <MapView path={latest?.path || []} />
      </section>

      <div className="fixed bottom-6 left-6 right-6">
        <button onClick={() => window.location.href='tel:0000000000'} className="w-full bg-samurai-black text-white py-5 rounded-3xl font-bold shadow-xl active:scale-95 transition-transform">電話をかける</button>
      </div>
    </main>
  );
}
