import type { PointerEvent } from 'react'
import { linkWhatsApp, mensagemDoServico } from '../dados/loja'
import { href } from '../dados/site'
import { Icone, IconeWhatsApp, type NomeIcone } from '../marca/Icones'

/*
 * Três especialidades com público próprio (e buscas que a loja ainda não pega no
 * Google: drone e PS5). Os títulos são frases da própria loja nas artes e no projeto
 * original; os sintomas do Mac vêm da arte "Seu Mac parou?".
 */
const CASOS: { icone: NomeIcone; titulo: string; texto: string; sinais?: string[]; assunto: string; slug: string; botao: string }[] = [
  {
    icone: 'mac',
    titulo: 'Seu Mac parou? A gente resolve.',
    texto: 'Especialistas em MacBook e iMac: reparo avançado de placa e troca de tela.',
    sinais: ['Não liga', 'Travou do nada', 'Superaquecendo', 'Desligando sozinho', 'Tela preta ou não carrega'],
    assunto: 'conserto de MacBook ou iMac',
    slug: 'macbook-e-imac',
    botao: 'Pedir orçamento',
  },
  {
    icone: 'drone',
    titulo: 'Não sabe onde levar o seu drone?',
    texto: 'DJI e outras marcas, com laboratório próprio para diagnóstico e reparo, aqui na Jatiúca.',
    assunto: 'conserto de drone',
    slug: 'conserto-de-drone',
    botao: 'Pedir orçamento',
  },
  {
    icone: 'videogame',
    titulo: 'PS5 sem imagem? Console retrô parado?',
    texto: 'Reparo de placa de PS5 e de consoles retrô, como o Super Nintendo.',
    assunto: 'conserto de videogame',
    slug: 'conserto-de-videogame',
    botao: 'Pedir orçamento',
  },
]

const seguir = (e: PointerEvent<HTMLElement>) => {
  const r = e.currentTarget.getBoundingClientRect()
  e.currentTarget.style.setProperty('--mx', `${e.clientX - r.left}px`)
  e.currentTarget.style.setProperty('--my', `${e.clientY - r.top}px`)
}

export function Casos() {
  return (
    <section className="secao casos" aria-labelledby="casos-titulo">
      <div className="conteudo">
        <p className="rotulo">Também na bancada</p>
        <h2 id="casos-titulo" className="titulo-secao" data-titulo>
          Mac, drone e videogame também.
        </h2>
        <div className="casos-grade" data-entra="filhos">
          {CASOS.map((c) => (
            <article key={c.slug} className="caso" onPointerMove={seguir}>
              <span className="caso-icone" aria-hidden="true">
                <Icone nome={c.icone} tamanho={64} />
              </span>
              <h3>{c.titulo}</h3>
              <p>{c.texto}</p>
              {c.sinais && (
                <ul className="caso-sinais" aria-label="Sintomas comuns">
                  {c.sinais.map((s) => (
                    <li key={s}>{s}</li>
                  ))}
                </ul>
              )}
              <div className="caso-acoes">
                <a className="botao botao--zap botao--pequeno" href={linkWhatsApp(mensagemDoServico(c.assunto))} target="_blank" rel="noopener">
                  <IconeWhatsApp tamanho={18} /> {c.botao}
                </a>
                <a className="link-seta" href={href(`servicos/${c.slug}/`)} aria-label={`Ver detalhes: ${c.titulo}`}>
                  Detalhes <Icone nome="seta" tamanho={16} />
                </a>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}
