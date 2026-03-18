import { calculateDistance, calculateTotalPathDistance, calculateNakasendoProgress } from '../src/lib/nakasendo';

describe('距離計算ロジックのテスト', () => {
  it('2点間の距離が正しく計算されること (安中市役所〜松井田支所 約10km)', () => {
    const annakaCityHall = { lat: 36.3268, lng: 138.8914 };
    const matsuidaBranch = { lat: 36.3156, lng: 138.7969 };
    
    const distance = calculateDistance(
      annakaCityHall.lat, annakaCityHall.lng,
      matsuidaBranch.lat, matsuidaBranch.lng
    );
    
    // 直線距離で約8.5km〜9.0km程度になるはず
    expect(distance).toBeGreaterThan(8);
    expect(distance).toBeLessThan(10);
  });

  it('空の配列の場合は距離0を返すこと', () => {
    expect(calculateTotalPathDistance([])).toBe(0);
  });

  it('中山道の進捗計算が正しいこと', () => {
    // 0km地点（安中宿）
    const p1 = calculateNakasendoProgress(0);
    expect(p1.nextGoalName).toBe('松井田宿');
    expect(p1.progressPercent).toBe(0);

    // 松井田宿（3.5km）の直前
    const p2 = calculateNakasendoProgress(3.4);
    expect(p2.nextGoalName).toBe('松井田宿');
    expect(p2.progressPercent).toBeGreaterThan(90);

    // 松井田宿を過ぎた地点
    const p3 = calculateNakasendoProgress(4.0);
    expect(p3.nextGoalName).toBe('坂本宿');
  });
});
