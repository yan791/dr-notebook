import { useEffect, useRef, useState } from 'react'
import { linkWhatsApp, mensagemDoServico } from '../dados/loja'
import { href } from '../dados/site'
import { Icone, IconeWhatsApp } from '../marca/Icones'
import { gsap } from '../lib/rolagem'

type Alvo = 'placa' | 'solda' | 'bios' | 'dados'

// textos do projeto original (seção "Reparo em placa")
const PROCEDIMENTOS: { alvo: Alvo; titulo: string; texto: string }[] = [
  { alvo: 'placa', titulo: 'Placa-mãe e placa de vídeo', texto: 'Conserto dos componentes na própria placa.' },
  { alvo: 'solda', titulo: 'Reballing', texto: 'Refaz as esferas de solda que ligam o chip à placa.' },
  { alvo: 'bios', titulo: 'Regravação de BIOS', texto: 'Reprograma o chip da BIOS quando o firmware corrompe.' },
  { alvo: 'dados', titulo: 'Recuperação de dados', texto: 'Resgate de arquivos de aparelhos que pararam de funcionar.' },
]

type Pt = [number, number]
// trilhas da placa (viewBox 640 x 440): saem do chip central para cada procedimento
const LIGACOES: { alvo: Alvo | 'energia'; pts: Pt[]; n: number }[] = [
  { alvo: 'placa', pts: [[250, 196], [214, 196], [196, 178], [182, 178]], n: 6 },
  { alvo: 'dados', pts: [[390, 178], [418, 178], [440, 156], [440, 150]], n: 6 },
  { alvo: 'bios', pts: [[372, 290], [372, 312], [392, 332], [470, 332]], n: 4 },
  { alvo: 'energia', pts: [[50, 352], [150, 352], [176, 326], [262, 326], [282, 306], [282, 290]], n: 5 },
  { alvo: 'placa', pts: [[125, 180], [125, 236], [150, 260], [240, 260], [250, 250]], n: 3 },
]

function caminho(pts: Pt[], dx: number, dy: number) {
  return pts.map(([x, y], i) => `${i ? 'L' : 'M'}${x + dx},${y + dy}`).join(' ')
}

// trilhas de fundo: barramentos finos com curvas de 45 graus, iguais em toda visita
const FUNDO: string[] = (() => {
  let s = 2005
  const r = () => (s = (s * 1664525 + 1013904223) >>> 0) / 4294967296
  const out: string[] = []
  for (let i = 0; i < 26; i++) {
    const vertical = i % 3 === 0
    if (vertical) {
      const x = 60 + r() * 520
      const y0 = 40 + r() * 60
      const y1 = y0 + 120 + r() * 200
      const d = (r() < 0.5 ? -1 : 1) * (12 + r() * 30)
      out.push(`M${x},${y0} V${y1} L${x + d},${y1 + Math.abs(d)} V${Math.min(400, y1 + Math.abs(d) + 40 + r() * 60)}`)
    } else {
      const y = 40 + r() * 360
      const x0 = 40 + r() * 120
      const x1 = x0 + 140 + r() * 260
      const d = (r() < 0.5 ? -1 : 1) * (10 + r() * 26)
      out.push(`M${x0},${y} H${x1} L${x1 + Math.abs(d)},${y + d} H${Math.min(600, x1 + Math.abs(d) + 40 + r() * 80)}`)
    }
  }
  return out
})()

