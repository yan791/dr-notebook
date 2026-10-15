import { useEffect, useRef, useState } from 'react'
import { linkWhatsApp, mensagemDoServico } from '../dados/loja'
import { href } from '../dados/site'
import { Icone, IconeWhatsApp } from '../marca/Icones'
import { ocioso } from '../lib/rolagem'
import { clamp, css, easeInOut, f3, px } from '../lib/util'
import type { CenaLaboratorio, Foco } from '../tres/laboratorio'

// textos do projeto original (seção "Reparo em placa")
const PROCEDIMENTOS: { alvo: Foco; titulo: string; texto: string }[] = [
  { alvo: 'solda', titulo: 'Reballing', texto: 'Refaz as esferas de solda que ligam o chip à placa.' },
  { alvo: 'bios', titulo: 'Regravação de BIOS', texto: 'Reprograma o chip da BIOS quando o firmware corrompe.' },
  { alvo: 'dados', titulo: 'Recuperação de dados', texto: 'Resgate de arquivos de aparelhos que pararam de funcionar.' },
  { alvo: 'placa', titulo: 'Placa-mãe e placa de vídeo', texto: 'Conserto dos componentes na própria placa.' },
]
const ROTULO: Record<Foco, string> = { solda: 'Chip · reballing', bios: 'BIOS · regravação', dados: 'SSD · seus arquivos', placa: 'Trilhas da placa' }

/*
 * O laboratório: o notebook 3D se abre sozinho até a placa quando a seção aparece (sem
 * prender a rolagem) e cada procedimento acende a sua peça. Dá para girar arrastando.
 */
