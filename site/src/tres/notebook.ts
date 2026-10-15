import * as THREE from 'three'
import { rng } from '../lib/util'
import { chapa, injetar, materialTela, uniformesTela, type Uniformes } from './palco'
import { PLACA, POS, texturaPlaca } from './texturas'

/*
 * O notebook modelado em código: bandeja com paredes, placa com trilhas, chip com
 * esferas de solda (BGA), BIOS, SSD, ventoinha com heat pipe de cobre, bateria, topo com
 * teclado e trackpad, e a tampa com a tela (monitor cardíaco). Serve à recepção (só por
 * fora) e ao laboratório (aberto até o chip).
 */

export const L = 3.2
export const P = 2.2
export const ALT_PAREDE = 0.1
export const ESP_TOPO = 0.032
export const ESP_TAMPA = 0.042
export const ANGULO_ABERTA = THREE.MathUtils.degToRad(110)
export const Y_PLACA = 0.034
const TOPO_PLACA = Y_PLACA + 0.008
const zP = (z: number) => z - 0.5

export type Zona = { obj: THREE.Object3D; pos: THREE.Vector3 }

export type Notebook = {
  modelo: THREE.Group
  dobradica: THREE.Group
  tampa: THREE.Group
  topo: THREE.Group
  chip: THREE.Group
  helices: THREE.Group
  matTopo: THREE.MeshStandardMaterial[]
  matSolda: THREE.MeshStandardMaterial
  matPlaca: THREE.MeshStandardMaterial
  matBios: THREE.MeshStandardMaterial
  matSsd: THREE.MeshStandardMaterial
  uTela: Uniformes
  luzTela: THREE.PointLight
  luzPlaca: THREE.PointLight
  zonas: Record<string, Zona>
  centroChip: THREE.Vector3
}

type Opcoes = { acabamento?: 'prata' | 'grafite'; miolo?: boolean }

