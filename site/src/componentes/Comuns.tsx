import { useEffect, useRef, useState } from 'react'
import { linkWhatsApp, loja } from '../dados/loja'
import { caminhoDoServico, marcas, servicos } from '../dados/servicos'
import { href } from '../dados/site'
import { Logo } from '../marca/Logo'
import { Icone, IconeWhatsApp } from '../marca/Icones'
import { LINKS } from './Cabecalho'
import { Batimento } from './Batimento'
import './Comuns.css'

/* Fundo fixo da página: os hexágonos grandes das artes da loja, derivando devagar. */
export function Ambiente() {
  const lado = 120
  const w = Math.sqrt(3) * lado
  const h = 3 * lado
  const celula = `M${w / 2},0 L${w},${lado / 2} L${w},${1.5 * lado} L${w / 2},${2 * lado} L0,${1.5 * lado} L0,${lado / 2} Z M${w / 2},${2 * lado} L${w / 2},${h}`
  return (
    <div className="ambiente" aria-hidden="true">
      <svg>
        <defs>
          <pattern id="hex-ambiente" width={w} height={h} patternUnits="userSpaceOnUse">
            <path d={celula} fill="none" stroke="rgba(77,148,255,0.07)" strokeWidth={1} />
          </pattern>
          <radialGradient id="hex-mascara-g" cx="70%" cy="30%" r="80%">
            <stop offset="0" stopColor="#fff" />
            <stop offset="1" stopColor="#fff" stopOpacity="0" />
          </radialGradient>
          <mask id="hex-mascara">
            <rect width="100%" height="100%" fill="url(#hex-mascara-g)" />
          </mask>
        </defs>
        <rect width="100%" height="100%" fill="url(#hex-ambiente)" mask="url(#hex-mascara)" />
      </svg>
      <span className="ambiente-brilho" />
    </div>
  )
}

export function Marcas() {
  const lista = (
    <ul>
      {marcas.map((m) => (
        <li key={m}>{m}</li>
      ))}
    </ul>
  )
  return (
    <section className="marcas" aria-label="Marcas atendidas">
      <p className="rotulo marcas-rotulo">Marcas que passam pela bancada</p>
      <div className="marcas-trilho">
        {lista}
        <div aria-hidden="true">{lista}</div>
      </div>
    </section>
  )
}

/* Chamada final: o batimento fica reto até a seção entrar na tela, e então volta a bater. */
export function ChamadaFinal({ mensagem }: { mensagem?: string }) {
  const ref = useRef<HTMLElement>(null)
  const [vivo, setVivo] = useState(false)
  useEffect(() => {
    const io = new IntersectionObserver(([e]) => e.isIntersecting && setVivo(true), { threshold: 0.4 })
    io.observe(ref.current!)
    return () => io.disconnect()
  }, [])
  return (
    <section ref={ref} className="secao chamada" aria-labelledby="chamada-titulo">
      <Batimento className="chamada-ecg" largura={1400} altura={160} batidas={3} vivo={vivo} />
      <div className="conteudo chamada-conteudo">
        <p className="rotulo">Orçamento grátis</p>
        <h2 id="chamada-titulo" className="titulo-secao" data-titulo>
          Vamos descobrir o que o seu aparelho tem?
        </h2>
        <p className="lede">
          Orçamento grátis e diagnóstico antes do serviço. Na {loja.endereco.local}, em {loja.endereco.bairro}, {loja.cidade}.
        </p>
        <div className="chamada-acoes">
          <a className="botao botao--zap" href={linkWhatsApp(mensagem)} target="_blank" rel="noopener" data-magnetico>
            <IconeWhatsApp tamanho={22} /> {loja.whatsapp.exibicao}
          </a>
          <a className="botao botao--linha" href={loja.mapas.rota} target="_blank" rel="noopener">
            <Icone nome="rota" tamanho={18} /> Como chegar
          </a>
        </div>
      </div>
    </section>
  )
}

export function Rodape() {
  return (
    <footer className="rodape">
      <div className="conteudo rodape-grade">
        <div className="rodape-marca">
          <Logo className="rodape-logo" titulo={`${loja.nome} ${loja.cidade}`} />
          <p>
            Assistência técnica de informática em {loja.cidade} desde {loja.desde}. Reparo em placa de notebooks, MacBooks, PCs gamer, PS5, drones e celulares.
          </p>
        </div>
        <nav aria-label="Rodapé">
          <p className="rotulo">Navegação</p>
          <ul>
            {LINKS.map((l) => (
              <li key={l.alvo}>
                <a href={href(l.alvo)}>{l.rotulo}</a>
              </li>
            ))}
          </ul>
        </nav>
        <nav aria-label="Serviços">
          <p className="rotulo">Serviços</p>
          <ul>
            {servicos.map((s) => (
              <li key={s.slug}>
                <a href={href(caminhoDoServico(s.slug))}>{s.pagina.tituloMeta}</a>
              </li>
            ))}
          </ul>
        </nav>
        <div>
          <p className="rotulo">Contato</p>
          <ul>
            <li>
              <a href={linkWhatsApp()} target="_blank" rel="noopener">
                WhatsApp {loja.whatsapp.exibicao}
              </a>
            </li>
            <li>
              <a href={`mailto:${loja.email}`}>{loja.email}</a>
            </li>
            <li>
              <a href={loja.instagram.link} target="_blank" rel="noopener">
                Instagram {loja.instagram.usuario}
              </a>
            </li>
            <li>
              {loja.endereco.local}, {loja.endereco.rua}, {loja.endereco.bairro}, {loja.endereco.cidadeUf}
            </li>
          </ul>
        </div>
      </div>
      <div className="conteudo rodape-base">
        <p>© {new Date().getFullYear()} {loja.nome} {loja.cidade}.</p>
        <p>{loja.horario.map((f) => `${f.dias}: ${f.horas}`).join(' · ')}</p>
      </div>
    </footer>
  )
}
