// Serviços da loja, agrupados como no briefing ("Lista do perfil no Google").
// Textos e títulos de página vêm do projeto original; a triagem de cada página
// abre com o aparelho do serviço já escolhido (campo `aparelho`).
import type { IdAparelho } from './triagem'

export type Icone = 'placa' | 'notebook' | 'mac' | 'gamer' | 'videogame' | 'drone' | 'celular' | 'software' | 'loja'

export type Servico = {
  slug: string
  titulo: string
  resumo: string
  // completa "Olá! Vim pelo site e quero um orçamento de ..."
  assunto: string
  icone: Icone
  aparelho?: IdAparelho
  pagina: { titulo: string; tituloMeta: string; descricao: string; chamada: string }
  itens: readonly string[]
  marcas?: readonly string[]
}

export const servicos = [
  {
    slug: 'reparo-em-placa',
    titulo: 'Reparo em placa',
    resumo: 'Placa-mãe, placa de vídeo, reballing, regravação de BIOS e recuperação de dados. É o diferencial técnico da loja.',
    assunto: 'reparo em placa',
    icone: 'placa',
    pagina: {
      titulo: 'Reparo em placa em Maceió',
      tituloMeta: 'Reparo em placa',
      descricao: 'Reparo em placa em Maceió: placa-mãe, placa de vídeo, reballing, regravação de BIOS e recuperação de dados. Orçamento grátis pelo WhatsApp.',
      chamada: 'Quando o defeito está na placa, o reparo é feito no componente. Diagnóstico antes do serviço e orçamento grátis.',
    },
    itens: ['Placa-mãe', 'Placa de vídeo', 'Reballing', 'Regravação de BIOS', 'Recuperação de dados'],
  },
  {
    slug: 'conserto-de-notebook',
    titulo: 'Notebooks',
    resumo: 'Tela, teclado, bateria, conector de energia, dobradiça e carcaça, limpeza interna com pasta térmica e formatação.',
    assunto: 'conserto de notebook',
    icone: 'notebook',
    aparelho: 'notebook',
    pagina: {
      titulo: 'Conserto de notebook em Maceió',
      tituloMeta: 'Conserto de notebook',
      descricao: 'Conserto de notebook em Maceió: tela, teclado, bateria, conector de energia, dobradiça, limpeza interna e formatação. Orçamento grátis.',
      chamada: 'Da troca de tela ao reparo na placa, com diagnóstico antes do serviço e orçamento grátis pelo WhatsApp.',
    },
    itens: ['Troca de tela', 'Teclado', 'Bateria', 'Conector de energia', 'Dobradiça e carcaça', 'Limpeza interna e pasta térmica', 'Formatação'],
    marcas: ['Dell', 'Acer', 'HP', 'Lenovo', 'Asus', 'Samsung', 'Positivo', 'LG'],
  },
  {
    slug: 'macbook-e-imac',
    titulo: 'MacBook e iMac',
    resumo: 'Reparo avançado de placa e troca de tela. Seu Mac parou? A gente resolve.',
    assunto: 'conserto de MacBook ou iMac',
    icone: 'mac',
    aparelho: 'mac',
    pagina: {
      titulo: 'Conserto de MacBook e iMac em Maceió',
      tituloMeta: 'Conserto de MacBook e iMac',
      descricao: 'Conserto de MacBook e iMac em Maceió: reparo avançado de placa e troca de tela. Diagnóstico antes do serviço e orçamento grátis pelo WhatsApp.',
      chamada: 'Seu Mac parou? A gente resolve. Reparo avançado de placa e troca de tela, com orçamento grátis.',
    },
    itens: ['Reparo avançado de placa', 'Troca de tela'],
    marcas: ['MacBook', 'iMac'],
  },
  {
    slug: 'pc-gamer',
    titulo: 'PC gamer',
    resumo: 'Montagem sob medida, reparo, otimização e upgrade.',
    assunto: 'PC gamer',
    icone: 'gamer',
    aparelho: 'pc',
    pagina: {
      titulo: 'PC gamer em Maceió',
      tituloMeta: 'PC gamer: montagem, reparo e upgrade',
      descricao: 'PC gamer em Maceió: montagem sob medida, reparo, otimização e upgrade. Assistência técnica desde 2005, na Jatiúca. Orçamento grátis.',
      chamada: 'Montagem sob medida, reparo, otimização e upgrade. Conte o que você quer e receba o orçamento grátis.',
    },
    itens: ['Montagem sob medida', 'Reparo', 'Otimização', 'Upgrade e kits de upgrade'],
  },
  {
    slug: 'conserto-de-videogame',
    titulo: 'Videogames',
    resumo: 'Reparo de placa de PS5 e de consoles retrô, como o Super Nintendo.',
    assunto: 'conserto de videogame',
    icone: 'videogame',
    aparelho: 'videogame',
    pagina: {
      titulo: 'Conserto de PS5 e videogames em Maceió',
      tituloMeta: 'Conserto de PS5 e videogames',
      descricao: 'Conserto de PS5 e videogames em Maceió: reparo de placa de PS5 e de consoles retrô, como o Super Nintendo. Orçamento grátis pelo WhatsApp.',
      chamada: 'Reparo de placa de PS5 e de consoles retrô, como o Super Nintendo. Orçamento grátis pelo WhatsApp.',
    },
    itens: ['Reparo de placa de PS5', 'Consoles retrô, como o Super Nintendo'],
    marcas: ['PlayStation 5', 'Super Nintendo'],
  },
  {
    slug: 'conserto-de-drone',
    titulo: 'Drones',
    resumo: 'DJI e outras marcas, com laboratório próprio para diagnóstico e reparo.',
    assunto: 'conserto de drone',
    icone: 'drone',
    aparelho: 'drone',
    pagina: {
      titulo: 'Conserto de drone em Maceió',
      tituloMeta: 'Conserto de drone',
      descricao: 'Conserto de drone em Maceió: DJI e outras marcas, com laboratório próprio para diagnóstico e reparo. Orçamento grátis pelo WhatsApp.',
      chamada: 'Não sabe onde levar o seu drone? DJI e outras marcas, com laboratório próprio, aqui na Jatiúca.',
    },
    itens: ['Diagnóstico em laboratório próprio', 'Reparo de drones DJI e de outras marcas'],
    marcas: ['DJI'],
  },
  {
    slug: 'conserto-de-celular',
    titulo: 'Celulares',
    resumo: 'Tela, bateria, entrada do carregador, câmera, microfone e alto-falante, botões e danos por água.',
    assunto: 'conserto de celular',
    icone: 'celular',
    aparelho: 'celular',
    pagina: {
      titulo: 'Conserto de celular em Maceió',
      tituloMeta: 'Conserto de celular',
      descricao: 'Conserto de celular em Maceió: tela, bateria, entrada do carregador, câmera, microfone, alto-falante, botões e danos por água. Orçamento grátis.',
      chamada: 'Tela, bateria, carregador, câmera, som, botões e danos por água. Orçamento grátis pelo WhatsApp.',
    },
    itens: ['Tela', 'Bateria', 'Entrada do carregador', 'Câmera', 'Microfone e alto-falante', 'Botões', 'Danos por água'],
    marcas: ['iPhone', 'Samsung', 'Motorola', 'Xiaomi', 'LG'],
  },
  {
    slug: 'software-e-ti',
    titulo: 'Software e TI',
    resumo: 'Remoção de vírus, formatação, problemas de software e consultoria de TI.',
    assunto: 'software ou formatação',
    icone: 'software',
    pagina: {
      titulo: 'Formatação, vírus e TI em Maceió',
      tituloMeta: 'Formatação, remoção de vírus e TI',
      descricao: 'Formatação, remoção de vírus, problemas de software e consultoria de TI em Maceió. Assistência técnica desde 2005, na Jatiúca.',
      chamada: 'Remoção de vírus, formatação, problemas de software e consultoria de TI. Orçamento grátis pelo WhatsApp.',
    },
    itens: ['Remoção de vírus', 'Formatação de desktop', 'Problemas de software', 'Consultoria de TI'],
  },
] as const satisfies readonly Servico[]

export type SlugServico = (typeof servicos)[number]['slug']

export const caminhoDoServico = (slug: SlugServico) => `servicos/${slug}/` as const

// a loja de informática não tem página própria, só aparece no índice de especialidades
export const loja = {
  titulo: 'Loja de informática',
  resumo: 'Periféricos para notebook e desktop e kits de upgrade.',
  mensagem: 'Olá! Vim pelo site e quero saber sobre periféricos e kits de upgrade.',
} as const

// marcas citadas no briefing (notebooks, celulares, Mac, drones, consoles)
export const marcas = ['Dell', 'Acer', 'HP', 'Lenovo', 'Asus', 'Samsung', 'Positivo', 'LG', 'MacBook', 'iMac', 'iPhone', 'Motorola', 'Xiaomi', 'DJI', 'PlayStation 5', 'Super Nintendo'] as const
