import { SplitText } from 'gsap/SplitText'
import { gsap, ScrollTrigger } from './rolagem'

if (typeof window !== 'undefined') gsap.registerPlugin(SplitText)

/*
 * Efeitos ligados por atributo, para qualquer seção usar sem repetir código:
 *  data-titulo       palavras sobem de dentro de uma máscara quando o título entra na tela
 *  data-entra        o bloco sobe e aparece (filhos com data-entra="filhos" entram em sequência)
 *  data-decodifica   rótulo que se "decodifica" letra a letra, como um monitor ligando
 *  data-parallax="n" desloca n (fração da altura) enquanto atravessa a tela
 *  data-magnetico    puxado de leve pelo cursor (só com mouse)
 */

const SINAIS = '01DR/#+<>:'

export function decodificar(el: HTMLElement, duracao = 0.8) {
  const final = el.dataset.texto ?? el.textContent ?? ''
  el.dataset.texto = final
  const obj = { t: 0 }
  return gsap.to(obj, {
    t: 1,
    duration: duracao,
    ease: 'none',
    onUpdate: () => {
      const n = Math.floor(obj.t * final.length)
      let s = final.slice(0, n)
      for (let i = n; i < final.length; i++) s += final[i] === ' ' ? ' ' : SINAIS[Math.floor(Math.random() * SINAIS.length)]
      el.textContent = s
    },
    onComplete: () => {
      el.textContent = final
    },
  })
}

export function ligarEfeitos(raiz: HTMLElement) {
  const finos = window.matchMedia('(pointer: fine)').matches
  const ctx = gsap.context(() => {
    raiz.querySelectorAll<HTMLElement>('[data-titulo]').forEach((el) => {
      SplitText.create(el, {
        type: 'words',
        mask: 'words',
        wordsClass: 'palavra-mascara',
        onSplit(self) {
          return gsap.from(self.words, {
            yPercent: 110,
            duration: 0.95,
            ease: 'expo.out',
            stagger: 0.03,
            scrollTrigger: { trigger: el, start: 'top 88%', once: true },
          })
        },
      })
    })

    raiz.querySelectorAll<HTMLElement>('[data-entra]').forEach((el) => {
      const alvos = el.dataset.entra === 'filhos' ? Array.from(el.children) : [el]
      gsap.from(alvos, {
        y: 28,
        autoAlpha: 0,
        duration: 0.9,
        ease: 'power3.out',
        stagger: 0.08,
        scrollTrigger: { trigger: el, start: 'top 90%', once: true },
        clearProps: 'transform,opacity,visibility',
      })
    })

    raiz.querySelectorAll<HTMLElement>('[data-decodifica]').forEach((el) => {
      el.dataset.texto = el.textContent ?? ''
      ScrollTrigger.create({ trigger: el, start: 'top 92%', once: true, onEnter: () => decodificar(el) })
    })

    raiz.querySelectorAll<HTMLElement>('[data-parallax]').forEach((el) => {
      const n = Number(el.dataset.parallax) || 0.12
      gsap.fromTo(el, { yPercent: n * 100 }, { yPercent: -n * 100, ease: 'none', scrollTrigger: { trigger: el, start: 'top bottom', end: 'bottom top', scrub: true } })
    })
  }, raiz)

  const limpezas: (() => void)[] = []
  if (finos) {
    raiz.querySelectorAll<HTMLElement>('[data-magnetico]').forEach((el) => {
      const x = gsap.quickTo(el, 'x', { duration: 0.6, ease: 'power3' })
      const y = gsap.quickTo(el, 'y', { duration: 0.6, ease: 'power3' })
      const mover = (e: PointerEvent) => {
        const r = el.getBoundingClientRect()
        x((e.clientX - (r.left + r.width / 2)) * 0.12)
        y((e.clientY - (r.top + r.height / 2)) * 0.16)
      }
      const sair = () => {
        x(0)
        y(0)
      }
      el.addEventListener('pointermove', mover)
      el.addEventListener('pointerleave', sair)
      limpezas.push(() => {
        el.removeEventListener('pointermove', mover)
        el.removeEventListener('pointerleave', sair)
      })
    })
  }

  return () => {
    limpezas.forEach((f) => f())
    ctx.revert()
  }
}
