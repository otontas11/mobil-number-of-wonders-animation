# Kaşif ve Dostu — Köprü Kurtarma Sahnesi

Oyun tasarımı ve teknik doküman · Sürüm 1.0 · Ekim 2026

Bu doküman, matematik bulmaca oyunundaki köprü kurtarma sahnesinin oyun mantığını, sahne akışını, ses tasarımını ve Android/iOS uygulamalarına WebView ile gömülecek web projesinin teknik yapısını tanımlar. Referans uygulama: `kasif-kopru.html` demosu.

---

## 1. Genel bakış

| | |
|---|---|
| **Tür** | Çocuklara yönelik matematik bulmaca + kurtarma hikâyesi |
| **Ekran** | Dikey (portre), telefon öncelikli |
| **Platform** | Android ve iOS native uygulama; kurtarma sahnesi WebView içinde çalışan web projesi |
| **Oturum** | 9 soru: 8 soru köprü için, 1 soru kafes kapısı için |
| **Süre** | Ortalama 2–4 dakika |
| **Ton** | Sevimli, neşeli, cezalandırmayan |

**Hikâye:** Yavru köpek, kanyonun karşı tarafındaki kilitli bir kafeste. Kaşif köprünün bu tarafında bekliyor. Oyuncu her doğru cevapta köprüye bir tahta ekler. Köprü tamamlanınca son soruyla kilit açılır, köpek köprüden koşarak kaşife gelir ve ikisi sarılır.

---

## 2. Karakterler ve mekân

### 2.1 Kaşif (ana karakter)
- Yuvarlak, krem renkli yüz; sarı kapüşon yüzü çerçeveler.
- Önünde pusula olan bej safari şapkası, kahverengi şapka bandı.
- Bej tulum, göğüste koyu gri **+ − × ÷** işaretleri.
- Kahverengi eldivenler ve botlar, sırtında rulo yataklı kahverengi çanta.
- İri kahverengi gözler, pembe yanaklar, açık ağızlı gülüş.

### 2.2 Yavru köpek (kurtarılan dost)
- Turuncu-kahve tüy; beyaz alın şeridi, beyaz burun ve çene.
- Gözleri saran kahve lekeler, uzun sarkık kulaklar.
- Beyaz göğüs tüyleri ve patiler, beyaz uçlu kabarık kuyruk.
- İri, parlak kahverengi gözler; mutluyken dili dışarıda.

### 2.3 Mekân
- Orman içinde bir kanyon; dibinde dere ve kayalar.
- **Uzak taraf:** taş kaide üstünde paslı metal kafes, arkasında sarmaşıklı taş harabe kemer, ağaçlar.
- **Yakın taraf:** kaşifin beklediği çimenlik alan, çalılar, çiçekler.
- Arka planda alçak poligon dağlar ve yavaşça kayan bulutlar.
- Halatlı asma köprü: iki uçta ahşap direkler, tutamak halatları ve alt halatlar baştan görünür; tahtalar sonradan eklenir.

---

## 3. Oyun akışı

```
Başlangıç
  │
  ├─ Soru 1–8  → her doğru cevap: +1 tahta (kaşifin tarafından kafese doğru)
  │
  ├─ Soru 9 ("Son soru") → kilit parlar, köpek kapıda heyecanla zıplar
  │       doğru cevap → kilit kırılır → kapı açılır
  │
  ├─ Kurtarma → köpek köprüden geçer → kaşifle sarılma
  │
  └─ Final ekranı: "9 Soru, 1 Mutlu Son! 🐾" + Tekrar oyna
```

### 3.1 Kurallar
- Tahta sayısı `CFG.planks` (varsayılan **8**). Toplam soru = `planks + 1`.
- Her doğru cevap **tam olarak 1 tahta** ekler; 9. doğru cevap tahta eklemez, kilidi açar.
- Yanlış cevap ilerlemeyi geri almaz, can veya süre düşürmez. Oyuncu aynı soruyu tekrar dener.
- Süre sınırı yoktur (bkz. Bölüm 10).

---

