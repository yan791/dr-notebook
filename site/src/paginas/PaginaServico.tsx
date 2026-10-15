import type { servicos } from '../dados/servicos'
import { linkWhatsApp, loja, mensagemDoServico } from '../dados/loja'
import { aparelhoPorId } from '../dados/triagem'
import { href } from '../dados/site'
import { Batimento } from '../componentes/Batimento'
import { ChamadaFinal } from '../componentes/Comuns'
import { Icone, IconeWhatsApp } from '../marca/Icones'
import { Triagem } from '../secoes/Triagem'
import { ComoFunciona } from '../secoes/ComoFunciona'
import { Especialidades } from '../secoes/Especialidades'
import '../secoes/secoes.css'

type Servico = (typeof servicos)[number]

/* Página de cada serviço: o título leva "Maceió" para as buscas locais e a triagem já
   abre com o aparelho do serviço escolhido. */
export function PaginaServico({ servico: s }: { servico: Servico }) {
  const aparelho = 'aparelho' in s ? aparelhoPorId(s.aparelho) : undefined
  const mensagem = mensagemDoServico(s.assunto)
  return (
    <>
      <section className="secao servico-hero" aria-labelledby="sv-titulo">
        <div className="conteudo sv-grade">
          <div>
            <nav className="sv-trilha" aria-label="Você está em">
              <a href={href()}>Início</a>
              <Icone nome="seta" tamanho={14} />
              <span aria-current="page">{s.titulo}</span>
            </nav>
            <p className="rotulo">
              {loja.nome} · {loja.cidade}
            </p>
            <h1 id="sv-titulo" className="titulo-secao sv-titulo" data-titulo>
              {s.pagina.titulo}
            </h1>
            <p className="lede">{s.pagina.chamada}</p>
            <div className="sv-acoes">
              <a className="botao botao--zap" href={linkWhatsApp(mensagem)} target="_blank" rel="noopener" data-magnetico>
                <IconeWhatsApp /> Pedir orçamento grátis
              </a>
              <a className="botao botao--linha" href="#triagem">
                Fazer a triagem online
              </a>
            </div>
            <p className="hs-prova">
              <Icone nome="estrela" tamanho={15} className="estrela-cheia" /> <b>{loja.avaliacoes.notaTexto}</b> no Google · {loja.avaliacoes.total} avaliações · desde {loja.desde}
            </p>
          </div>
          <aside className="sv-cartao" aria-label="O que a loja faz">
            <div className="sv-cartao-topo">
              <span className="sv-icone">
                <Icone nome={s.icone} tamanho={40} />
              </span>
              <Batimento className="sv-ecg" largura={300} altura={60} batidas={2} />
            </div>
            <p className="ft-sub">O que a loja faz</p>
            <ul className="sv-itens">
              {s.itens.map((it) => (
                <li key={it}>
                  <Icone nome="check" tamanho={16} /> {it}
                </li>
              ))}
            </ul>
            {'marcas' in s && s.marcas && <p className="esp-marcas">Marcas: {s.marcas.join(', ')}</p>}
          </aside>
        </div>
      </section>
      <Triagem inicial={aparelho?.id} titulo={aparelho ? `Conta o que está acontecendo com o seu ${aparelho.id === 'mac' ? 'Mac' : aparelho.id === 'pc' ? 'PC gamer' : aparelho.nome.toLowerCase()}.` : undefined} />
      <ComoFunciona />
      <Especialidades semTitulo excluir={s.slug} />
      <ChamadaFinal mensagem={mensagem} />
    </>
  )
}
