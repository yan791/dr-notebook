// Captura a recepção em vários estados: escolhe aparelho e sintoma e fotografa.
// node recepcao.mjs <url> <pasta> [largura] [altura] [--movel]
import puppeteer from 'puppeteer-core'
import { mkdirSync } from 'node:fs'
import { join } from 'node:path'

const args = process.argv.slice(2)
const pos = args.filter((a) => !a.startsWith('--'))
const movel = args.includes('--movel')
const [url, pasta, w = '1440', h = '900'] = pos
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
await page.waitForFunction(() => document.querySelector('.rc--pronto'), { timeout: 30000 }).catch(() => erros.push('3D não ficou pronto'))
await new Promise((r) => setTimeout(r, 1800))
await page.screenshot({ path: join(pasta, '0-inicio.jpg'), type: 'jpeg', quality: 78 })
const passos = [
  ['Notebook', 'Não liga'],
  ['Notebook', 'Esquenta e desliga sozinho'],
  ['MacBook ou iMac', 'Tela com defeito'],
  ['Celular', 'Câmera, microfone ou alto-falante'],
  ['Celular', 'Não carrega'],
  ['PC gamer', 'Liga mas não dá vídeo'],
  ['Videogame', 'Esquenta e desliga'],
  ['Drone', 'Caiu ou bateu'],
]
let n = 1
for (const [ap, si] of passos) {
  await page.evaluate((ap) => [...document.querySelectorAll('.rc-aparelho')].find((b) => b.textContent.trim() === ap)?.click(), ap)
  await new Promise((r) => setTimeout(r, 900))
  await page.evaluate((si) => [...document.querySelectorAll('.rc-sintoma')].find((b) => b.textContent.trim() === si)?.click(), si)
  await new Promise((r) => setTimeout(r, 1700))
  await page.screenshot({ path: join(pasta, `${n++}-${ap.split(' ')[0]}.jpg`), type: 'jpeg', quality: 78 })
}
const link = await page.evaluate(() => document.querySelector('.rc-enviar')?.href)
console.log(JSON.stringify({ erros: [...new Set(erros)], link: decodeURIComponent(link?.split('text=')[1] ?? '') }))
await browser.close()