## 4. Bulmaca mantığı

### 4.1 Görünüm
- **Hedef sayı:** mavi parlayan kutu. Son soruda altın rengine döner.
- **Etiketler:** `İşlem: +`, `Adım: 2`.
- **Sayı halkası:** çember üzerinde eşit aralıklı 6 sayı düğmesi.
- **Denklem şeridi:** seçim yapıldıkça dolar (`? + ? = 13` → `8 + ? = 13` → `8 + 5 = 13`).

### 4.2 Soru üretimi
1. 2–12 aralığından **6 farklı** sayı seç.
2. Bu sayılardan rastgele iki farklı indeks seç.
3. Hedef = bu iki sayının toplamı.

```ts
function newQuestion(): Question {
  const set = new Set<number>()
  while (set.size < 6) set.add(rnd(2, 12))
  const nums = [...set]
  const i = rnd(0, 5)
  let j = rnd(0, 5); while (j === i) j = rnd(0, 5)
  return { nums, target: nums[i] + nums[j] }
}
```

> **Not:** Halkada hedefe ulaşan birden fazla çift olabilir. Toplamı hedefe eşit **her çift doğru kabul edilir**. Tek doğru çift istenirse üretimden sonra diğer çiftler kontrol edilip gerekirse yeniden üretilmelidir.

### 4.3 Seçim ve doğrulama
| Durum | Davranış |
|---|---|
| 1. sayıya dokunma | Düğme altın çerçeveyle parlar, denklem `a + ? = hedef` olur. |
| Aynı sayıya tekrar dokunma | Seçim iptal edilir. |
| 2. sayı, toplam = hedef | İki düğme arasına altın çizgi çekilir, denklem tamamlanır, düğmeler kilitlenir, `onCorrect()` çalışır. 900 ms sonra yeni soru gelir. |
| 2. sayı, toplam ≠ hedef | Çizgi ve düğmeler kırmızı olur, halka sallanır, denklem gerçek toplamı gösterir (`8 + 6 = 14`). 750 ms sonra seçim temizlenir. `onWrong()` çalışır. |

### 4.4 Genişletme seçenekleri
- `İşlem`: `+`, `−`, `×` (çıkarmada büyük − küçük; çarpmada 2–9 aralığı).
- `Adım`: 3 sayı seçimi (üç sayının toplamı).
- Sayı aralığı ve düğme sayısı yaş grubuna göre ayarlanabilir.

---

## 5. Durum modeli

### 5.1 Durum alanları
```ts
interface GameState {
  solved: number        // doğru cevap sayısı (0–9)
  placed: number        // yerleşmiş tahta (0–8)
  status: 'playing' | 'rescued'
  rescueT: number       // kurtarma başladıktan sonra geçen süre (sn)
  cheerT: number        // sevinç animasyonu kalan süre
  sadT: number          // yanlış cevap tepkisi kalan süre
}
```

### 5.2 Aşamalar
| Aşama | Koşul | Görsel durum |
|---|---|---|
| Köprü kurma | `solved < 8` | Kalan tahtalar yarı saydam "hayalet" olarak görünür |
| Kilit aşaması | `solved === 8` | Kilit periyodik olarak kıvılcımlanır, köpekte sarı ünlemler, hedef kutusu altın |
| Kurtarma | `status === 'rescued'` | Zaman çizelgesi (Bölüm 6) işler |
| Final | `rescueT > HUG_AT + 2.4` | Final ekranı açılır |

### 5.3 Olay akışı
```
onCorrect():
  solved++ ; cheerT = 1.4 ; ses: correct
  if solved <= 8 → addPlank() ; ses: plank
  if solved == 8 → 700 ms sonra ses: magic
  if solved == 9 → status = 'rescued' ; kurtarma zaman çizelgesini başlat
  else → 900 ms sonra newQuestion()

onWrong():
  sadT = 1.1 ; sıradaki hayalet tahta 0,5 sn titrer ; ses: wrong
  balon: "Hmm, bir daha deneyelim!" → 1,5 sn sonra eski mesaja döner
```

