import * as THREE from 'three'
import { bloco, chapa, injetar, materialTela, retangulo, uniformesTela, type Uniformes } from './palco'
import { texturaPlaca } from './texturas'
import type { Zona } from './notebook'

/*
 * Os outros aparelhos da recepção, modelados em código como produtos de estúdio:
 * celular, PC gamer, videogame com controle e drone. Cada um diz onde ficam os pontos
 * de defeito (zonas) que a triagem aponta.
 */

export type Aparelho3D = {
  grupo: THREE.Group
  zonas: Record<string, Zona & { giro?: number }>
  telas: Uniformes[]
  animar: (tempo: number) => void
}

/** Placa plana com cantos arredondados, com UV de 0 a 1 (para a tela do celular). */
function formaPlana(w: number, h: number, r: number) {
  const geo = new THREE.ShapeGeometry(retangulo(w, h, r), 10)
  const pos = geo.getAttribute('position') as THREE.BufferAttribute
  const uv = geo.getAttribute('uv') as THREE.BufferAttribute
  for (let i = 0; i < pos.count; i++) uv.setXY(i, pos.getX(i) / w + 0.5, pos.getY(i) / h + 0.5)
  uv.needsUpdate = true
  return geo
}

const metal = (u: Uniformes, cor: string, rug = 0.32, met = 0.9) => {
  const m = new THREE.MeshStandardMaterial({ color: cor, roughness: rug, metalness: met })
  injetar(m, u)
  return m
}
const brilho = (cor: string, forca = 2.2) => new THREE.MeshBasicMaterial({ color: new THREE.Color(cor).multiplyScalar(forca), toneMapped: false })

