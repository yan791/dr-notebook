import { StrictMode } from 'react'
import { renderToString } from 'react-dom/server'
import { App, rota } from './App'
import { caminhoDoServico, servicos } from './dados/servicos'
import { dadosDaLoja, dadosDoServico, trilhaDoServico } from './dados/seo'
import { INDEXAR, SITE_URL, urlAbsoluta } from './dados/site'

/*
 * Pré-renderização: o build gera o HTML de cada página (início, uma por serviço e a
 * 404), com título, descrição, og e dados estruturados próprios. O Google e as prévias
 * de link (WhatsApp, Instagram) leem tudo sem rodar JavaScript.
 */

export const rotas = ['', ...servicos.map((s) => caminhoDoServico(s.slug)), '404']

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

const DESCRICAO_INICIO =
  'Assistência técnica em Maceió desde 2005. Reparo em placa de notebooks, MacBooks, PCs gamer, PS5, drones e celulares. Diagnóstico antes do serviço e orçamento grátis pelo WhatsApp.'

function cabeca(caminho: string) {
  const r = rota(caminho)
  let titulo = 'Dr. Notebook Maceió | Assistência técnica e reparo em placa'
  let descricao = DESCRICAO_INICIO
  let url = `${SITE_URL}/`
  let dados: object[] = [dadosDaLoja()]
  let indexar = INDEXAR
  if (r.tipo === 'servico') {
    titulo = `${r.servico.pagina.tituloMeta} | Dr. Notebook Maceió`
    descricao = r.servico.pagina.descricao
    url = urlAbsoluta(caminhoDoServico(r.servico.slug))
    dados = [dadosDoServico(r.servico), trilhaDoServico(r.servico)]
  }
  if (r.tipo === '404') {
    titulo = 'Página não encontrada | Dr. Notebook Maceió'
    indexar = false
  }
  const og = urlAbsoluta('og.jpg')
  return [
    `<title>${esc(titulo)}</title>`,
    `<meta name="description" content="${esc(descricao)}" />`,
    indexar ? '' : '<meta name="robots" content="noindex" />',
    r.tipo === '404' ? '' : `<link rel="canonical" href="${esc(url)}" />`,
    '<meta property="og:type" content="website" />',
    '<meta property="og:locale" content="pt_BR" />',
    '<meta property="og:site_name" content="Dr. Notebook Maceió" />',
    `<meta property="og:title" content="${esc(titulo)}" />`,
    `<meta property="og:description" content="${esc(descricao)}" />`,
    `<meta property="og:url" content="${esc(url)}" />`,
    `<meta property="og:image" content="${esc(og)}" />`,
    '<meta property="og:image:width" content="1200" />',
    '<meta property="og:image:height" content="630" />',
    '<meta property="og:image:alt" content="Dr. Notebook Maceió: assistência técnica de informática desde 2005" />',
    '<meta name="twitter:card" content="summary_large_image" />',
    ...dados.map((d) => `<script type="application/ld+json">${JSON.stringify(d).replace(/</g, '\\u003c')}</script>`),
  ]
    .filter(Boolean)
    .join('\n    ')
}

export function render(caminho: string) {
  const html = renderToString(
    <StrictMode>
      <App caminho={caminho} />
    </StrictMode>,
  )
  return { html, head: cabeca(caminho) }
}

export function sitemap() {
  const urls = rotas.filter((r) => r !== '404').map((r) => `  <url><loc>${urlAbsoluta(r)}</loc></url>`)
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join('\n')}\n</urlset>\n`
}

export function robots() {
  return INDEXAR ? `User-agent: *\nAllow: /\n\nSitemap: ${urlAbsoluta('sitemap.xml')}\n` : 'User-agent: *\nDisallow: /\n'
}
