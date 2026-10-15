export const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v))
export const inv = (a: number, b: number, v: number) => clamp((v - a) / (b - a))
export const suave = (t: number) => t * t * (3 - 2 * t)
export const easeOut = (t: number) => 1 - Math.pow(1 - t, 3)
export const easeInOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2)
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t

/** Gerador com semente: os valores "aleatórios" são iguais em toda visita (e no pré-render). */
export function rng(semente: number) {
  let s = semente >>> 0
  return () => (s = (s * 1664525 + 1013904223) >>> 0) / 4294967296
}

/** Escrita de estilo só quando o valor muda (o loop do palco roda a cada quadro). */
const cache = new WeakMap<Element, Record<string, string>>()
export function css(el: HTMLElement | SVGElement | null | undefined, prop: string, val: string) {
  if (!el) return
  let c = cache.get(el)
  if (!c) cache.set(el, (c = {}))
  if (c[prop] === val) return
  c[prop] = val
  if (prop.startsWith('--')) el.style.setProperty(prop, val)
  else (el.style as unknown as Record<string, string>)[prop] = val
}
export const f3 = (n: number) => (Math.round(n * 1000) / 1000).toString()
export const px = (n: number) => `${Math.round(n * 10) / 10}px`
