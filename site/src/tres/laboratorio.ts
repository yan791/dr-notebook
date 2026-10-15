import * as THREE from 'three'
import { clamp, inv, lerp, suave } from '../lib/util'
import { curva, novosUniformes, Palco } from './palco'
import { ALT_PAREDE, ANGULO_ABERTA, ESP_TOPO, montarNotebook, Y_PLACA, type Notebook } from './notebook'
import { POS, texturaSombra } from './texturas'

/*
 * O laboratório em 3D: quando a seção aparece, o notebook se abre sozinho (tampa e
 * teclado saem, a câmera desce até a placa) e fica ali, vivo. Cada procedimento da lista
 * acende a sua peça: o chip sobe e mostra as esferas (reballing), a BIOS brilha, o SSD
 * acende (recuperação de dados) ou a corrente corre pelas trilhas (placa-mãe). O visitante
 * pode girar arrastando. Nada depende da rolagem.
 */

export type Foco = 'placa' | 'solda' | 'bios' | 'dados'

// câmera ao longo da abertura (a = 0 fechado de frente, a = 1 sobre a placa)
type Chave = { a: number; pos: [number, number, number]; alvo: [number, number, number] }
const CHAVES: Chave[] = [
  { a: 0.0, pos: [1.0, 4.9, 9.3], alvo: [0, 0.8, -0.1] },
  { a: 0.25, pos: [-0.3, 5.5, 7.9], alvo: [0, 0.55, -0.2] },
  { a: 0.6, pos: [-0.9, 3.6, 3.2], alvo: [-0.1, 0.05, -0.45] },
  { a: 1.0, pos: [-0.3, 3.0, 3.1], alvo: [-0.2, -0.05, -0.22] },
]
const as = CHAVES.map((c) => c.a)
const CAMINHO = {
  pos: [0, 1, 2].map((k) => curva(as, CHAVES.map((c) => c.pos[k]))),
  alvo: [0, 1, 2].map((k) => curva(as, CHAVES.map((c) => c.alvo[k]))),
}

export const PONTOS_LAB: Record<Foco, THREE.Vector3> = {
  solda: new THREE.Vector3(POS.chipHeroi.x, 0.08, POS.chipHeroi.z - 0.5),
  bios: new THREE.Vector3(POS.bios.x, 0.06, POS.bios.z - 0.5),
  dados: new THREE.Vector3(POS.ssd.x, 0.06, POS.ssd.z - 0.5),
  placa: new THREE.Vector3(0.75, 0.06, -0.62),
}

export class CenaLaboratorio {
  palco: Palco
  private u = novosUniformes()
  private nb: Notebook
  private raiz = new THREE.Group()
  private sombra: THREE.Mesh<THREE.PlaneGeometry, THREE.MeshBasicMaterial>
  private giroArrasto = 0
  private giro = 0
  private chipK = 0
  private biosK = 0
  private ssdK = 0
  private ondaK = 0

  constructor(canvas: HTMLCanvasElement, { movel }: { movel: boolean }) {
    this.palco = new Palco(canvas, { movel })
    this.nb = montarNotebook(this.u, { acabamento: 'prata', miolo: true })
    this.nb.dobradica.rotation.x = -ANGULO_ABERTA
    this.sombra = new THREE.Mesh(new THREE.PlaneGeometry(5.2, 3.8), new THREE.MeshBasicMaterial({ map: texturaSombra(), transparent: true, depthWrite: false, opacity: 0.9 }))
    this.sombra.rotation.x = -Math.PI / 2
    this.sombra.position.y = 0.002
    this.raiz.add(this.sombra, this.nb.modelo)
    this.palco.cena.add(this.raiz)
    this.u.uCentro.value.copy(this.nb.centroChip)

    this.resize(canvas.clientWidth || 800, canvas.clientHeight || 600, 1)
  }

  /** Aquecimento: aberto e aceso, compilado em segundo plano, para nada travar a rolagem. */
  async aquecer() {
    this.apply({ tempo: 0, abertura: 1, foco: 'solda' })
    this.nb.topo.visible = true
    await this.palco.compilar()
    this.palco.composer.render()
    this.apply({ tempo: 0, abertura: 0, foco: null })
  }

  resize(w: number, h: number, dpr: number) {
    this.palco.resize(w, h, dpr)
  }

  /** Giro vindo do arraste (radianos, limitado). */
  arrastar(delta: number) {
    this.giroArrasto = clamp(this.giroArrasto + delta, -0.6, 0.6)
  }