// ---------------------------------------------------------------------------
// celular
// ---------------------------------------------------------------------------
export function montarCelular(u: Uniformes): Aparelho3D {
  const grupo = new THREE.Group()
  const corpo = new THREE.Group()
  const W = 1.05
  const H = 2.15
  const E = 0.11
  const R = 0.17
  const moldura = metal(u, '#aab3c2', 0.3, 0.92)
  const vidro = metal(u, '#05070c', 0.08, 0.5)
  const traseira = metal(u, '#14254a', 0.18, 0.45)
  corpo.add(new THREE.Mesh(bloco(W, H, E, R, 0.025), moldura))
  const frente = new THREE.Mesh(formaPlana(W - 0.05, H - 0.05, R - 0.025), vidro)
  frente.position.z = E / 2 + 0.002
  corpo.add(frente)
  const uTela = uniformesTela(u, (W - 0.12) / (H - 0.12))
  uTela.uLigada.value = 0.5
  const tela = new THREE.Mesh(formaPlana(W - 0.12, H - 0.12, R - 0.06), materialTela(uTela))
  tela.position.z = E / 2 + 0.004
  corpo.add(tela)
  // alto-falante e câmera de selfie
  const fenda = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.022, 0.004), new THREE.MeshStandardMaterial({ color: '#000', roughness: 0.6 }))
  fenda.position.set(0, H / 2 - 0.045, E / 2 + 0.005)
  corpo.add(fenda)
  // traseira de vidro com o bloco de câmeras
  const costas = new THREE.Mesh(formaPlana(W - 0.05, H - 0.05, R - 0.025), traseira)
  costas.rotation.y = Math.PI
  costas.position.z = -E / 2 - 0.002
  corpo.add(costas)
  const bump = new THREE.Mesh(bloco(0.46, 0.46, 0.05, 0.11, 0.015), metal(u, '#1b2c52', 0.15, 0.5))
  bump.position.set(-W / 2 + 0.3, H / 2 - 0.3, -E / 2 - 0.025)
  corpo.add(bump)
  const lenteMat = new THREE.MeshStandardMaterial({ color: '#020306', roughness: 0.05, metalness: 0.6 })
  const aroMat = metal(u, '#c6ccd6', 0.25, 1)
  for (const [x, y] of [
    [-0.1, 0.1],
    [0.1, 0.1],
    [-0.1, -0.1],
  ]) {
    const aro = new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.075, 0.03, 28), aroMat)
    aro.rotation.x = Math.PI / 2
    aro.position.set(bump.position.x + x, bump.position.y + y, -E / 2 - 0.058)
    const lente = new THREE.Mesh(new THREE.CircleGeometry(0.055, 28), lenteMat)
    lente.rotation.y = Math.PI
    lente.position.set(aro.position.x, aro.position.y, -E / 2 - 0.0735)
    corpo.add(aro, lente)
  }
  const flash = new THREE.Mesh(new THREE.CircleGeometry(0.022, 16), brilho('#fff3d6', 1.2))
  flash.rotation.y = Math.PI
  flash.position.set(bump.position.x + 0.1, bump.position.y - 0.1, -E / 2 - 0.051)
  corpo.add(flash)
  // botões na lateral direita e entrada do carregador embaixo
  for (const [y, h] of [
    [0.55, 0.26],
    [0.22, 0.18],
  ]) {
    const b = new THREE.Mesh(new THREE.BoxGeometry(0.02, h, 0.05), moldura)
    b.position.set(W / 2 + 0.008, y, 0)
    corpo.add(b)
  }
  const porta = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.02, 0.05), new THREE.MeshStandardMaterial({ color: '#05070c', roughness: 0.5 }))
  porta.position.set(0, -H / 2 + 0.004, 0)
  corpo.add(porta)

  corpo.position.y = H / 2 + 0.12
  corpo.rotation.x = -0.1
  grupo.add(corpo)
  const z = (x: number, y: number, zz: number, giro?: number) => ({ obj: corpo, pos: new THREE.Vector3(x, y, zz), giro })
  return {
    grupo,
    telas: [uTela],
    zonas: {
      tela: z(0, 0.25, E / 2 + 0.01),
      bateria: z(0, -0.2, E / 2 + 0.01),
      porta: z(0, -H / 2, 0.03),
      camera: z(bump.position.x, bump.position.y, -E / 2 - 0.06, Math.PI),
      som: z(0, H / 2 - 0.05, E / 2 + 0.01),
      botoes: z(W / 2 + 0.01, 0.42, 0, -0.9),
      placa: z(0, 0.45, E / 2 + 0.01),
      geral: z(0, 0, E / 2 + 0.01),
    },
    animar: () => {},
  }
}

