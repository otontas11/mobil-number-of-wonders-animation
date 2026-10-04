// Kurtarma zaman çizelgesi sabitleri, saniye (doküman §6).
// HUG_AT sahne tarafında hesaplanır: WALK_START + yolUzunluğu / CFG.walkSpeed
export const TL = {
  SPARK_END: 0.7, // büyük kıvılcım süresi
  LOCK_BREAK: 0.35, // kilit kırılma sesi, kilit düşmeye başlar
  DOOR_OPEN: 0.7, // kapı açılmaya başlar
  DOOR_CREAK: 0.75, // kapı gıcırtısı
  WALK_START: 1.6, // köpek havlar, kafesten çıkar
  STEP_INTERVAL: 0.21, // yürüyüşte ayak sesi aralığı
  FINALE_AFTER_HUG: 2.4, // sarılmadan final ekranına
  MAGIC_DELAY_MS: 700, // köprü tamamlanınca "magic" sesi gecikmesi
  HINT: 1.8, // ipucu tepkisi: kaşif köprüyü işaret eder (doküman §12.2)
  HINT_BUBBLE_MS: 1800, // ipucu balonunun ekranda kalma süresi
} as const

// Tahta ekleme (doküman §6.1)
export const PLANK = {
  DROP_HEIGHT: 3.2,
  LAND_DUR: 0.55,
  DUST_START: 0.3,
  DUST_DUR: 0.9,
} as const
