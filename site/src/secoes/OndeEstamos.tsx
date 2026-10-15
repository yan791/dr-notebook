import { useEffect, useState } from 'react'
import { estaAberta, linkWhatsApp, loja, statusDaLoja } from '../dados/loja'
import { arquivo } from '../dados/site'
import { Icone, IconeWhatsApp } from '../marca/Icones'

/* Onde estamos, com o status "aberto agora" calculado pelo horário real da loja. */
export function OndeEstamos() {
  const [status, setStatus] = useState<{ aberta: boolean; texto: string } | null>(null)
  const [hoje, setHoje] = useState(-1)

  useEffect(() => {
    const atualizar = () => {
      setStatus(statusDaLoja())
      const dia = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(new Intl.DateTimeFormat('en-US', { timeZone: 'America/Maceio', weekday: 'short' }).format(new Date()))
      setHoje(loja.horario.findIndex((f) => (estaAberta(f) ? f.semana.includes(dia) : dia === 0)))
    }
    atualizar()
    const id = window.setInterval(atualizar, 60000)
    return () => window.clearInterval(id)
  }, [])

  return (
    <section className="secao onde" id="onde-estamos" aria-labelledby="onde-titulo">
      <div className="conteudo onde-grade">
        <div className="onde-texto">
          <p className="rotulo">Onde estamos</p>
          <h2 id="onde-titulo" className="titulo-secao" data-titulo>
            Na {loja.endereco.local}, em {loja.endereco.bairro}.
          </h2>
          <p className={`onde-status ${status ? (status.aberta ? 'onde-status--aberta' : 'onde-status--fechada') : ''}`} aria-live="polite">
            <span className="onde-status-luz" aria-hidden="true" />
            {status ? status.texto : 'Loja física em Maceió, de segunda a sábado'}
          </p>
          <div className="onde-dados">
            <div>
              <p className="ft-sub">Endereço</p>
              <address>
                {loja.endereco.local}
                <br />
                {loja.endereco.rua}
                <br />
                {loja.endereco.bairro}, {loja.endereco.cidadeUf}
                <br />
                CEP {loja.endereco.cep}
              </address>
            </div>
            <div>
              <p className="ft-sub">Horário</p>
              <ul className="onde-horario">
                {loja.horario.map((f, i) => (
                  <li key={f.dias} className={i === hoje ? 'onde-hoje' : ''}>
                    <span>{f.dias}</span>
                    <span>{f.horas}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <p className="ft-sub">WhatsApp</p>
              <a href={linkWhatsApp()} target="_blank" rel="noopener">
                {loja.whatsapp.exibicao}
              </a>
            </div>
            <div>
              <p className="ft-sub">E-mail e Instagram</p>
              <a href={`mailto:${loja.email}`}>{loja.email}</a>
              <br />
              <a href={loja.instagram.link} target="_blank" rel="noopener">
                {loja.instagram.usuario}
              </a>
            </div>
          </div>
          <div className="onde-acoes">
            <a className="botao botao--zap" href={loja.mapas.rota} target="_blank" rel="noopener">
              <Icone nome="rota" tamanho={18} /> Como chegar
            </a>
            <a className="botao botao--linha" href={loja.mapas.perfil} target="_blank" rel="noopener">
              <Icone nome="pin" tamanho={18} /> Ver no Google Maps
            </a>
          </div>
        </div>
        <figure className="onde-foto">
          <div className="onde-foto-moldura">
            <img src={arquivo('img/loja.jpg')} alt="Interior da loja: balcão preto, parede azul-marinho com a logo iluminada, estante com action figures e sofá de espera." width={382} height={455} loading="lazy" decoding="async" />
          </div>
          <figcaption>
            <Icone nome="pin" tamanho={14} /> A loja na {loja.endereco.local}
            <a className="onde-foto-zap" href={linkWhatsApp('Olá! Vim pelo site e quero passar na loja.')} target="_blank" rel="noopener">
              <IconeWhatsApp tamanho={16} /> Avisar que vou passar
            </a>
          </figcaption>
        </figure>
      </div>
    </section>
  )
}