// ---------------------------------------------------------------------------
// PC gamer: gabinete com lateral de vidro, placa-mãe, water cooler, memórias,
// placa de vídeo e ventoinhas com luz azul
// ---------------------------------------------------------------------------
export function montarPC(u: Uniformes): Aparelho3D {
  const grupo = new THREE.Group()
  const W = 1.15
  const H = 2.4
  const D = 2.3
  const aco = metal(u, '#141922', 0.42, 0.65)
  const preto = metal(u, '#0b0e14', 0.55, 0.3)
  const gab = new THREE.Group()
  // painéis: fundo, topo, traseira, lateral esquerda e frente
  const painel = (w: number, h: number, d: number, x: number, y: number, zz: number, m = aco) => {
    const p = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m)
    p.position.set(x, y, zz)
    gab.add(p)
    return p
  }
  painel(W, 0.05, D, 0, 0.025, 0)
  painel(W, 0.05, D, 0, H - 0.025, 0)
  painel(W, H, 0.05, 0, H / 2, -D / 2 + 0.025)
  painel(0.05, H, D, -W / 2 + 0.025, H / 2, 0)
  painel(W, H, 0.06, 0, H / 2, D / 2 - 0.03, preto)
  // faixa de luz na frente
  const faixa = new THREE.Mesh(new THREE.BoxGeometry(0.035, H - 0.3, 0.01), brilho('#3a8bff', 2.4))
  faixa.position.set(W / 2 - 0.12, H / 2, D / 2 + 0.002)
  gab.add(faixa)
  // vidro lateral (lado direito, virado para a câmera)
  const vidro = new THREE.Mesh(
    new THREE.PlaneGeometry(D - 0.1, H - 0.1),
    new THREE.MeshStandardMaterial({ color: '#0a1830', roughness: 0.04, metalness: 0.95, transparent: true, opacity: 0.22, depthWrite: false }),
  )
  vidro.rotation.y = Math.PI / 2
  vidro.position.set(W / 2, H / 2, 0)
  gab.add(vidro)
  const aro = new THREE.Mesh(new THREE.BoxGeometry(0.03, H, 0.05), aco)
  aro.position.set(W / 2 - 0.015, H / 2, -D / 2 + 0.025)
  gab.add(aro)

  // placa-mãe na parede esquerda
  const { mapa, brilho: brilhoPlaca } = texturaPlaca()
  const matPlaca = new THREE.MeshStandardMaterial({ map: mapa, roughness: 0.45, metalness: 0.25, emissiveMap: brilhoPlaca, emissive: new THREE.Color('#2a7fd8'), emissiveIntensity: 0.12 })
  injetar(matPlaca, u)
  const placa = new THREE.Mesh(new THREE.BoxGeometry(0.02, 1.55, 1.45), matPlaca)
  placa.position.set(-W / 2 + 0.07, H - 0.95, -0.25)
  gab.add(placa)
  // water cooler: bomba com anel de luz
  const bomba = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.1, 40), metal(u, '#1a2030', 0.3, 0.7))
  bomba.rotation.z = Math.PI / 2
  bomba.position.set(-W / 2 + 0.13, H - 0.72, -0.2)
  gab.add(bomba)
  const anel = new THREE.Mesh(new THREE.TorusGeometry(0.16, 0.015, 10, 48), brilho('#5cc6f2', 2.6))
  anel.rotation.y = Math.PI / 2
  anel.position.set(-W / 2 + 0.185, bomba.position.y, bomba.position.z)
  gab.add(anel)
  // memórias com barra de luz
  for (let i = 0; i < 4; i++) {
    const ram = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.5, 0.035), preto)
    ram.position.set(-W / 2 + 0.16, H - 0.72, 0.18 + i * 0.07)
    gab.add(ram)
    const luz = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.03, 0.03), brilho(i % 2 ? '#4d94ff' : '#5cc6f2', 2.2))
    luz.position.set(ram.position.x + 0.005, ram.position.y + 0.26, ram.position.z)
    gab.add(luz)
  }
  // placa de vídeo, com as três ventoinhas embaixo e a faixa de luz na lateral
  const gpu = new THREE.Group()
  gpu.add(new THREE.Mesh(new THREE.BoxGeometry(0.56, 0.3, 1.45), metal(u, '#1b2130', 0.38, 0.7)))
  const tampaGpu = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.22, 1.3), metal(u, '#8a93a4', 0.3, 0.95))
  tampaGpu.position.set(0.29, 0, 0)
  gpu.add(tampaGpu)
  const luzGpu = new THREE.Mesh(new THREE.BoxGeometry(0.01, 0.035, 1.1), brilho('#4d94ff', 2.6))
  luzGpu.position.set(0.302, 0.08, 0)
  gpu.add(luzGpu)
  const ventGpu: THREE.Group[] = []
  for (let i = 0; i < 3; i++) {
    const v = new THREE.Group()
    const pas = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.012, 9), metal(u, '#0d1017', 0.5, 0.3))
    v.add(pas)
    const borda = new THREE.Mesh(new THREE.TorusGeometry(0.21, 0.01, 6, 36), metal(u, '#2a3242', 0.4, 0.6))
    borda.rotation.x = Math.PI / 2
    v.add(borda)
    v.position.set(0, -0.16, -0.45 + i * 0.45)
    gpu.add(v)
    ventGpu.push(v)
  }
  gpu.position.set(-W / 2 + 0.36, H - 1.38, -0.18)
  gab.add(gpu)
  // cobertura da fonte embaixo
  const shroud = new THREE.Mesh(new THREE.BoxGeometry(W - 0.1, 0.42, D - 0.1), aco)
  shroud.position.set(0, 0.26, 0)
  gab.add(shroud)
  const janela = new THREE.Mesh(new THREE.BoxGeometry(0.01, 0.06, 0.9), brilho('#3a8bff', 1.2))
  janela.position.set(W / 2 - 0.05, 0.3, -0.4)
  gab.add(janela)
  // ventoinhas da frente (por dentro) com anéis de luz
  const ventFrente: THREE.Mesh[] = []
  for (let i = 0; i < 3; i++) {
    const anelF = new THREE.Mesh(new THREE.TorusGeometry(0.24, 0.018, 10, 48), brilho('#4d94ff', 2.4))
    anelF.position.set(0.02, 0.85 + i * 0.52, D / 2 - 0.12)
    gab.add(anelF)
    const pasF = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, 0.01, 7), metal(u, '#0f131c', 0.6, 0.2))
    pasF.rotation.x = Math.PI / 2
    pasF.position.copy(anelF.position)
    gab.add(pasF)
    ventFrente.push(pasF)
  }
  grupo.add(gab)
  const z = (x: number, y: number, zz: number, giro?: number) => ({ obj: gab, pos: new THREE.Vector3(x, y, zz), giro })
  return {
    grupo,
    telas: [],
    zonas: {
      gpu: z(0.05, H - 1.38, 0.1),
      fonte: z(0.2, 0.3, 0.3),
      cpu: z(-W / 2 + 0.2, H - 0.72, -0.2),
      ram: z(-W / 2 + 0.2, H - 0.72, 0.3),
      geral: z(0, H / 2, 0),
    },
    animar: (t) => {
      ventGpu.forEach((v, i) => (v.rotation.y = t * (6 + i)))
      ventFrente.forEach((v, i) => (v.rotation.y = t * (5 + i * 0.7)))
    },
  }
}