---

## 6. Sahne ve animasyon zamanlaması

### 6.1 Tahta ekleme
| Zaman | Olay |
|---|---|
| 0,00 sn | Tahta 3,2 birim yukarıda belirir, dönerek düşer |
| 0,20 sn | İlk temas (tok ahşap sesi) |
| 0,00–0,55 sn | Sekmeli iniş (`easeOutBounce`), dönüş sıfırlanır |
| 0,30–1,20 sn | Tahtanın etrafında toz bulutu genişleyip kaybolur |

Tahtalar kaşifin tarafından başlayarak kafese doğru dizilir. Köprü hafif sarkıktır: `y = -0.12 - 0.42 · sin(π · konum)`.

### 6.2 Kurtarma zaman çizelgesi (`rescueT`)
| Zaman | Olay |
|---|---|
| 0,00 sn | Büyük kıvılcım, kilit halkası açılır |
| 0,35 sn | Kilit kırılma sesi; kilit dönerek düşmeye başlar |
| 0,70 sn | Kapı kameraya doğru açılmaya başlar |
| 0,75 sn | Kapı gıcırtısı |
| 1,05 sn | Kilit yere düşer, kaybolur |
| 1,60 sn | Köpek "hav hav" der ve kafesten çıkar (`WALK_START`) |
| 1,60 sn → | Köprü boyunca yürüyüş, hız 3 birim/sn, her ~0,21 sn'de ayak sesi; kamera köpeği izler |
| `HUG_AT` | Sarılma: fanfar + havlama, kalpler ve konfeti |
| `HUG_AT + 2,4 sn` | Final ekranı |

`HUG_AT = WALK_START + yolUzunluğu / 3.0`

---

## 7. Karakter davranışları

### 7.1 Köpek
Mutluluk değeri: `happy = 0.1 + (placed / 8) · 0.8` (+0,2 sevinçte, −0,15 yanlış cevapta), kurtarmada 1.

| Mutluluk | İfade |
|---|---|
| ≤ 0,25 | Kaşlar üzgün eğimli, ağız aşağı kıvrık, kulaklar düşük, kuyruk aşağıda |
| > 0,4 | Gülümseme, kuyruk sallanmaya başlar |
| > 0,8 | Dil dışarıda, hızlı kuyruk sallama |

- **Kafeste bekleme:** hafif sallanma, köprüye ve kaşife bakma, ara ara göz kırpma.
- **Tahta gelince:** zıplama, kulak çırpma, köprüye dönme.
- **Kilit aşaması:** sürekli zıplama, başının üstünde ünlemler.
- **Yürüyüş:** çapraz bacak salınımı, hoplayarak ilerleme.
- **Sarılma:** arka ayaklar üstünde doğrulur, ön patiler havada, gözler mutlulukla kısılır.

### 7.2 Kaşif
- **Bekleme:** köprüye ve köpeğe bakar, ara ara el sallar.
- **Doğru cevap:** oyuncuya döner, iki kolu havada zıplar.
- **Kurtarma:** köpeğin gelişini izler, kollarını açar.
- **Sarılma:** kollarını köpeğe sarar, gözler kısılır, kalpler çıkar.

---

## 8. Arayüz (dikey ekran)

```
┌──────────────────────────┐
│ [3. Soru]   ▮▮▮▯▯▯▯▯ 🔒 🔊 │  ← HUD
│        [Köprüyü kur!]     │  ← tabela
│                          │
│     3D SAHNE (esnek)     │
│                          │
│        (balon + avatar) ─┤
├──────────────────────────┤
│ [ 13 ]        ⑦          │
│ İşlem:+  Adım:2  ⑧   ③   │  ← taş tablet
│ [8 + 5 = 13]  ⑩   ⑤      │
│                ⑥         │
└──────────────────────────┘
```

- **HUD:** soru etiketi, 8 tahta yuvası + kilit simgesi (🔒 → 🔓), ses düğmesi.
- **Tabela:** aşamaya göre metin.
- **Balon:** kaşifin avatarıyla konuşma metni.
- **Tablet:** solda hedef, etiketler ve denklem; sağda sayı halkası.
- Masaüstünde telefon çerçevesi içinde ortalanır.

