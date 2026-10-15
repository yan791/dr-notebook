import { Historia } from '../secoes/Historia'
import { Triagem } from '../secoes/Triagem'
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
 * A página é o atendimento: recepção e diagnóstico (hero 3D), triagem (o momento
 * interativo que vira mensagem), como funciona, especialidades, o laboratório, casos,
 * avaliações, dúvidas, onde estamos e a chamada final. Tudo afunila para o WhatsApp.
 */
export function Inicio() {
  return (
    <>
      <Historia />
      <Triagem />
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
