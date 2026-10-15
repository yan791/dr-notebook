// Percorre a página inteira tirando capturas da tela, para revisão.
// node pagina.mjs <url> <pasta> [largura] [altura] [--movel] [--desde=y] [--passo=fração] [--clique=seletor]
import puppeteer from 'puppeteer-core'
import { mkdirSync } from 'node:fs'
import { join } from 'node:path'

const args = process.argv.slice(2)
const pos = args.filter((a) => !a.startsWith('--'))
const opt = Object.fromEntries(args.filter((a) => a.startsWith('--')).map((a) => { const [k, v] = a.slice(2).split('='); return [k, v ?? true] }))
const [url, pasta, w = '1440', h = '900'] = pos
const movel = Boolean(opt.movel)
mkdirSync(pasta, { recursive: true })

const browser = await puppeteer.launch({
  executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe',
  headless: 'new',
  args: ['--use-angle=d3d11', '--enable-gpu', '--ignore-gpu-blocklist', '--hide-scrollbars'],
})
const page = await browser.newPage()
await page.setViewport({ width: +w, height: +h, deviceScaleFactor: 1, isMobile: movel, hasTouch: movel })
const erros = []
page.on('console', (m) => (m.type() === 'error' || m.type() === 'warning') && erros.push(m.type() + ': ' + m.text().slice(0, 300)))
page.on('pageerror', (e) => erros.push('pageerror: ' + String(e)))
await page.goto(url, { waitUntil: 'networkidle0' })
await new Promise((r) => setTimeout(r, 2500))
if (opt.clique) {
  for (const sel of String(opt.clique).split('|')) {
    await page.click(sel).catch((e) => erros.push('clique ' + sel + ': ' + e.message))
    await new Promise((r) => setTimeout(r, 500))
  }
}
const total = await page.evaluate(() => document.documentElement.scrollHeight)
const passo = Math.round(+h * Number(opt.passo ?? 0.9))
let n = 0
for (let y = Number(opt.desde ?? 0); y < total; y += passo) {
  await page.evaluate((y) => window.scrollTo(0, y), y)
  await new Promise((r) => setTimeout(r, 1300))
  await page.screenshot({ path: join(pasta, `${String(n++).padStart(2, '0')}.jpg`), type: 'jpeg', quality: 72 })
}
console.log(JSON.stringify({ total, n, erros: [...new Set(erros)] }))
await browser.close()
