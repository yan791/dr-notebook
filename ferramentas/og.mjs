// Gera a imagem de compartilhamento (og.png, 1200x630) e o ícone da tela inicial
// (apple-touch-icon.png, 180x180) a partir do primeiro quadro do hero 3D.
// node og.mjs <url-do-site> <pasta-public>
import puppeteer from 'puppeteer-core'
import { readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

const [url, publico] = process.argv.slice(2)
const browser = await puppeteer.launch({
  executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe',
  headless: 'new',
  args: ['--use-angle=d3d11', '--enable-gpu', '--ignore-gpu-blocklist', '--hide-scrollbars'],
})
const page = await browser.newPage()

// 1) o quadro final do hero (o batimento de volta), sem a interface por cima
await page.setViewport({ width: 1200, height: 630, deviceScaleFactor: 1 })
await page.goto(url, { waitUntil: 'networkidle0' })
await page.waitForFunction(() => document.querySelector('.hs--pronto'), { timeout: 30000 })
await page.evaluate(() => {
  const s = document.querySelector('.historia')
  window.scrollTo(0, s.offsetTop + (s.offsetHeight - innerHeight) * 1)
})
await new Promise((r) => setTimeout(r, 2600))
await page.addStyleTag({ content: '.cabecalho,.hs-faixa,.hs-cap,.hs-pular,.hs-dica,.hs-hud,.hs-vinheta{display:none!important}' })
await new Promise((r) => setTimeout(r, 300))
const fundo = await page.screenshot({ type: 'png', encoding: 'base64' })

// 2) monta a arte: o quadro à direita, a logo e a frase à esquerda
const logo = readFileSync(join(publico, '..', 'src', 'marca', 'logo-geometria.ts'), 'utf8')
const pega = (k) => logo.match(new RegExp(`${k}: "([^"]+)"`))[1]
const letras = ['dr', 'noteb', 'k'].map(pega)
const svgLogo = `<svg viewBox="-1 -105.5 620.1 121.5" width="380"><defs><linearGradient id="g" gradientUnits="userSpaceOnUse" x1="-1" x2="619.1"><stop offset="0" stop-color="#fff"/><stop offset="1" stop-color="#9cc2ff"/></linearGradient></defs>
<g fill="none" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"><path d="${pega('estetoscopio')}" stroke="#5cc6f2"/><path d="${pega('tela')}" stroke="#8597c2"/><path d="${pega('base')}" stroke="#8597c2"/><path d="${pega('batimento')}" stroke="url(#g)"/></g>
<g fill="url(#g)"><path d="${pega('moldura')}"/>${letras.map((d) => `<path d="${d}"/>`).join('')}</g><circle cx="579.6" cy="-98" r="4.5" fill="#5cc6f2"/><circle cx="611.6" cy="-98" r="4.5" fill="#5cc6f2"/></svg>`
const arte = `<!doctype html><html><head><meta charset="utf-8"><style>
@font-face{font-family:J;src:url(${pathFonte()}) format('woff2');font-weight:200 800}
*{margin:0;box-sizing:border-box}body{width:1200px;height:630px;overflow:hidden;font-family:J,sans-serif;background:#040d22;color:#f3f6fc}
.f{position:absolute;inset:0;background:url(data:image/png;base64,${fundo}) 240px 0/cover no-repeat}
.v{position:absolute;inset:0;background:linear-gradient(90deg,#040d22 0%,rgba(4,13,34,.92) 34%,rgba(4,13,34,0) 66%)}
.t{position:absolute;left:64px;top:70px;width:560px}
h1{margin-top:70px;font-size:64px;line-height:1;font-weight:800;letter-spacing:-.04em}
h1 span{background:linear-gradient(100deg,#7fb2ff,#5cc6f2 70%);-webkit-background-clip:text;color:transparent}
p{margin-top:26px;font-size:24px;line-height:1.4;color:#a7b6d3}
.r{position:absolute;left:64px;bottom:58px;display:flex;gap:14px;font-size:20px;font-weight:700;color:#f3f6fc}
.r i{font-style:normal;color:#5cc6f2}
</style></head><body><div class="f"></div><div class="v"></div><div class="t">${svgLogo}<h1>Não resolve no martelo. <span>Resolve na técnica.</span></h1><p>Assistência técnica em Maceió desde 2005. Orçamento grátis pelo WhatsApp.</p></div><div class="r"><i>4,8 no Google</i> · 186 avaliações · Jatiúca, Maceió</div></body></html>`
function pathFonte() {
  return 'file:///' + join(publico, '..', 'node_modules', '@fontsource-variable', 'plus-jakarta-sans', 'files', 'plus-jakarta-sans-latin-wght-normal.woff2').replace(/\\/g, '/')
}
const arquivoArte = join(publico, '..', '..', 'ferramentas', 'og-arte.html')
writeFileSync(arquivoArte, arte)
await page.goto('file:///' + arquivoArte.replace(/\\/g, '/'), { waitUntil: 'load' })
await new Promise((r) => setTimeout(r, 600))
await page.screenshot({ path: join(publico, 'og.jpg'), type: 'jpeg', quality: 84 })

// 3) ícone da tela inicial: o mesmo desenho do favicon, grande
await page.setViewport({ width: 180, height: 180, deviceScaleFactor: 1 })
const icone = readFileSync(join(publico, 'icone.svg'), 'utf8').replace('<svg ', '<svg width="180" height="180" ')
await page.setContent(`<html><body style="margin:0;background:#061430">${icone.replace(/rx="7"/, 'rx="0"')}</body></html>`)
await page.screenshot({ path: join(publico, 'apple-touch-icon.png'), type: 'png' })
console.log('ok')
await browser.close()
