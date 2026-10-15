// Dados da loja, todos do briefing levantado no projeto original
// (original/docs/briefing.md). Nada aqui pode ser inventado: o que não está no
// briefing fica em PENDENCIAS.md até a loja confirmar.

const WHATSAPP_NUMERO = '5582991298384'
const WHATSAPP_BASE = `https://api.whatsapp.com/send?phone=${WHATSAPP_NUMERO}`
const COORDENADAS = { latitude: -9.6513854, longitude: -35.7131546 } as const
const BUSCA_NO_GOOGLE = 'Dr. Notebook Informática, Divina Galeria, Jatiúca, Maceió'

// A loja sabe de onde veio o contato e o visitante só precisa apertar enviar.
export const MENSAGEM_ORCAMENTO = 'Olá! Vim pelo site e quero um orçamento.'

export const linkWhatsApp = (mensagem: string = MENSAGEM_ORCAMENTO) => `${WHATSAPP_BASE}&text=${encodeURIComponent(mensagem)}`

export const mensagemDoServico = (assunto: string) => `Olá! Vim pelo site e quero um orçamento de ${assunto}.`

type Aberta = {
  dias: string
  horas: string
  // dias da semana (0 domingo ... 6 sábado) e horário em minutos, para o "aberto agora"
  semana: readonly number[]
  abre: number
  fecha: number
  schema: { dias: readonly string[]; abre: string; fecha: string }
}
type Fechada = { dias: string; horas: string }
export type Faixa = Aberta | Fechada
export const estaAberta = (f: Faixa): f is Aberta => 'semana' in f

const horario: readonly Faixa[] = [
  {
    dias: 'Segunda a sexta',
    horas: '8h às 19h',
    semana: [1, 2, 3, 4, 5],
    abre: 8 * 60,
    fecha: 19 * 60,
    schema: { dias: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'], abre: '08:00', fecha: '19:00' },
  },
  { dias: 'Sábado', horas: '9h às 13h', semana: [6], abre: 9 * 60, fecha: 13 * 60, schema: { dias: ['Saturday'], abre: '09:00', fecha: '13:00' } },
  { dias: 'Domingo', horas: 'Fechado' },
]

export const loja = {
  nome: 'Dr. Notebook',
  cidade: 'Maceió',
  desde: 2005,
  avaliacoes: { nota: 4.8, notaTexto: '4,8', total: 186 },
  whatsapp: { exibicao: '(82) 99129-8384', telefone: '+55 82 99129-8384' },
  email: 'drnotebookmcz@outlook.com',
  instagram: { usuario: '@drnotebookmcz', link: 'https://www.instagram.com/drnotebookmcz/' },
  coordenadas: COORDENADAS,
  mapas: {
    perfil: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(BUSCA_NO_GOOGLE)}`,
    rota: `https://www.google.com/maps/dir/?api=1&destination=${COORDENADAS.latitude},${COORDENADAS.longitude}`,
  },
  endereco: {
    local: 'Divina Galeria',
    rua: 'Av. Dr. Antônio Gomes de Barros, 637, Loja 3',
    bairro: 'Jatiúca',
    cidadeUf: 'Maceió/AL',
    cep: '57036-000',
  },
  horario,
} as const

const DIAS = ['domingo', 'segunda', 'terça', 'quarta', 'quinta', 'sexta', 'sábado']
const hora = (min: number) => `${Math.floor(min / 60)}h${min % 60 ? String(min % 60).padStart(2, '0') : ''}`

/**
 * "Aberto agora · fecha às 19h" pelo relógio de Maceió (UTC-3, sem horário de verão).
 * Só roda no navegador: no HTML pré-renderizado o status ainda não existe.
 */
export function statusDaLoja(agora = new Date()): { aberta: boolean; texto: string } {
  const partes = new Intl.DateTimeFormat('en-US', { timeZone: 'America/Maceio', weekday: 'short', hour: 'numeric', minute: 'numeric', hourCycle: 'h23' }).formatToParts(agora)
  const pega = (t: string) => partes.find((p) => p.type === t)?.value ?? ''
  const dia = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(pega('weekday'))
  const min = Number(pega('hour')) * 60 + Number(pega('minute'))
  const faixas = loja.horario.filter(estaAberta)
  const hoje = faixas.find((f) => f.semana.includes(dia))
  if (hoje && min >= hoje.abre && min < hoje.fecha) return { aberta: true, texto: `Aberto agora · fecha às ${hora(hoje.fecha)}` }
  // próxima abertura
  for (let i = 0; i < 7; i++) {
    const d = (dia + i) % 7
    const f = faixas.find((x) => x.semana.includes(d))
    if (!f) continue
    if (i === 0 && min >= f.abre) continue
    const quando = i === 0 ? 'hoje' : i === 1 ? 'amanhã' : DIAS[d]
    return { aberta: false, texto: `Fechado agora · abre ${quando} às ${hora(f.abre)}` }
  }
  return { aberta: false, texto: 'Fechado agora' }
}
