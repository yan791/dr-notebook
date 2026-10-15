/*
 * Rolagem suave (Lenis) ligada ao GSAP ScrollTrigger. Animação sempre ligada,
 * no celular também (decisão do usuário em todos os sites).
 * Nada aqui roda no servidor: o pré-render só importa o módulo.
 */
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import Lenis from 'lenis'

const NO_NAVEGADOR = typeof window !== 'undefined'
if (NO_NAVEGADOR) gsap.registerPlugin(ScrollTrigger)

let lenis: Lenis | null = null
const travas = new Set<string>()
const pulso = (t: number) => lenis?.raf(t * 1000)
let ultimaRolagem = 0
if (NO_NAVEGADOR) window.addEventListener('scroll', () => (ultimaRolagem = performance.now()), { passive: true })

/** Espera ninguém estar rolando e o navegador ficar ocioso (para criar a cena 3D sem engasgar). */
export function ocioso(calma = 250): Promise<void> {
  return new Promise((resolver) => {
    const tentar = () => {
      const falta = calma - (performance.now() - ultimaRolagem)
      if (falta > 0) return void setTimeout(tentar, falta + 20)
      const ric = (window as Window & { requestIdleCallback?: (f: () => void, o?: { timeout: number }) => number }).requestIdleCallback
      const conferir = () => (performance.now() - ultimaRolagem < calma ? tentar() : resolver())
      if (ric) ric(conferir, { timeout: 500 })
      else setTimeout(conferir, 16)
    }
    tentar()
  })
}

export function iniciarRolagem() {
  if (lenis) return lenis
  lenis = new Lenis({ lerp: 0.09, wheelMultiplier: 0.9, smoothWheel: true, touchMultiplier: 1.1 })
  lenis.on('scroll', () => {
    ScrollTrigger.update()
    ultimaRolagem = performance.now()
  })
  gsap.ticker.add(pulso)
  gsap.ticker.lagSmoothing(0)
  if (travas.size) lenis.stop()
  return lenis
}

export function encerrarRolagem() {
  gsap.ticker.remove(pulso)
  lenis?.destroy()
  lenis = null
}

export const velocidade = () => lenis?.velocity ?? 0

export function rolarPara(alvo: string | number | HTMLElement, imediato = false) {
  if (lenis) {
    lenis.scrollTo(alvo, { immediate: imediato, duration: 1.4, force: true })
    return
  }
  const el = typeof alvo === 'string' ? document.querySelector(alvo) : typeof alvo === 'number' ? null : alvo
  const y = typeof alvo === 'number' ? alvo : (el?.getBoundingClientRect().top ?? 0) + scrollY - 84
  window.scrollTo({ top: y, behavior: imediato ? 'auto' : 'smooth' })
}

/** Trava a rolagem (menu do celular). Só solta quando todos soltarem. */
export function travarRolagem(travar: boolean, quem = 'geral') {
  if (travar) travas.add(quem)
  else travas.delete(quem)
  document.documentElement.classList.toggle('travado', travas.size > 0)
  if (!lenis) return
  if (travas.size) lenis.stop()
  else lenis.start()
}

/** Links internos (#secao, ou /dr-notebook/#secao estando na home) passam pela rolagem suave. */
export function ligarAncoras() {
  const clique = (ev: MouseEvent) => {
    const a = (ev.target as HTMLElement).closest<HTMLAnchorElement>('a[href*="#"]')
    if (!a || ev.defaultPrevented || ev.button !== 0 || ev.metaKey || ev.ctrlKey) return
    const url = new URL(a.href, location.href)
    if (url.pathname !== location.pathname || !url.hash || url.hash === '#') return
    const alvo = document.querySelector<HTMLElement>(url.hash)
    if (!alvo) return
    ev.preventDefault()
    rolarPara(alvo.hasAttribute('data-fixa') ? alvo.getBoundingClientRect().top + window.scrollY : alvo)
    history.replaceState(null, '', url.hash)
    if (!alvo.hasAttribute('tabindex')) alvo.setAttribute('tabindex', '-1')
    alvo.focus({ preventScroll: true })
  }
  document.addEventListener('click', clique)
  return () => document.removeEventListener('click', clique)
}

export { gsap, ScrollTrigger }
