import { useEffect, useState } from 'react'
import { linkWhatsApp, loja } from '../dados/loja'
import { href } from '../dados/site'
import { Logo } from '../marca/Logo'
import { Icone, IconeWhatsApp } from '../marca/Icones'
import { travarRolagem } from '../lib/rolagem'
import './Cabecalho.css'

export const LINKS = [
  { rotulo: 'Triagem', alvo: '#triagem' },
  { rotulo: 'Serviços', alvo: '#servicos' },
  { rotulo: 'Reparo em placa', alvo: '#reparo-em-placa' },
  { rotulo: 'Avaliações', alvo: '#avaliacoes' },
  { rotulo: 'Onde estamos', alvo: '#onde-estamos' },
] as const

/* Cabeçalho sempre visível: o WhatsApp fica a um toque em qualquer ponto da página. */
export function Cabecalho() {
  const [aberto, setAberto] = useState(false)

  useEffect(() => {
    travarRolagem(aberto, 'menu')
    if (!aberto) return
    const esc = (e: KeyboardEvent) => e.key === 'Escape' && setAberto(false)
    window.addEventListener('keydown', esc)
    return () => window.removeEventListener('keydown', esc)
  }, [aberto])

  const zap = linkWhatsApp()
  return (
    <header className={`cabecalho ${aberto ? 'cabecalho--aberto' : ''}`}>
      <div className="cab-capsula">
        <a className="cab-logo" href={href()} aria-label={`${loja.nome} ${loja.cidade}, início`}>
          <Logo vivo />
        </a>
        <nav className="cab-nav" aria-label="Principal">
          <ul>
            {LINKS.map((l) => (
              <li key={l.alvo}>
                <a href={href(l.alvo)}>{l.rotulo}</a>
              </li>
            ))}
          </ul>
        </nav>
        <a className="botao botao--zap botao--pequeno cab-zap" href={zap} target="_blank" rel="noopener" aria-label="Orçamento grátis pelo WhatsApp">
          <IconeWhatsApp tamanho={18} />
          <span className="cab-zap-texto">Orçamento grátis</span>
          <svg className="cab-ecg" viewBox="0 0 40 16" aria-hidden="true" focusable="false">
            <path d="M0 8h12l3-6 4 12 3-6h18" />
          </svg>
        </a>
        <button className="cab-menu" type="button" aria-expanded={aberto} aria-controls="menu-celular" aria-label={aberto ? 'Fechar menu' : 'Abrir menu'} onClick={() => setAberto((v) => !v)}>
          <Icone nome={aberto ? 'fechar' : 'menu'} tamanho={22} />
        </button>
      </div>

      <div id="menu-celular" className="cab-gaveta" hidden={!aberto}>
        <ul>
          {LINKS.map((l, i) => (
            <li key={l.alvo} style={{ transitionDelay: `${0.04 * i + 0.05}s` }}>
              <a href={href(l.alvo)} onClick={() => setAberto(false)}>
                <span className="rotulo">0{i + 1}</span> {l.rotulo}
              </a>
            </li>
          ))}
        </ul>
        <a className="botao botao--zap" href={zap} target="_blank" rel="noopener">
          <IconeWhatsApp tamanho={20} /> Pedir orçamento grátis
        </a>
        <p className="cab-gaveta-info">
          {loja.endereco.local}, {loja.endereco.bairro} · {loja.whatsapp.exibicao}
        </p>
      </div>
    </header>
  )
}