### 8.1 Metinler
| Yer | Koşul | Metin |
|---|---|---|
| Tabela | 0–7 doğru | Köprüyü kur! |
| Tabela | 8 doğru | Kilidi aç! 🔑 |
| Tabela | 9 doğru | Kavuşma zamanı! |
| Balon | Başlangıç | Dayan dostum, sana köprü kuruyorum! |
| Balon | Ara doğrular | Bir tahta daha! / Harika gidiyoruz! / Süpersin! / Devam, devam! / Çok iyi! |
| Balon | 4 doğru | Köprünün yarısı tamam! |
| Balon | 7 doğru | Son tahta geliyor! |
| Balon | 8 doğru | Köprü hazır! Şimdi kilidi açalım. |
| Balon | 9 doğru | Kapı açıldı! Gel buraya dostum! |
| Balon | Sarılma | Kavuştuk! Seni çok özledim! |
| Balon | Yanlış cevap | Hmm, bir daha deneyelim! |
| Soru etiketi | 1–8 | `N. Soru` |
| Soru etiketi | 9 | Son soru |
| Final | — | 9 Soru, 1 Mutlu Son! 🐾 · Tekrar oyna |

---

## 9. Ses tasarımı

Sesler Web Audio API ile üretilir, ses dosyası gerekmez. Melodik sesler Do majör, tınılar yumuşak (triangle/sine). Ana çıkışta kompresör vardır. Ses bağlamı ilk dokunuşta başlatılır.

| Olay | Ses | Tanım |
|---|---|---|
| Sayı seçimi | `tap` | Kısa G5 "tık" |
| Doğru cevap | `correct` | C6 → E6 çan |
| Yanlış cevap | `wrong` | Yumuşak, alçalan iki "bup" (sert buzzer değil) |
| Tahta | `plank` | Havada vınlama → tok ahşap darbe (150→68 Hz) → küçük sekme → halat gıcırtısı |
| Köprü tamam | `magic` | C6-E6-G6-C7 arpej |
| Kilit kırılır | `lockBreak` | Metalik şıngırtı (1870/2730/3910 Hz) + parıltı + yere düşme |
| Kapı açılır | `doorCreak` | Titreşimli metal gıcırtı (190→285→160 Hz, 1,1 sn) + yumuşak çarpma |
| Köpek çıkar / sarılma | `bark` | İki kısa "hav" |
| Yürüyüş | `step` | Ahşapta tıpırtı, ~0,21 sn aralıkla |
| Sarılma | `fanfare` | C5-E5-G5-C6 arpej + akor + parıltı notaları |

Sessize alma: HUD'daki 🔊/🔇 düğmesi veya native taraftan `rescue.setMuted(true)`.

---

## 10. Çocuk dostu tasarım ilkeleri

- **Tehlike yok:** Hayvan hiçbir zaman boğulma, düşme gibi bir tehlikeyle gösterilmez. İlk konseptteki yükselen su mekaniği bu nedenle köprü kurma mekaniğiyle değiştirildi.
- **Emek kaybolmaz:** Yanlış cevap ilerlemeyi geri almaz, süre baskısı yoktur.
- **Başarısızlık yerine teşvik:** Yanlış cevapta kaşif cesaret verir.
- **Görünür ilerleme:** Hayalet tahtalar ve HUD yuvaları ne kadar kaldığını gösterir.
- **Her zaman mutlu son.**

Süre eklenecekse: süre bitince "Biraz daha!" ekranı gösterilmeli, köprü korunmalı ve oyuncu kaldığı yerden yeni süreyle devam etmelidir.

---

## 11. Teknik mimari

### 11.1 Teknoloji
- **Vite + Vue 3 + TypeScript** (statik SPA; SSR gerekmediği için Nuxt kullanılmaz)
- **three.js** (sahne, ışık, gölge, animasyon)
- Web Audio API (sesler)

