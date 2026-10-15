import { useEffect, useId, useRef, useState } from 'react'
import { aparelhos, aparelhoPorId, mensagemDaTriagem, zonaDoSintoma, type IdAparelho } from '../dados/triagem'
import { linkWhatsApp, loja, statusDaLoja } from '../dados/loja'
import { Icone, IconeWhatsApp } from '../marca/Icones'
import { ocioso } from '../lib/rolagem'
import { clamp, css, f3, px } from '../lib/util'
import type { CenaRecepcao } from '../tres/recepcao'
import './Recepcao.css'

/*
 * O topo do site é a recepção da loja: a pergunta vem primeiro ("o que aconteceu com o
 * seu aparelho?"), o visitante escolhe o aparelho e o sintoma, e o aparelho em 3D reage,
 * acendendo em âmbar o ponto provável do defeito. Em dois toques a ficha vai pelo
 * WhatsApp. Nada prende a rolagem.
 */
export function Recepcao() {
  const [idAparelho, setIdAparelho] = useState<IdAparelho | null>(null)
  const [idSintoma, setIdSintoma] = useState<string | null>(null)
  const [modelo, setModelo] = useState('')
  const [status, setStatus] = useState<{ aberta: boolean; texto: string } | null>(null)
  const idModelo = useId()
  const raizRef = useRef<HTMLElement>(null)
  const palcoRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const marcadorRef = useRef<HTMLDivElement>(null)
  const estado = useRef<{ aparelho: IdAparelho | null; zona: string | null }>({ aparelho: null, zona: null })

  const aparelho = aparelhoPorId(idAparelho)
  const sintoma = aparelho?.sintomas.find((s) => s.id === idSintoma)
  const zona = zonaDoSintoma(idAparelho, idSintoma)
  estado.current = { aparelho: idAparelho, zona }
  const mensagem = mensagemDaTriagem(aparelho, sintoma, modelo)

  useEffect(() => {
    const atualizar = () => setStatus(statusDaLoja())
    atualizar()
    const id = window.setInterval(atualizar, 60000)
    return () => window.clearInterval(id)
  }, [])

  // a cena 3D: carrega depois da primeira pintura e só desenha com a recepção na tela
  useEffect(() => {
    const raiz = raizRef.current!
    const palco = palcoRef.current!
    const canvas = canvasRef.current!
    const marcador = marcadorRef.current!
    const topo = window.matchMedia('(max-width: 900px)')
    let cena: CenaRecepcao | null = null
    let descartado = false

    ocioso(60)
      .then(() => import('../tres/recepcao'))
      .then(async ({ CenaRecepcao }) => {
        if (descartado) return
        // a cena só passa a desenhar depois de compilada em segundo plano
        const nova = new CenaRecepcao(canvas, { movel: topo.matches })
        nova.resize(palco.clientWidth, palco.clientHeight, window.devicePixelRatio || 1)
        await nova.aquecer()
        if (descartado) return nova.dispose()
        cena = nova
        if (import.meta.env.DEV) (window as unknown as Record<string, unknown>).__recepcao = cena
        palco.classList.add('rc--pronto')
      })
      .catch(() => palco.classList.add('rc--sem3d'))

    function layout() {
      cena?.resize(palco.clientWidth, palco.clientHeight, window.devicePixelRatio || 1)
    }

    let raf = 0
    let rodando = false
    function tick(agora: number) {
      raf = 0
      if (cena) {
        cena.apply({ tempo: agora / 1000, aparelho: estado.current.aparelho, zona: estado.current.zona, modo: topo.matches ? 'topo' : 'lado' })
        cena.render()
        const pt = cena.projetarDefeito()
        // no desktop o marcador nunca invade a coluna da triagem (metade esquerda)
        const livre = topo.matches || (pt && pt.x > palco.clientWidth * 0.5)
        const op = pt && pt.frente && livre ? clamp(cena.forca * 1.4) : 0
        css(marcador, 'opacity', f3(op))
        css(marcador, 'visibility', op > 0.01 ? 'visible' : 'hidden')
        if (pt && op > 0.01) {
          css(marcador, 'transform', `translate3d(${px(pt.x)},${px(pt.y)},0)`)
          // perto da borda direita a etiqueta vira para a esquerda do ponto
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
    const io = new IntersectionObserver(([e]) => (e.isIntersecting && !document.hidden ? iniciar() : parar()), { rootMargin: '60px 0px' })
    io.observe(raiz)
    const aoVis = () => (document.hidden ? parar() : raiz.getBoundingClientRect().bottom > 0 && iniciar())
    document.addEventListener('visibilitychange', aoVis)
    const ro = new ResizeObserver(layout)
    ro.observe(palco)
    iniciar()
    return () => {
      descartado = true
      parar()
      io.disconnect()
      ro.disconnect()
      document.removeEventListener('visibilitychange', aoVis)
      cena?.dispose()
    }
  }, [])

  const escolherAparelho = (id: IdAparelho) => {
    setIdAparelho(id)
    setIdSintoma(null)
  }

  return (
    <section ref={raizRef} className="recepcao" id="inicio" aria-labelledby="rc-titulo">
      <div ref={palcoRef} className="rc-palco" aria-hidden="true">
        <div className="rc-poster" />
        <canvas ref={canvasRef} className="rc-canvas" tabIndex={-1} />
        <div className="rc-vinheta" />
        <div ref={marcadorRef} className="marcador3d marcador3d--alerta rc-marcador">
          <span className="marcador3d-ponto" />
          <span className="marcador3d-linha" />
          <span className="marcador3d-chip">
            <b>Possível causa</b>
            <i>{sintoma?.causas[0] ?? ''}</i>
          </span>
        </div>
      </div>

      <div className="conteudo rc-grade">
        <div className="rc-painel" id="triagem">
          <p className={`rc-status ${status ? (status.aberta ? 'rc-status--aberta' : 'rc-status--fechada') : ''}`}>
            <span className="rc-status-luz" aria-hidden="true" />
            <span>{status ? status.texto : `Assistência técnica em ${loja.cidade} desde ${loja.desde}`}</span>
            <span className="rc-status-local">
              {loja.endereco.local}, {loja.endereco.bairro}
            </span>
          </p>
          <h1 id="rc-titulo" className="rc-titulo" data-titulo>
            <span className="sr-only">Dr. Notebook Maceió, assistência técnica. </span>O que aconteceu com o seu aparelho?
          </h1>
          <p className="rc-sub">Escolha o aparelho e o problema. A loja recebe a ficha pelo WhatsApp e o orçamento é grátis.</p>

          <div className="rc-passo">
            <p className="rc-legenda" id="rc-l1">
              <span className={`rc-num ${aparelho ? 'rc-num--ok' : ''}`}>{aparelho ? <Icone nome="check" tamanho={13} /> : '1'}</span> Qual é o aparelho?
            </p>
            <div className="rc-aparelhos" role="group" aria-labelledby="rc-l1">
              {aparelhos.map((a) => (
                <button key={a.id} type="button" className="rc-aparelho" aria-pressed={idAparelho === a.id} onClick={() => escolherAparelho(a.id)}>
                  <Icone nome={a.icone} tamanho={20} />
                  <span>{a.nome}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="rc-passo">
            <p className="rc-legenda" id="rc-l2">
              <span className={`rc-num ${sintoma ? 'rc-num--ok' : ''}`}>{sintoma ? <Icone nome="check" tamanho={13} /> : '2'}</span> O que ele está fazendo?
            </p>
            {aparelho ? (
              <div className="rc-sintomas" role="group" aria-labelledby="rc-l2" key={aparelho.id}>
                {aparelho.sintomas.map((s, i) => (
                  <button key={s.id} type="button" className="rc-sintoma" aria-pressed={idSintoma === s.id} onClick={() => setIdSintoma(s.id)} style={{ animationDelay: `${i * 0.03}s` }}>
                    {s.nome}
                  </button>
                ))}
              </div>
            ) : (
              <p className="rc-dica">Escolha o aparelho para ver os problemas mais comuns.</p>
            )}
          </div>

          {sintoma && (
            <div className="rc-resultado" aria-live="polite" key={`${aparelho?.id}-${sintoma.id}`}>
              <p className="rc-pode">
                <b>O que pode ser:</b> {sintoma.causas.join(' · ')}
              </p>
              {sintoma.dica && (
                <p className="rc-alerta">
                  <Icone nome="alerta" tamanho={16} /> {sintoma.dica}
                </p>
              )}
              <label className="rc-modelo" htmlFor={idModelo}>
                <span>Marca e modelo (se souber)</span>
                <input id={idModelo} type="text" autoComplete="off" maxLength={60} placeholder="Ex.: Dell Inspiron 15, iPhone 12" value={modelo} onChange={(e) => setModelo(e.target.value)} />
              </label>
            </div>
          )}

          <div className="rc-acoes">
            <a className="botao botao--zap rc-enviar" href={linkWhatsApp(mensagem)} target="_blank" rel="noopener" data-magnetico>
              <IconeWhatsApp tamanho={20} /> {sintoma ? 'Enviar ficha pelo WhatsApp' : 'Pedir orçamento no WhatsApp'}
            </a>
            <p className="rc-nota">{sintoma ? 'A mensagem já vai escrita. A confirmação vem no diagnóstico, na loja.' : `Ou chame direto: ${loja.whatsapp.exibicao}`}</p>
          </div>

          <ul className="rc-confianca">
            <li>
              <Icone nome="estrela" tamanho={15} className="estrela-cheia" /> <b>{loja.avaliacoes.notaTexto}</b> no Google · {loja.avaliacoes.total} avaliações
            </li>
            <li>Desde {loja.desde}</li>
            <li>Diagnóstico antes do serviço</li>
            <li>Garantia nos serviços</li>
          </ul>
        </div>
      </div>
    </section>
  )
}