export function Laboratorio() {
  const raizRef = useRef<HTMLElement>(null)
  const palcoRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const marcadorRef = useRef<HTMLDivElement>(null)
  const [ativo, setAtivo] = useState<Foco>('solda')
  const [tocou, setTocou] = useState(false)
  const ativoRef = useRef<Foco>('solda')
  ativoRef.current = ativo

  useEffect(() => {
    const raiz = raizRef.current!
    const palco = palcoRef.current!
    const canvas = canvasRef.current!
    const marcador = marcadorRef.current!
    let cena: CenaLaboratorio | null = null
    let descartado = false
    let carregando = false
    let inicioAbertura = -1
    const movel = window.matchMedia('(max-width: 900px)').matches

    const carregar = () => {
      if (carregando) return
      carregando = true
      ocioso(150)
        .then(() => import('../tres/laboratorio'))
        .then(async ({ CenaLaboratorio }) => {
          if (descartado) return
          // compila em segundo plano: a rolagem não engasga quando a cena nasce
          const nova = new CenaLaboratorio(canvas, { movel })
          nova.resize(palco.clientWidth, palco.clientHeight, window.devicePixelRatio || 1)
          await nova.aquecer()
          if (descartado) return nova.dispose()
          cena = nova
          palco.classList.add('lab--pronto')
        })
        .catch(() => palco.classList.add('lab--sem3d'))
    }
    function layout() {
      cena?.resize(palco.clientWidth, palco.clientHeight, window.devicePixelRatio || 1)
    }

    let raf = 0
    let rodando = false
    function tick(agora: number) {
      raf = 0
      if (cena) {
        // a abertura começa quando a seção está bem à vista e leva 4,5 s
        if (inicioAbertura < 0) {
          const r = raiz.getBoundingClientRect()
          if (r.top < innerHeight * 0.55) inicioAbertura = agora
        }
        const abertura = inicioAbertura < 0 ? 0 : easeInOut(clamp((agora - inicioAbertura) / 4500))
        const foco = ativoRef.current
        cena.apply({ tempo: agora / 1000, abertura, foco })
        cena.render()
        const op = clamp((abertura - 0.85) / 0.15)
        css(marcador, 'opacity', f3(op))
        css(marcador, 'visibility', op > 0.01 ? 'visible' : 'hidden')
        if (op > 0.01) {
          const pt = cena.projetar(foco)
          css(marcador, 'transform', `translate3d(${px(pt.x)},${px(pt.y)},0)`)
          marcador.classList.toggle('marcador3d--esquerda', pt.x > palco.clientWidth - Math.min(300, palco.clientWidth * 0.42))
        }
      }
      if (rodando) raf = requestAnimationFrame(tick)
    }
    const iniciar = () => {
      if (rodando) return
      rodando = true
      raf = requestAnimationFrame(tick)
    }
    const parar = () => {
      rodando = false
      if (raf) cancelAnimationFrame(raf)
      raf = 0
    }
    // carrega a cena uma tela antes de a seção chegar; desenha só com ela à vista
    const perto = new IntersectionObserver(([e]) => e.isIntersecting && carregar(), { rootMargin: '120% 0px' })
    perto.observe(raiz)
    const io = new IntersectionObserver(([e]) => (e.isIntersecting && !document.hidden ? iniciar() : parar()), { rootMargin: '40px 0px' })
    io.observe(raiz)
    const aoVis = () => (document.hidden ? parar() : raiz.getBoundingClientRect().bottom > 0 && raiz.getBoundingClientRect().top < innerHeight && iniciar())
    document.addEventListener('visibilitychange', aoVis)
    const ro = new ResizeObserver(layout)
    ro.observe(palco)

    // arrastar para girar (mouse ou dedo na horizontal; a rolagem vertical continua livre)
    let x0: number | null = null
    const desce = (e: PointerEvent) => (x0 = e.clientX)
    const move = (e: PointerEvent) => {
      if (x0 === null || !cena) return
      cena.arrastar((e.clientX - x0) * 0.004)
      x0 = e.clientX
    }
    const sobe = () => (x0 = null)
    canvas.addEventListener('pointerdown', desce)
    window.addEventListener('pointermove', move, { passive: true })
    window.addEventListener('pointerup', sobe)
    return () => {
      descartado = true
      parar()
      perto.disconnect()
      io.disconnect()
      ro.disconnect()
      document.removeEventListener('visibilitychange', aoVis)
      canvas.removeEventListener('pointerdown', desce)
      window.removeEventListener('pointermove', move)
      window.removeEventListener('pointerup', sobe)
      cena?.dispose()
    }
  }, [])

  // enquanto ninguém interage, os procedimentos se revezam sozinhos
  useEffect(() => {
    if (tocou) return
    const ordem: Foco[] = ['solda', 'bios', 'dados', 'placa']
    const id = window.setInterval(() => setAtivo((a) => ordem[(ordem.indexOf(a) + 1) % ordem.length]), 3600)
    return () => window.clearInterval(id)
  }, [tocou])

  const escolher = (a: Foco) => {
    setTocou(true)
    setAtivo(a)
  }

  return (
    <section ref={raizRef} className="laboratorio" id="reparo-em-placa" aria-labelledby="lab-titulo">
      <div ref={palcoRef} className="lab-palco">
        <div className="lab-poster" aria-hidden="true" />
        <canvas ref={canvasRef} className="lab-canvas" aria-hidden="true" tabIndex={-1} />
        <div className="lab-vinheta" aria-hidden="true" />
        <div ref={marcadorRef} className="marcador3d lab-marcador" aria-hidden="true">
          <span className="marcador3d-ponto" />
          <span className="marcador3d-linha" />
          <span className="marcador3d-chip">
            <b>Laboratório</b>
            <i>{ROTULO[ativo]}</i>
          </span>
        </div>
        <p className="lab-arraste" aria-hidden="true">
          <Icone nome="seta" tamanho={14} /> Arraste para girar
        </p>
      </div>

      <div className="conteudo lab-conteudo">
        <div className="lab-texto">
          <p className="rotulo" data-decodifica>
            Laboratório · reparo em placa
          </p>
          <h2 id="lab-titulo" className="titulo-secao" data-titulo>
            Não resolve no martelo. Resolve na técnica.
          </h2>
          <p className="lede">É o diferencial técnico da Dr. Notebook: o reparo é feito nos componentes da placa. E o diagnóstico vem antes, para você saber o que o aparelho tem antes de decidir.</p>
          <ul className="lab-lista">
            {PROCEDIMENTOS.map((p) => (
              <li key={p.alvo}>
                <button type="button" className="lab-item" aria-pressed={ativo === p.alvo} onClick={() => escolher(p.alvo)} onMouseEnter={() => escolher(p.alvo)} onFocus={() => escolher(p.alvo)}>
                  <span className="lab-item-luz" aria-hidden="true" />
                  <span className="lab-item-titulo">{p.titulo}</span>
                  <span className="lab-item-texto">{p.texto}</span>
                </button>
              </li>
            ))}
          </ul>
          <div className="lab-acoes">
            <a className="botao botao--zap" href={linkWhatsApp(mensagemDoServico('reparo em placa'))} target="_blank" rel="noopener">
              <IconeWhatsApp /> Orçamento de reparo em placa
            </a>
            <a className="link-seta" href={href('servicos/reparo-em-placa/')}>
              Saiba mais <Icone nome="seta" tamanho={16} />
            </a>
          </div>
        </div>
      </div>
    </section>
  )
}
