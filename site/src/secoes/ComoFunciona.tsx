import { useEffect, useRef } from 'react'
import { caminhoECG } from '../componentes/Batimento'
import { linkWhatsApp } from '../dados/loja'
import { Icone, IconeWhatsApp, type NomeIcone } from '../marca/Icones'
import { gsap, ScrollTrigger } from '../lib/rolagem'

// os argumentos que a loja repete (briefing, "Tom de voz"), sem prazo de garantia nem de reparo
const PASSOS: { titulo: string; texto: string; icone: NomeIcone }[] = [
  { titulo: 'Triagem', texto: 'Você conta o problema pelo WhatsApp ou passa na loja.', icone: 'celular' },
  { titulo: 'Diagnóstico', texto: 'O técnico descobre o motivo antes de mexer em qualquer peça.', icone: 'chip' },
  { titulo: 'Orçamento', texto: 'Grátis. Você decide se quer seguir com o conserto.', icone: 'check' },
  { titulo: 'Alta', texto: 'Aparelho de volta, com garantia no serviço.', icone: 'notebook' },
]

/* O batimento se desenha com a rolagem e acende cada etapa quando passa por ela. */
export function ComoFunciona() {
  const ref = useRef<HTMLElement>(null)

  useEffect(() => {
    const raiz = ref.current!
    const linha = raiz.querySelector<SVGPathElement>('.cf-linha')!
    const passos = Array.from(raiz.querySelectorAll<HTMLElement>('.cf-passo'))
    const st = ScrollTrigger.create({
      trigger: raiz.querySelector('.cf-trilha'),
      start: 'top 78%',
      end: 'bottom 45%',
      scrub: 0.6,
      onUpdate: (s) => {
        const p = s.progress
        gsap.set(linha, { strokeDashoffset: 1 - p })
        raiz.style.setProperty('--prog', p.toFixed(3))
        passos.forEach((el, i) => el.classList.toggle('cf-passo--aceso', p >= (i + 0.35) / PASSOS.length))
      },
    })
    return () => st.kill()
  }, [])

  return (
    <section ref={ref} className="secao ficha como-funciona" aria-labelledby="cf-titulo">
      <div className="conteudo">
        <div className="cf-cabeca">
          <div>
            <p className="rotulo">Como funciona</p>
            <h2 id="cf-titulo" className="titulo-secao" data-titulo>
              Do primeiro contato até a alta.
            </h2>
          </div>
          <p className="lede">Orçamento grátis e diagnóstico antes do serviço. Você sabe o que o aparelho tem antes de decidir.</p>
        </div>
        <div className="cf-trilha">
          <svg className="cf-ecg" viewBox="0 0 1200 120" preserveAspectRatio="none" aria-hidden="true" focusable="false">
            <path className="cf-base" d={caminhoECG(1200, 120, 4, 0.02, 0.02)} />
            <path className="cf-linha" d={caminhoECG(1200, 120, 4, 0.02, 0.02)} pathLength={1} />
          </svg>
          <ol className="cf-passos">
            {PASSOS.map((p, i) => (
              <li key={p.titulo} className="cf-passo">
                <span className="cf-no" aria-hidden="true">
                  <Icone nome={p.icone} tamanho={22} />
                </span>
                <span className="rotulo">Etapa 0{i + 1}</span>
                <h3>{p.titulo}</h3>
                <p>{p.texto}</p>
              </li>
            ))}
          </ol>
        </div>
        <div className="cf-acoes">
          <a className="botao botao--zap" href={linkWhatsApp()} target="_blank" rel="noopener">
            <IconeWhatsApp /> Começar pelo WhatsApp
          </a>
          <a className="link-seta" href="#triagem">
            Ou faça a triagem online <Icone nome="seta" tamanho={16} />
          </a>
        </div>
      </div>
    </section>
  )
}
