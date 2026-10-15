import { estaAberta, loja } from './loja'
import { caminhoDoServico, type Servico, type SlugServico } from './servicos'
import { SITE_URL, urlAbsoluta } from './site'

// Dados estruturados (schema.org) da loja, de cada serviço e da trilha, só com o
// que está no briefing. Adaptado do projeto original (src/lib/seo.ts).

type Dados = { '@context': 'https://schema.org'; '@type': string; [k: string]: unknown }

const ID_DA_LOJA = urlAbsoluta('#loja')

const endereco = {
  '@type': 'PostalAddress',
  streetAddress: `${loja.endereco.rua}, ${loja.endereco.local}`,
  addressLocality: loja.cidade,
  addressRegion: 'AL',
  postalCode: loja.endereco.cep,
  addressCountry: 'BR',
} as const

const horario = loja.horario.filter(estaAberta).map((f) => ({ '@type': 'OpeningHoursSpecification', dayOfWeek: f.schema.dias, opens: f.schema.abre, closes: f.schema.fecha }))

export const dadosDaLoja = (): Dados => ({
  '@context': 'https://schema.org',
  '@type': 'ComputerStore',
  '@id': ID_DA_LOJA,
  name: loja.nome,
  alternateName: `${loja.nome} ${loja.cidade}`,
  description: 'Assistência técnica de informática em Maceió desde 2005: reparo em placa de notebooks, MacBooks, PCs gamer, PS5, drones e celulares.',
  url: `${SITE_URL}/`,
  telephone: loja.whatsapp.telefone,
  email: loja.email,
  foundingDate: String(loja.desde),
  image: urlAbsoluta('img/loja.jpg'),
  address: endereco,
  geo: { '@type': 'GeoCoordinates', ...loja.coordenadas },
  openingHoursSpecification: horario,
  areaServed: { '@type': 'City', name: loja.cidade },
  // sem aggregateRating: o Google não aceita nota da própria loja nos dados dela
  sameAs: [loja.instagram.link],
})

export const dadosDoServico = (s: Servico & { slug: SlugServico }): Dados => ({
  '@context': 'https://schema.org',
  '@type': 'Service',
  name: s.pagina.titulo,
  serviceType: s.titulo,
  description: s.pagina.descricao,
  url: urlAbsoluta(caminhoDoServico(s.slug)),
  areaServed: { '@type': 'City', name: loja.cidade },
  provider: { '@type': 'ComputerStore', '@id': ID_DA_LOJA, name: loja.nome, telephone: loja.whatsapp.telefone, address: endereco },
})

export const trilhaDoServico = (s: Servico & { slug: SlugServico }): Dados => ({
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: [
    { '@type': 'ListItem', position: 1, name: 'Início', item: `${SITE_URL}/` },
    { '@type': 'ListItem', position: 2, name: s.pagina.titulo, item: urlAbsoluta(caminhoDoServico(s.slug)) },
  ],
})
