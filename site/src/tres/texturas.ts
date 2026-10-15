import * as THREE from 'three'
import { rng } from '../lib/util'

/*
 * Texturas desenhadas em canvas no carregamento: a placa (máscara de solda azul,
 * trilhas, vias e ilhas), o mapa de brilho das trilhas, o ambiente de estúdio para os
 * metais refletirem, o piso e a sombra de contato. Nada é baixado.
 */

export const PLACA = { largura: 2.74, profundidade: 1.04 } as const
// componentes, em coordenadas da placa (x de -1.37 a 1.37, z de -0.52 a 0.52)
export const POS = {
  chipHeroi: { x: -0.42, z: 0.02, lado: 0.36 },
  cpu: { x: 0.42, z: 0.04, lado: 0.32 },
  bios: { x: -0.98, z: 0.3, w: 0.11, d: 0.08 },
  ram: { x: -1.0, z: -0.2 },
  ventoinha: { x: 1.02, z: -0.08, r: 0.27 },
} as const

function canvas(w: number, h: number) {
  const c = document.createElement('canvas')
  c.width = w
  c.height = h
  return [c, c.getContext('2d')!] as const
}

type Trilha = { pts: [number, number][]; larg: number }

/** Trilhas com curvas de 45 graus saindo dos chips, iguais em toda visita. */
function gerarTrilhas(W: number, H: number): Trilha[] {
  const r = rng(2005)
  const px = (x: number) => ((x + PLACA.largura / 2) / PLACA.largura) * W
  const pz = (z: number) => ((z + PLACA.profundidade / 2) / PLACA.profundidade) * H
  const trilhas: Trilha[] = []
  const origens = [POS.chipHeroi, POS.cpu]
  for (const o of origens) {
    const cx = px(o.x)
    const cz = pz(o.z)
    const meio = (o.lado / PLACA.largura) * W * 0.5
    for (let i = 0; i < 46; i++) {
      const lado = i % 4
      const t = (r() - 0.5) * 1.6 * meio
      let x = cx
      let y = cz
      let dx = 0
      let dy = 0
      if (lado === 0) ((x = cx + t), (y = cz - meio), (dy = -1))
      if (lado === 1) ((x = cx + t), (y = cz + meio), (dy = 1))
      if (lado === 2) ((x = cx - meio), (y = cz + t), (dx = -1))
      if (lado === 3) ((x = cx + meio), (y = cz + t), (dx = 1))
      const pts: [number, number][] = [[x, y]]
      const a = 20 + r() * 90
      x += dx * a
      y += dy * a
      pts.push([x, y])
      const diag = (r() < 0.5 ? -1 : 1) * (14 + r() * 50)
      if (dx) y += diag
      else x += diag
      x += dx * Math.abs(diag)
      y += dy * Math.abs(diag)
      pts.push([x, y])
      const b = 40 + r() * 240
      x += dx * b
      y += dy * b
      pts.push([x, y])
      trilhas.push({ pts, larg: r() < 0.2 ? 3.2 : 1.6 })
    }
  }
  // barramentos longos de borda a borda
  for (let i = 0; i < 14; i++) {
    const y = H * (0.08 + r() * 0.84)
    const x0 = W * r() * 0.3
    const x1 = W * (0.6 + r() * 0.4)
    const quebra = x0 + (x1 - x0) * (0.3 + r() * 0.4)
    const sobe = (r() - 0.5) * 60
    trilhas.push({ pts: [[x0, y], [quebra, y], [quebra + Math.abs(sobe), y + sobe], [x1, y + sobe]], larg: 1.4 })
  }
  return trilhas
}

