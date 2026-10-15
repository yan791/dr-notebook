import * as THREE from 'three'
import { clamp, easeOut, lerp } from '../lib/util'
import { novosUniformes, Palco } from './palco'
import { ANGULO_ABERTA, montarNotebook, type Zona } from './notebook'
import { montarCelular, montarDrone, montarPC, montarVideogame, type Aparelho3D } from './aparelhos'
import { texturaSombra } from './texturas'
import type { IdAparelho } from '../dados/triagem'

/*
 * A recepção em 3D (topo do site): o aparelho que o visitante escolhe entra na bancada e,
 * quando ele diz o sintoma, o ponto provável do defeito acende em âmbar, como um técnico
 * apontando onde vai olhar. Nada aqui depende da rolagem.
 */

type Chave = IdAparelho | 'inicio'
type Modelo = 'prata' | 'grafite' | 'pc' | 'celular' | 'videogame' | 'drone'
const MODELO: Record<Chave, Modelo> = { inicio: 'prata', mac: 'prata', notebook: 'grafite', pc: 'pc', celular: 'celular', videogame: 'videogame', drone: 'drone' }

// enquadramento por aparelho: altura do alvo, distância da câmera e giro de repouso
const QUADRO: Record<Modelo, { alvo: number; dist: number; giro: number; sombra: number }> = {
  prata: { alvo: 0.92, dist: 9.6, giro: 0.08, sombra: 1 },
  grafite: { alvo: 0.92, dist: 9.6, giro: 0.08, sombra: 1 },
  pc: { alvo: 1.2, dist: 9.4, giro: -0.55, sombra: 0.8 },
  celular: { alvo: 1.2, dist: 7.4, giro: 0.3, sombra: 0.5 },
  videogame: { alvo: 0.42, dist: 7.6, giro: -0.15, sombra: 1 },
  drone: { alvo: 0.95, dist: 7.8, giro: 0.45, sombra: 0.8 },
}
const DIRECAO = new THREE.Vector3(0.5, 0.24, 0.84).normalize()

// modo: 'lado' = texto à esquerda e aparelho à direita (desktop); 'topo' = aparelho numa faixa em cima (celular)
export type EstadoRecepcao = { tempo: number; aparelho: IdAparelho | null; zona: string | null; modo: 'lado' | 'topo' }

type Item = Aparelho3D & { escala: number }

export class CenaRecepcao {
  palco: Palco
  private u = novosUniformes()
  private modelos = {} as Record<Modelo, Item>
  private atual: Modelo = 'prata'
  private anterior: Modelo | null = null
  private troca = -1
  private entrando = false
  private chave: Chave = 'inicio'
  private giro = 0
  private giroExtra = 0
  private alvo = new THREE.Vector3(0, 0.92, 0)
  private dist = 9.6
  private sombra: THREE.Mesh<THREE.PlaneGeometry, THREE.MeshBasicMaterial>
  private anel: THREE.Mesh<THREE.RingGeometry, THREE.MeshBasicMaterial>
  private luzDefeito = new THREE.PointLight('#ffb547', 0, 2.4, 2)
  private forcaDefeito = 0
  private zonaAtiva: Zona | null = null
  private aux = new THREE.Vector3()

