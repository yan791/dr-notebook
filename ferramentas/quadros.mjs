// Captura o hero em vários pontos da história (progresso p de 0 a 1), com GPU.
// node quadros.mjs <url> <pasta> [largura] [altura] [p1,p2,...] [--movel]
import puppeteer from 'puppeteer-core'
import { mkdirSync } from 'node:fs'
import { join } from 'node:path'

const args = process.argv.slice(2)
const pos = args.filter((a) => !a.startsWith('--'))
const movel = args.includes('--movel')
const [url, pasta, w = '1440', h = '900', lista = '0,0.1,0.3,0.4,0.55,0.66,0.72,0.8,0.92,1'] = pos
mkdirSync(pasta, { recursive: true })

const browser = await puppeteer.launch({
  executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe',
  headless: 'new',
  args: ['--use-angle=d3d11', '--enable-gpu', '--ignore-gpu-blocklist', '--hide-scrollbars'],
})
const page = await browser.newPage()
await page.setViewport({ width: +w, height: +h, deviceScaleFactor: 1, isMobile: movel, hasTouch: movel })
const erros = []
page.on('console', (m) => m.type() === 'error' && erros.push(m.text()))
page.on('pageerror', (e) => erros.push(String(e)))
await page.goto(url, { waitUntil: 'networkidle0' })
await page.waitForFunction(() => document.querySelector('.hs--pronto'), { timeout: 30000 }).catch(() => erros.push('3D não ficou pronto'))
await new Promise((r) => setTimeout(r, 2200))

for (const p of lista.split(',').map(Number)) {
  await page.evaluate((p) => {
    const s = document.querySelector('.historia')
    const curso = s.offsetHeight - innerHeight
    const y = s.offsetTop + curso * p
    window.scrollTo(0, y)
  }, p)
  await new Promise((r) => setTimeout(r, 1600))
  await page.screenshot({ path: join(pasta, `p${String(Math.round(p * 100)).padStart(3, '0')}.jpg`), type: 'jpeg', quality: 78 })
}
console.log(JSON.stringify({ erros }))
await browser.close()