// ---------------------------------------------------------------------------
// videogame: console deitado e um controle à frente (formas genéricas, sem marca)
// ---------------------------------------------------------------------------
export function montarVideogame(u: Uniformes): Aparelho3D {
  const grupo = new THREE.Group()
  const console_ = new THREE.Group()
  const W = 2.5
  const H = 0.5
  const D = 1.75
  const fosco = metal(u, '#10141c', 0.55, 0.25)
  const brilhante = metal(u, '#0a0d14', 0.12, 0.6)
  console_.add(new THREE.Mesh(chapa(W, D, H, 0.2), fosco))
  const topo = new THREE.Mesh(chapa(W - 0.24, D - 0.24, 0.02, 0.12), brilhante)
  topo.position.y = H
  console_.add(topo)
  // grade de ventilação no topo, atrás
  const fenda = new THREE.InstancedMesh(new THREE.BoxGeometry(0.03, 0.012, 0.42), new THREE.MeshStandardMaterial({ color: '#020306', roughness: 0.9 }), 22)
  const mm = new THREE.Object3D()
  for (let i = 0; i < 22; i++) {
    mm.position.set(-0.5 + i * 0.07, H + 0.022, -0.5)
    mm.updateMatrix()
    fenda.setMatrixAt(i, mm.matrix)
  }
  console_.add(fenda)
  // faixa de luz na frente, entrada de disco e portas
  const luz = new THREE.Mesh(new THREE.BoxGeometry(W - 0.6, 0.02, 0.01), brilho('#4d94ff', 2.6))
  luz.position.set(0, H * 0.32, D / 2 + 0.003)
  console_.add(luz)
  const disco = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.012, 0.01), new THREE.MeshStandardMaterial({ color: '#000', roughness: 0.5 }))
  disco.position.set(-0.4, H * 0.62, D / 2 + 0.003)
  console_.add(disco)
  for (const x of [0.75, 0.92]) {
    const usb = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.035, 0.01), new THREE.MeshStandardMaterial({ color: '#020306', roughness: 0.5 }))
    usb.position.set(x, H * 0.62, D / 2 + 0.003)
    console_.add(usb)
  }
  const led = new THREE.Mesh(new THREE.CircleGeometry(0.02, 16), brilho('#5cc6f2', 3))
  led.position.set(1.08, H * 0.62, D / 2 + 0.004)
  console_.add(led)
  console_.position.set(-0.35, 0, -0.45)
  grupo.add(console_)

  // controle
  const controle = new THREE.Group()
  const casco = metal(u, '#1a2233', 0.45, 0.3)
  const centro = new THREE.Mesh(chapa(0.78, 0.42, 0.14, 0.14), casco)
  controle.add(centro)
  for (const lado of [-1, 1]) {
    const pega = new THREE.Mesh(new THREE.CapsuleGeometry(0.14, 0.32, 6, 16), casco)
    pega.rotation.x = Math.PI / 2 - 0.35
    pega.rotation.z = lado * 0.5
    pega.position.set(lado * 0.36, 0.06, 0.2)
    controle.add(pega)
    const analog = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.06, 0.07, 20), metal(u, '#0b0e14', 0.6, 0.2))
    analog.position.set(lado * 0.14, 0.17, 0.12)
    controle.add(analog)
  }
  const touch = new THREE.Mesh(chapa(0.3, 0.16, 0.012, 0.04), metal(u, '#0d1220', 0.2, 0.5))
  touch.position.set(0, 0.14, -0.08)
  controle.add(touch)
  const barra = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.012, 0.012), brilho('#5cc6f2', 2.6))
  barra.position.set(0, 0.12, -0.215)
  controle.add(barra)
  const bot = metal(u, '#0b0e14', 0.4, 0.3)
  for (const [dx, dz] of [
    [0, -0.05],
    [0, 0.05],
    [-0.05, 0],
    [0.05, 0],
  ]) {
    const b = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.022, 0.03, 14), bot)
    b.position.set(0.27 + dx, 0.15, -0.02 + dz)
    controle.add(b)
    const d = new THREE.Mesh(new THREE.BoxGeometry(dx ? 0.05 : 0.03, 0.025, dz ? 0.05 : 0.03), bot)
    d.position.set(-0.27 + dx, 0.15, -0.02 + dz)
    controle.add(d)
  }
  controle.position.set(1.05, 0.1, 0.95)
  controle.rotation.y = -0.45
  grupo.add(controle)
  const z = (x: number, y: number, zz: number, giro?: number) => ({ obj: console_, pos: new THREE.Vector3(x, y, zz), giro })
  return {
    grupo,
    telas: [],
    zonas: {
      hdmi: z(0.6, H * 0.5, -D / 2, 1.0),
      fonte: z(-0.6, H + 0.02, 0.1),
      ventilacao: z(0.25, H + 0.03, -0.5),
      placa: z(0.1, H + 0.02, 0.25),
      geral: z(0, H + 0.02, 0),
    },
    animar: () => {},
  }
}

