import * as THREE from 'three'
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js'
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js'
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js'
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js'
import { clamp, easeInOut, easeOut, inv, lerp, rng, suave } from '../lib/util'
import { PLACA, POS, texturaAmbiente, texturaPiso, texturaPlaca, texturaSombra } from './texturas'

/*
 * O atendimento em 3D. Um notebook modelado em código passa pela história do hero:
 * chega com a tela "sem sinal", é varrido pelo diagnóstico, se abre até o chip
 * (as esferas de solda acendem: reballing) e volta montado com o batimento na tela.
 * Tudo comandado por p (0 a 1), o progresso do scroll pela seção fixa.
 */

// ---------------------------------------------------------------------------
// medidas (unidades da cena; o notebook tem 3,2 de largura)
// ---------------------------------------------------------------------------
const L = 3.2
const P = 2.2
const ALT_PAREDE = 0.1
const ESP_TOPO = 0.032
const ESP_TAMPA = 0.042
const ANGULO_ABERTA = THREE.MathUtils.degToRad(110)
const Y_PLACA = 0.034

// pontos do HUD (no espaço do notebook)
export const PONTOS = {
  bateria: new THREE.Vector3(-0.2, 0.12, 0.62),
  carregador: new THREE.Vector3(-1.6, 0.06, 0.15),
  placa: new THREE.Vector3(POS.chipHeroi.x, 0.12, POS.chipHeroi.z - 0.5),
  solda: new THREE.Vector3(POS.chipHeroi.x, 0.06, POS.chipHeroi.z - 0.5),
  bios: new THREE.Vector3(POS.bios.x, 0.05, POS.bios.z - 0.5),
} as const

// ---------------------------------------------------------------------------
// câmera: chaves ao longo de p, interpoladas por curva monótona (sem ultrapassar)
// ---------------------------------------------------------------------------
type Chave = { p: number; pos: [number, number, number]; alvo: [number, number, number] }
const CHAVES: Chave[] = [
  { p: 0.0, pos: [5.2, 2.9, 8.2], alvo: [0.15, 0.92, 0] },
  { p: 0.2, pos: [4.0, 3.15, 8.6], alvo: [0.1, 0.9, 0] },
  { p: 0.33, pos: [1.0, 4.9, 9.3], alvo: [0, 0.8, -0.1] },
  { p: 0.45, pos: [-0.3, 5.5, 7.9], alvo: [0, 0.55, -0.2] },
  { p: 0.56, pos: [-0.9, 3.6, 3.2], alvo: [-0.1, 0.05, -0.45] },
  { p: 0.66, pos: [-0.75, 2.2, 1.65], alvo: [-0.35, 0.06, -0.5] },
  { p: 0.73, pos: [-0.55, 2.05, 1.85], alvo: [-0.38, 0.08, -0.5] },
  { p: 0.84, pos: [2.0, 3.4, 7.2], alvo: [0, 0.82, 0] },
  { p: 0.94, pos: [4.3, 2.95, 8.4], alvo: [0.12, 0.9, 0] },
  { p: 1.0, pos: [4.4, 2.92, 8.4], alvo: [0.12, 0.9, 0] },
]

/** Interpolação cúbica monótona (Fritsch-Carlson) de uma série de valores em p. */
function curva(ps: number[], vs: number[]) {
  const n = ps.length
  const d: number[] = []
  const m: number[] = []
  for (let i = 0; i < n - 1; i++) d.push((vs[i + 1] - vs[i]) / (ps[i + 1] - ps[i]))
  m[0] = d[0]
  m[n - 1] = d[n - 2]
  for (let i = 1; i < n - 1; i++) m[i] = d[i - 1] * d[i] <= 0 ? 0 : (d[i - 1] + d[i]) / 2
  for (let i = 0; i < n - 1; i++) {
    if (d[i] === 0) {
      m[i] = m[i + 1] = 0
      continue
    }
    const a = m[i] / d[i]
    const b = m[i + 1] / d[i]
    const s = a * a + b * b
    if (s > 9) {
      const t = 3 / Math.sqrt(s)
      m[i] = t * a * d[i]
      m[i + 1] = t * b * d[i]
    }
  }
  return (p: number) => {
    if (p <= ps[0]) return vs[0]
    if (p >= ps[n - 1]) return vs[n - 1]
    let i = 0
    while (p > ps[i + 1]) i++
    const h = ps[i + 1] - ps[i]
    const t = (p - ps[i]) / h
    const t2 = t * t
    const t3 = t2 * t
    return (2 * t3 - 3 * t2 + 1) * vs[i] + (t3 - 2 * t2 + t) * h * m[i] + (-2 * t3 + 3 * t2) * vs[i + 1] + (t3 - t2) * h * m[i + 1]
  }
}
const ps = CHAVES.map((c) => c.p)
const CAMINHO = {
  pos: [0, 1, 2].map((k) => curva(ps, CHAVES.map((c) => c.pos[k]))),
  alvo: [0, 1, 2].map((k) => curva(ps, CHAVES.map((c) => c.alvo[k]))),
}

// ---------------------------------------------------------------------------
// shaders
// ---------------------------------------------------------------------------
const TELA_VERT = /* glsl */ `
  varying vec2 vUv;
  varying vec3 vW;
  void main(){
    vUv = uv;
    vec4 w = modelMatrix * vec4(position, 1.0);
    vW = w.xyz;
    gl_Position = projectionMatrix * viewMatrix * w;
  }`