  constructor(canvas: HTMLCanvasElement, { movel }: { movel: boolean }) {
    this.palco = new Palco(canvas, { movel })
    const cena = this.palco.cena
    this.sombra = new THREE.Mesh(new THREE.PlaneGeometry(5.2, 3.8), new THREE.MeshBasicMaterial({ map: texturaSombra(), transparent: true, depthWrite: false, opacity: 0.9 }))
    this.sombra.rotation.x = -Math.PI / 2
    this.sombra.position.y = 0.002
    cena.add(this.sombra)
    // anel de varredura no piso, a cada troca de aparelho
    this.anel = new THREE.Mesh(new THREE.RingGeometry(0.96, 1, 96), new THREE.MeshBasicMaterial({ color: new THREE.Color('#5cc6f2').multiplyScalar(2.2), transparent: true, opacity: 0, toneMapped: false, depthWrite: false, side: THREE.DoubleSide }))
    this.anel.rotation.x = -Math.PI / 2
    this.anel.position.y = 0.01
    cena.add(this.anel, this.luzDefeito)

    const prata = montarNotebook(this.u, { acabamento: 'prata', miolo: false })
    const grafite = montarNotebook(this.u, { acabamento: 'grafite', miolo: false })
    for (const nb of [prata, grafite]) {
      nb.dobradica.rotation.x = -ANGULO_ABERTA
      nb.uTela.uLigada.value = 0.48
    }
    const comoAparelho = (nb: typeof prata): Item => {
      const grupo = new THREE.Group()
      grupo.add(nb.modelo)
      return { grupo, zonas: nb.zonas, telas: [nb.uTela], animar: () => {}, escala: 0 }
    }
    this.modelos = {
      prata: comoAparelho(prata),
      grafite: comoAparelho(grafite),
      pc: { ...montarPC(this.u), escala: 0 },
      celular: { ...montarCelular(this.u), escala: 0 },
      videogame: { ...montarVideogame(this.u), escala: 0 },
      drone: { ...montarDrone(this.u), escala: 0 },
    }
    for (const m of Object.values(this.modelos)) {
      m.grupo.visible = false
      cena.add(m.grupo)
    }
    this.modelos.prata.escala = 1
    this.modelos.prata.grupo.visible = true

    this.resize(canvas.clientWidth || 800, canvas.clientHeight || 600, 1)
  }

  /** Aquecimento: compila todos os aparelhos em segundo plano, para nada travar quando o visitante escolher. */
  async aquecer() {
    for (const m of Object.values(this.modelos)) {
      m.grupo.visible = true
      m.grupo.scale.setScalar(1)
    }
    await this.palco.compilar()
    this.palco.composer.render()
    for (const [k, m] of Object.entries(this.modelos)) {
      m.grupo.visible = k === 'prata'
      m.grupo.scale.setScalar(k === 'prata' ? 1 : 0)
    }
  }

  resize(w: number, h: number, dpr: number) {
    this.palco.resize(w, h, dpr)
  }

