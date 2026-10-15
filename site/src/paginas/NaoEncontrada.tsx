import { href } from '../dados/site'
import { linkWhatsApp } from '../dados/loja'
import { Batimento } from '../componentes/Batimento'
import { IconeWhatsApp } from '../marca/Icones'

export function NaoEncontrada() {
  return (
    <section className="secao nao-encontrada" aria-labelledby="ne-titulo">
      <div className="conteudo" style={{ paddingTop: 80, maxWidth: 760 }}>
        <Batimento largura={760} altura={90} batidas={2} vivo={false} />
        <p className="rotulo" style={{ marginTop: 32 }}>
          Erro 404
        </p>
        <h1 id="ne-titulo" className="titulo-secao">
          Esta página está sem sinal.
        </h1>
        <p className="lede">O endereço pode ter mudado. Volte para o início ou fale direto com a loja.</p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginTop: 28 }}>
          <a className="botao botao--linha" href={href()}>
            Voltar ao início
          </a>
          <a className="botao botao--zap" href={linkWhatsApp()} target="_blank" rel="noopener">
            <IconeWhatsApp /> Falar no WhatsApp
          </a>
        </div>
      </div>
    </section>
  )
}
