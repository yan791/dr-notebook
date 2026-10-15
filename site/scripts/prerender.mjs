// Gera o HTML de cada página a partir do build do servidor (dist-ssr) e do modelo
// (dist/index.html). Roda no fim do "npm run build".
import { mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const raiz = join(dirname(fileURLToPath(import.meta.url)), '..')
const dist = join(raiz, 'dist')
const modelo = readFileSync(join(dist, 'index.html'), 'utf8')
const { render, rotas, sitemap, robots } = await import(pathToFileURL(join(raiz, 'dist-ssr', 'servidor.js')).href)

for (const r of rotas) {
  const { html, head } = render(r)
  const pagina = modelo.replace('<!--cabeca-->', head).replace('<!--app-->', html)
  const destino = r === '404' ? join(dist, '404.html') : join(dist, r, 'index.html')
  mkdirSync(dirname(destino), { recursive: true })
  writeFileSync(destino, pagina)
  console.log('página', r === '' ? '/' : r)
}
writeFileSync(join(dist, 'sitemap.xml'), sitemap())
writeFileSync(join(dist, 'robots.txt'), robots())
rmSync(join(raiz, 'dist-ssr'), { recursive: true, force: true })
