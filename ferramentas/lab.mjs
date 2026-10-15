// Captura o laboratório: rola até ele, espera a abertura e fotografa cada procedimento.
// node lab.mjs <url> <pasta> [largura] [altura] [--movel]
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
await new Promise((r) => setTimeout(r, 1500))
// chega perto (carrega a cena) e depois entra na seção
await page.evaluate(() => window.scrollTo(0, document.querySelector('#reparo-em-placa').offsetTop - innerHeight * 1.5))
await new Promise((r) => setTimeout(r, 2500))
await page.evaluate(() => window.scrollTo(0, document.querySelector('#reparo-em-placa').offsetTop))
await new Promise((r) => setTimeout(r, 1200))
await page.screenshot({ path: join(pasta, '0-abrindo.jpg'), type: 'jpeg', quality: 78 })
await new Promise((r) => setTimeout(r, 4800))
let n = 1
for (const t of ['Reballing', 'Regravação de BIOS', 'Recuperação de dados', 'Placa-mãe e placa de vídeo']) {
  await page.evaluate((t) => [...document.querySelectorAll('.lab-item')].find((b) => b.querySelector('.lab-item-titulo').textContent === t)?.click(), t)
  await new Promise((r) => setTimeout(r, 1600))
  await page.screenshot({ path: join(pasta, `${n++}.jpg`), type: 'jpeg', quality: 78 })
}
console.log(JSON.stringify({ erros: [...new Set(erros)] }))
await browser.close()