// ---------------------------------------------------------------------------
// drone: corpo, quatro braços com motores e hélices, gimbal com câmera
// ---------------------------------------------------------------------------
export function montarDrone(u: Uniformes): Aparelho3D {
  const grupo = new THREE.Group()
  const voo = new THREE.Group()
  const cinza = metal(u, '#8f99a9', 0.42, 0.35)
  const escuro = metal(u, '#1b212c', 0.5, 0.3)
  const corpo = new THREE.Mesh(chapa(0.78, 1.2, 0.26, 0.24), cinza)
  voo.add(corpo)
  const cupula = new THREE.Mesh(new THREE.SphereGeometry(0.5, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2), cinza)
  cupula.scale.set(0.72, 0.28, 1.1)
  cupula.position.y = 0.25
  voo.add(cupula)
  const helices: THREE.Group[] = []
  const motores: THREE.Vector3[] = []
  const braco = new THREE.BoxGeometry(0.09, 0.07, 0.95)
  braco.translate(0, 0, 0.475)
  for (const [ang, x, zz] of [
    [0.75, 0.28, 0.4],
    [-0.75, -0.28, 0.4],
    [Math.PI - 0.8, 0.28, -0.42],
    [-(Math.PI - 0.8), -0.28, -0.42],
  ] as const) {
    const b = new THREE.Mesh(braco, escuro)
    b.position.set(x, 0.12, zz)
    b.rotation.y = ang
    voo.add(b)
    const ponta = new THREE.Vector3(x + Math.sin(ang) * 0.92, 0.12, zz + Math.cos(ang) * 0.92)
    motores.push(ponta)
    const motor = new THREE.Mesh(new THREE.CylinderGeometry(0.085, 0.095, 0.14, 24), metal(u, '#2b3240', 0.35, 0.8))
    motor.position.copy(ponta).add(new THREE.Vector3(0, 0.05, 0))
    voo.add(motor)
    const h = new THREE.Group()
    const pa = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.008, 0.07), escuro)
    pa.rotation.x = 0.12
    h.add(pa)
    const disco = new THREE.Mesh(new THREE.CircleGeometry(0.42, 40), new THREE.MeshBasicMaterial({ color: '#9fb6e0', transparent: true, opacity: 0.035, depthWrite: false }))
    disco.rotation.x = -Math.PI / 2
    h.add(disco)
    h.position.copy(ponta).add(new THREE.Vector3(0, 0.13, 0))
    voo.add(h)
    helices.push(h)
    // luzes na ponta dos braços da frente
    if (zz > 0) {
      const led = new THREE.Mesh(new THREE.SphereGeometry(0.025, 12, 8), brilho('#5cc6f2', 3))
      led.position.copy(ponta).add(new THREE.Vector3(0, -0.03, 0.05))
      voo.add(led)
    }
    // pernas
    const perna = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.012, 0.32, 8), escuro)
    perna.position.copy(ponta).add(new THREE.Vector3(0, -0.15, 0))
    voo.add(perna)
  }
  // gimbal e câmera na frente, embaixo
  const gimbal = new THREE.Group()
  gimbal.add(new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.14, 0.16), escuro))
  const cam = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.08, 28), metal(u, '#2b3240', 0.3, 0.8))
  cam.rotation.x = Math.PI / 2
  cam.position.z = 0.1
  gimbal.add(cam)
  const lente = new THREE.Mesh(new THREE.CircleGeometry(0.05, 28), new THREE.MeshStandardMaterial({ color: '#020306', roughness: 0.04, metalness: 0.6 }))
  lente.position.z = 0.141
  gimbal.add(lente)
  const anelLente = new THREE.Mesh(new THREE.TorusGeometry(0.052, 0.006, 8, 32), brilho('#4d94ff', 2))
  anelLente.position.z = 0.142
  gimbal.add(anelLente)
  gimbal.position.set(0, -0.04, 0.62)
  voo.add(gimbal)
  voo.position.y = 1.0
  grupo.add(voo)
  const z = (x: number, y: number, zz: number, giro?: number) => ({ obj: voo, pos: new THREE.Vector3(x, y, zz), giro })
  return {
    grupo,
    telas: [],
    zonas: {
      helice: z(motores[0].x, 0.25, motores[0].z),
      camera: z(0, -0.04, 0.72),
      antena: z(motores[3].x, -0.1, motores[3].z, 0.6),
      bateria: z(0, 0.3, -0.35),
      geral: z(0, 0.3, 0),
    },
    animar: (t) => {
      voo.position.y = 1.0 + Math.sin(t * 1.3) * 0.06
      voo.rotation.z = Math.sin(t * 0.9) * 0.03
      voo.rotation.x = Math.sin(t * 1.1) * 0.02
      helices.forEach((h, i) => (h.rotation.y = t * 38 * (i % 2 ? 1 : -1)))
    },
  }
}
