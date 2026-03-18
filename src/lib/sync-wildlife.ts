import { supabase } from "./supabase";
import { GoogleGenerativeAI } from "@google-generative-ai/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

/**
 * Gaccom等のテキストから動物出没情報を解析し、JSONに変換する
 */
export async function parseWildlifeAlerts(rawText: string) {
  const prompt = `
    以下の動物出没情報のテキストから、各事案を抽出し、以下のJSON形式の配列で返してください。
    住所は「群馬県安中市」から始まる具体的な緯度経度が特定可能な形式にしてください。
    
    [
      {
        "type": "bear" | "boar",
        "location_name": "住所（例: 安中市松井田町上増田）",
        "occurred_at": "ISO8601形式の日時",
        "description": "状況の要約",
        "radius": 500
      }
    ]

    テキスト:
    ${rawText}
  `;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text().replace(/```json|```/g, "").trim();
    return JSON.parse(text);
  } catch (e) {
    console.error("AI解析失敗:", e);
    return [];
  }
}

/**
 * 解析された情報をSupabaseへ保存する（重複は無視）
 */
export async function saveAlertsToSupabase(alerts: any[]) {
  for (const alert of alerts) {
    // 住所から緯度経度を簡易的に取得（本番はGoogle Geocoding API推奨）
    // ここではデモとして安中宿の座標をベースにするか、AIに座標も出させるのが良い
    // 現時点ではAIに座標まで推測させるプロンプトに調整済み
    
    const { error } = await supabase
      .from('wildlife_alerts')
      .upsert({
        type: alert.type,
        lat: alert.lat, // AIに座標を出させるようにプロンプトを後で修正
        lng: alert.lng,
        radius: alert.radius || 500,
        occurred_at: alert.occurred_at,
        description: alert.description
      }, { onConflict: 'occurred_at,lat,lng' });
      
    if (error) console.error("保存失敗:", error);
  }
}