  apply({ tempo, aparelho, zona, modo }: EstadoRecepcao) {
    const p = this.palco
    const { w, h } = p.tam
    const aspecto = w / h
    const topo = modo === 'topo'

    // ---- troca de aparelho: o atual encolhe, o novo cresce girando; um anel varre o piso
    const chave: Chave = aparelho ?? 'inicio'
    const modelo = MODELO[chave]
    if (chave !== this.chave) {
      this.chave = chave
      this.troca = tempo
      if (modelo !== this.atual) {
        this.anterior = this.atual
        this.atual = modelo
        this.entrando = true
        this.giroExtra = 0.9
      } else {
        // mesmo modelo (ex.: do início para o Mac): só gira e o anel passa
        this.giroExtra = 0.5
      }
    }
    const k = this.troca < 0 ? 1 : (tempo - this.troca) / 0.95
    if (this.anterior) {
      const ant = this.modelos[this.anterior]
      ant.escala = 1 - easeOut(clamp(k / 0.35))
      if (k >= 0.35) {
        ant.grupo.visible = false
        ant.escala = 0
        this.anterior = null
      }
    }
    const novo = this.modelos[this.atual]
    const kIn = clamp((k - 0.28) / 0.72)
    // entra com um leve exagero e assenta
    const back = (t: number) => 1 + 2.2 * Math.pow(t - 1, 3) + 1.2 * Math.pow(t - 1, 2)
    if (this.entrando) {
      novo.escala = Math.max(0.001, back(kIn))
      if (kIn >= 1) {
        novo.escala = 1
        this.entrando = false
      }
    } else novo.escala = 1
    if (this.troca >= 0 && k < 1.2) {
      const a = clamp(k / 1.1)
      this.anel.scale.setScalar(lerp(0.3, 4.2, easeOut(a)))
      this.anel.material.opacity = (1 - a) * 0.9
    } else this.anel.material.opacity = 0
    for (const [nome, m] of Object.entries(this.modelos)) {
      const ativo = nome === this.atual || nome === this.anterior
      m.grupo.visible = ativo && m.escala > 0.002
      m.grupo.scale.setScalar(m.escala)
    }

    // ---- giro: repouso do aparelho, balanço, giro de entrada e o giro da zona (ex.: costas do celular)
    const q = QUADRO[this.atual]
    const z = zona ? (novo.zonas[zona] ?? novo.zonas.geral) : null
    const giroZona = (z as { giro?: number } | null)?.giro ?? 0
    this.giroExtra *= Math.pow(0.04, 1 / 60)
    const alvoGiro = q.giro + giroZona + Math.sin(tempo * 0.32) * 0.05 + this.giroExtra
    this.giro += (alvoGiro - this.giro) * 0.06
    novo.grupo.rotation.y = this.giro
    if (this.anterior) this.modelos[this.anterior].grupo.rotation.y = this.giro
    for (const m of Object.values(this.modelos)) if (m.grupo.visible) m.animar(tempo)

    // ---- câmera: aproxima-se suavemente do enquadramento do aparelho
    p.seguirMouse()
    this.alvo.y += (q.alvo - this.alvo.y) * 0.06
    this.dist += (q.dist - this.dist) * 0.06
    const recuo = topo ? lerp(1.0, 1.4, clamp((1.25 - aspecto) / 0.6)) : aspecto < 1.35 ? 1.15 : 1
    const d = this.dist * recuo
    const resp = Math.sin(tempo * 0.55) * 0.02
    p.camera.position.set(this.alvo.x + DIRECAO.x * d + p.mouse.sx * 0.25, this.alvo.y + DIRECAO.y * d - p.mouse.sy * 0.15 + resp, this.alvo.z + DIRECAO.z * d)
    this.aux.set(this.alvo.x + p.mouse.sx * 0.08, this.alvo.y - p.mouse.sy * 0.05, this.alvo.z)
    p.camera.lookAt(this.aux)
    p.camera.fov = topo ? 32 : 30
    const desloca = topo ? 0 : -0.2 * (aspecto < 1.35 ? 0.55 : 1)
    const sobe = topo ? -0.02 : 0
    p.camera.setViewOffset(w, h, desloca * w, sobe * h, w, h)
    p.camera.updateProjectionMatrix()

    // ---- o defeito: aro âmbar que se expande nas superfícies em volta da zona e uma luz
    const temDefeito = Boolean(z && zona !== 'geral' && zona !== 'outro')
    this.forcaDefeito += ((temDefeito ? 1 : 0) - this.forcaDefeito) * 0.08
    this.zonaAtiva = z
    if (z) {
      z.obj.updateWorldMatrix(true, false)
      const mundo = z.pos.clone().applyMatrix4(z.obj.matrixWorld)
      this.u.uDefeito.value.copy(mundo)
      this.luzDefeito.position.copy(mundo).add(new THREE.Vector3(0.2, 0.35, 0.3))
    }
    const radar = (tempo * 0.7) % 1
    this.u.uDefeitoRaio.value = 0.04 + radar * 0.42
    this.u.uDefeitoForca.value = this.forcaDefeito * (1 - radar * 0.6)
    this.luzDefeito.intensity = this.forcaDefeito * (1.4 + 0.6 * Math.sin(tempo * 6))
    for (const t of novo.telas) {
      t.uTempo.value = tempo
      t.uFalha.value += ((zona === 'tela' ? 1 : 0) - t.uFalha.value) * 0.1
    }

    // ---- sombra e ambiente
    this.sombra.scale.setScalar(Math.max(0.3, novo.escala) * q.sombra)
    this.sombra.material.opacity = 0.85 * novo.escala
    p.uFundo.uTempo.value = tempo
    p.uFundo.uBrilho.value = 0.85 + 0.15 * this.forcaDefeito
    p.uSaida.uTempo.value = tempo
    p.uSaida.uFlash.value = this.anel.material.opacity * 0.05
  }

  render() {
    this.palco.render()
  }

  /** Onde o defeito está na tela (px), para o marcador em HTML. */
  projetarDefeito() {
    if (!this.zonaAtiva || this.forcaDefeito < 0.05) return null
    return this.palco.projetar(this.zonaAtiva.pos, this.zonaAtiva.obj)
  }

  get forca() {
    return this.forcaDefeito
  }

  dispose() {
    this.palco.dispose()
  }
}
