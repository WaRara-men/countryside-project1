/**
 * OpenStreetMap (Nominatim API) を使用して緯度経度から住所を取得する
 */
export async function getAddressFromCoords(lat: number, lng: number): Promise<string> {
  // 緯度経度が異常な場合は早期リターン
  if (typeof lat !== 'number' || typeof lng !== 'number' || isNaN(lat) || isNaN(lng)) {
    return "位置情報が不正です";
  }

  try {
    // ブラウザのfetchでは User-Agent ヘッダーの設定は禁止されているため削除
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`,
      {
        headers: {
          "Accept-Language": "ja"
        }
      }
    );

    if (!response.ok) throw new Error("Network response was not ok");
    
    const data = await response.json();
    
    if (data && data.address) {
      const addr = data.address;
      const city = addr.city || addr.town || addr.village || addr.suburb || "";
      const suburb = addr.suburb || addr.neighbourhood || "";
      const road = addr.road || "";
      
      const result = [city, suburb, road].filter(Boolean).join(" ");
      return result || "住所不明なエリア";
    }
    return "場所を特定できませんでした";
  } catch (error) {
    console.error("住所取得エラー:", error);
    return "住所の取得に失敗しました";
  }
}