// a tela do notebook: monitor cardíaco que varre da esquerda para a direita
const TELA_FRAG = /* glsl */ `
  uniform float uTempo;
  uniform float uLigada;
  uniform float uVida;
  uniform float uScan;
  uniform float uScanForca;
  varying vec2 vUv;
  varying vec3 vW;
  float g(float x, float m, float s){ return exp(-pow((x - m) / s, 2.0)); }
  float ecg(float f){
    return 0.12*g(f,0.20,0.035) - 0.12*g(f,0.385,0.011) + 1.0*g(f,0.41,0.013) - 0.3*g(f,0.44,0.012) + 0.24*g(f,0.66,0.05);
  }
  void main(){
    vec2 uv = vUv;
    float aspecto = 1.6;
    vec3 cor = mix(vec3(0.004, 0.01, 0.03), vec3(0.012, 0.035, 0.09), uv.y) * (0.35 + 0.65 * uLigada);
    // grade do monitor
    vec2 gp = uv * vec2(aspecto, 1.0) * 12.0;
    vec2 gl = abs(fract(gp) - 0.5);
    float dg = min(0.5 - gl.x, 0.5 - gl.y);
    cor += vec3(0.08, 0.2, 0.45) * (1.0 - smoothstep(0.0, 0.035, dg)) * 0.22 * uLigada;
    // a linha: reta (sem sinal) ou batendo
    float bat = 2.2;
    float f = fract(uv.x * bat + 0.18);
    float A = 0.27 * uVida;
    float y0 = 0.47;
    float yv = y0 + A * ecg(f);
    float e = 0.002;
    float k = A * (ecg(f + e) - ecg(f - e)) / (2.0 * e) * bat;
    float d = abs(uv.y - yv) / sqrt(1.0 + pow(k / aspecto, 2.0));
    // varredura: o traço recente brilha, o antigo apaga, e há um vão logo à frente da cabeça
    float cabeca = fract(uTempo * 0.3);
    float idade = fract(cabeca - uv.x);
    float rastro = exp(-idade * 2.2) * step(idade, 0.94);
    float nucleo = smoothstep(0.0065, 0.0, d);
    float halo = exp(-d * 55.0) * 0.55;
    vec3 tinta = mix(vec3(0.25, 0.55, 1.0), vec3(0.32, 0.8, 1.0), uVida);
    cor += tinta * (nucleo * 2.6 + halo) * rastro * uLigada;
    // ponto da cabeça
    float dc = length(vec2((uv.x - cabeca) * aspecto, uv.y - (y0 + A * ecg(fract(cabeca * bat + 0.18)))));
    cor += tinta * exp(-dc * 70.0) * 3.0 * uLigada;
    // vidro
    cor += vec3(0.6, 0.75, 1.0) * smoothstep(0.65, 1.0, uv.x * 0.5 + uv.y * 0.7) * 0.035;
    // varredura do diagnóstico atravessando a tela
    float b = exp(-pow((vW.z - uScan) / 0.03, 2.0)) + 0.25 * exp(-pow((vW.z - uScan) / 0.16, 2.0));
    cor += vec3(0.36, 0.78, 0.95) * b * uScanForca * 1.6;
    gl_FragColor = vec4(cor, 1.0);
  }`

// fundo: hexágonos grandes como nas artes da loja, num cilindro em volta da cena
const FUNDO_VERT = /* glsl */ `
  varying vec3 vW;
  void main(){
    vec4 w = modelMatrix * vec4(position, 1.0);
    vW = w.xyz;
    gl_Position = projectionMatrix * viewMatrix * w;
  }`
const FUNDO_FRAG = /* glsl */ `
  uniform float uTempo;
  uniform float uBrilho;
  varying vec3 vW;
  float hexDist(vec2 p){ p = abs(p); return max(dot(p, normalize(vec2(1.0, 1.7320508))), p.x); }
  vec4 hexCoord(vec2 uv){
    vec2 r = vec2(1.0, 1.7320508);
    vec2 h = r * 0.5;
    vec2 a = mod(uv, r) - h;
    vec2 b = mod(uv - h, r) - h;
    vec2 gv = dot(a, a) < dot(b, b) ? a : b;
    return vec4(gv, uv - gv);
  }
  float hash(vec2 p){ return fract(sin(dot(p, vec2(41.3, 289.1))) * 43758.5453); }
  void main(){
    float ang = atan(vW.x, -vW.z);
    vec2 uv = vec2(ang * 13.0, vW.y) / 1.55;
    vec4 hc = hexCoord(uv);
    float borda = 0.5 - hexDist(hc.xy);
    float linha = smoothstep(0.022, 0.0, borda);
    float h = hash(hc.zw);
    float pulso = smoothstep(0.82, 1.0, h) * (0.5 + 0.5 * sin(uTempo * 0.6 + h * 30.0));
    // brilho azul atrás do notebook e escuridão no alto e embaixo
    float centro = exp(-pow(ang / 0.9, 2.0)) * exp(-pow((vW.y - 1.2) / 3.2, 2.0));
    vec3 base = mix(vec3(0.012, 0.035, 0.09), vec3(0.03, 0.09, 0.24), centro * uBrilho);
    vec3 cor = base + vec3(0.09, 0.2, 0.48) * linha * (0.28 + 0.9 * centro) + vec3(0.1, 0.3, 0.7) * pulso * linha * 0.9 * centro;
    cor += vec3(0.05, 0.12, 0.3) * (1.0 - smoothstep(0.0, 0.5, borda)) * pulso * 0.15;
    cor *= smoothstep(-2.5, 1.0, vW.y) * (1.0 - smoothstep(4.0, 9.0, vW.y));
    gl_FragColor = vec4(cor, 1.0);
  }`