  apply({ tempo, abertura, foco }: { tempo: number; abertura: number; foco: Foco | null }) {
    const p = this.palco
    const { w, h } = p.tam
    const aspecto = w / h
    const estreito = aspecto < 1
    const a = clamp(abertura)

    // ---- câmera
    p.seguirMouse()
    const [cx, cy, cz] = CAMINHO.pos.map((f) => f(a))
    const [ax, ay, az] = CAMINHO.alvo.map((f) => f(a))
    const recuo = estreito ? lerp(1.1, 1.75, clamp((1 - aspecto) / 0.5)) : aspecto < 1.35 ? 1.15 : 1
    const resp = Math.sin(tempo * 0.55) * 0.02
    p.camera.position.set(ax + (cx - ax) * recuo + p.mouse.sx * 0.15, ay + (cy - ay) * recuo - p.mouse.sy * 0.08 + resp, az + (cz - az) * recuo)
    p.camera.lookAt(ax + p.mouse.sx * 0.06, ay - p.mouse.sy * 0.04, az)
    p.camera.fov = estreito ? 36 : 30
    const desloca = estreito ? 0 : -0.21 * (aspecto < 1.35 ? 0.6 : 1)
    const sobe = estreito ? 0.08 : 0
    p.camera.setViewOffset(w, h, desloca * w, sobe * h, w, h)
    p.camera.updateProjectionMatrix()

    // ---- giro do arraste e balanço
    this.giro += (this.giroArrasto + Math.sin(tempo * 0.3) * 0.03 - this.giro) * 0.08
    this.raiz.rotation.y = this.giro

    // ---- abertura: tampa e topo saem por cima, a câmera desce
    const e = suave(inv(0.15, 0.7, a))
    const nb = this.nb
    nb.tampa.position.set(0, e * 1.4, -e * 0.7)
    nb.tampa.rotation.x = -e * 0.35
    nb.dobradica.position.y = ALT_PAREDE + ESP_TOPO + 0.004 + e * 1.2
    const eTopo = suave(inv(0.15, 0.6, a))
    nb.topo.position.set(0, ALT_PAREDE + eTopo * 3.2, -eTopo * 1.2)
    nb.topo.rotation.x = -eTopo * 0.35
    const opTopo = 1 - suave(inv(0.55, 0.95, eTopo))
    for (const m of nb.matTopo) m.opacity = opTopo
    nb.topo.visible = opTopo > 0.01
    nb.uTela.uLigada.value = 0.5 * (1 - e)
    nb.uTela.uTempo.value = tempo

    // ---- o foco de cada procedimento (só depois de aberto)
    const pronto = suave(inv(0.8, 1, a))
    const amortece = (atual: number, alvo: number) => atual + (alvo - atual) * 0.07
    this.chipK = amortece(this.chipK, foco === 'solda' ? pronto : 0)
    this.biosK = amortece(this.biosK, foco === 'bios' ? pronto : 0)
    this.ssdK = amortece(this.ssdK, foco === 'dados' ? pronto : 0)
    this.ondaK = amortece(this.ondaK, (foco === 'placa' ? 1 : 0.3) * suave(inv(0.6, 1, a)))
    const c = suave(this.chipK)
    nb.chip.position.y = Y_PLACA + 0.008 + 0.02 + c * 0.2
    nb.chip.rotation.x = -c * 0.12
    nb.chip.rotation.z = c * 0.06
    nb.matSolda.emissiveIntensity = c * (1.6 + 0.5 * Math.sin(tempo * 5))
    nb.matBios.emissiveIntensity = this.biosK * (1.2 + 0.6 * Math.sin(tempo * 6))
    nb.matSsd.emissiveIntensity = this.ssdK * (0.9 + 0.4 * Math.sin(tempo * 4))
    this.u.uOnda.value = this.ondaK
    this.u.uRaio.value = ((tempo * 0.55) % 1.6) + 0.05
    nb.matPlaca.emissiveIntensity = 0.05 + 0.15 * this.ondaK
    nb.luzPlaca.intensity = 0.3 * this.ondaK + 0.7 * c
    nb.helices.rotation.y = tempo * 2.5

    // ---- ambiente e pós
    p.uFundo.uTempo.value = tempo
    p.uFundo.uBrilho.value = 0.8 + 0.2 * this.ondaK
    p.bloom.strength = 0.5 + 0.12 * c
    p.uSaida.uTempo.value = tempo
    p.uSaida.uFlash.value = 0
    this.sombra.material.opacity = 0.9 * (1 - e * 0.4)
  }

  render() {
    this.palco.render()
  }

  projetar(foco: Foco) {
    return this.palco.projetar(PONTOS_LAB[foco], this.nb.modelo)
  }

  dispose() {
    this.palco.dispose()
  }
}

