import { useId } from 'react'
import { logoGeometria as g } from './logo-geometria'

/*
 * Logo da loja redesenhada em SVG no projeto original (scripts/gerar-logo.mjs): "Dr."
 * pequeno, "Noteb" em degradê, o notebook com batimento no lugar do "oo" e o "k" com
 * estetoscópio. Cores pelos tokens --logo-*, para servir no escuro e no claro.
 * `vivo` faz o batimento da logo correr (no cabeçalho).
 */
export function Logo({ className, vivo = false, titulo }: { className?: string; vivo?: boolean; titulo?: string }) {
  const id = useId().replace(/:/g, '')
  const degrade = `url(#lg${id})`
  return (
    <svg viewBox={g.viewBox} className={className} role={titulo ? 'img' : undefined} aria-label={titulo} aria-hidden={titulo ? undefined : true} focusable="false">
      <defs>
        <linearGradient id={`lg${id}`} gradientUnits="userSpaceOnUse" x1={g.degrade.x1} x2={g.degrade.x2} y1={0} y2={0}>
          <stop offset={0} style={{ stopColor: 'var(--logo-inicio)' }} />
          <stop offset={1} style={{ stopColor: 'var(--logo-fim)' }} />
        </linearGradient>
      </defs>
      <g fill="none" strokeWidth={g.traco} strokeLinecap="round" strokeLinejoin="round">
        <path d={g.estetoscopio} style={{ stroke: 'var(--logo-estetoscopio)' }} />
        <path d={g.tela} style={{ stroke: 'var(--logo-aparelho)' }} />
        <path d={g.base} style={{ stroke: 'var(--logo-aparelho)' }} />
        <path d={g.batimento} stroke={degrade} />
        {vivo && <path className="logo-pulso" d={g.batimento} pathLength={1} stroke="var(--logo-estetoscopio)" />}
      </g>
      <g fill={degrade}>
        <path d={g.moldura} />
        <path d={g.letras.dr} />
        <path d={g.letras.noteb} />
        <path d={g.letras.k} />
      </g>
      {g.olivas.map((o) => (
        <circle key={o.cx} cx={o.cx} cy={o.cy} r={o.r} style={{ fill: 'var(--logo-estetoscopio)' }} />
      ))}
    </svg>
  )
}