export function montarNotebook(u: Uniformes, { acabamento = 'prata', miolo = true }: Opcoes = {}): Notebook {
  const modelo = new THREE.Group()
  const dobradica = new THREE.Group()
  const tampa = new THREE.Group()
  const topo = new THREE.Group()
  const chip = new THREE.Group()
  const helices = new THREE.Group()
  const grafite = acabamento === 'grafite'

  const aluminio = grafite
    ? new THREE.MeshStandardMaterial({ color: '#626b7c', metalness: 0.62, roughness: 0.42 })
    : new THREE.MeshStandardMaterial({ color: '#c4cbd8', metalness: 0.86, roughness: 0.36, envMapIntensity: 1.0 })
  injetar(aluminio, u)
  const aluminioEscuro = new THREE.MeshStandardMaterial({ color: grafite ? '#2b313c' : '#8d96a8', metalness: 0.8, roughness: 0.45 })
  injetar(aluminioEscuro, u)

  // ---- bandeja (fundo com paredes)
  const fundo = new THREE.Mesh(chapa(L, P, 0.014, 0.13), aluminioEscuro)
  const paredes = new THREE.Mesh(chapa(L, P, ALT_PAREDE, 0.13, { w: L - 0.07, d: P - 0.07, r: 0.1 }), aluminio)
  modelo.add(fundo, paredes)
  // portas e saída de ar na lateral direita (a que a câmera vê)
  const matPorta = new THREE.MeshStandardMaterial({ color: '#05070c', roughness: 0.5 })
  for (const [z, w] of [
    [0.3, 0.09],
    [0.05, 0.16],
    [-0.2, 0.16],
  ] as const) {
    const porta = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.028, w), matPorta)
    porta.position.set(L / 2 - 0.006, 0.05, z)
    modelo.add(porta)
  }
  const grade = new THREE.InstancedMesh(new THREE.BoxGeometry(0.02, 0.03, 0.025), matPorta, 9)
  const mm = new THREE.Object3D()
  for (let i = 0; i < 9; i++) {
    mm.position.set(L / 2 - 0.006, 0.05, -0.98 + i * 0.045)
    mm.updateMatrix()
    grade.setMatrixAt(i, mm.matrix)
  }
  modelo.add(grade)

  // ---- miolo (só no laboratório; na recepção o notebook fica fechado por baixo do teclado)
  const matChip = new THREE.MeshStandardMaterial({ color: '#12151c', roughness: 0.35, metalness: 0.35 })
  injetar(matChip, u)
  const matDie = new THREE.MeshStandardMaterial({ color: '#9aa6bb', roughness: 0.16, metalness: 0.95 })
  const matSolda = new THREE.MeshStandardMaterial({ color: '#d4dbe6', metalness: 1, roughness: 0.22, emissive: new THREE.Color('#5cc6f2'), emissiveIntensity: 0 })
  const matBios = new THREE.MeshStandardMaterial({ color: '#12151c', roughness: 0.35, metalness: 0.35, emissive: new THREE.Color('#5cc6f2'), emissiveIntensity: 0 })
  const matSsd = new THREE.MeshStandardMaterial({ color: '#14181f', roughness: 0.4, metalness: 0.3, emissive: new THREE.Color('#5cc6f2'), emissiveIntensity: 0 })
  let matPlaca = new THREE.MeshStandardMaterial()
  const luzPlaca = new THREE.PointLight('#5cc6f2', 0, 1.8, 2)
  const centroChip = new THREE.Vector3(POS.chipHeroi.x, 0, zP(POS.chipHeroi.z))
  if (miolo) {
    const grupo = new THREE.Group()
    const { mapa, brilho } = texturaPlaca()
    matPlaca = new THREE.MeshStandardMaterial({ map: mapa, roughness: 0.42, metalness: 0.25, emissiveMap: brilho, emissive: new THREE.Color('#2a7fd8'), emissiveIntensity: 0.0 })
    injetar(matPlaca, u, true)
    const placa = new THREE.Mesh(new THREE.BoxGeometry(PLACA.largura, 0.016, PLACA.profundidade), matPlaca)
    placa.position.set(0, Y_PLACA, -0.5)
    grupo.add(placa)

    // bateria na frente, com três células
    const matBat = new THREE.MeshStandardMaterial({ color: '#1b1f27', roughness: 0.8, metalness: 0.1 })
    injetar(matBat, u)
    for (let i = 0; i < 3; i++) {
      const cel = new THREE.Mesh(chapa(0.74, 0.62, 0.05, 0.03), matBat)
      cel.position.set(-0.78 + i * 0.78, 0.016, 0.5)
      grupo.add(cel)
    }
    const etiqueta = new THREE.Mesh(new THREE.PlaneGeometry(0.6, 0.22), new THREE.MeshStandardMaterial({ color: '#2b3a5c', roughness: 0.6 }))
    etiqueta.rotation.x = -Math.PI / 2
    etiqueta.position.set(0, 0.0675, 0.5)
    grupo.add(etiqueta)

    // o chip do reballing, que sobe e mostra as esferas
    const ch = POS.chipHeroi
    const substrato = new THREE.Mesh(new THREE.BoxGeometry(ch.lado, 0.014, ch.lado), matChip)
    const die = new THREE.Mesh(new THREE.BoxGeometry(ch.lado * 0.48, 0.008, ch.lado * 0.62), matDie)
    die.position.y = 0.011
    chip.add(substrato, die)
    chip.position.set(ch.x, TOPO_PLACA + 0.02, zP(ch.z))
    grupo.add(chip)
    const n = 13
    const esferas = new THREE.InstancedMesh(new THREE.SphereGeometry(0.0095, 8, 6), matSolda, n * n)
    let k = 0
    for (let i = 0; i < n; i++)
      for (let j = 0; j < n; j++) {
        mm.position.set(ch.x + (i - (n - 1) / 2) * 0.025, TOPO_PLACA + 0.009, zP(ch.z) + (j - (n - 1) / 2) * 0.025)
        mm.updateMatrix()
        esferas.setMatrixAt(k++, mm.matrix)
      }
    grupo.add(esferas)

    // processador com heat pipe de cobre até a ventoinha
    const cpu = new THREE.Mesh(new THREE.BoxGeometry(POS.cpu.lado, 0.014, POS.cpu.lado), matChip)
    cpu.position.set(POS.cpu.x, TOPO_PLACA + 0.007, zP(POS.cpu.z))
    grupo.add(cpu)
    const cobre = new THREE.MeshStandardMaterial({ color: '#c8794a', metalness: 1, roughness: 0.28 })
    injetar(cobre, u)
    const contato = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.012, 0.3), cobre)
    contato.position.set(POS.cpu.x, TOPO_PLACA + 0.02, zP(POS.cpu.z))
    grupo.add(contato)
    const tubo = new THREE.CatmullRomCurve3([
      new THREE.Vector3(POS.cpu.x - 0.08, TOPO_PLACA + 0.03, zP(POS.cpu.z)),
      new THREE.Vector3(POS.cpu.x + 0.25, TOPO_PLACA + 0.032, zP(POS.cpu.z) - 0.02),
      new THREE.Vector3(POS.ventoinha.x - 0.05, TOPO_PLACA + 0.032, zP(POS.ventoinha.z) - 0.28),
      new THREE.Vector3(POS.ventoinha.x + 0.32, TOPO_PLACA + 0.03, zP(POS.ventoinha.z) - 0.3),
    ])
    const heat = new THREE.Mesh(new THREE.TubeGeometry(tubo, 40, 0.022, 8), cobre)
    heat.scale.y = 0.6
    heat.position.y = TOPO_PLACA * 0.4
    grupo.add(heat)
    const aleta = new THREE.InstancedMesh(new THREE.BoxGeometry(0.008, 0.05, 0.1), cobre, 24)
    for (let i = 0; i < 24; i++) {
      mm.position.set(POS.ventoinha.x - 0.12 + i * 0.022, TOPO_PLACA + 0.025, zP(POS.ventoinha.z) - 0.33)
      mm.updateMatrix()
      aleta.setMatrixAt(i, mm.matrix)
    }
    grupo.add(aleta)
    const matVent = new THREE.MeshStandardMaterial({ color: '#0e1118', roughness: 0.6, metalness: 0.2 })
    injetar(matVent, u)
    const carcaca = new THREE.Mesh(new THREE.CylinderGeometry(POS.ventoinha.r, POS.ventoinha.r, 0.05, 40, 1, true), matVent)
    carcaca.position.set(POS.ventoinha.x, TOPO_PLACA + 0.026, zP(POS.ventoinha.z))
    grupo.add(carcaca)
    helices.add(new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.046, 24), matVent))
    const pa = new THREE.BoxGeometry(0.17, 0.034, 0.03)
    pa.translate(0.15, 0, 0)
    const pas = new THREE.InstancedMesh(pa, matVent, 11)
    for (let i = 0; i < 11; i++) {
      mm.position.set(0, 0, 0)
      mm.rotation.set(0.25, (i / 11) * Math.PI * 2, 0)
      mm.updateMatrix()
      pas.setMatrixAt(i, mm.matrix)
    }
    mm.rotation.set(0, 0, 0)
    helices.add(pas)
    helices.position.copy(carcaca.position)
    grupo.add(helices)

    // memórias RAM
    const matRam = new THREE.MeshStandardMaterial({ color: '#0f3b2c', roughness: 0.5, metalness: 0.2 })
    for (let i = 0; i < 2; i++) {
      const ram = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.012, 0.22), matRam)
      ram.position.set(POS.ram.x + 0.04, TOPO_PLACA + 0.012 + i * 0.03, zP(POS.ram.z) + i * 0.03)
      grupo.add(ram)
      for (let c = 0; c < 4; c++) {
        const mem = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.008, 0.1), matChip)
        mem.position.set(POS.ram.x - 0.2 + c * 0.14, ram.position.y + 0.009, ram.position.z)
        grupo.add(mem)
      }
    }
    // chip da BIOS (8 pinos)
    const bios = new THREE.Mesh(new THREE.BoxGeometry(POS.bios.w, 0.014, POS.bios.d), matBios)
    bios.position.set(POS.bios.x, TOPO_PLACA + 0.008, zP(POS.bios.z))
    grupo.add(bios)
    const pinos = new THREE.InstancedMesh(new THREE.BoxGeometry(0.008, 0.004, 0.022), matDie, 8)
    for (let i = 0; i < 8; i++) {
      mm.position.set(POS.bios.x - 0.036 + (i % 4) * 0.024, TOPO_PLACA + 0.003, zP(POS.bios.z) + (i < 4 ? -1 : 1) * 0.05)
      mm.updateMatrix()
      pinos.setMatrixAt(i, mm.matrix)
    }
    grupo.add(pinos)
    // SSD M.2 (recuperação de dados)
    const matSsdPcb = new THREE.MeshStandardMaterial({ color: '#0d2a5e', roughness: 0.5, metalness: 0.2 })
    const ssd = new THREE.Mesh(new THREE.BoxGeometry(0.64, 0.008, 0.16), matSsdPcb)
    ssd.position.set(POS.ssd.x, TOPO_PLACA + 0.006, zP(POS.ssd.z))
    grupo.add(ssd)
    for (const [dx, w] of [
      [-0.18, 0.14],
      [0.0, 0.14],
      [0.19, 0.1],
    ] as const) {
      const nand = new THREE.Mesh(new THREE.BoxGeometry(w, 0.01, 0.12), matSsd)
      nand.position.set(POS.ssd.x + dx, TOPO_PLACA + 0.014, zP(POS.ssd.z))
      grupo.add(nand)
    }

    // capacitores, indutores e componentes SMD espalhados (iguais em toda visita)
    const r = rng(1984)
    const livre = (x: number, z: number) => {
      const zona = [
        { x: POS.chipHeroi.x, z: POS.chipHeroi.z, raio: 0.26 },
        { x: POS.cpu.x, z: POS.cpu.z, raio: 0.24 },
        { x: POS.ventoinha.x, z: POS.ventoinha.z, raio: 0.34 },
        { x: POS.ram.x + 0.04, z: POS.ram.z, raio: 0.36 },
        { x: POS.bios.x, z: POS.bios.z, raio: 0.1 },
      ]
      if (z < -0.42 && x > 0.6) return false
      if (Math.abs(z - POS.ssd.z) < 0.12 && Math.abs(x - POS.ssd.x) < 0.38) return false
      return zona.every((q) => Math.hypot(x - q.x, z - q.z) > q.raio)
    }
    const sorteia = () => {
      for (let t = 0; t < 40; t++) {
        const x = (r() - 0.5) * (PLACA.largura - 0.12)
        const z = (r() - 0.5) * (PLACA.profundidade - 0.12)
        if (livre(x, z)) return { x, z }
      }
      return { x: 0, z: 0.4 }
    }
    const matCap = new THREE.MeshStandardMaterial({ color: '#c9ced8', metalness: 0.85, roughness: 0.3 })
    const caps = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.024, 0.024, 0.05, 14), matCap, 30)
    for (let i = 0; i < 30; i++) {
      const s = i < 16 ? { x: POS.chipHeroi.x + (r() - 0.5) * 0.7, z: POS.chipHeroi.z + (r() < 0.5 ? -1 : 1) * (0.24 + r() * 0.12) } : sorteia()
      mm.position.set(s.x, TOPO_PLACA + 0.025, zP(s.z))
      mm.updateMatrix()
      caps.setMatrixAt(i, mm.matrix)
    }
    grupo.add(caps)
    const matInd = new THREE.MeshStandardMaterial({ color: '#2a2f3a', roughness: 0.5, metalness: 0.4 })
    const inds = new THREE.InstancedMesh(new THREE.BoxGeometry(0.07, 0.035, 0.07), matInd, 12)
    for (let i = 0; i < 12; i++) {
      mm.position.set(POS.cpu.x - 0.3 + (i % 6) * 0.1, TOPO_PLACA + 0.0175, zP(POS.cpu.z + (i < 6 ? 0.28 : 0.38)))
      mm.updateMatrix()
      inds.setMatrixAt(i, mm.matrix)
    }
    grupo.add(inds)
    const smd = new THREE.InstancedMesh(new THREE.BoxGeometry(0.02, 0.008, 0.011), matChip, 300)
    for (let i = 0; i < 300; i++) {
      const s = sorteia()
      mm.position.set(s.x, TOPO_PLACA + 0.004, zP(s.z))
      mm.rotation.set(0, r() < 0.5 ? 0 : Math.PI / 2, 0)
      mm.updateMatrix()
      smd.setMatrixAt(i, mm.matrix)
    }
    mm.rotation.set(0, 0, 0)
    grupo.add(smd)
    luzPlaca.position.set(POS.chipHeroi.x, 0.75, zP(POS.chipHeroi.z) - 0.1)
    grupo.add(luzPlaca)
    modelo.add(grupo)
  }

  // ---- topo: chapa com teclado e trackpad
  const topoMat = aluminio.clone()
  topoMat.transparent = true
  injetar(topoMat, u)
  const poco = new THREE.MeshStandardMaterial({ color: '#141821', roughness: 0.75, metalness: 0.2, transparent: true })
  injetar(poco, u)
  const tecla = new THREE.MeshStandardMaterial({ color: '#0d1016', roughness: 0.55, metalness: 0.15, transparent: true })
  injetar(tecla, u)
  const trackMat = new THREE.MeshStandardMaterial({ color: grafite ? '#4a5262' : '#aab4c4', roughness: 0.34, metalness: 0.65, transparent: true })
  injetar(trackMat, u)
  const chapaTopo = new THREE.Mesh(chapa(L, P, ESP_TOPO, 0.13), topoMat)
  topo.add(chapaTopo)
  const yS = ESP_TOPO + 0.0015
  const pocoGeo = new THREE.PlaneGeometry(2.78, 1.02)
  pocoGeo.rotateX(-Math.PI / 2)
  const pocoMesh = new THREE.Mesh(pocoGeo, poco)
  pocoMesh.position.set(0, yS, -0.33)
  topo.add(pocoMesh)
  const passo = 0.19
  const lado = 0.162
  const pos: { x: number; z: number; w: number }[] = []
  for (let l = 0; l < 5; l++)
    for (let c = 0; c < 14; c++) {
      if (l === 4 && c > 4 && c <= 9) continue
      const w = l === 4 && c === 4 ? 5 * passo + lado : lado
      pos.push({ x: -6.5 * passo + c * passo + (w - lado) / 2, z: -0.33 - 2 * passo + l * passo, w })
    }
  const teclas = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 0.016, lado), tecla, pos.length)
  pos.forEach((t, i) => {
    mm.position.set(t.x, yS + 0.008, t.z)
    mm.scale.set(t.w, 1, 1)
    mm.updateMatrix()
    teclas.setMatrixAt(i, mm.matrix)
  })
  mm.scale.set(1, 1, 1)
  topo.add(teclas)
  const track = new THREE.Mesh(chapa(1.18, 0.68, 0.004, 0.06), trackMat)
  track.position.set(0, ESP_TOPO, 0.6)
  topo.add(track)
  topo.position.y = ALT_PAREDE
  modelo.add(topo)

  // ---- tampa na dobradiça, com a tela
  dobradica.position.set(0, ALT_PAREDE + ESP_TOPO + 0.004, -P / 2 + 0.03)
  const casca = new THREE.Mesh(chapa(L, P - 0.04, ESP_TAMPA, 0.13), aluminio)
  casca.position.set(0, 0, (P - 0.04) / 2)
  tampa.add(casca)
  const moldura = new THREE.Mesh(new THREE.PlaneGeometry(L - 0.06, P - 0.1), new THREE.MeshStandardMaterial({ color: '#04060b', roughness: 0.12, metalness: 0.4 }))
  moldura.rotation.x = Math.PI / 2
  moldura.position.set(0, -0.0015, (P - 0.04) / 2)
  tampa.add(moldura)
  const uTela = uniformesTela(u, 1.6)
  const tela = new THREE.Mesh(new THREE.PlaneGeometry(2.98, 1.86), materialTela(uTela))
  tela.rotation.x = Math.PI / 2
  tela.position.set(0, -0.003, 1.17)
  tampa.add(tela)
  const luzTela = new THREE.PointLight('#4d94ff', 0, 3.6, 2)
  luzTela.position.set(0, -1.7, 1.0)
  tampa.add(luzTela)
  dobradica.add(tampa)
  modelo.add(dobradica)

  // pontos dos defeitos (onde a triagem aponta)
  const zonas: Record<string, Zona> = {
    energia: { obj: modelo, pos: new THREE.Vector3(L / 2, 0.06, 0.3) },
    ventoinha: { obj: modelo, pos: new THREE.Vector3(L / 2, 0.06, -0.8) },
    tela: { obj: tampa, pos: new THREE.Vector3(0, -0.01, 1.2) },
    dobradica: { obj: modelo, pos: new THREE.Vector3(1.15, 0.15, -P / 2 + 0.04) },
    teclado: { obj: topo, pos: new THREE.Vector3(-0.35, 0.05, -0.3) },
    placa: { obj: topo, pos: new THREE.Vector3(0.35, 0.05, -0.55) },
    bateria: { obj: topo, pos: new THREE.Vector3(0.0, 0.04, 0.55) },
    geral: { obj: topo, pos: new THREE.Vector3(0, 0.05, -0.2) },
  }

  return { modelo, dobradica, tampa, topo, chip, helices, matTopo: [topoMat, poco, tecla, trackMat], matSolda, matPlaca, matBios, matSsd, uTela, luzTela, luzPlaca, zonas, centroChip }
}
