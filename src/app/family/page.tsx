"use client";

import { useEffect, useState } from "react";
import { Heart, Activity, HeartPulse, MapPin, Calendar, ShieldAlert } from "lucide-react";
import MapView, { WildlifeAlert } from "@/components/MapView";
import { supabase } from "@/lib/supabase";

// 安中市の出没注意エリア（テスト用データ）
const mockAlerts: WildlifeAlert[] = [
  { id: "1", type: "bear", lat: 36.3355, lng: 138.8612, radius: 500 }, // 松井田町付近
  { id: "2", type: "boar", lat: 36.3274, lng: 138.8893, radius: 300 }, // 安中市役所付近
];

export default function FamilyDashboard() {
  const [latestActivity, setLatestActivity] = useState<ActivityData | null>(null);
  const [loading, setLoading] = useState(true);

  // ... (useEffectなどの既存ロジックは維持) ...

  return (
    <main className="min-h-screen bg-gray-50 p-6 pb-24 font-sans">
      {/* ... (ヘッダーなどは維持) ... */}

      {/* 危険エリアのアラート通知（地図の上に追加） */}
      <section className="mb-6">
        <div className="bg-orange-50 border border-orange-200 p-4 rounded-3xl flex items-center gap-4">
          <ShieldAlert className="text-orange-500 flex-shrink-0" size={24} />
          <p className="text-sm text-orange-800 font-bold">
            安中市の最新情報：付近にイノシシの出没報告があります。修行ルートと重なっていないか確認してください。
          </p>
        </div>
      </section>

      {/* ... (健康分析カードなどは維持) ... */}

      <section className="bg-white p-4 rounded-[32px] shadow-lg mb-8">
        <h2 className="text-lg font-bold mb-4 px-2 flex items-center gap-2">
          <Calendar className="text-samurai-gold" size={20} /> 今日の足跡
        </h2>
        {/* 地図にアラートデータを渡す */}
        <MapView path={path} alerts={mockAlerts} />
      </section>

      {/* ... (電話ボタンなどは維持) ... */}
    </main>
  );
}