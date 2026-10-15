import { useEffect, useRef } from 'react'
import { temasMaisCitados, trechos } from '../dados/avaliacoes'
import { loja } from '../dados/loja'
import { Icone } from '../marca/Icones'
import { gsap } from '../lib/rolagem'

const MAIOR = Math.max(...temasMaisCitados.map((t) => t.mencoes))

/* Prova social real: a nota do Google, os temas mais citados e os trechos das avaliações. */
export function Avaliacoes() {
  const ref = useRef<HTMLElement>(null)

  useEffect(() => {
    const raiz = ref.current!
    const numero = raiz.querySelector<HTMLElement>('.av-nota-num')!
    const ctx = gsap.context(() => {
      const o = { v: 0 }
      gsap.to(o, {
        v: loja.avaliacoes.nota,
        duration: 1.6,
        ease: 'power3.out',
        scrollTrigger: { trigger: raiz.querySelector('.av-nota'), start: 'top 82%', once: true },
        onUpdate: () => (numero.textContent = o.v.toFixed(1).replace('.', ',')),
      })
      gsap.fromTo(raiz.querySelector('.av-estrelas-cheias'), { clipPath: 'inset(0 100% 0 0)' }, { clipPath: `inset(0 ${100 - (loja.avaliacoes.nota / 5) * 100}% 0 0)`, duration: 1.6, ease: 'power3.out', scrollTrigger: { trigger: raiz.querySelector('.av-nota'), start: 'top 82%', once: true } })
      gsap.fromTo(raiz.querySelectorAll('.av-barra i'), { scaleX: 0 }, { scaleX: 1, duration: 1.2, ease: 'expo.out', stagger: 0.08, scrollTrigger: { trigger: raiz.querySelector('.av-temas'), start: 'top 85%', once: true } })
    }, raiz)
    return () => ctx.revert()
  }, [])

  const estrelas = (classe: string) => (
    <span className={classe}>
      {[0, 1, 2, 3, 4].map((i) => (
        <Icone key={i} nome="estrela" tamanho={26} />
      ))}
    </span>
  )

  return (
    <section ref={ref} className="secao avaliacoes" id="avaliacoes" aria-labelledby="av-titulo">
      <div className="conteudo">
        <p className="rotulo">Avaliações</p>
        <h2 id="av-titulo" className="titulo-secao" data-titulo>
          O que dizem os clientes.
        </h2>
        <div className="av-grade">
          <div className="av-nota">
            <p className="av-nota-linha">
              <span className="av-nota-num">{loja.avaliacoes.notaTexto}</span>
              <span className="av-estrelas" aria-hidden="true">
                {estrelas('av-estrelas-vazias')}
                {estrelas('av-estrelas-cheias')}
              </span>
            </p>
            <p className="av-total">
              <b>{loja.avaliacoes.total}</b> avaliações no Google
            </p>
            <p className="av-resposta">Todas as avaliações no Google têm resposta da loja.</p>
            <div className="av-temas">
              <p className="ft-sub">O que mais aparece nas avaliações</p>
              <ul>
                {temasMaisCitados.map((t) => (
                  <li key={t.tema}>
                    <span>{t.tema}</span>
                    <span className="av-barra" aria-hidden="true">
                      <i style={{ width: `${(t.mencoes / MAIOR) * 100}%` }} />
                    </span>
                    <span className="av-mencoes">{t.mencoes}</span>
                  </li>
                ))}
              </ul>
            </div>
            <a className="link-seta" href={loja.mapas.perfil} target="_blank" rel="noopener">
              Ver as avaliações no Google <Icone nome="diagonal" tamanho={16} />
            </a>
          </div>
          <div className="av-trechos" data-entra="filhos">
            {trechos.map((t) =>
              t.tipo === 'citacao' ? (
                <figure key={t.texto} className="av-trecho">
                  <span className="av-aspas" aria-hidden="true">
                    “
                  </span>
                  <blockquote>{t.texto}</blockquote>
                  <figcaption>Avaliação no Google</figcaption>
                </figure>
              ) : (
                <figure key={t.texto} className="av-trecho av-trecho--relato">
                  <p className="av-relato">{t.texto}</p>
                  <figcaption>Relato de uma cliente no Google</figcaption>
                </figure>
              ),
            )}
          </div>
        </div>
      </div>
    </section>
  )
}
