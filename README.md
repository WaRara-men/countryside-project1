# 🏯 安中・侍の足跡 (Annaka Samurai Footsteps)

群馬県安中市の中山間地域に住む高齢者の「健康維持」と「安否確認」を、
**「修行（散歩）」**という前向きな文脈で解決するプロダクトです。

---

## 🌟 プロダクトの目的
- **高齢者の自立支援**: 「見守られる（監視）」ではなく、「侍として歩く（修行）」ことで自尊心を保ちます。
- **家族への安心提供**: 離れて暮らす家族に、歩いた軌跡と元気度スコアをリアルタイムで届けます。
- **地域の安全**: 安中市内で多発する熊・イノシシの出没情報を、高齢者の手元に即座に届けます。

## 🛠️ 主要機能
- **出陣・帰還ボタン**: 高齢者でも迷わない巨大なUI。
- **侍の足跡マップ**: Google Mapsと連携し、歩いた道を赤い線で可視化。
- **帰り際ボイス診断**: 帰宅時の「ただいま」という5秒の音声から健康状態をAIが判定。
- **野生動物アラート**: 地域の危険情報を常に表示。

## 🚀 技術スタック
- **Frontend**: Next.js (App Router), TypeScript, Tailwind CSS, Framer Motion
- **Backend**: Supabase (PostgreSQL, Realtime, Auth)
- **Maps**: Google Maps Platform API
- **Deployment**: Vercel (GitHub連携)

## 🔧 セットアップ方法
1. `npm install`
2. `.env.local` に各種APIキーを設定
3. `npm run dev` で起動

## 🛡️ 自動メンテナンス
- **GitHub Actions**: Supabaseの休止を防ぐため、3日に1回自動でアクセスを実行。

---

© 2026 安中・侍の足跡 開発チーム
