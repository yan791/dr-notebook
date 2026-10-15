import { Recepcao } from '../secoes/Recepcao'
import { ComoFunciona } from '../secoes/ComoFunciona'
import { Especialidades } from '../secoes/Especialidades'
import { Laboratorio } from '../secoes/Laboratorio'
import { Casos } from '../secoes/Casos'
import { Avaliacoes } from '../secoes/Avaliacoes'
import { Duvidas } from '../secoes/Duvidas'
import { OndeEstamos } from '../secoes/OndeEstamos'
import { ChamadaFinal, Marcas } from '../componentes/Comuns'
import '../secoes/secoes.css'

/*
 * A página é o atendimento: a recepção no topo (a triagem, com o aparelho 3D apontando o
 * defeito provável), como funciona, especialidades, o laboratório (o chip em 3D), casos,
 * avaliações, dúvidas, onde estamos e a chamada final. Tudo afunila para o WhatsApp e
 * nenhuma seção prende a rolagem.
 */
export function Inicio() {
  return (
    <>
      <Recepcao />
      <Marcas />
      <ComoFunciona />
      <Especialidades />
      <Laboratorio />
      <Casos />
      <Avaliacoes />
      <Duvidas />
      <OndeEstamos />
      <ChamadaFinal />
    </>
  )
}
