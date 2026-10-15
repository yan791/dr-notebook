/*
 * O batimento da logo, a assinatura do site: reto quando o aparelho está "sem
 * sinal", batendo quando ele volta. O caminho é gerado aqui (onda P, QRS e T) para
 * qualquer largura e número de batidas.
 */

export function caminhoECG(largura: number, altura: number, batidas: number, folgaInicio = 0.08, folgaFim = 0.08) {
  const meio = altura / 2
  const a = altura / 2 - 2
  const ini = largura * folgaInicio
  const util = largura * (1 - folgaInicio - folgaFim)
  const B = util / batidas
  const f = (n: number) => Math.round(n * 10) / 10
  let d = `M0,${f(meio)} H${f(ini)}`
  for (let i = 0; i < batidas; i++) {
    const x = ini + i * B
    d += ` H${f(x + B * 0.16)}`
    d += ` Q${f(x + B * 0.22)},${f(meio - a * 0.22)} ${f(x + B * 0.28)},${f(meio)}`
    d += ` H${f(x + B * 0.36)} L${f(x + B * 0.385)},${f(meio + a * 0.18)} L${f(x + B * 0.42)},${f(meio - a * 0.98)} L${f(x + B * 0.455)},${f(meio + a * 0.5)} L${f(x + B * 0.48)},${f(meio)}`
    d += ` H${f(x + B * 0.58)} Q${f(x + B * 0.66)},${f(meio - a * 0.34)} ${f(x + B * 0.74)},${f(meio)} H${f(x + B)}`
  }
  d += ` H${f(largura)}`
  return d
}

type Props = {
  largura?: number
  altura?: number
  batidas?: number
  className?: string
  /** reto (sem sinal) ou vivo (batendo); a troca é animada no CSS */
  vivo?: boolean
}

export function Batimento({ largura = 600, altura = 80, batidas = 3, className = '', vivo = true }: Props) {
  const d = caminhoECG(largura, altura, batidas)
  const reto = `M0,${altura / 2} H${largura}`
  return (
    <svg className={`ecg ${vivo ? 'ecg--vivo' : 'ecg--reto'} ${className}`} viewBox={`0 0 ${largura} ${altura}`} preserveAspectRatio="none" fill="none" aria-hidden="true" focusable="false">
      <path className="ecg-reto" d={reto} pathLength={1} />
      <path className="ecg-linha" d={d} pathLength={1} />
      <path className="ecg-pulso" d={d} pathLength={1} />
    </svg>
  )
}
