import { linkWhatsApp, loja } from '../dados/loja'
import { Icone, IconeWhatsApp } from '../marca/Icones'

/*
 * Dúvidas frequentes. Só com o que o briefing confirma; garantia e prazo não têm
 * número porque a loja ainda não informou (ver PENDENCIAS.md).
 */
const DUVIDAS: { p: string; r: string }[] = [
  { p: 'O orçamento é grátis?', r: `Sim. Você pode pedir pelo WhatsApp ou levar o aparelho até a loja, na ${loja.endereco.local}.` },
  { p: 'Preciso aprovar antes do conserto?', r: 'Sim. Primeiro vem o diagnóstico e o orçamento. O conserto só começa depois que você decide seguir.' },
  { p: 'O serviço tem garantia?', r: 'Sim, os serviços têm garantia. Pergunte no WhatsApp qual é o prazo para o seu caso.' },
  { p: 'Quanto tempo leva o conserto?', r: 'Depende do defeito e do aparelho. Conte o problema no WhatsApp e pergunte o prazo para o seu caso.' },
  { p: 'Vocês consertam MacBook, drone e PS5?', r: 'Sim. Além de notebooks e celulares, a loja faz reparo avançado em MacBook e iMac, conserto de drones DJI e de outras marcas, e reparo de placa de PS5 e de consoles retrô.' },
  { p: 'Meu aparelho molhou. O que eu faço?', r: 'Desligue, não tente ligar de novo e não coloque para carregar. Quanto antes ele chegar à bancada, melhor.' },
  {
    p: 'Onde fica a loja e qual o horário?',
    r: `${loja.endereco.local}, ${loja.endereco.rua}, ${loja.endereco.bairro}, ${loja.endereco.cidadeUf}. ${loja.horario.map((f) => `${f.dias}: ${f.horas}`).join('. ')}.`,
  },
]

export function Duvidas() {
  return (
    <section className="secao ficha duvidas" aria-labelledby="duv-titulo">
      <div className="conteudo duv-grade">
        <div className="duv-cabeca">
          <p className="rotulo">Antes de levar o aparelho</p>
          <h2 id="duv-titulo" className="titulo-secao" data-titulo>
            Dúvidas frequentes.
          </h2>
          <p className="lede">Não achou a sua? A loja responde no WhatsApp.</p>
          <a className="botao botao--zap" href={linkWhatsApp('Olá! Vim pelo site e tenho uma dúvida.')} target="_blank" rel="noopener">
            <IconeWhatsApp /> Perguntar no WhatsApp
          </a>
        </div>
        <div className="duv-lista">
          {DUVIDAS.map((d, i) => (
            <details key={d.p} className="duv-item" open={i === 0}>
              <summary>
                <span>{d.p}</span>
                <span className="duv-icone" aria-hidden="true">
                  <Icone nome="mais" tamanho={18} />
                </span>
              </summary>
              <p>{d.r}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  )
}
