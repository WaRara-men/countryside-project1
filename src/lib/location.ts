/**
 * OpenStreetMap (Nominatim API) を使用して緯度経度から住所を取得する
 * 
 * ※利用規約: 1秒間に1回以上のリクエストを避けること
 */
export async function getAddressFromCoords(lat: number, lng: number): Promise<string> {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`,
      {
        headers: {
          "Accept-Language": "ja",
          "User-Agent": "AnnakaSamuraiApp/1.0" // 利用規約に基づきアプリケーション名を指定
        }
      }
    );
    const data = await response.json();
    
    if (data && data.address) {
      const addr = data.address;
      // 日本の住所形式に合わせて組み立て (市町村 + 町名)
      const city = addr.city || addr.town || addr.village || addr.suburb || "";
      const suburb = addr.suburb || addr.neighbourhood || "";
      const road = addr.road || "";
      
      return city + (suburb ? ` ${suburb}` : "") + (road ? ` ${road}` : "");
    }
    return "場所を特定できませんでした";
  } catch (error) {
    console.error("住所取得エラー:", error);
    return "住所取得に失敗";
  }
}
