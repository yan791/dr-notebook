import { useId, useState } from 'react'
import { aparelhos, aparelhoPorId, mensagemDaTriagem, type IdAparelho } from '../dados/triagem'
import { linkWhatsApp } from '../dados/loja'
import { Batimento } from '../componentes/Batimento'
import { Icone, IconeWhatsApp } from '../marca/Icones'
import './Triagem.css'

/*
 * O momento interativo do site: a recepção da loja. O visitante escolhe o aparelho e o
 * sintoma, a ficha se monta ao lado (o batimento volta quando ela fica pronta) e o botão
 * abre o WhatsApp com a mensagem escrita. Impressiona e já entrega o cliente explicando
 * o problema.
 */
export function Triagem({ inicial, titulo = 'Conta pra gente o que está acontecendo.' }: { inicial?: IdAparelho; titulo?: string }) {
  const [idAparelho, setIdAparelho] = useState<IdAparelho | null>(inicial ?? null)
  const [idSintoma, setIdSintoma] = useState<string | null>(null)
  const [modelo, setModelo] = useState('')
  const idModelo = useId()

  const aparelho = aparelhoPorId(idAparelho)
  const sintoma = aparelho?.sintomas.find((s) => s.id === idSintoma)
  const pronta = Boolean(aparelho && sintoma)
  const mensagem = mensagemDaTriagem(aparelho, sintoma, modelo)

  const escolherAparelho = (id: IdAparelho) => {
    setIdAparelho(id)
    setIdSintoma(null)
  }

  return (
    <section className="secao triagem" id="triagem" aria-labelledby="triagem-titulo">
      <div className="conteudo triagem-grade">
        <div className="triagem-passos">
          <p className="rotulo" data-decodifica>
            Triagem online
          </p>
          <h2 id="triagem-titulo" className="titulo-secao" data-titulo>
            {titulo}
          </h2>
          <p className="lede">Em três toques você monta a ficha do aparelho e manda pelo WhatsApp. A loja já recebe sabendo do que se trata.</p>

          <fieldset className="tr-passo">
            <legend>
              <span className={`tr-num ${aparelho ? 'tr-num--ok' : ''}`}>{aparelho ? <Icone nome="check" tamanho={14} /> : '1'}</span> Qual é o aparelho?
            </legend>
            <div className="tr-aparelhos">
              {aparelhos.map((a) => (
                <button key={a.id} type="button" className="tr-aparelho" aria-pressed={idAparelho === a.id} onClick={() => escolherAparelho(a.id)}>
                  <Icone nome={a.icone} tamanho={30} />
                  <span>{a.nome}</span>
                </button>
              ))}
            </div>
          </fieldset>

          <fieldset className="tr-passo" disabled={!aparelho}>
            <legend>
              <span className={`tr-num ${sintoma ? 'tr-num--ok' : ''}`}>{sintoma ? <Icone nome="check" tamanho={14} /> : '2'}</span> O que ele está fazendo?
            </legend>
            {aparelho ? (
              <div className="tr-sintomas" key={aparelho.id}>
                {aparelho.sintomas.map((s, i) => (
                  <button key={s.id} type="button" className="tr-sintoma" aria-pressed={idSintoma === s.id} onClick={() => setIdSintoma(s.id)} style={{ animationDelay: `${i * 0.035}s` }}>
                    {s.nome}
                  </button>
                ))}
              </div>
            ) : (
              <p className="tr-vazio">Escolha o aparelho primeiro.</p>
            )}
          </fieldset>

          <div className="tr-passo">
            <label className="tr-legenda" htmlFor={idModelo}>
              <span className={`tr-num ${modelo.trim() ? 'tr-num--ok' : ''}`}>{modelo.trim() ? <Icone nome="check" tamanho={14} /> : '3'}</span> Marca e modelo <em>(se souber)</em>
            </label>
            <input id={idModelo} className="tr-campo" type="text" inputMode="text" autoComplete="off" maxLength={60} placeholder="Ex.: Dell Inspiron 15, iPhone 12, DJI Mini 3" value={modelo} onChange={(e) => setModelo(e.target.value)} />
          </div>
        </div>

        <aside className={`ficha-triagem ${pronta ? 'ficha-triagem--pronta' : ''}`} aria-label="Ficha de triagem" aria-live="polite">
          <header className="ft-topo">
            <span className="ft-led" aria-hidden="true" />
            <span className="rotulo">Ficha de triagem</span>
            <span className="ft-loja">Dr. Notebook · Maceió</span>
          </header>
          <dl className="ft-dados">
            <div>
              <dt>Aparelho</dt>
              <dd>{aparelho?.nome ?? <span className="ft-falta">aguardando</span>}</dd>
            </div>
            <div>
              <dt>Marca e modelo</dt>
              <dd>{modelo.trim() || <span className="ft-falta">opcional</span>}</dd>
            </div>
            <div>
              <dt>Sintoma</dt>
              <dd>{sintoma?.nome ?? <span className="ft-falta">aguardando</span>}</dd>
            </div>
          </dl>
          <Batimento className="ft-ecg" largura={520} altura={70} batidas={3} vivo={pronta} />
          <div className="ft-causas">
            <p className="ft-sub">{pronta ? 'O que pode ser' : 'Sinal'}</p>
            {sintoma ? (
              <ul key={sintoma.id}>
                {sintoma.causas.map((c) => (
                  <li key={c}>{c}</li>
                ))}
              </ul>
            ) : (
              <p className="ft-espera">Escolha o aparelho e o sintoma para montar a ficha.</p>
            )}
            {sintoma?.dica && (
              <p className="ft-dica">
                <Icone nome="alerta" tamanho={16} /> {sintoma.dica}
              </p>
            )}
          </div>
          <p className="ft-nota">A confirmação vem no diagnóstico, na loja. O orçamento é grátis.</p>
          <a className="botao botao--zap ft-enviar" href={linkWhatsApp(mensagem)} target="_blank" rel="noopener" data-magnetico>
            <IconeWhatsApp tamanho={20} /> {aparelho ? 'Enviar ficha pelo WhatsApp' : 'Pedir orçamento no WhatsApp'}
          </a>
          <p className="ft-rodape">A mensagem já vai escrita. É só apertar enviar.</p>
        </aside>
      </div>
    </section>
  )
}
