/*
 * Triagem online: o visitante escolhe o aparelho e o sintoma e manda a ficha pelo
 * WhatsApp. "O que pode ser" lista causas comuns daquele sintoma (conhecimento
 * técnico geral, não promessa da loja); a confirmação é sempre o diagnóstico na loja.
 */
import type { Icone } from './servicos'

export type IdAparelho = 'notebook' | 'mac' | 'pc' | 'celular' | 'videogame' | 'drone'

export type Sintoma = {
  id: string
  nome: string
  causas: readonly string[]
  dica?: string
}

export type Aparelho = {
  id: IdAparelho
  nome: string
  // como o aparelho entra na frase da mensagem
  naMensagem: string
  icone: Icone
  sintomas: readonly Sintoma[]
}

const MOLHOU = 'Desligue, não tente ligar de novo e não coloque para carregar. Quanto antes ele chegar à bancada, melhor.'

const outro: Sintoma = { id: 'outro', nome: 'Outro problema', causas: ['Você explica no WhatsApp e a loja orienta o próximo passo.'] }

export const aparelhos: readonly Aparelho[] = [
  {
    id: 'notebook',
    nome: 'Notebook',
    naMensagem: 'Notebook',
    icone: 'notebook',
    sintomas: [
      { id: 'nao-liga', nome: 'Não liga', causas: ['Carregador ou conector de energia', 'Curto no circuito de energia da placa', 'BIOS corrompida'] },
      { id: 'esquenta', nome: 'Esquenta e desliga sozinho', causas: ['Poeira no cooler e nas aletas', 'Pasta térmica ressecada', 'Cooler com defeito'] },
      { id: 'tela', nome: 'Tela preta ou sem vídeo', causas: ['Cabo flat ou a própria tela', 'Iluminação da tela', 'Chip de vídeo da placa'] },
      { id: 'nao-carrega', nome: 'Não carrega', causas: ['Carregador ou cabo', 'Conector de energia', 'Bateria', 'Circuito de carga da placa'] },
      { id: 'lento', nome: 'Lento ou travando', causas: ['HD ou SSD com defeito', 'Vírus ou sistema com problema', 'Pouca memória para o uso (upgrade resolve)'] },
      { id: 'quebrou', nome: 'Tela, teclado ou dobradiça quebrados', causas: ['Troca da peça danificada', 'Ajuste da carcaça e da dobradiça'] },
      { id: 'molhou', nome: 'Caiu líquido', causas: ['Oxidação nos componentes da placa', 'Curto causado pelo líquido'], dica: MOLHOU },
      outro,
    ],
  },
  {
    id: 'mac',
    nome: 'MacBook ou iMac',
    naMensagem: 'MacBook ou iMac',
    icone: 'mac',
    sintomas: [
      { id: 'nao-liga', nome: 'Não liga', causas: ['Fonte ou carregador', 'Defeito no circuito de energia da placa'] },
      { id: 'nao-carrega', nome: 'Não carrega', causas: ['Carregador ou cabo', 'Porta de carga', 'Bateria', 'Circuito de carga da placa'] },
      { id: 'tela', nome: 'Tela com defeito', causas: ['Tela quebrada ou com manchas', 'Cabo da tela', 'Defeito de vídeo na placa'] },
      { id: 'esquenta', nome: 'Superaquecendo', causas: ['Poeira na ventilação', 'Pasta térmica ressecada'] },
      { id: 'travou', nome: 'Travou do nada ou desliga sozinho', causas: ['Problema no sistema', 'SSD com defeito', 'Defeito na placa'] },
      { id: 'molhou', nome: 'Caiu líquido', causas: ['Oxidação nos componentes da placa', 'Curto causado pelo líquido'], dica: MOLHOU },
      outro,
    ],
  },
  {
    id: 'pc',
    nome: 'PC gamer',
    naMensagem: 'PC gamer',
    icone: 'gamer',
    sintomas: [
      { id: 'sem-video', nome: 'Liga mas não dá vídeo', causas: ['Placa de vídeo', 'Memória RAM', 'Fonte'] },
      { id: 'desliga', nome: 'Desliga ou reinicia sozinho', causas: ['Superaquecimento', 'Fonte fraca ou com defeito', 'Problema no sistema'] },
      { id: 'lento', nome: 'Lento ou travando nos jogos', causas: ['Temperatura alta', 'Sistema e drivers', 'Peça abaixo do que o jogo pede (upgrade)'] },
      { id: 'montar', nome: 'Quero montar ou fazer upgrade', causas: ['Montagem sob medida para o seu uso', 'Kit de upgrade para o PC que você já tem'] },
      outro,
    ],
  },
  {
    id: 'celular',
    nome: 'Celular',
    naMensagem: 'Celular',
    icone: 'celular',
    sintomas: [
      { id: 'tela', nome: 'Tela quebrada ou sem imagem', causas: ['Troca da tela', 'Conector da tela'] },
      { id: 'bateria', nome: 'Bateria acaba rápido', causas: ['Bateria desgastada', 'Algum aplicativo ou o sistema gastando energia'] },
      { id: 'nao-carrega', nome: 'Não carrega', causas: ['Entrada do carregador', 'Cabo ou carregador', 'Bateria'] },
      { id: 'molhou', nome: 'Caiu na água', causas: ['Oxidação nos componentes', 'Curto causado pela água'], dica: MOLHOU },
      { id: 'som', nome: 'Câmera, microfone ou alto-falante', causas: ['Troca do módulo da câmera', 'Microfone ou alto-falante com defeito'] },
      { id: 'botoes', nome: 'Botões não funcionam', causas: ['Botão ou flex dos botões'] },
      outro,
    ],
  },
  {
    id: 'videogame',
    nome: 'Videogame',
    naMensagem: 'Videogame',
    icone: 'videogame',
    sintomas: [
      { id: 'sem-imagem', nome: 'Liga mas fica sem imagem', causas: ['Porta HDMI', 'Chip de vídeo da placa'] },
      { id: 'nao-liga', nome: 'Não liga', causas: ['Fonte interna', 'Curto na placa'] },
      { id: 'esquenta', nome: 'Esquenta e desliga', causas: ['Poeira na ventilação', 'Pasta térmica ou metal líquido'] },
      { id: 'retro', nome: 'Console retrô parado', causas: ['Contatos oxidados', 'Componentes da placa desgastados pelo tempo'] },
      outro,
    ],
  },
  {
    id: 'drone',
    nome: 'Drone',
    naMensagem: 'Drone',
    icone: 'drone',
    sintomas: [
      { id: 'queda', nome: 'Caiu ou bateu', causas: ['Hélices e braços', 'Motor', 'Gimbal e câmera'] },
      { id: 'camera', nome: 'Câmera ou gimbal com defeito', causas: ['Motor ou cabo do gimbal', 'Módulo da câmera'] },
      { id: 'conexao', nome: 'Não conecta ao controle', causas: ['Antenas', 'Placa de transmissão', 'Atualização de firmware'] },
      { id: 'bateria', nome: 'Bateria não segura carga', causas: ['Bateria desgastada', 'Carregador'] },
      outro,
    ],
  },
]

export const aparelhoPorId = (id?: IdAparelho | null) => aparelhos.find((a) => a.id === id)

export function mensagemDaTriagem(aparelho?: Aparelho, sintoma?: Sintoma, modelo?: string) {
  if (!aparelho) return 'Olá! Vim pelo site e quero um orçamento.'
  const linhas = ['Olá! Fiz a triagem no site da Dr. Notebook.', `Aparelho: ${aparelho.naMensagem}`]
  const m = modelo?.trim()
  if (m) linhas.push(`Marca e modelo: ${m}`)
  if (sintoma) linhas.push(`O que está acontecendo: ${sintoma.id === 'outro' ? 'outro problema (explico aqui)' : sintoma.nome.toLowerCase()}`)
  linhas.push('Quero um orçamento.')
  return linhas.join('\n')
}