### 11.2 Klasör yapısı
```
rescue-scene/
├─ index.html
├─ vite.config.ts            # base: './'
├─ public/
│  └─ models/                # puppy.glb, explorer.glb
└─ src/
   ├─ main.ts
   ├─ App.vue                # düzen: sahne + tablet
   ├─ config.ts              # CFG (tahta sayısı, aralıklar, süreler)
   ├─ game/
   │  ├─ state.ts            # GameState, onCorrect / onWrong / start
   │  ├─ questions.ts        # soru üretimi ve doğrulama
   │  └─ timeline.ts         # kurtarma zaman sabitleri
   ├─ scene/
   │  ├─ GameScene.ts        # renderer, kamera, döngü (Vue reaktivitesi dışında)
   │  ├─ environment.ts      # kanyon, bitkiler, harabe, gökyüzü
   │  ├─ bridge.ts           # köprü, tahtalar, toz
   │  ├─ cage.ts             # kafes, kapı, kilit, kıvılcım
   │  ├─ puppy.ts            # model yükleme + davranış
   │  └─ explorer.ts         # model yükleme + davranış
   ├─ audio/sfx.ts           # Snd modülü
   ├─ native/bridge.ts       # web ↔ native mesajlaşma
   └─ components/
      ├─ Hud.vue
      ├─ SpeechBubble.vue
      ├─ PuzzleTablet.vue
      ├─ NumberRing.vue
      └─ FinaleOverlay.vue
```

**İlke:** Oyun döngüsü ve three.js nesneleri `GameScene` sınıfında, Vue reaktivitesinin dışında durur. Vue yalnızca arayüz durumunu (soru, ilerleme, metinler) gösterir. İkisi küçük bir olay arayüzüyle haberleşir.

### 11.3 Yapılandırma
```ts
export const CFG = {
  planks: 8,             // köprü tahtası = köprü sorusu sayısı
  numberRange: [2, 12],
  ringSize: 6,
  steps: 2,
  operation: '+',
  nextQuestionDelayMs: 900,
  walkSpeed: 3.0,
}
```

---

## 12. Native köprü (Android & iOS)

### 12.1 Web → native olayları
Tüm mesajlar JSON string olarak gönderilir.

| `evt` | Ek alanlar | Ne zaman |
|---|---|---|
| `start` | — | Oyun (yeniden) başladığında |
| `progress` | `solved`, `planks`, `total` | Her doğru cevapta |
| `rescued` | — | 9. doğru cevapta |

```ts
// src/native/bridge.ts
export function sendToNative(evt: string, data: object = {}) {
  const msg = JSON.stringify({ evt, ...data })
  const w = window as any
  if (w.AndroidBridge?.postMessage) w.AndroidBridge.postMessage(msg)
  else if (w.webkit?.messageHandlers?.rescue) w.webkit.messageHandlers.rescue.postMessage(msg)
  else if (window.parent !== window) window.parent.postMessage(msg, '*')
}
```

### 12.2 Native → web metotları
`window.rescue` nesnesi üzerinden:

| Metot | Açıklama |
|---|---|
| `start()` | Sahneyi sıfırlar ve başlatır |
| `onCorrect()` | Doğru cevap bildirimi |
| `onWrong()` | Yanlış cevap bildirimi |
| `setMuted(bool)` | Sayfa seslerini açar/kapatır |
| `state` / `config` | Okuma amaçlı durum ve ayarlar |

### 12.3 Gömülü mod
Sayfa `?embed=1` ile açılırsa tablet (bulmaca) gizlenir, sadece 3D sahne görünür. Bu modda soruları native uygulama gösterir ve sonucu `onCorrect()` / `onWrong()` ile bildirir.