export function Laboratorio() {
  const ref = useRef<HTMLElement>(null)
  const [ativo, setAtivo] = useState<Alvo>('solda')
  const [tocou, setTocou] = useState(false)

  // as trilhas se desenham com a rolagem
  useEffect(() => {
    const raiz = ref.current!
    const ctx = gsap.context(() => {
      gsap.fromTo(
        raiz.querySelectorAll('.lab-trilha'),
        { strokeDashoffset: 1 },
        { strokeDashoffset: 0, ease: 'none', stagger: 0.012, scrollTrigger: { trigger: raiz.querySelector('.lab-placa'), start: 'top 80%', end: 'center 50%', scrub: 0.8 } },
      )
    }, raiz)
    return () => ctx.revert()
  }, [])

  // enquanto ninguém interage, os procedimentos se revezam sozinhos
  useEffect(() => {
    if (tocou) return
    const ordem: Alvo[] = ['solda', 'bios', 'dados', 'placa']
    const id = window.setInterval(() => setAtivo((a) => ordem[(ordem.indexOf(a) + 1) % ordem.length]), 3200)
    return () => window.clearInterval(id)
  }, [tocou])

  const escolher = (a: Alvo) => {
    setTocou(true)
    setAtivo(a)
  }

  return (
    <section ref={ref} className="secao laboratorio" id="reparo-em-placa" aria-labelledby="lab-titulo">
      <div className="conteudo lab-grade">
        <div className="lab-texto">
          <p className="rotulo" data-decodifica>
            Laboratório
          </p>
          <h2 id="lab-titulo" className="titulo-secao" data-titulo>
            O reparo em placa, de perto.
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

        <div className="lab-visual" aria-hidden="true">
          <svg className="lab-placa" data-ativo={ativo} viewBox="0 0 640 440">
            <defs>
              <linearGradient id="lab-pcb" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0" stopColor="#0f2f74" />
                <stop offset="1" stopColor="#0a2155" />
              </linearGradient>
              <pattern id="lab-hach" width="9" height="9" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
                <line x1="0" y1="0" x2="0" y2="9" stroke="rgba(111,160,255,0.08)" strokeWidth="1" />
              </pattern>
            </defs>
            <rect x="20" y="20" width="600" height="400" rx="20" fill="url(#lab-pcb)" stroke="rgba(92,198,242,0.35)" />
            <rect x="20" y="20" width="600" height="400" rx="20" fill="url(#lab-hach)" />
            {[
              [44, 44],
              [596, 44],
              [44, 396],
              [596, 396],
            ].map(([x, y]) => (
              <g key={`${x}${y}`}>
                <circle cx={x} cy={y} r="10" fill="#c9a957" opacity="0.85" />
                <circle cx={x} cy={y} r="5" fill="#061430" />
              </g>
            ))}

            {/* trilhas */}
            {FUNDO.map((d, i) => (
              <path key={`f${i}`} className="lab-trilha lab-fundo" d={d} pathLength={1} />
            ))}
            {LIGACOES.map((l, k) =>
              Array.from({ length: l.n }, (_, i) => {
                const o = (i - (l.n - 1) / 2) * 7
                const [x0, y0] = l.pts[0]
                const [x1, y1] = l.pts[1]
                const horizontal = Math.abs(x1 - x0) > Math.abs(y1 - y0)
                return <path key={`${k}-${i}`} className={`lab-trilha t-${l.alvo}`} d={caminho(l.pts, horizontal ? 0 : o, horizontal ? o : 0)} pathLength={1} />
              }),
            )}

            {/* placa de vídeo / componentes da placa-mãe */}
            <g className="lab-alvo a-placa">
              <rect x="70" y="70" width="112" height="110" rx="8" />
              <rect x="98" y="98" width="56" height="54" rx="4" className="lab-die" />
            </g>
            {/* memória RAM */}
            <g className="lab-ram">
              <rect x="300" y="44" width="10" height="84" rx="2" />
              <rect x="318" y="44" width="10" height="84" rx="2" />
            </g>
            {/* chip do reballing, com a grade de esferas */}
            <g className="lab-alvo a-solda">
              <rect x="250" y="150" width="140" height="140" rx="10" />
              <g className="lab-esferas">
                {Array.from({ length: 64 }, (_, i) => (
                  <circle key={i} cx={268 + (i % 8) * 15} cy={168 + Math.floor(i / 8) * 15} r="3.4" />
                ))}
              </g>
              <rect x="282" y="182" width="76" height="76" rx="5" className="lab-die lab-tampa" />
            </g>
            {/* armazenamento (recuperação de dados) */}
            <g className="lab-alvo a-dados">
              <rect x="420" y="72" width="150" height="78" rx="8" />
              <rect x="438" y="88" width="50" height="46" rx="3" className="lab-die" />
              <rect x="502" y="88" width="50" height="46" rx="3" className="lab-die" />
            </g>
            {/* chip da BIOS, 8 pinos */}
            <g className="lab-alvo a-bios">
              <rect x="470" y="316" width="52" height="34" rx="4" />
              {[0, 1, 2, 3].map((i) => (
                <g key={i}>
                  <rect x={476 + i * 12} y="308" width="5" height="8" className="lab-pino" />
                  <rect x={476 + i * 12} y="350" width="5" height="8" className="lab-pino" />
                </g>
              ))}
            </g>
            {/* conector de energia */}
            <rect x="20" y="330" width="34" height="46" rx="4" className="lab-conector" />
            {/* componentes pequenos */}
            {Array.from({ length: 26 }, (_, i) => (
              <rect key={i} x={200 + ((i * 53) % 380)} y={300 + ((i * 37) % 100)} width="10" height="5" rx="1" className="lab-smd" />
            ))}
          </svg>
          <p className="lab-legenda">
            <span className="lab-legenda-luz" /> {PROCEDIMENTOS.find((p) => p.alvo === ativo)?.titulo}
          </p>
        </div>
      </div>
    </section>
  )
}