export function texturaPlaca() {
  const W = 2048
  const H = Math.round((W * PLACA.profundidade) / PLACA.largura)
  const [c, g] = canvas(W, H)
  const [ce, ge] = canvas(W, H)
  const r = rng(77)

  // máscara de solda azul-marinho, com leve variação
  const fundo = g.createLinearGradient(0, 0, W, H)
  fundo.addColorStop(0, '#0d2c6e')
  fundo.addColorStop(1, '#0a2359')
  g.fillStyle = fundo
  g.fillRect(0, 0, W, H)
  ge.fillStyle = '#000'
  ge.fillRect(0, 0, W, H)

  // plano de cobre por baixo (textura sutil de hachura)
  g.globalAlpha = 0.06
  g.strokeStyle = '#6fa0ff'
  for (let i = -H; i < W; i += 9) {
    g.beginPath()
    g.moveTo(i, 0)
    g.lineTo(i + H, H)
    g.stroke()
  }
  g.globalAlpha = 1

  const trilhas = gerarTrilhas(W, H)
  g.lineCap = ge.lineCap = 'round'
  g.lineJoin = ge.lineJoin = 'round'
  for (const t of trilhas) {
    g.strokeStyle = 'rgba(70,130,235,0.85)'
    g.lineWidth = t.larg * 1.6
    ge.strokeStyle = '#fff'
    ge.lineWidth = t.larg * 1.4
    for (const ctx of [g, ge]) {
      ctx.beginPath()
      t.pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)))
      ctx.stroke()
    }
    // via no fim
    const [vx, vy] = t.pts[t.pts.length - 1]
    g.fillStyle = '#c9a957'
    g.beginPath()
    g.arc(vx, vy, 4.2, 0, Math.PI * 2)
    g.fill()
    g.fillStyle = '#0a2359'
    g.beginPath()
    g.arc(vx, vy, 1.8, 0, Math.PI * 2)
    g.fill()
    ge.fillStyle = '#fff'
    ge.beginPath()
    ge.arc(vx, vy, 3.6, 0, Math.PI * 2)
    ge.fill()
  }

  // ilhas douradas dos componentes pequenos
  g.fillStyle = '#b8944a'
  for (let i = 0; i < 520; i++) {
    const x = r() * W
    const y = r() * H
    const w = 6 + r() * 6
    g.fillRect(x, y, w, 4)
    g.fillRect(x, y + 9, w, 4)
  }
  // marcações de serigrafia (retângulos finos, sem texto)
  g.strokeStyle = 'rgba(220,230,255,0.35)'
  g.lineWidth = 1.5
  for (let i = 0; i < 60; i++) {
    const x = r() * W
    const y = r() * H
    g.strokeRect(x, y, 14 + r() * 40, 10 + r() * 22)
  }
  // furos de fixação
  for (const [x, y] of [
    [40, 40],
    [W - 40, 40],
    [40, H - 40],
    [W - 40, H - 40],
  ]) {
    g.fillStyle = '#c9a957'
    g.beginPath()
    g.arc(x, y, 18, 0, Math.PI * 2)
    g.fill()
    g.fillStyle = '#05112c'
    g.beginPath()
    g.arc(x, y, 10, 0, Math.PI * 2)
    g.fill()
  }

  const mapa = new THREE.CanvasTexture(c)
  mapa.colorSpace = THREE.SRGBColorSpace
  mapa.anisotropy = 8
  const brilho = new THREE.CanvasTexture(ce)
  brilho.anisotropy = 8
  return { mapa, brilho }
}

/** Ambiente de estúdio: duas caixas de luz brancas, um horizonte azul e um filete ciano atrás. */
export function texturaAmbiente() {
  const [c, g] = canvas(512, 256)
  const ceu = g.createLinearGradient(0, 0, 0, 256)
  ceu.addColorStop(0, '#0d1d44')
  ceu.addColorStop(0.48, '#1d3e86')
  ceu.addColorStop(0.52, '#0b1838')
  ceu.addColorStop(1, '#03081a')
  g.fillStyle = ceu
  g.fillRect(0, 0, 512, 256)
  g.filter = 'blur(6px)'
  g.fillStyle = '#dfe8f6'
  g.fillRect(200, 26, 120, 46) // caixa de luz principal, à frente e acima
  g.fillStyle = '#cfe0ff'
  g.fillRect(360, 60, 60, 80) // lateral direita
  g.fillStyle = '#5cc6f2'
  g.fillRect(0, 108, 90, 12) // filete ciano atrás
  g.fillRect(470, 108, 42, 12)
  g.filter = 'none'
  const t = new THREE.CanvasTexture(c)
  t.mapping = THREE.EquirectangularReflectionMapping
  t.colorSpace = THREE.SRGBColorSpace
  return t
}

export function texturaSombra() {
  const [c, g] = canvas(256, 256)
  const grad = g.createRadialGradient(128, 128, 10, 128, 128, 128)
  grad.addColorStop(0, 'rgba(0,0,0,0.85)')
  grad.addColorStop(0.55, 'rgba(0,0,0,0.45)')
  grad.addColorStop(1, 'rgba(0,0,0,0)')
  g.fillStyle = grad
  g.fillRect(0, 0, 256, 256)
  return new THREE.CanvasTexture(c)
}

export function texturaPiso() {
  const [c, g] = canvas(512, 512)
  const grad = g.createRadialGradient(256, 256, 0, 256, 256, 256)
  grad.addColorStop(0, 'rgba(26,70,160,0.75)')
  grad.addColorStop(0.3, 'rgba(12,38,96,0.55)')
  grad.addColorStop(1, 'rgba(4,13,34,0)')
  g.fillStyle = grad
  g.fillRect(0, 0, 512, 512)
  const t = new THREE.CanvasTexture(c)
  t.colorSpace = THREE.SRGBColorSpace
  return t
}
