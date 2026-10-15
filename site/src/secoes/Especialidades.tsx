import { useState } from 'react'
import { caminhoDoServico, loja as lojaInfo, servicos } from '../dados/servicos'
import { linkWhatsApp, mensagemDoServico } from '../dados/loja'
import { href } from '../dados/site'
import { Icone, IconeWhatsApp } from '../marca/Icones'

/*
 * Índice de especialidades em linhas (e não nove cartões iguais): uma aberta por vez,
 * cada uma com a página do serviço e o atalho do WhatsApp com a mensagem do serviço.
 */
export function Especialidades({ semTitulo = false, excluir }: { semTitulo?: boolean; excluir?: string }) {
  const lista = servicos.filter((s) => s.slug !== excluir)
  const [aberta, setAberta] = useState<string | null>(semTitulo ? null : lista[0]?.slug ?? null)

  return (
    <section className="secao especialidades" id={semTitulo ? undefined : 'servicos'} aria-labelledby="esp-titulo">
      <div className="conteudo">
        <div className="esp-cabeca">
          <p className="rotulo">{semTitulo ? 'Outros serviços' : 'Especialidades'}</p>
          <h2 id="esp-titulo" className="titulo-secao" data-titulo>
            {semTitulo ? 'A loja também cuida de' : 'Do notebook ao drone.'}
          </h2>
          {!semTitulo && <p className="lede">Técnicos especializados e laboratório próprio para diagnóstico e reparo.</p>}
        </div>
        <ul className="esp-lista">
          {lista.map((s, i) => {
            const on = aberta === s.slug
            const id = `esp-${s.slug}`
            return (
              <li key={s.slug} className={`esp-item ${on ? 'esp-item--on' : ''}`}>
                <h3>
                  <button type="button" className="esp-linha" aria-expanded={on} aria-controls={id} onClick={() => setAberta(on ? null : s.slug)}>
                    <span className="esp-n">{String(i + 1).padStart(2, '0')}</span>
                    <span className="esp-icone">
                      <Icone nome={s.icone} tamanho={26} />
                    </span>
                    <span className="esp-nome">
                      {s.titulo}
                      {s.slug === 'reparo-em-placa' && <span className="esp-selo">Diferencial</span>}
                    </span>
                    <span className="esp-resumo">{s.resumo}</span>
                    <span className="esp-mais" aria-hidden="true">
                      <Icone nome="mais" tamanho={20} />
                    </span>
                  </button>
                </h3>
                <div className="esp-painel" id={id}>
                  <div className="esp-painel-dentro">
                    <ul className="esp-itens">
                      {s.itens.map((it) => (
                        <li key={it}>{it}</li>
                      ))}
                    </ul>
                    {'marcas' in s && s.marcas && <p className="esp-marcas">Marcas: {s.marcas.join(', ')}</p>}
                    <div className="esp-acoes">
                      <a className="botao botao--zap botao--pequeno" href={linkWhatsApp(mensagemDoServico(s.assunto))} target="_blank" rel="noopener" tabIndex={on ? 0 : -1}>
                        <IconeWhatsApp tamanho={18} /> Pedir orçamento
                      </a>
                      <a className="link-seta" href={href(caminhoDoServico(s.slug))} tabIndex={on ? 0 : -1}>
                        Ver detalhes <Icone nome="seta" tamanho={16} />
                      </a>
                    </div>
                  </div>
                </div>
              </li>
            )
          })}
          {!excluir && (
            <li className={`esp-item ${aberta === 'loja' ? 'esp-item--on' : ''}`}>
              <h3>
                <button type="button" className="esp-linha" aria-expanded={aberta === 'loja'} aria-controls="esp-loja" onClick={() => setAberta(aberta === 'loja' ? null : 'loja')}>
                  <span className="esp-n">{String(lista.length + 1).padStart(2, '0')}</span>
                  <span className="esp-icone">
                    <Icone nome="loja" tamanho={26} />
                  </span>
                  <span className="esp-nome">{lojaInfo.titulo}</span>
                  <span className="esp-resumo">{lojaInfo.resumo}</span>
                  <span className="esp-mais" aria-hidden="true">
                    <Icone nome="mais" tamanho={20} />
                  </span>
                </button>
              </h3>
              <div className="esp-painel" id="esp-loja">
                <div className="esp-painel-dentro">
                  <div className="esp-acoes">
                    <a className="botao botao--zap botao--pequeno" href={linkWhatsApp(lojaInfo.mensagem)} target="_blank" rel="noopener" tabIndex={aberta === 'loja' ? 0 : -1}>
                      <IconeWhatsApp tamanho={18} /> Perguntar no WhatsApp
                    </a>
                  </div>
                </div>
              </div>
            </li>
          )}
        </ul>
      </div>
    </section>
  )
}
