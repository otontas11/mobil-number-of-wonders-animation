# Dostuna Köprü Kur — 9 Soru, 1 Mutlu Son

Kaşif ve dostu: köprü kurtarma sahnesi. Vue 3 + Vite + TypeScript + three.js.
Tasarım ve teknik doküman: `public/kopru-kurtarma-oyun-dokumani.md`. Orijinal tek dosyalık demo: `public/Dostuna Köprü Kur — 9 Soru, 1 Mutlu Son.html`.

## Komutlar

```bash
npm run dev      # geliştirme sunucusu (ağdaki cihazlardan da erişilebilir)
npm run build    # tip kontrolü (vue-tsc) + production build -> dist/
npm run preview  # build çıktısını yerel olarak sun
```

`?embed=1` ile açılırsa tablet (bulmaca) gizlenir; soruları native uygulama gösterir ve
sonucu `rescue.onCorrect()` / `rescue.onWrong()` ile bildirir (doküman §12).

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
  native/bridge.ts        sendToNative + window.rescue API (§12)
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
