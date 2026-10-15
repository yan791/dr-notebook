import { useEffect, useMemo, useRef, type CSSProperties } from 'react'
import { linkWhatsApp, loja } from '../dados/loja'
import { Icone, IconeWhatsApp } from '../marca/Icones'
import { clamp, css, f3, inv, px, rng, suave } from '../lib/util'
import { ocioso } from '../lib/rolagem'
import type { CenaNotebook } from '../tres/cena'
import './Historia.css'

/*
 * O hero: uma seção alta com um palco fixo. O progresso do scroll (0 a 1) comanda o
 * notebook 3D, as faixas de texto e os marcadores do diagnóstico. O CTA do WhatsApp
 * está na primeira dobra e no fim, e o cabeçalho com o botão nunca some.
 */

type R = readonly [number, number]
const T = {
  b1: [0, 0.2] as R,
  b2: [0.232, 0.455] as R,
  b3: [0.49, 0.725] as R,
  b4: [0.765, 1] as R,
}
const CAPITULOS = [
  { nome: 'Recepção', p: 0 },
  { nome: 'Diagnóstico', p: 0.225 },
  { nome: 'Placa', p: 0.48 },
  { nome: 'Alta', p: 0.755 },
]
// marcadores do diagnóstico: acendem quando a varredura passa por eles
const HUD = [
  { ponto: 'bateria', texto: 'Bateria', status: 'ok', de: 0.29 },
  { ponto: 'carregador', texto: 'Carregador', status: 'ok', de: 0.325 },
  { ponto: 'placa', texto: 'Placa-mãe', status: 'defeito encontrado', de: 0.37, alerta: true },
  { ponto: 'solda', texto: 'Chip', status: 'reballing', de: 0.6, ate: 0.735, placa: true },
  { ponto: 'bios', texto: 'BIOS', status: 'regravação', de: 0.63, ate: 0.735, placa: true },
] as const

function faixa(p: number, a: number, b: number, rampa: number, primeira = false, ultima = false) {
  const entra = primeira ? 1 : suave(inv(a, a + rampa, p))
  const sai = ultima ? 1 : 1 - suave(inv(b - rampa, b, p))
  return entra * sai
}

/** Palavras com limiar em ordem de leitura. */
function Palavras({ texto, espalha = 0.45, desde = 0 }: { texto: string; espalha?: number; desde?: number }) {
  const ws = texto.split(' ')
  return (
    <>
      {ws.map((w, i) => (
        <span key={i}>
          <span className="hs-w" style={{ '--th': (desde + (i / Math.max(1, ws.length - 1)) * espalha).toFixed(3) } as CSSProperties}>
            {w}
          </span>
          {i < ws.length - 1 ? ' ' : ''}
        </span>
      ))}
    </>
  )
}

/** Letras com deslocamentos com semente: dispersão (peças se separando) ou grade (leitura de monitor). */
function Letras({ texto, semente, modo }: { texto: string; semente: number; modo: 'dispersa' | 'grade' }) {
  const r = useMemo(() => rng(semente), [semente])
  const total = texto.replace(/ /g, '').length
  let idx = 0
  return (
    <>
      {texto.split(' ').map((w, i, arr) => (
        <span key={i}>
          <span className="hs-palavra">
            {[...w].map((c, j) => {
              const ordem = idx++ / Math.max(1, total - 1)
              const estilo =
                modo === 'dispersa'
                  ? ({
                      '--th': (r() * 0.5).toFixed(3),
                      '--jx': `${((r() - 0.5) * 140).toFixed(0)}px`,
                      '--jy': `${((r() - 0.5) * 100).toFixed(0)}px`,
                      '--jr': `${((r() - 0.5) * 34).toFixed(0)}deg`,
                    } as CSSProperties)
                  : ({ '--th': (ordem * 0.55 + r() * 0.05).toFixed(3), '--jx': '-26px', '--jy': '0px', '--jr': '0deg' } as CSSProperties)
              return (
                <span key={j} className="hs-c" style={estilo}>
                  {c}
                </span>
              )
            })}
          </span>
          {i < arr.length - 1 ? ' ' : ''}
        </span>
      ))}
    </>
  )
}