// saída numa passada: vinheta e grão em linear, depois tone mapping e sRGB
const SAIDA_FRAG = /* glsl */ `
  precision highp float;
  uniform sampler2D tDiffuse;
  uniform float uTempo;
  uniform float uFlash;
  #include <tonemapping_pars_fragment>
  #include <colorspace_pars_fragment>
  varying vec2 vUv;
  float h(vec2 p){ return fract(sin(dot(p, vec2(12.9898,78.233)) + uTempo * 7.0) * 43758.5453); }
  void main(){
    vec2 d = vUv - 0.5;
    vec3 c = texture2D(tDiffuse, vUv).rgb;
    c += uFlash * vec3(0.18, 0.4, 0.75);
    float v = smoothstep(0.98, 0.3, length(d * vec2(1.0, 1.2)));
    c *= mix(1.0, v, 0.5);
    c += (h(vUv * 900.0) - 0.5) * 0.022;
    gl_FragColor = vec4(c, 1.0);
    #ifdef ACES_FILMIC_TONE_MAPPING
      gl_FragColor.rgb = ACESFilmicToneMapping(gl_FragColor.rgb);
    #endif
    #ifdef SRGB_TRANSFER
      gl_FragColor = sRGBTransferOETF(gl_FragColor);
    #endif
  }`