### 12.4 Android
```kotlin
val assetLoader = WebViewAssetLoader.Builder()
    .addPathHandler("/assets/", WebViewAssetLoader.AssetsPathHandler(context))
    .build()

webView.webViewClient = object : WebViewClientCompat() {
    override fun shouldInterceptRequest(view: WebView, request: WebResourceRequest) =
        assetLoader.shouldInterceptRequest(request.url)
}
webView.settings.apply {
    javaScriptEnabled = true
    mediaPlaybackRequiresUserGesture = false
}
webView.addJavascriptInterface(object {
    @JavascriptInterface fun postMessage(json: String) { /* olayları işle */ }
}, "AndroidBridge")
webView.loadUrl("https://appassets.androidplatform.net/assets/rescue/index.html?embed=1")

// cevap sonucu:
webView.evaluateJavascript(if (isCorrect) "rescue.onCorrect()" else "rescue.onWrong()", null)
```
`file://` yerine `WebViewAssetLoader` kullanılmalıdır; aksi halde `.glb` model ve ses yüklemelerinde CORS hatası alınır.

### 12.5 iOS
```swift
let config = WKWebViewConfiguration()
config.mediaTypesRequiringUserActionForPlayback = []
config.userContentController.add(self, name: "rescue")   // WKScriptMessageHandler
let webView = WKWebView(frame: .zero, configuration: config)

let dir = Bundle.main.url(forResource: "rescue", withExtension: nil)!
let url = dir.appendingPathComponent("index.html")
var comps = URLComponents(url: url, resolvingAgainstBaseURL: false)!
comps.queryItems = [URLQueryItem(name: "embed", value: "1")]
webView.loadFileURL(comps.url!, allowingReadAccessTo: dir)

func userContentController(_ c: WKUserContentController, didReceive m: WKScriptMessage) {
    // m.body: JSON string
}
webView.evaluateJavaScript(isCorrect ? "rescue.onCorrect()" : "rescue.onWrong()")
```

### 12.6 WebView ayarları
- CSS: `user-select: none`, `touch-action: manipulation`, `overscroll-behavior: none`
- Yakınlaştırma kapalı: `<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">`
- Çentikli ekranlar için `env(safe-area-inset-*)` boşlukları

---

## 13. 3D model hattı

| Kriter | Hedef |
|---|---|
| Format | GLB (dokular gömülü) |
| Poligon | 10–30 bin üçgen / karakter |
| Doku | 1024–2048 px |
| Boyut | < 10 MB / karakter |
| Kaynak | Meshy (görselden 3D); gerekirse Blender'da düzeltme |

**Animasyonlar:**
- **Kaşif** (insan formu, otomatik rig uygun): bekleme, el sallama, sevinç, yürüme, sarılma.
- **Köpek** (dört ayaklı; otomatik rig desteklenmeyebilir): bekleme, zıplama, yürüme, şahlanma. Rig yoksa animasyon kodla yapılır: gövde sallanması, zıplama, hoplayarak yürüme, eğilme.

**Yükleme:** three.js `GLTFLoader`. Model yüklenemezse prosedürel (kodla üretilmiş) karakter yedek olarak kullanılır.

---

## 14. Performans

- `renderer.setPixelRatio(Math.min(devicePixelRatio, 2))`
- Gölge haritası 2048 px; düşük kalite modunda 1024 px veya gölgeler kapalı.
- Çim tutamları `InstancedMesh` ile tek çizim çağrısında.
- Kare süresi 0,1 sn ile sınırlanır (arka plandan dönüşte sıçrama olmaz).
- Hedef: orta seviye cihazlarda 60 FPS, düşük seviyede ≥ 30 FPS.

---

## 15. Açık konular

- [ ] Meshy'den köpek ve kaşif GLB dosyalarının alınması ve entegrasyonu
- [ ] Halkada birden fazla doğru çift olmasına izin verilecek mi?
- [ ] Yaş gruplarına göre zorluk seviyeleri (sayı aralığı, işlem türü, adım sayısı)
- [ ] Opsiyonel süre modu ("Biraz daha!" ile devam)
- [ ] Diğer hayvanlar için yeni kurtarma sahneleri (kedi, tavşan vb.) ve ortak sahne altyapısı
- [ ] Native tarafta özel ses dosyaları kullanılacak mı, yoksa web sesleri mi?
- [ ] Düşük kalite modu için cihaz algılama