export function Historia() {
  const raizRef = useRef<HTMLElement>(null)
  const palcoRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const raiz = raizRef.current!
    const palco = palcoRef.current!
    const canvas = canvasRef.current!
    const $ = (s: string) => palco.querySelector(s) as HTMLElement
    const $$ = (s: string) => Array.from(palco.querySelectorAll(s)) as HTMLElement[]
    const el = {
      faixas: $$('[data-faixa]'),
      hud: $$('.hs-hud li'),
      capitulos: $$('.hs-cap li'),
      capBarra: $('.hs-cap-barra i'),
      cap: $('.hs-cap'),
      dica: $('.hs-dica'),
      pular: $('.hs-pular'),
    }

    let cena: CenaNotebook | null = null
    let descartado = false
    let pronto = false
    const movel = window.matchMedia('(max-width: 767px)').matches

    // a cena 3D chega depois da primeira pintura, num momento ocioso
    ocioso(120)
      .then(() => import('../tres/cena'))
      .then(({ CenaNotebook }) => {
        if (descartado) return
        try {
          cena = new CenaNotebook(canvas, { movel })
          if (import.meta.env.DEV) (window as unknown as Record<string, unknown>).__cena = cena
          layout()
          pronto = true
          palco.classList.add('hs--3d')
        } catch {
          palco.classList.add('hs--sem3d')
        }
      })
      .catch(() => palco.classList.add('hs--sem3d'))

    let vw = 1
    let vh = 1
    function layout() {
      vw = palco.clientWidth
      vh = palco.clientHeight
      cena?.resize(vw, vh, window.devicePixelRatio || 1)
    }

    const progresso = () => {
      const r = raiz.getBoundingClientRect()
      const curso = raiz.offsetHeight - window.innerHeight
      return curso > 0 ? clamp(-r.top / curso) : 0
    }
    let alvo = progresso()
    let mostrado = alvo
    const aoRolar = () => (alvo = progresso())
    window.addEventListener('scroll', aoRolar, { passive: true })

    const faixas = el.faixas.map((f) => {
      const id = f.dataset.faixa as keyof typeof T
      const [a, b] = T[id]
      return { el: f, a, b, primeira: id === 'b1', ultima: id === 'b4' }
    })

    function aplicar(p: number, tempo: number) {
      for (const f of faixas) {
        let op = faixa(p, f.a, f.b, 0.022, f.primeira, f.ultima)
        if (f.primeira) op *= Math.max(ligar, 0.0001)
        const k = f.primeira ? ligar : clamp((p - f.a) / Math.max(0.03, (f.b - f.a) * 0.42))
        css(f.el, 'opacity', f3(op))
        css(f.el, '--k', f3(k))
        css(f.el, 'visibility', op < 0.002 ? 'hidden' : 'visible')
        css(f.el, 'pointer-events', op > 0.5 ? 'auto' : 'none')
      }

      let cap = 0
      CAPITULOS.forEach((c, i) => p >= c.p && (cap = i))
      el.capitulos.forEach((li, i) => css(li, '--on', i === cap ? '1' : '0'))
      css(el.capBarra, 'transform', `scaleX(${f3(p)})`)
      css(el.cap, 'opacity', f3(ligar))
      css(el.dica, 'opacity', f3(ligar * (1 - suave(inv(0.01, 0.05, p)))))
      css(el.pular, 'opacity', f3(ligar * (1 - suave(inv(0.9, 0.97, p)))))

      // marcadores presos aos pontos do notebook
      HUD.forEach((h, i) => {
        const li = el.hud[i]
        const ate = 'ate' in h ? h.ate : 0.455
        const op = cena ? faixa(p, h.de, ate, 0.016) : 0
        css(li, 'opacity', f3(op))
        css(li, 'visibility', op < 0.002 ? 'hidden' : 'visible')
        css(li, '--k', f3(suave(inv(h.de, h.de + 0.03, p))))
        if (cena && op > 0.002) {
          const pt = cena.projetar(cena.pontos[h.ponto])
          css(li, 'transform', `translate3d(${px(pt.x)},${px(pt.y)},0)`)
        }
      })

      if (cena) {
        cena.apply({ p, tempo, ligar })
        cena.render()
        if (pronto) palco.classList.add('hs--pronto')
      }
    }

    // ---------- loop ----------
    let raf = 0
    let rodando = false
    let ultimo = 0
    let ligar = 0
    const t0 = performance.now()
    function tick(agora: number) {
      raf = 0
      const dt = Math.min(64, agora - (ultimo || agora))
      ultimo = agora
      ligar = clamp((agora - t0 - 150) / 1700)
      mostrado += (alvo - mostrado) * (1 - Math.pow(1 - 0.16, dt / 16.67))
      if (Math.abs(alvo - mostrado) < 0.00005) mostrado = alvo
      aplicar(mostrado, agora / 1000)
      if (rodando) raf = requestAnimationFrame(tick)
    }
    const iniciar = () => {
      if (rodando) return
      rodando = true
      ultimo = 0
      raf = requestAnimationFrame(tick)
    }
    const parar = () => {
      rodando = false
      if (raf) cancelAnimationFrame(raf)
      raf = 0
    }
    const io = new IntersectionObserver(([e]) => (e.isIntersecting && !document.hidden ? iniciar() : parar()), { rootMargin: '80px 0px' })
    io.observe(raiz)
    const aoVis = () => (document.hidden ? parar() : raiz.getBoundingClientRect().bottom > 0 && iniciar())
    document.addEventListener('visibilitychange', aoVis)
    const ro = new ResizeObserver(() => {
      layout()
      alvo = progresso()
    })
    ro.observe(palco)
    layout()
    iniciar()
    if (import.meta.env.DEV) (window as unknown as Record<string, unknown>).__historia = { get: () => ({ alvo, mostrado, pronto, trocas: cena?.trocas }) }

    return () => {
      descartado = true
      parar()
      io.disconnect()
      ro.disconnect()
      document.removeEventListener('visibilitychange', aoVis)
      window.removeEventListener('scroll', aoRolar)
      cena?.dispose()
    }
  }, [])

  const zap = linkWhatsApp()
  return (
    <section ref={raizRef} className="historia" id="inicio" aria-labelledby="hs-titulo" data-fixa>
      <div ref={palcoRef} className="hs-palco">
        <div className="hs-poster" aria-hidden="true" />
        <canvas ref={canvasRef} className="hs-canvas" aria-hidden="true" tabIndex={-1} />
        <div className="hs-vinheta" aria-hidden="true" />

        <ul className="hs-hud" aria-hidden="true">
          {HUD.map((h) => (
            <li key={h.ponto} className={`${'alerta' in h ? 'hs-hud--alerta' : ''} ${'placa' in h ? 'hs-hud--placa' : ''}`}>
              <span className="hs-hud-ponto" />
              <span className="hs-hud-linha" />
              <span className="hs-hud-chip">
                <b>{h.texto}</b>
                <i>{h.status}</i>
              </span>
            </li>
          ))}
        </ul>

        {/* faixa 1: a primeira dobra, já com o CTA */}
        <div className="hs-faixa hs-f1" data-faixa="b1">
          <p className="rotulo hs-rot">
            <span className="hs-led" aria-hidden="true" />
            Assistência técnica em Maceió · desde {loja.desde}
          </p>
          <h1 id="hs-titulo" className="hs-titulo">
            <span className="sr-only">Dr. Notebook Maceió. Não resolve no martelo. Resolve na técnica.</span>
            <span aria-hidden="true" className="hs-l">
              <Palavras texto="Não resolve no martelo." espalha={0.3} />
            </span>
            <span aria-hidden="true" className="hs-l hs-l--azul">
              <Palavras texto="Resolve na técnica." espalha={0.3} desde={0.3} />
            </span>
          </h1>
          <p className="hs-texto hs-sub">Notebooks, MacBooks, PCs gamer, PS5, drones e celulares. Diagnóstico antes do serviço e orçamento grátis pelo WhatsApp.</p>
          <div className="hs-acoes hs-cta">
            <a className="botao botao--zap" href={zap} target="_blank" rel="noopener" data-magnetico>
              <IconeWhatsApp tamanho={20} /> Pedir orçamento grátis
            </a>
            <a className="botao botao--linha" href="#triagem">
              Fazer a triagem online
            </a>
          </div>
          <p className="hs-prova hs-cta">
            <Icone nome="estrela" tamanho={15} className="estrela-cheia" /> <b>{loja.avaliacoes.notaTexto}</b> no Google · {loja.avaliacoes.total} avaliações
          </p>
        </div>

        {/* faixa 2: diagnóstico */}
        <div className="hs-faixa hs-f2" data-faixa="b2">
          <p className="rotulo hs-rot">01 · Diagnóstico</p>
          <h2 className="hs-titulo hs-titulo--m">
            <span className="sr-only">Primeiro, a gente descobre o motivo.</span>
            <span aria-hidden="true" className="hs-grade">
              <Letras texto="Primeiro, a gente descobre o motivo." semente={11} modo="grade" />
            </span>
          </h2>
          <p className="hs-texto">O aparelho passa por um diagnóstico antes de qualquer troca de peça. Você recebe o orçamento grátis e só então decide.</p>
        </div>

        {/* faixa 3: reparo em placa */}
        <div className="hs-faixa hs-f3" data-faixa="b3">
          <p className="rotulo hs-rot">02 · Reparo em placa</p>
          <h2 className="hs-titulo hs-titulo--m">
            <span className="sr-only">O conserto que vai até o chip.</span>
            <span aria-hidden="true" className="hs-dispersa">
              <Letras texto="O conserto que vai até o chip." semente={23} modo="dispersa" />
            </span>
          </h2>
          <p className="hs-texto">Reballing, regravação de BIOS, placa de vídeo e recuperação de dados. Quando o defeito está na placa, o reparo é feito no componente.</p>
        </div>

        {/* faixa 4: alta */}
        <div className="hs-faixa hs-f4" data-faixa="b4">
          <p className="rotulo hs-rot">
            <span className="hs-led hs-led--vivo" aria-hidden="true" />
            03 · Alta
          </p>
          <h2 className="hs-titulo">
            <span className="sr-only">Voltou a funcionar.</span>
            <span aria-hidden="true" className="hs-l">
              <Palavras texto="Voltou a funcionar." espalha={0.35} />
            </span>
          </h2>
          <p className="hs-texto hs-sub">Atendimento rápido e transparente, com garantia nos serviços.</p>
          <div className="hs-acoes hs-cta">
            <a className="botao botao--zap" href={linkWhatsApp('Olá! Vim pelo site e quero contar o problema do meu aparelho.')} target="_blank" rel="noopener" data-magnetico>
              <IconeWhatsApp tamanho={20} /> Contar o problema no WhatsApp
            </a>
          </div>
        </div>

        <div className="hs-cap" aria-hidden="true">
          <span className="hs-cap-barra" aria-hidden="true">
            <i />
          </span>
          <ol>
            {CAPITULOS.map((c, i) => (
              <li key={c.nome}>
                <span className="hs-cap-n">0{i}</span> {c.nome}
              </li>
            ))}
          </ol>
        </div>

        <a className="hs-pular" href="#triagem">
          Pular para a triagem <Icone nome="seta" tamanho={14} />
        </a>
        <p className="hs-dica" aria-hidden="true">
          <span className="hs-dica-roda" />
          Role para acompanhar o atendimento
        </p>
      </div>
    </section>
  )
}
