// Mede a fluidez da rolagem: rola a página com a roda do mouse (como uma pessoa) e anota o
// intervalo entre quadros em cada trecho. node fluidez.mjs <url> [largura] [altura] [--movel]
import puppeteer from 'puppeteer-core'

const args = process.argv.slice(2)
const pos = args.filter((a) => !a.startsWith('--'))
const movel = args.includes('--movel')
const [url, largura = '1440', altura = '900'] = pos

const browser = await puppeteer.launch({
  executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe',
  headless: true,
  args: ['--use-angle=d3d11', '--enable-gpu', '--ignore-gpu-blocklist', '--hide-scrollbars'],
})
const page = await browser.newPage()
const erros = []
page.on('pageerror', (e) => erros.push(`[pageerror] ${e.message}`))
await page.setViewport({ width: +largura, height: +altura, deviceScaleFactor: 1, isMobile: movel, hasTouch: movel })

await page.goto(url, { waitUntil: 'networkidle0', timeout: 60000 })
await new Promise((r) => setTimeout(r, 2500))
if (args.includes('--sem-blur')) await page.addStyleTag({ content: '.cabecalho{backdrop-filter:none!important;-webkit-backdrop-filter:none!important}' })

await page.evaluate(() => {
  const w = window
  w.__quadros = []
  let ultimo = performance.now()
  const passo = (t) => {
    w.__quadros.push([t - ultimo, scrollY])
    ultimo = t
    requestAnimationFrame(passo)
  }
  requestAnimationFrame(passo)
})

const total = await page.evaluate(() => document.documentElement.scrollHeight - innerHeight)
await page.mouse.move(+largura / 2, +altura / 2)
const inicio = Date.now()
while ((await page.evaluate(() => scrollY)) < total - 50 && Date.now() - inicio < 120000) {
  await page.mouse.wheel({ deltaY: 120 })
  await new Promise((r) => setTimeout(r, 45))
}
await new Promise((r) => setTimeout(r, 1500))

const relatorio = await page.evaluate(() => {
  const secoes = [...document.querySelectorAll('main > section, main > div, footer')].map((s) => {
    const r = s.getBoundingClientRect()
    return { id: s.id || s.className.split(' ')[0], de: r.top + scrollY, ate: r.bottom + scrollY }
  })
  const porSecao = secoes.map((s) => {
    const q = window.__quadros.filter(([, y]) => y + innerHeight / 2 >= s.de && y + innerHeight / 2 < s.ate).map(([d]) => d)
    if (!q.length) return null
    q.sort((a, b) => a - b)
    const media = q.reduce((a, b) => a + b, 0) / q.length
    return { secao: s.id, quadros: q.length, media: +media.toFixed(1), p95: +q[Math.floor(q.length * 0.95)].toFixed(1), pior: +q[q.length - 1].toFixed(1), acima33: q.filter((d) => d > 33).length }
  })
  return porSecao.filter(Boolean)
})
console.table(relatorio)
console.log('historia:', JSON.stringify(await page.evaluate(() => window.__historia?.get())))
if (erros.length) console.log(erros.join('\n'))
await browser.close()
