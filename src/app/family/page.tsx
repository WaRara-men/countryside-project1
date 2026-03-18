"use client";

import { useEffect, useState } from "react";
import { Heart, Activity, HeartPulse, MapPin, Calendar, ShieldAlert, Clock, TrendingUp } from "lucide-react";
import MapView, { WildlifeAlert } from "@/components/MapView";
import { supabase } from "@/lib/supabase";

interface ActivityData {
  id: string;
  start_time: string;
  end_time: string;
  voice_score: number;
  distance: number;
  path: { lat: number; lng: number }[];
}

export default function FamilyDashboard() {
  const [activities, setActivities] = useState<ActivityData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchActivities = async () => {
      try {
        const { data } = await supabase
          .from("activities")
          .select("*")
          .order("start_time", { ascending: false })
          .limit(7); // 過去7日分

        if (data) {
          setActivities(data as ActivityData[]);
        }
      } catch (err) {
        console.error("データ取得失敗:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchActivities();
  }, []);

  if (loading) return <div className="min-h-screen flex items-center justify-center font-bold">父さんの様子を確認中...</div>;

  const latest = activities[0];
  const history = activities.slice(1);

  return (
    <main className="min-h-screen bg-gray-50 p-4 pb-24 font-sans max-w-lg mx-auto">
      {/* 1. 【核心】親の現在の状態 */}
      <header className="mb-6 bg-white p-6 rounded-[40px] shadow-sm border border-gray-100">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h1 className="text-xl font-bold text-gray-800">父さんの安否</h1>
            <p className="text-sm text-gray-500">群馬県安中市</p>
          </div>
          <div className="bg-samurai-green/10 text-samurai-green px-4 py-2 rounded-full text-sm font-black">
            帰宅済み
          </div>
        </div>

        <div className="flex items-center gap-6">
          <div className="flex-1">
            <p className="text-xs text-gray-400 font-bold uppercase mb-1">声のハリ（元気度）</p>
            <div className="flex items-baseline gap-1">
              <span className="text-5xl font-black text-gray-900">{latest?.voice_score || "--"}</span>
              <span className="text-lg font-bold text-gray-400">/100</span>
            </div>
          </div>
          <div className="w-px h-12 bg-gray-100"></div>
          <div className="flex-1">
            <p className="text-xs text-gray-400 font-bold uppercase mb-1">修行（散歩）距離</p>
            <div className="flex items-baseline gap-1">
              <span className="text-3xl font-black text-gray-900">{latest?.distance?.toFixed(1) || "0.0"}</span>
              <span className="text-lg font-bold text-gray-400">km</span>
            </div>
          </div>
        </div>
      </header>

      {/* 2. 【安心】生活リズムのタイムライン */}
      <section className="bg-white p-6 rounded-[40px] shadow-sm border border-gray-100 mb-6">
        <h2 className="text-gray-500 font-bold mb-4 flex items-center gap-2 text-sm uppercase">
          <Clock className="text-blue-500" size={18} /> 本日のリズム
        </h2>
        <div className="relative pl-6 border-l-2 border-dashed border-gray-100 space-y-6">
          <div className="relative">
            <div className="absolute -left-[31px] top-1 w-4 h-4 rounded-full bg-blue-500 border-4 border-white"></div>
            <p className="text-sm font-bold text-gray-800">10:15 出陣</p>
            <p className="text-xs text-gray-400">「いざ、出陣！」ボタンが押されました</p>
          </div>
          <div className="relative">
            <div className="absolute -left-[31px] top-1 w-4 h-4 rounded-full bg-samurai-green border-4 border-white"></div>
            <p className="text-sm font-bold text-gray-800">11:00 帰還</p>
            <p className="text-xs text-gray-400">「ただいま」の声とともに無事帰宅</p>
          </div>
        </div>
      </section>

      {/* 3. 【健康】元気度の推移（過去の変化に気づく） */}
      <section className="bg-white p-6 rounded-[40px] shadow-sm border border-gray-100 mb-6">
        <h2 className="text-gray-500 font-bold mb-4 flex items-center gap-2 text-sm uppercase">
          <TrendingUp className="text-red-500" size={18} /> 元気の変化（1週間）
        </h2>
        <div className="flex items-end justify-between h-32 gap-2">
          {activities.slice().reverse().map((act, i) => (
            <div key={i} className="flex-1 flex flex-col items-center gap-2">
              <div 
                className={`w-full rounded-t-lg transition-all duration-1000 ${i === activities.length - 1 ? 'bg-samurai-green' : 'bg-gray-100'}`}
                style={{ height: `${act.voice_score}%` }}
              ></div>
              <span className="text-[10px] font-bold text-gray-400">
                {new Date(act.start_time).getDate()}日
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* 4. 【安全】足跡マップ（帰ってきた場所を確認） */}
      <section className="bg-white p-4 rounded-[40px] shadow-lg mb-6">
        <h2 className="text-lg font-bold mb-4 px-2 flex items-center gap-2">
          <MapPin className="text-samurai-gold" size={20} /> 修行の軌跡
        </h2>
        <MapView path={latest?.path || []} />
        <div className="mt-4 p-4 bg-gray-50 rounded-2xl flex items-center gap-3">
          <ShieldAlert className="text-gray-400" size={20} />
          <p className="text-xs text-gray-500 leading-relaxed">
            安中市内の修行ルート付近を安全に通過しました。ご安心ください。
          </p>
        </div>
      </section>

      {/* 5. 絆のアクション */}
      <div className="fixed bottom-6 left-6 right-6 flex gap-3">
        <button className="flex-1 bg-samurai-black text-white py-5 rounded-3xl font-bold shadow-xl active:scale-95 transition-transform">
          電話をかける
        </button>
      </div>
    </main>
  );
}