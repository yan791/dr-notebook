import { useEffect } from 'react'
import { servicos } from './dados/servicos'
import { Inicio } from './paginas/Inicio'
import { PaginaServico } from './paginas/PaginaServico'
import { NaoEncontrada } from './paginas/NaoEncontrada'
import { Cabecalho } from './componentes/Cabecalho'
import { Ambiente, Rodape } from './componentes/Comuns'
import { encerrarRolagem, iniciarRolagem, ligarAncoras, ScrollTrigger } from './lib/rolagem'
import { ligarEfeitos } from './lib/efeitos'

/** Qual página mostrar, a partir do caminho dentro do site ("" ou "servicos/drone/"). */
export function rota(caminho: string) {
  const limpo = caminho.replace(/^\/+|\/+$/g, '')
  if (limpo === '') return { tipo: 'inicio' as const }
  const m = limpo.match(/^servicos\/([a-z0-9-]+)$/)
  const servico = m && servicos.find((s) => s.slug === m[1])
  if (servico) return { tipo: 'servico' as const, servico }
  return { tipo: '404' as const }
}

export function App({ caminho }: { caminho: string }) {
  const r = rota(caminho)

  useEffect(() => {
    document.documentElement.classList.add('js')
    iniciarRolagem()
    const desligarAncoras = ligarAncoras()
    const desligarEfeitos = ligarEfeitos(document.getElementById('principal')!)
    // fontes e imagens mudam alturas: recalcula os gatilhos quando tudo assenta
    document.fonts?.ready.then(() => ScrollTrigger.refresh())
    const aoCarregar = () => ScrollTrigger.refresh()
    window.addEventListener('load', aoCarregar)
    // aba escondida: pausa as animações em CSS
    const aoVis = () => document.body.classList.toggle('pausado', document.hidden)
    document.addEventListener('visibilitychange', aoVis)
    // chegou com #secao no endereço: vai até ela depois da primeira pintura
    if (location.hash) requestAnimationFrame(() => document.querySelector(location.hash)?.scrollIntoView())
    return () => {
      desligarAncoras()
      desligarEfeitos()
      window.removeEventListener('load', aoCarregar)
      document.removeEventListener('visibilitychange', aoVis)
      encerrarRolagem()
    }
  }, [])

  return (
    <>
      <a className="pular-conteudo" href="#principal">
        Pular para o conteúdo
      </a>
      <Ambiente />
      <Cabecalho />
      <main id="principal" tabIndex={-1}>
        {r.tipo === 'inicio' && <Inicio />}
        {r.tipo === 'servico' && <PaginaServico servico={r.servico} />}
        {r.tipo === '404' && <NaoEncontrada />}
      </main>
      <Rodape />
    </>
  )
}
