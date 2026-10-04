# Dostuna Köprü Kur — 9 Soru, 1 Mutlu Son

Kaşif ve dostu: köprü kurtarma sahnesi. Vue 3 + Vite + TypeScript + three.js.
Tasarım ve teknik doküman: `public/kopru-kurtarma-oyun-dokumani.md`. Orijinal tek dosyalık demo: `public/Dostuna Köprü Kur — 9 Soru, 1 Mutlu Son.html`.

## Komutlar

```bash
npm run dev         # geliştirme sunucusu (ağdaki cihazlardan da erişilebilir)
npm run build       # tip kontrolü (vue-tsc) + production build -> dist/
npm run build:embed # native WebView için tek dosya -> dist-embed/index.html
npm run preview     # build çıktısını yerel olarak sun
```

`?embed=1` ile açılırsa tablet (bulmaca) gizlenir; soruları native uygulama gösterir ve
sonucu `rescue.onCorrect()` / `rescue.onWrong()` / `rescue.onHint()` ile bildirir (doküman §12).

## Native WebView için gömülü build

`build:embed` tek bir `index.html` üretir: JS ve CSS satır içi gömülür, harici font/ikon
istekleri kaldırılır, `window.RESCUE_EMBED = true` bayrağı dosyaya işlenir. Böylece sahne
`file://` altında (WebView) hiç istek yapmadan, çevrimdışı ve sorgu dizesine ihtiyaç
duymadan gömülü modda açılır — modül script'i `file://` kaynağından fetch edilemediği için
bu şart. Script çıktının bütünlüğünü de doğrular (gömülen kod kaynağıyla birebir mi,
HTML'de yerel dosya isteği kaldı mı).

Tüketen uygulama: `tecvid_elifba_pro` → `tools/sync_rescue_scene.sh` bu çıktıyı
`app/src/main/assets/rescue/index.html` olarak kopyalar.

### Ödül ekranı akışı (`rescue.replay`)

Native oyun sahneyi oyun sırasında göstermiyorsa (ödül ekranı yaklaşımı), olayları
biriktirip tek seferde oynatır:

```js
rescue.replay(['correct', 'wrong', 'correct', 'hint', ...], { stagger: 320 })
```

`replay` sahneyi sıfırlar, sonra günlüğü sırayla uygular: tahtalar kurulur, aradaki yanlış
denemeler ve ipuçları hikâyeye girer, 9. `correct` kilidi açıp kurtarmayı başlatır. Sahne
`ready` (API kurulu), `progress`, `rescued` ve `finale` olaylarını native tarafa bildirir.

## Yapı

```
src/
  main.ts                 Pinia + router + mount
  App.vue                 <RouterView>
  config.ts               CFG (tahta sayısı, aralıklar, süreler), EMBED, REDUCE_MOTION
  game/
    state.ts              Pinia store: solved/placed/status, soru, seçim, metinler
    questions.ts          soru üretimi ve doğrulama
    messages.ts           tabela, balon, etiket metinleri (§8.1)
    timeline.ts           kurtarma zaman sabitleri (§6)
    types.ts              SceneHandle / SceneEvent — Vue ↔ sahne olay arayüzü
  scene/
    GameScene.ts          renderer, kamera, döngü, zaman çizelgesi olayları (Vue reaktivitesi dışında)
    layout.ts             sahne koordinat sabitleri (köprü, kafes, ev konumları)
    environment.ts        kanyon, bitkiler, harabe, dağlar, bulutlar
    bridge.ts             direkler, halatlar, hayalet/gerçek tahtalar, toz
    cage.ts               kafes, kapı, kilit, kıvılcım
    puppy.ts              prosedürel köpek + davranış
    explorer.ts           prosedürel kaşif + davranış
    confetti.ts           sarılma konfetisi
    helpers.ts            C, M, adder, lerp, easeOutBounce
  audio/sfx.ts            Web Audio sesleri (§9) — dosya yok
  native/bridge.ts        sendToNative + window.rescue API (§12), replay olay tipleri
  components/             Hud, SpeechBubble, PuzzleTablet, NumberRing, FinaleOverlay
  views/GameView.vue      sahne + tablet düzeni, olay bağlama, kalpler
```

**İlke:** Oyun döngüsü ve three.js nesneleri `GameScene` içinde durur. Store sahneye
`SceneHandle` metotlarıyla komut verir (`addPlank`, `cheer`, `sad`, `startRescue`); sahne
zaman çizelgesi olaylarını (`lockBreak`, `doorCreak`, `bark`, `step`, `hug`, `finale`)
geri bildirir, ses ve arayüz bunlara bağlanır.

## Notlar

- **three r186**: demo r128 kullanıyordu. `outputEncoding`/`convertSRGBToLinear` yerine
  three'nin otomatik renk yönetimi; `PCFSoftShadowMap` kaldırıldığı için `PCFShadowMap`.
- **Router** hash history kullanır, `base: './'` ile WebView'da `file://`/asset loader
  üzerinden de çalışır.
- **Tailwind** kurulu ama oyun arayüzü demonun kendi CSS'ini (scoped) kullanıyor;
  tahta/taş görünümünü utility'lere çevirmek görsel riski değmezdi.
- **Karakterler** prosedürel. GLB modeller gelince `puppy.ts` / `explorer.ts` içindeki
  `create*` fonksiyonları GLTFLoader ile değişir, `update*` davranışları kalır (§13).
- Baloo 2 fontu Google Fonts'tan geliyor; çevrimdışı WebView için self-host edilmeli.
