"use client";

import { Heart, Activity, TrendingUp, HeartPulse, MapPin, Calendar } from "lucide-react";
import MapView from "@/components/MapView";

const dummyPath = [
  { lat: 36.3274, lng: 138.8893 },
  { lat: 36.3312, lng: 138.8755 },
  { lat: 36.3355, lng: 138.8612 },
];

export default function FamilyDashboard() {
  return (
    <main className="min-h-screen bg-gray-50 p-6 pb-24 font-sans">
      <header className="mb-8">
        <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
          <Heart className="text-red-500 fill-red-500" />
          父さんの修行日誌
        </h1>
        <p className="text-gray-500">本日：安中市にて活動中</p>
      </header>

      <section className="grid grid-cols-1 gap-6 mb-8">
        <div className="bg-white p-6 rounded-[32px] shadow-sm border border-gray-100">
          <h2 className="text-gray-500 font-bold mb-4 flex items-center gap-2 text-sm uppercase tracking-wider">
            <HeartPulse className="text-red-500" size={18} /> 今日の健康分析
          </h2>
          <div className="flex justify-between items-end">
            <div>
              <span className="text-5xl font-black text-gray-900">85</span>
              <span className="text-xl font-bold text-gray-400"> / 100 点</span>
            </div>
            <div className="text-right">
              <p className="text-green-600 font-bold text-sm">昨日より +5点</p>
              <p className="text-gray-400 text-xs">声のハリ・歩行ともに安定</p>
            </div>
          </div>
          <div className="mt-6 h-2 w-full bg-gray-100 rounded-full overflow-hidden flex">
            <div className="h-full bg-samurai-green" style={{ width: '85%' }}></div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white p-5 rounded-3xl shadow-sm border border-gray-100">
            <div className="flex items-center gap-2 text-blue-600 mb-2 font-bold text-sm">
              <MapPin size={16} /> 修行距離
            </div>
            <div className="text-2xl font-black text-gray-900">2.4km</div>
          </div>
          <div className="bg-white p-5 rounded-3xl shadow-sm border border-gray-100">
            <div className="flex items-center gap-2 text-orange-600 mb-2 font-bold text-sm">
              <Activity size={16} /> 経過時間
            </div>
            <div className="text-2xl font-black text-gray-900">45分</div>
          </div>
        </div>
      </section>

      <section className="bg-white p-4 rounded-[32px] shadow-lg mb-8">
        <h2 className="text-lg font-bold mb-4 px-2 flex items-center gap-2">
          <Calendar className="text-samurai-gold" size={20} /> 今日の足跡
        </h2>
        <MapView path={dummyPath} />
      </section>

      <div className="fixed bottom-8 left-6 right-6">
        <button className="w-full bg-samurai-black text-white py-5 rounded-3xl font-bold shadow-xl active:scale-95 transition-transform flex items-center justify-center gap-3">
          父さんに電話をかける
        </button>
      </div>
    </main>
  );
}