// injeção nos materiais do notebook: a faixa da varredura (em z do mundo) e, na
// placa, a onda de corrente que sai do chip pelas trilhas
type Uniformes = Record<string, THREE.IUniform>
function injetar(mat: THREE.MeshStandardMaterial, u: Uniformes, onda = false) {
  // a chave do cache precisa diferir: senão a placa (com a onda) reaproveitaria o programa dos outros
  mat.customProgramCacheKey = () => (onda ? 'dn-scan-onda' : 'dn-scan')
  mat.onBeforeCompile = (sh) => {
    Object.assign(sh.uniforms, u)
    sh.vertexShader = sh.vertexShader
      .replace('#include <common>', '#include <common>\nvarying vec3 vWScan;')
      .replace(
        '#include <project_vertex>',
        `#include <project_vertex>
        vec4 wScan = vec4(transformed, 1.0);
        #ifdef USE_INSTANCING
          wScan = instanceMatrix * wScan;
        #endif
        vWScan = (modelMatrix * wScan).xyz;`,
      )
    sh.fragmentShader = sh.fragmentShader
      .replace('#include <common>', `#include <common>\nvarying vec3 vWScan;\nuniform float uScan;\nuniform float uScanForca;\nuniform float uRaio;\nuniform float uOnda;\nuniform vec3 uCentro;`)
      .replace(
        '#include <emissivemap_fragment>',
        `#include <emissivemap_fragment>
        float bScan = exp(-pow((vWScan.z - uScan) / 0.03, 2.0)) + 0.22 * exp(-pow((vWScan.z - uScan) / 0.16, 2.0));
        totalEmissiveRadiance += vec3(0.36, 0.78, 0.95) * bScan * uScanForca * 1.4;
        ${
          onda
            ? `#ifdef USE_EMISSIVEMAP
          float rOnda = distance(vWScan.xz, uCentro.xz);
          float frente = exp(-pow((rOnda - uRaio) / 0.09, 2.0));
          totalEmissiveRadiance += vec3(0.3, 0.8, 1.0) * texture2D(emissiveMap, vEmissiveMapUv).r * frente * uOnda * 3.2;
        #endif`
            : ''
        }`,
      )
  }
}

/** Retângulo arredondado (forma 2D) centrado na origem. */
function retangulo(w: number, h: number, r: number) {
  const s = new THREE.Shape()
  const x = -w / 2
  const y = -h / 2
  s.moveTo(x + r, y)
  s.lineTo(x + w - r, y)
  s.quadraticCurveTo(x + w, y, x + w, y + r)
  s.lineTo(x + w, y + h - r)
  s.quadraticCurveTo(x + w, y + h, x + w - r, y + h)
  s.lineTo(x + r, y + h)
  s.quadraticCurveTo(x, y + h, x, y + h - r)
  s.lineTo(x, y + r)
  s.quadraticCurveTo(x, y, x + r, y)
  return s
}

/** Chapa com cantos arredondados, deitada (espessura para cima, base em y = 0). */
function chapa(w: number, d: number, esp: number, r: number, furo?: { w: number; d: number; r: number }) {
  const forma = retangulo(w, d, r)
  if (furo) forma.holes.push(retangulo(furo.w, furo.d, furo.r) as unknown as THREE.Path)
  const bisel = Math.min(0.012, esp * 0.3)
  const geo = new THREE.ExtrudeGeometry(forma, { depth: esp - bisel * 2, bevelEnabled: true, bevelThickness: bisel, bevelSize: bisel, bevelSegments: 3, curveSegments: 10 })
  geo.rotateX(-Math.PI / 2)
  geo.translate(0, bisel, 0)
  return geo
}

export type Estado = {
  p: number
  tempo: number
  ligar: number
}

export class CenaNotebook {
  private renderer: THREE.WebGLRenderer
  private cena = new THREE.Scene()
  camera = new THREE.PerspectiveCamera(30, 1, 0.05, 80)
  private composer: EffectComposer
  private bloom: UnrealBloomPass
  private uSaida: Uniformes
  private uScan: Uniformes = {
    uScan: { value: 99 },
    uScanForca: { value: 0 },
    uRaio: { value: 0 },
    uOnda: { value: 0 },
    uCentro: { value: new THREE.Vector3() },
  }
  private uTela: Uniformes
  private uFundo: Uniformes
  private raiz = new THREE.Group()
  private modelo = new THREE.Group()
  private dobradica = new THREE.Group()
  private tampa = new THREE.Group()
  private topo = new THREE.Group()
  private chip = new THREE.Group()
  private helices = new THREE.Group()
  private matTopo: THREE.MeshStandardMaterial[] = []
  private matSolda!: THREE.MeshStandardMaterial
  private matPlaca!: THREE.MeshStandardMaterial
  private luzTela: THREE.PointLight
  private luzPlaca: THREE.PointLight
  private sombra: THREE.Mesh<THREE.PlaneGeometry, THREE.MeshBasicMaterial>
  private movel: boolean
  private mouse = { x: 0, y: 0, sx: 0, sy: 0 }
  private alvoCam = new THREE.Vector3()
  private tam = { w: 1, h: 1 }
  private teto = 1
  private qualidade = 1
  private media = 0
  private contagem = 0
  private ultimoQuadro = 0
  private aux = new THREE.Vector3()
  pontos = PONTOS
  trocas = 0

  constructor(canvas: HTMLCanvasElement, { movel }: { movel: boolean }) {
    this.movel = movel
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: false, powerPreference: 'high-performance', alpha: false })
    this.renderer.setClearColor(0x040d22, 1)
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping
    this.renderer.toneMappingExposure = 1.05
    this.renderer.outputColorSpace = THREE.SRGBColorSpace
    this.cena.background = new THREE.Color(0x040d22)
    this.cena.fog = new THREE.Fog(0x040d22, 9, 22)

    // ambiente para os metais (gerado em canvas, barato)
    const pmrem = new THREE.PMREMGenerator(this.renderer)
    const amb = texturaAmbiente()
    this.cena.environment = pmrem.fromEquirectangular(amb).texture
    amb.dispose()
    pmrem.dispose()

    // fundo de hexágonos
    this.uFundo = { uTempo: { value: 0 }, uBrilho: { value: 1 } }
    const fundo = new THREE.Mesh(
      new THREE.CylinderGeometry(15, 15, 22, 64, 1, true),
      new THREE.ShaderMaterial({ vertexShader: FUNDO_VERT, fragmentShader: FUNDO_FRAG, uniforms: this.uFundo, side: THREE.BackSide, depthWrite: false, fog: false }),
    )
    fundo.position.y = 3
    this.cena.add(fundo)

    // piso com brilho azul e sombra de contato
    // o piso é uma poça de luz que some nas bordas: sem linha de horizonte atrás do notebook
    const piso = new THREE.Mesh(new THREE.CircleGeometry(9, 64), new THREE.MeshBasicMaterial({ map: texturaPiso(), transparent: true, depthWrite: false, fog: false }))
    piso.rotation.x = -Math.PI / 2
    piso.position.y = -0.001
    this.cena.add(piso)
    this.sombra = new THREE.Mesh(new THREE.PlaneGeometry(5.2, 3.8), new THREE.MeshBasicMaterial({ map: texturaSombra(), transparent: true, depthWrite: false, opacity: 0.9 }))
    this.sombra.rotation.x = -Math.PI / 2
    this.sombra.position.y = 0.002
    this.raiz.add(this.sombra)

    // luzes
    this.cena.add(new THREE.HemisphereLight('#4a78d8', '#020611', 0.55))
    // a luz principal vem de trás e de cima: o reflexo dela no alumínio não volta para a câmera
    const chave = new THREE.DirectionalLight('#e6efff', 2.0)
    chave.position.set(2.5, 6, -2.5)
    const frente = new THREE.DirectionalLight('#cfe0ff', 0.85)
    frente.position.set(3, 2.2, 6)
    this.cena.add(frente)
    // contorno ciano por trás, baixo e à direita: o reflexo dele no tampo vai para a esquerda, longe da câmera
    const contra = new THREE.DirectionalLight('#5cc6f2', 2.0)
    contra.position.set(4, 0.8, -5)
    const lateral = new THREE.DirectionalLight('#3a6fe0', 1.2)
    lateral.position.set(-5, 2, 2)
    this.cena.add(chave, contra, lateral)
    this.luzTela = new THREE.PointLight('#4d94ff', 0, 3.6, 2)
    this.luzPlaca = new THREE.PointLight('#5cc6f2', 0, 1.8, 2)
    this.cena.add(this.luzPlaca)

    this.uTela = { uTempo: { value: 0 }, uLigada: { value: 0 }, uVida: { value: 0 }, uScan: this.uScan.uScan, uScanForca: this.uScan.uScanForca }

    this.montarNotebook()
    this.raiz.add(this.modelo)
    this.cena.add(this.raiz)

    // pós-processamento: bloom em meia resolução e a saída numa passada
    this.composer = new EffectComposer(this.renderer)
    this.composer.addPass(new RenderPass(this.cena, this.camera))
    this.bloom = new UnrealBloomPass(new THREE.Vector2(512, 512), 0.5, 0.3, 1.0)
    const tamanhoBloom = this.bloom.setSize.bind(this.bloom)
    this.bloom.setSize = () => tamanhoBloom(Math.round(this.tam.w * this.teto * 0.5), Math.round(this.tam.h * this.teto * 0.5))
    this.composer.addPass(this.bloom)
    const saida = new OutputPass()
    this.uSaida = saida.uniforms as unknown as Uniformes
    Object.assign(this.uSaida, { uTempo: { value: 0 }, uFlash: { value: 0 } })
    saida.material.fragmentShader = SAIDA_FRAG
    saida.material.needsUpdate = true
    this.composer.addPass(saida)

    window.addEventListener('pointermove', this.aoMouse, { passive: true })

    // aquecimento: um quadro com tudo aberto e aceso, para nada compilar no meio da rolagem
    this.resize(canvas.clientWidth || 800, canvas.clientHeight || 600, 1)
    this.apply({ p: 0.66, tempo: 0, ligar: 1 })
    this.composer.render()
    this.apply({ p: 0, tempo: 0, ligar: 0 })
  }

  private aoMouse = (e: PointerEvent) => {
    if (e.pointerType !== 'mouse') return
    this.mouse.x = (e.clientX / innerWidth) * 2 - 1
    this.mouse.y = (e.clientY / innerHeight) * 2 - 1
  }

  // -------------------------------------------------------------------------
  // modelo
  // -------------------------------------------------------------------------
  private montarNotebook() {
    const u = this.uScan
    const aluminio = new THREE.MeshStandardMaterial({ color: '#c4cbd8', metalness: 0.86, roughness: 0.36, envMapIntensity: 1.0 })
    injetar(aluminio, u)
    const aluminioEscuro = new THREE.MeshStandardMaterial({ color: '#8d96a8', metalness: 0.85, roughness: 0.42 })
    injetar(aluminioEscuro, u)

    // ---- bandeja (fundo com paredes) e o miolo
    const bandeja = new THREE.Group()
    const fundo = new THREE.Mesh(chapa(L, P, 0.014, 0.13), aluminioEscuro)
    const paredes = new THREE.Mesh(chapa(L, P, ALT_PAREDE, 0.13, { w: L - 0.07, d: P - 0.07, r: 0.1 }), aluminio)
    bandeja.add(fundo, paredes)
    // portas na lateral esquerda (onde fica o carregador)
    const matPorta = new THREE.MeshStandardMaterial({ color: '#05070c', roughness: 0.5 })
    for (const [z, w] of [
      [0.15, 0.09],
      [-0.1, 0.16],
      [-0.35, 0.16],
    ] as const) {
      const porta = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.028, w), matPorta)
      porta.position.set(-L / 2 + 0.006, 0.05, z)
      bandeja.add(porta)
    }
    this.modelo.add(bandeja)
    this.montarMiolo()

    // ---- topo: chapa com teclado e trackpad (sobe na abertura)
    const topoMat = aluminio.clone()
    topoMat.transparent = true
    injetar(topoMat, u)
    const poco = new THREE.MeshStandardMaterial({ color: '#141821', roughness: 0.75, metalness: 0.2, transparent: true })
    const tecla = new THREE.MeshStandardMaterial({ color: '#0d1016', roughness: 0.55, metalness: 0.15, transparent: true })
    injetar(tecla, u)
    const trackMat = new THREE.MeshStandardMaterial({ color: '#aab4c4', roughness: 0.34, metalness: 0.65, transparent: true })
    injetar(trackMat, u)
    this.matTopo = [topoMat, poco, tecla, trackMat]

    const chapaTopo = new THREE.Mesh(chapa(L, P, ESP_TOPO, 0.13), topoMat)
    this.topo.add(chapaTopo)
    const yS = ESP_TOPO + 0.0015
    const pocoGeo = new THREE.PlaneGeometry(2.78, 1.02)
    pocoGeo.rotateX(-Math.PI / 2)
    const pocoMesh = new THREE.Mesh(pocoGeo, poco)
    pocoMesh.position.set(0, yS, -0.33)
    this.topo.add(pocoMesh)
    // teclas instanciadas (14 x 5 e a barra de espaço)
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
    const m = new THREE.Object3D()
    pos.forEach((t, i) => {
      m.position.set(t.x, yS + 0.008, t.z)
      m.scale.set(t.w, 1, 1)
      m.updateMatrix()
      teclas.setMatrixAt(i, m.matrix)
    })
    this.topo.add(teclas)
    const track = new THREE.Mesh(chapa(1.18, 0.68, 0.004, 0.06), trackMat)
    track.position.set(0, ESP_TOPO, 0.6)
    this.topo.add(track)
    this.topo.position.y = ALT_PAREDE
    this.modelo.add(this.topo)

    // ---- tampa na dobradiça
    this.dobradica.position.set(0, ALT_PAREDE + ESP_TOPO + 0.004, -P / 2 + 0.03)
    const casca = new THREE.Mesh(chapa(L, P - 0.04, ESP_TAMPA, 0.13), aluminio)
    casca.position.set(0, 0, (P - 0.04) / 2)
    this.tampa.add(casca)
    const moldura = new THREE.Mesh(new THREE.PlaneGeometry(L - 0.06, P - 0.1), new THREE.MeshStandardMaterial({ color: '#04060b', roughness: 0.12, metalness: 0.4 }))
    moldura.rotation.x = Math.PI / 2
    moldura.position.set(0, -0.0015, (P - 0.04) / 2)
    this.tampa.add(moldura)
    const tela = new THREE.Mesh(
      new THREE.PlaneGeometry(2.98, 1.86),
      new THREE.ShaderMaterial({ vertexShader: TELA_VERT, fragmentShader: TELA_FRAG, uniforms: this.uTela, toneMapped: false }),
    )
    tela.rotation.x = Math.PI / 2
    tela.position.set(0, -0.003, 1.17)
    this.tampa.add(tela)
    this.luzTela.position.set(0, -1.7, 1.0)
    this.tampa.add(this.luzTela)
    this.dobradica.add(this.tampa)
    this.modelo.add(this.dobradica)

    // o modelo gira e escala em torno do próprio meio
    this.modelo.position.y = 0
  }

  private montarMiolo() {
    const u = this.uScan
    const miolo = new THREE.Group()
    const { mapa, brilho } = texturaPlaca()
    this.matPlaca = new THREE.MeshStandardMaterial({ map: mapa, roughness: 0.42, metalness: 0.25, emissiveMap: brilho, emissive: new THREE.Color('#2a7fd8'), emissiveIntensity: 0.0 })
    injetar(this.matPlaca, u, true)
    const placa = new THREE.Mesh(new THREE.BoxGeometry(PLACA.largura, 0.016, PLACA.profundidade), this.matPlaca)
    placa.position.set(0, Y_PLACA, -0.5)
    miolo.add(placa)
    const topoPlaca = Y_PLACA + 0.008
    const zP = (z: number) => z - 0.5

    // bateria na frente, com três células
    const matBat = new THREE.MeshStandardMaterial({ color: '#1b1f27', roughness: 0.8, metalness: 0.1 })
    injetar(matBat, u)
    for (let i = 0; i < 3; i++) {
      const cel = new THREE.Mesh(chapa(0.74, 0.62, 0.05, 0.03), matBat)
      cel.position.set(-0.78 + i * 0.78, 0.016, 0.5)
      miolo.add(cel)
    }
    const etiqueta = new THREE.Mesh(new THREE.PlaneGeometry(0.6, 0.22), new THREE.MeshStandardMaterial({ color: '#2b3a5c', roughness: 0.6 }))
    etiqueta.rotation.x = -Math.PI / 2
    etiqueta.position.set(0, 0.0675, 0.5)
    miolo.add(etiqueta)

    // chips
    const matChip = new THREE.MeshStandardMaterial({ color: '#12151c', roughness: 0.35, metalness: 0.35 })
    const matDie = new THREE.MeshStandardMaterial({ color: '#9aa6bb', roughness: 0.16, metalness: 0.95 })
    injetar(matChip, u)
    // o chip do reballing, que sobe e mostra as esferas
    const ch = POS.chipHeroi
    const substrato = new THREE.Mesh(new THREE.BoxGeometry(ch.lado, 0.014, ch.lado), matChip)
    const die = new THREE.Mesh(new THREE.BoxGeometry(ch.lado * 0.48, 0.008, ch.lado * 0.62), matDie)
    die.position.y = 0.011
    this.chip.add(substrato, die)
    this.chip.position.set(ch.x, topoPlaca + 0.02, zP(ch.z))
    miolo.add(this.chip)
    // esferas de solda (BGA) entre o chip e a placa
    this.matSolda = new THREE.MeshStandardMaterial({ color: '#d4dbe6', metalness: 1, roughness: 0.22, emissive: new THREE.Color('#5cc6f2'), emissiveIntensity: 0 })
    const n = 13
    const esferas = new THREE.InstancedMesh(new THREE.SphereGeometry(0.0095, 8, 6), this.matSolda, n * n)
    const mm = new THREE.Object3D()
    let k = 0
    for (let i = 0; i < n; i++)
      for (let j = 0; j < n; j++) {
        mm.position.set(ch.x + (i - (n - 1) / 2) * 0.025, topoPlaca + 0.009, zP(ch.z) + (j - (n - 1) / 2) * 0.025)
        mm.updateMatrix()
        esferas.setMatrixAt(k++, mm.matrix)
      }
    miolo.add(esferas)

    // processador com heat pipe de cobre até a ventoinha
    const cpu = new THREE.Mesh(new THREE.BoxGeometry(POS.cpu.lado, 0.014, POS.cpu.lado), matChip)
    cpu.position.set(POS.cpu.x, topoPlaca + 0.007, zP(POS.cpu.z))
    miolo.add(cpu)
    const cobre = new THREE.MeshStandardMaterial({ color: '#c8794a', metalness: 1, roughness: 0.28 })
    injetar(cobre, u)
    const contato = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.012, 0.3), cobre)
    contato.position.set(POS.cpu.x, topoPlaca + 0.02, zP(POS.cpu.z))
    miolo.add(contato)
    const tubo = new THREE.CatmullRomCurve3([
      new THREE.Vector3(POS.cpu.x - 0.08, topoPlaca + 0.03, zP(POS.cpu.z)),
      new THREE.Vector3(POS.cpu.x + 0.25, topoPlaca + 0.032, zP(POS.cpu.z) - 0.02),
      new THREE.Vector3(POS.ventoinha.x - 0.05, topoPlaca + 0.032, zP(POS.ventoinha.z) - 0.28),
      new THREE.Vector3(POS.ventoinha.x + 0.32, topoPlaca + 0.03, zP(POS.ventoinha.z) - 0.3),
    ])
    const heat = new THREE.Mesh(new THREE.TubeGeometry(tubo, 40, 0.022, 8), cobre)
    heat.scale.y = 0.6
    heat.position.y = topoPlaca * 0.4
    miolo.add(heat)
    // aletas do dissipador na borda de trás
    const aleta = new THREE.InstancedMesh(new THREE.BoxGeometry(0.008, 0.05, 0.1), cobre, 24)
    for (let i = 0; i < 24; i++) {
      mm.position.set(POS.ventoinha.x - 0.12 + i * 0.022, topoPlaca + 0.025, zP(POS.ventoinha.z) - 0.33)
      mm.scale.set(1, 1, 1)
      mm.updateMatrix()
      aleta.setMatrixAt(i, mm.matrix)
    }
    miolo.add(aleta)
    // ventoinha
    const matVent = new THREE.MeshStandardMaterial({ color: '#0e1118', roughness: 0.6, metalness: 0.2 })
    injetar(matVent, u)
    const carcaca = new THREE.Mesh(new THREE.CylinderGeometry(POS.ventoinha.r, POS.ventoinha.r, 0.05, 40, 1, true), matVent)
    carcaca.position.set(POS.ventoinha.x, topoPlaca + 0.026, zP(POS.ventoinha.z))
    miolo.add(carcaca)
    const cubo = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.046, 24), matVent)
    this.helices.add(cubo)
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
    this.helices.add(pas)
    this.helices.position.copy(carcaca.position)
    miolo.add(this.helices)

    // memórias RAM
    const matRam = new THREE.MeshStandardMaterial({ color: '#0f3b2c', roughness: 0.5, metalness: 0.2 })
    for (let i = 0; i < 2; i++) {
      const ram = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.012, 0.22), matRam)
      ram.position.set(POS.ram.x + 0.04, topoPlaca + 0.012 + i * 0.03, zP(POS.ram.z) + i * 0.03)
      miolo.add(ram)
      for (let c = 0; c < 4; c++) {
        const mem = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.008, 0.1), matChip)
        mem.position.set(POS.ram.x - 0.2 + c * 0.14, ram.position.y + 0.009, ram.position.z)
        miolo.add(mem)
      }
    }
    // chip da BIOS (SOIC de 8 pinos)
    const bios = new THREE.Mesh(new THREE.BoxGeometry(POS.bios.w, 0.014, POS.bios.d), matChip)
    bios.position.set(POS.bios.x, topoPlaca + 0.008, zP(POS.bios.z))
    miolo.add(bios)
    const pinos = new THREE.InstancedMesh(new THREE.BoxGeometry(0.008, 0.004, 0.022), matDie, 8)
    for (let i = 0; i < 8; i++) {
      mm.position.set(POS.bios.x - 0.036 + (i % 4) * 0.024, topoPlaca + 0.003, zP(POS.bios.z) + (i < 4 ? -1 : 1) * 0.05)
      mm.updateMatrix()
      pinos.setMatrixAt(i, mm.matrix)
    }
    miolo.add(pinos)

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
      mm.position.set(s.x, topoPlaca + 0.025, zP(s.z))
      mm.updateMatrix()
      caps.setMatrixAt(i, mm.matrix)
    }
    miolo.add(caps)
    const matInd = new THREE.MeshStandardMaterial({ color: '#2a2f3a', roughness: 0.5, metalness: 0.4 })
    const inds = new THREE.InstancedMesh(new THREE.BoxGeometry(0.07, 0.035, 0.07), matInd, 12)
    for (let i = 0; i < 12; i++) {
      const s = { x: POS.cpu.x - 0.3 + (i % 6) * 0.1, z: POS.cpu.z + (i < 6 ? 0.28 : 0.38) }
      mm.position.set(s.x, topoPlaca + 0.0175, zP(s.z))
      mm.updateMatrix()
      inds.setMatrixAt(i, mm.matrix)
    }
    miolo.add(inds)
    const smd = new THREE.InstancedMesh(new THREE.BoxGeometry(0.02, 0.008, 0.011), matChip, 300)
    for (let i = 0; i < 300; i++) {
      const s = sorteia()
      mm.position.set(s.x, topoPlaca + 0.004, zP(s.z))
      mm.rotation.set(0, r() < 0.5 ? 0 : Math.PI / 2, 0)
      mm.updateMatrix()
      smd.setMatrixAt(i, mm.matrix)
    }
    mm.rotation.set(0, 0, 0)
    miolo.add(smd)

    this.uScan.uCentro.value.set(POS.chipHeroi.x, 0, zP(POS.chipHeroi.z))
    this.luzPlaca.position.set(POS.chipHeroi.x, 0.75, zP(POS.chipHeroi.z) - 0.1)
    this.modelo.add(miolo)
  }

  // -------------------------------------------------------------------------
  // tamanho e resolução
  // -------------------------------------------------------------------------
  resize(w: number, h: number, dpr: number) {
    this.tam = { w, h }
    this.teto = Math.min(dpr, this.movel ? 1.5 : 1.3)
    this.aplicarResolucao()
    this.camera.aspect = w / h
    this.camera.updateProjectionMatrix()
  }

  private aplicarResolucao() {
    const { w, h } = this.tam
    const ratio = Math.max(0.55, this.teto * this.qualidade)
    this.renderer.setPixelRatio(ratio)
    this.renderer.setSize(w, h, false)
    this.composer.setPixelRatio(ratio)
    this.composer.setSize(w, h)
    this.trocas++
  }

  /** Mede o intervalo entre quadros e baixa a resolução se o aparelho não sustentar a cena. */
  private medir() {
    const agora = performance.now()
    const dt = agora - this.ultimoQuadro
    this.ultimoQuadro = agora
    if (dt <= 0 || dt > 120) return
    this.media = this.media ? this.media * 0.92 + dt * 0.08 : dt
    if (++this.contagem < 30) return
    this.contagem = 0
    if (this.media > 18.5 && this.qualidade > 0.6) {
      this.qualidade = Math.max(0.6, this.qualidade * 0.78)
      this.aplicarResolucao()
    } else if (this.media < 11 && this.qualidade < 1) {
      this.qualidade = Math.min(1, this.qualidade / 0.78)
      this.aplicarResolucao()
    }
  }

  // -------------------------------------------------------------------------
  // estado da história
  // -------------------------------------------------------------------------
  apply({ p, tempo, ligar }: Estado) {
    const { w, h } = this.tam
    const aspecto = w / h
    const estreito = aspecto < 1

    // ---- câmera
    const [cx, cy, cz] = CAMINHO.pos.map((f) => f(p))
    const [ax, ay, az] = CAMINHO.alvo.map((f) => f(p))
    this.mouse.sx += (this.mouse.x - this.mouse.sx) * 0.04
    this.mouse.sy += (this.mouse.y - this.mouse.sy) * 0.04
    const resp = Math.sin(tempo * 0.55) * 0.02
    // em tela estreita a câmera recua para o notebook caber na largura
    const recuo = estreito ? lerp(1.0, 1.85, clamp((1 - aspecto) / 0.5)) : aspecto < 1.35 ? 1.18 : 1
    const fechado = suave(inv(0.5, 0.62, p)) * (1 - suave(inv(0.74, 0.84, p)))
    const fator = lerp(recuo, lerp(recuo, 1.1, 0.6), fechado)
    this.camera.position.set(ax + (cx - ax) * fator + this.mouse.sx * 0.18, ay + (cy - ay) * fator - this.mouse.sy * 0.1 + resp, az + (cz - az) * fator)
    this.alvoCam.set(ax + this.mouse.sx * 0.08, ay - this.mouse.sy * 0.05, az)
    this.camera.lookAt(this.alvoCam)
    this.camera.fov = estreito ? 36 : 30
    // enquadramento: no desktop o notebook fica à direita (texto à esquerda); no celular, acima
    const desloca = estreito ? 0 : lerp(-0.17, -0.12, fechado) * (aspecto < 1.35 ? 0.6 : 1)
    // no celular a primeira faixa é a mais alta (título, texto e dois botões): o notebook sobe mais
    const sobe = estreito ? lerp(lerp(0.22, 0.16, suave(inv(0.14, 0.3, p))), 0.1, fechado) : 0
    this.camera.setViewOffset(w, h, desloca * w, sobe * h, w, h)
    this.camera.updateProjectionMatrix()

    // ---- abertura da tampa na chegada e o leve balanço
    const abre = easeOut(clamp(ligar * 1.15))
    this.dobradica.rotation.x = -lerp(THREE.MathUtils.degToRad(28), ANGULO_ABERTA, abre)
    this.raiz.rotation.y = Math.sin(tempo * 0.32) * 0.045 * (1 - fechado) + lerp(0.08, 0, suave(inv(0.2, 0.4, p)))

    // ---- diagnóstico: a varredura atravessa o aparelho de frente para trás
    const s = inv(0.255, 0.425, p)
    this.uScan.uScan.value = lerp(1.35, -2.25, easeInOut(s))
    this.uScan.uScanForca.value = Math.sin(Math.PI * s) * 1.0

    // ---- abertura: tampa e topo saem, câmera desce até a placa
    const e = suave(inv(0.46, 0.58, p)) * (1 - suave(inv(0.745, 0.85, p)))
    const eTopo = suave(inv(0.46, 0.55, p)) * (1 - suave(inv(0.755, 0.84, p)))
    // tampa e topo saem por cima (a câmera desce e eles deixam o quadro); transparência só no fim
    this.tampa.position.set(0, e * 1.4, -e * 0.7)
    this.tampa.rotation.x = -e * 0.35
    this.dobradica.position.y = ALT_PAREDE + ESP_TOPO + 0.004 + e * 1.2
    this.topo.position.set(0, ALT_PAREDE + eTopo * 3.2, -eTopo * 1.2)
    this.topo.rotation.x = -eTopo * 0.35
    const opTopo = 1 - suave(inv(0.55, 0.95, eTopo))
    for (const m of this.matTopo) m.opacity = opTopo
    this.topo.visible = opTopo > 0.01

    // ---- o chip sobe e as esferas de solda acendem (reballing)
    const c = suave(inv(0.6, 0.665, p)) * (1 - suave(inv(0.715, 0.76, p)))
    this.chip.position.y = Y_PLACA + 0.008 + 0.02 + c * 0.2
    this.chip.rotation.x = -c * 0.12
    this.chip.rotation.z = c * 0.06
    this.matSolda.emissiveIntensity = c * (1.6 + 0.5 * Math.sin(tempo * 5))
    // corrente voltando: ondas pelas trilhas a partir do chip
    const onda = inv(0.52, 0.58, p) * (1 - inv(0.76, 0.82, p))
    this.uScan.uOnda.value = onda
    this.uScan.uRaio.value = ((tempo * 0.55) % 1.6) + 0.05
    this.matPlaca.emissiveIntensity = 0.15 * onda + 0.05
    this.luzPlaca.intensity = 0.35 * onda + 0.7 * c

    // ---- alta: a tela liga e o batimento volta
    const acende = suave(inv(0.84, 0.9, p))
    this.uTela.uLigada.value = lerp(0.42 * suave(clamp((ligar - 0.35) / 0.6)), 1, acende)
    this.uTela.uVida.value = suave(inv(0.86, 0.93, p))
    this.uTela.uTempo.value = tempo
    this.luzTela.intensity = this.uTela.uLigada.value * (0.12 + 0.55 * acende)
    this.helices.rotation.y = tempo * (1.2 + 9 * acende)

    // ---- ambiente e pós
    this.uFundo.uTempo.value = tempo
    this.uFundo.uBrilho.value = 0.75 + 0.25 * acende + 0.2 * onda
    this.bloom.strength = 0.5 + 0.22 * acende + 0.12 * c
    this.uSaida.uTempo.value = tempo
    this.uSaida.uFlash.value = Math.max(0, 1 - Math.abs(p - 0.875) / 0.025) * 0.12
    this.sombra.material.opacity = 0.9 * (1 - fechado * 0.4)
  }

  render() {
    this.medir()
    this.composer.render()
  }

  /** Projeta um ponto do notebook na tela (px), já com o enquadramento. */
  projetar(v: THREE.Vector3) {
    this.aux.copy(v)
    this.raiz.updateMatrixWorld()
    this.camera.updateMatrixWorld()
    this.aux.applyMatrix4(this.modelo.matrixWorld)
    this.aux.project(this.camera)
    return { x: (this.aux.x * 0.5 + 0.5) * this.tam.w, y: (-this.aux.y * 0.5 + 0.5) * this.tam.h }
  }

  dispose() {
    window.removeEventListener('pointermove', this.aoMouse)
    this.cena.traverse((o) => {
      const m = o as THREE.Mesh
      m.geometry?.dispose?.()
      const mat = m.material as THREE.Material | THREE.Material[] | undefined
      if (Array.isArray(mat)) mat.forEach((x) => x.dispose())
      else mat?.dispose?.()
    })
    this.composer.dispose()
    this.renderer.dispose()
  }
}
