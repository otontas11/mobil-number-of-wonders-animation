// Tek dosyalık gömülü build (doküman §12.3, §12.4).
//
// Native WebView sahneyi `file://` üzerinden açar; o kaynakta modül script'i ve
// harici CSS fetch edilemez (origin "null" → CORS). Bu yüzden JS ve CSS tek bir
// index.html içine gömülür: çalışma anında hiç ağ/dosya isteği kalmaz, sahne
// çevrimdışı açılır. Çıktı: dist-embed/index.html
//
// Ek dosya kurmaya gerek yok; yalnızca projede zaten bulunan vite kullanılır.

import { readFile, rm, stat, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { build } from 'vite'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const outDir = path.join(root, 'dist-embed')
const htmlFile = path.join(outDir, 'index.html')

await rm(outDir, { recursive: true, force: true })

await build({
  root,
  configFile: path.join(root, 'vite.config.ts'),
  logLevel: 'warn',
  build: {
    outDir,
    emptyOutDir: true,
    // tek CSS, tek JS: aşağıda ikisi de HTML'e gömülecek
    cssCodeSplit: false,
    // küçük varlıklar (favicon vb.) data URL olarak gömülsün
    assetsInlineLimit: 100 * 1024 * 1024,
    rollupOptions: {
      // router GameView'ı dinamik import ediyor; tek parça olmazsa WebView
      // çalışma anında dosya istemek zorunda kalır. (build.codeSplitting
      // seçeneği vite 8.3'te bu birleştirmeyi yapmıyor, bu yüzden burada.)
      output: { inlineDynamicImports: true },
    },
  },
})

let html = await readFile(htmlFile, 'utf8')

/** Gömülen kod içinde kapanış etiketi HTML ayrıştırıcısını yanıltmasın. */
const guard = (code, tag) => code.replaceAll(`</${tag}`, `<\\/${tag}`)

const readAsset = async (href) => {
  const file = path.join(outDir, href.replace(/^\.?\//, ''))
  return readFile(file, 'utf8')
}

// Değiştirme hep fonksiyonla yapılır: gömülen kodda geçen `$&`, `$1` gibi
// diziler replace tarafından yorumlanıp bundle'ı bozmasın.
const inline = (tag, markup) => {
  html = html.replace(tag, () => markup)
}

// <script type="module" src="./assets/index-*.js"> → satır içi modül
const scriptTags = [...html.matchAll(/<script[^>]*\ssrc="([^"]+)"[^>]*><\/script>/g)]
for (const [tag, href] of scriptTags) {
  if (/^https?:/.test(href)) continue
  const code = guard(await readAsset(href), 'script')
  inline(tag, `<script type="module">\n${code}\n</script>`)
}

// <link rel="stylesheet" href="./assets/index-*.css"> → satır içi stil
const styleTags = [...html.matchAll(/<link[^>]*rel="stylesheet"[^>]*>/g)]
for (const tag of styleTags) {
  const href = /href="([^"]+)"/.exec(tag)?.[1]
  if (!href || /^https?:/.test(href)) continue
  const css = guard(await readAsset(href), 'style')
  inline(tag, `<style>\n${css}\n</style>`)
}

// Çevrimdışı açılışta asılı kalmasın: harici font/ikon istekleri kaldırılır.
// style.css'teki yedek font yığını (Trebuchet MS, system-ui) devreye girer.
html = html
  .replace(/<link[^>]*fonts\.(googleapis|gstatic)\.com[^>]*>\s*/g, '')
  .replace(/<link[^>]*rel="icon"[^>]*>\s*/g, '')

// Bayraklar dosyaya işlenir: native taraf `?embed=1` sorgu dizesine veya
// zamanlaması belirsiz script enjeksiyonuna muhtaç kalmaz (doküman §12.3).
// Uygulama kodundan önce çalışmalı, bu yüzden <head> başına yazılır.
//   RESCUE_EMBED  : bulmaca tableti gizli, soruları native sorar
//   RESCUE_CHROME : sahne kendi arayüzünü (HUD/tabela/balon) çizmez — oyunun
//                   arkasında arka plan olarak çalıştığı için metinleri oyun gösterir
const flags = '<script>window.RESCUE_EMBED = true; window.RESCUE_CHROME = false</script>'
html = html.replace(/<head>/, () => `<head>\n    ${flags}`)

await writeFile(htmlFile, html, 'utf8')

// Doğrulama: gömülen kod kaynağıyla bire bir aynı mı? (replace'in `$&`/`$1`
// kalıplarını yorumlaması bundle'ı sessizce bozabiliyor.)
const written = await readFile(htmlFile, 'utf8')
const unguard = (code, tag) => code.replaceAll(`<\\/${tag}`, `</${tag}`)
for (const [tag, href] of scriptTags) {
  const embedded = /<script type="module">\n([\s\S]*?)\n<\/script>/.exec(written)?.[1]
  if (embedded === undefined) throw new Error('satır içi script bulunamadı')
  if (unguard(embedded, 'script') !== (await readAsset(href))) {
    throw new Error(`gömülen JS kaynağından farklı: ${href}`)
  }
  if (written.includes(tag)) throw new Error(`dış script etiketi kaldı: ${href}`)
}
if (/<script[^>]*\ssrc="(?!https?:)/.test(written) || /<link[^>]*href="\.?\//.test(written)) {
  throw new Error('HTML hâlâ yerel bir dosya istiyor; tek dosya bütünlüğü bozuldu')
}

const { size } = await stat(htmlFile)
console.log(
  `dist-embed/index.html hazır — ${(size / 1024).toFixed(0)} kB (tek dosya, harici istek yok)`,
)
