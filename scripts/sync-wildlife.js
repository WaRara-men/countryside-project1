// GitHub Actionsで自動実行される動物出没情報同期スクリプト
require('dotenv').config();
const { GoogleGenerativeAI } = require("@google/generative-ai");
const { createClient } = require('@supabase/supabase-js');
const puppeteer = require('puppeteer-core');

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

async function run() {
  console.log("🌊 同期開始: 安中市 動物出没情報...");
  
  // 1. Gaccomから情報を取得
  const browser = await puppeteer.launch({
    executablePath: process.env.CHROME_PATH || '/usr/bin/google-chrome',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  try {
    const page = await browser.newPage();
    await page.goto('https://www.gaccom.jp/safety/area/p10/c211/animal', { waitUntil: 'networkidle2' });
    
    // 直近の記事リストを取得
    const text = await page.evaluate(() => {
      return document.querySelector('.list_box')?.innerText || "";
    });
    
    if (!text) {
      console.log("❌ 記事が見つかりませんでした");
      return;
    }

    // 2. AIで構造化データに変換
    const prompt = `
      以下の動物出没ニュースから情報を抽出し、JSON配列で返してください。
      緯度(lat)と経度(lng)は、安中市内の住所から正確に推測してください。
      
      [
        {
          "id": "一意のID（日付と場所から生成）",
          "type": "bear" または "boar",
          "lat": 数値（例: 36.3156）,
          "lng": 数値（例: 138.7969）,
          "radius": 500,
          "occurred_at": "ISO8601形式",
          "description": "内容の要約"
        }
      ]

      テキスト:
      ${text}
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const jsonText = response.text().replace(/```json|```/g, "").trim();
    const alerts = JSON.parse(jsonText);

    console.log(`✨ ${alerts.length}件の事案を解析しました`);

    // 3. Supabaseに保存
    for (const alert of alerts) {
      const { error } = await supabase
        .from('wildlife_alerts')
        .upsert({
          type: alert.type,
          lat: alert.lat,
          lng: alert.lng,
          radius: alert.radius,
          occurred_at: alert.occurred_at,
          description: alert.description
        }, { onConflict: 'occurred_at,lat,lng' });

      if (error) console.error("❌ 保存失敗:", error.message);
      else console.log(`✅ 保存成功: ${alert.occurred_at} - ${alert.type}`);
    }

  } catch (err) {
    console.error("❌ 同期エラー:", err);
  } finally {
    await browser.close();
    console.log("🌊 同期終了");
  }
}

run();
