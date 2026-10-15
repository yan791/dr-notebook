import * as THREE from 'three'
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js'
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js'
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js'
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js'
import { texturaAmbiente, texturaPiso } from './texturas'

/*
 * A base das cenas 3D do site: renderizador, ambiente de estúdio para os metais, o fundo
 * de hexágonos (como nas artes da loja), o piso de luz, as luzes, o bloom em meia
 * resolução com a saída numa passada e a resolução que se adapta ao aparelho.
 */

export type Uniformes = Record<string, THREE.IUniform>

// ---------------------------------------------------------------------------
// shaders
// ---------------------------------------------------------------------------
export const TELA_VERT = /* glsl */ `
  varying vec2 vUv;
  varying vec3 vW;
  void main(){
    vUv = uv;
    vec4 w = modelMatrix * vec4(position, 1.0);
    vW = w.xyz;
    gl_Position = projectionMatrix * viewMatrix * w;
  }`

/** A tela dos aparelhos: um monitor cardíaco que varre da esquerda para a direita. */
export const TELA_FRAG = /* glsl */ `
  uniform float uTempo;
  uniform float uLigada;
  uniform float uVida;
  uniform float uScan;
  uniform float uScanForca;
  uniform float uAspecto;
  uniform float uFalha;
  varying vec2 vUv;
  varying vec3 vW;
  float g(float x, float m, float s){ return exp(-pow((x - m) / s, 2.0)); }
  float ecg(float f){
    return 0.12*g(f,0.20,0.035) - 0.12*g(f,0.385,0.011) + 1.0*g(f,0.41,0.013) - 0.3*g(f,0.44,0.012) + 0.24*g(f,0.66,0.05);
  }
  float hash(vec2 p){ return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }
  void main(){
    vec2 uv = vUv;
    float aspecto = uAspecto;
    // falha de tela: faixas que piscam e um quadro escuro (sintoma "tela preta")
    float linhaFalha = step(0.5, hash(vec2(floor(uv.y * 40.0), floor(uTempo * 9.0))));
    float ligada = uLigada * (1.0 - uFalha * (0.75 + 0.25 * linhaFalha * step(0.6, fract(uTempo * 1.7))));
    vec3 cor = mix(vec3(0.004, 0.01, 0.03), vec3(0.012, 0.035, 0.09), uv.y) * (0.35 + 0.65 * ligada);
    vec2 gp = uv * vec2(aspecto, 1.0) * (aspecto > 1.0 ? 12.0 : 7.0);
    vec2 gl = abs(fract(gp) - 0.5);
    float dg = min(0.5 - gl.x, 0.5 - gl.y);
    cor += vec3(0.08, 0.2, 0.45) * (1.0 - smoothstep(0.0, 0.035, dg)) * 0.22 * ligada;
    float bat = aspecto > 1.0 ? 2.2 : 1.2;
    float f = fract(uv.x * bat + 0.18);
    float A = (aspecto > 1.0 ? 0.27 : 0.12) * uVida;
    float y0 = 0.47;
    float yv = y0 + A * ecg(f);
    float e = 0.002;
    float k = A * (ecg(f + e) - ecg(f - e)) / (2.0 * e) * bat;
    float d = abs(uv.y - yv) / sqrt(1.0 + pow(k / aspecto, 2.0));
    float cabeca = fract(uTempo * 0.3);
    float idade = fract(cabeca - uv.x);
    float rastro = exp(-idade * 2.2) * step(idade, 0.94);
    float esp = aspecto > 1.0 ? 0.0065 : 0.004;
    float nucleo = smoothstep(esp, 0.0, d);
    float halo = exp(-d * (aspecto > 1.0 ? 55.0 : 90.0)) * 0.55;
    vec3 tinta = mix(vec3(0.25, 0.55, 1.0), vec3(0.32, 0.8, 1.0), uVida);
    cor += tinta * (nucleo * 2.6 + halo) * rastro * ligada;
    float dc = length(vec2((uv.x - cabeca) * aspecto, uv.y - (y0 + A * ecg(fract(cabeca * bat + 0.18)))));
    cor += tinta * exp(-dc * 70.0) * 3.0 * ligada;
    cor += vec3(0.6, 0.75, 1.0) * smoothstep(0.65, 1.0, uv.x * 0.5 + uv.y * 0.7) * 0.035;
    float b = exp(-pow((vW.z - uScan) / 0.03, 2.0)) + 0.25 * exp(-pow((vW.z - uScan) / 0.16, 2.0));
    cor += vec3(0.36, 0.78, 0.95) * b * uScanForca * 1.6;
    gl_FragColor = vec4(cor, 1.0);
  }`

export function uniformesTela(u: Uniformes, aspecto: number): Uniformes {
  return { uTempo: { value: 0 }, uLigada: { value: 0.45 }, uVida: { value: 0 }, uScan: u.uScan, uScanForca: u.uScanForca, uAspecto: { value: aspecto }, uFalha: { value: 0 } }
}

export function materialTela(uniforms: Uniformes) {
  return new THREE.ShaderMaterial({ vertexShader: TELA_VERT, fragmentShader: TELA_FRAG, uniforms, toneMapped: false })
}

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
    float centro = exp(-pow(ang / 0.9, 2.0)) * exp(-pow((vW.y - 1.2) / 3.2, 2.0));
    vec3 base = mix(vec3(0.012, 0.035, 0.09), vec3(0.03, 0.09, 0.24), centro * uBrilho);
    vec3 cor = base + vec3(0.09, 0.2, 0.48) * linha * (0.28 + 0.9 * centro) + vec3(0.1, 0.3, 0.7) * pulso * linha * 0.9 * centro;
    cor += vec3(0.05, 0.12, 0.3) * (1.0 - smoothstep(0.0, 0.5, borda)) * pulso * 0.15;
    cor *= smoothstep(-2.5, 1.0, vW.y) * (1.0 - smoothstep(4.0, 9.0, vW.y));
    gl_FragColor = vec4(cor, 1.0);
  }`

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

/**
 * Injeção nos materiais: a faixa da varredura (em z do mundo), a onda de corrente pelas
 * trilhas da placa e um brilho de "ponto com defeito" (uDefeito) em volta de um ponto.
 */
export function injetar(mat: THREE.MeshStandardMaterial, u: Uniformes, onda = false) {
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
      .replace(
        '#include <common>',
        `#include <common>\nvarying vec3 vWScan;\nuniform float uScan;\nuniform float uScanForca;\nuniform float uRaio;\nuniform float uOnda;\nuniform vec3 uCentro;\nuniform vec3 uDefeito;\nuniform float uDefeitoForca;\nuniform float uDefeitoRaio;`,
      )
      .replace(
        '#include <emissivemap_fragment>',
        `#include <emissivemap_fragment>
        float bScan = exp(-pow((vWScan.z - uScan) / 0.03, 2.0)) + 0.22 * exp(-pow((vWScan.z - uScan) / 0.16, 2.0));
        totalEmissiveRadiance += vec3(0.36, 0.78, 0.95) * bScan * uScanForca * 1.4;
        float dDef = distance(vWScan, uDefeito);
        float aro = exp(-pow((dDef - uDefeitoRaio) / 0.035, 2.0)) * 1.3 + exp(-dDef / (uDefeitoRaio * 0.6 + 0.05)) * 0.35;
        totalEmissiveRadiance += vec3(1.0, 0.62, 0.2) * aro * uDefeitoForca;
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

export function novosUniformes(): Uniformes {
  return {
    uScan: { value: 99 },
    uScanForca: { value: 0 },
    uRaio: { value: 0 },
    uOnda: { value: 0 },
    uCentro: { value: new THREE.Vector3() },
    uDefeito: { value: new THREE.Vector3(0, -99, 0) },
    uDefeitoForca: { value: 0 },
    uDefeitoRaio: { value: 0.2 },
  }
}

/** Retângulo arredondado (forma 2D) centrado na origem. */
export function retangulo(w: number, h: number, r: number) {
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
export function chapa(w: number, d: number, esp: number, r: number, furo?: { w: number; d: number; r: number }) {
  const forma = retangulo(w, d, r)
  if (furo) forma.holes.push(retangulo(furo.w, furo.d, furo.r) as unknown as THREE.Path)
  const bisel = Math.min(0.012, esp * 0.3)
  const geo = new THREE.ExtrudeGeometry(forma, { depth: esp - bisel * 2, bevelEnabled: true, bevelThickness: bisel, bevelSize: bisel, bevelSegments: 3, curveSegments: 10 })
  geo.rotateX(-Math.PI / 2)
  geo.translate(0, bisel, 0)
  return geo
}

/** Bloco de pé, com cantos arredondados vistos de frente (face para +z, centrado). */
export function bloco(w: number, h: number, esp: number, r: number, bisel = 0.02) {
  const b = Math.min(bisel, esp * 0.3)
  const geo = new THREE.ExtrudeGeometry(retangulo(w - b * 2, h - b * 2, Math.max(0.001, r - b)), { depth: esp - b * 2, bevelEnabled: true, bevelThickness: b, bevelSize: b, bevelSegments: 4, curveSegments: 12 })
  geo.translate(0, 0, -(esp - b * 2) / 2)
  return geo
}

/** Interpolação cúbica monótona (Fritsch-Carlson) de uma série de valores. */
export function curva(ps: number[], vs: number[]) {
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

// ---------------------------------------------------------------------------
// o palco
// ---------------------------------------------------------------------------
export class Palco {
  renderer: THREE.WebGLRenderer
  cena = new THREE.Scene()
  camera = new THREE.PerspectiveCamera(30, 1, 0.05, 80)
  composer: EffectComposer
  bloom: UnrealBloomPass
  uSaida: Uniformes
  uFundo: Uniformes = { uTempo: { value: 0 }, uBrilho: { value: 1 } }
  movel: boolean
  mouse = { x: 0, y: 0, sx: 0, sy: 0 }
  tam = { w: 1, h: 1 }
  trocas = 0
  private teto = 1
  private qualidade = 1
  private media = 0
  private contagem = 0
  private ultimoQuadro = 0
  private aux = new THREE.Vector3()

  constructor(canvas: HTMLCanvasElement, { movel }: { movel: boolean }) {
    this.movel = movel
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: false, powerPreference: 'high-performance', alpha: false })
    this.renderer.setClearColor(0x040d22, 1)
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping
    this.renderer.toneMappingExposure = 1.05
    this.renderer.outputColorSpace = THREE.SRGBColorSpace
    this.cena.background = new THREE.Color(0x040d22)
    this.cena.fog = new THREE.Fog(0x040d22, 9, 22)

    const pmrem = new THREE.PMREMGenerator(this.renderer)
    const amb = texturaAmbiente()
    this.cena.environment = pmrem.fromEquirectangular(amb).texture
    amb.dispose()
    pmrem.dispose()

    const fundo = new THREE.Mesh(
      new THREE.CylinderGeometry(15, 15, 22, 64, 1, true),
      new THREE.ShaderMaterial({ vertexShader: FUNDO_VERT, fragmentShader: FUNDO_FRAG, uniforms: this.uFundo, side: THREE.BackSide, depthWrite: false, fog: false }),
    )
    fundo.position.y = 3
    this.cena.add(fundo)
    // o piso é uma poça de luz que some nas bordas: sem linha de horizonte atrás do aparelho
    const piso = new THREE.Mesh(new THREE.CircleGeometry(9, 64), new THREE.MeshBasicMaterial({ map: texturaPiso(), transparent: true, depthWrite: false, fog: false }))
    piso.rotation.x = -Math.PI / 2
    piso.position.y = -0.001
    this.cena.add(piso)

    // luzes: a principal vem de trás e de cima (o reflexo dela não volta para a câmera),
    // o contorno ciano vem de trás, baixo e à direita
    this.cena.add(new THREE.HemisphereLight('#4a78d8', '#020611', 0.55))
    const chave = new THREE.DirectionalLight('#e6efff', 2.0)
    chave.position.set(2.5, 6, -2.5)
    const frente = new THREE.DirectionalLight('#cfe0ff', 0.85)
    frente.position.set(3, 2.2, 6)
    const contra = new THREE.DirectionalLight('#5cc6f2', 2.0)
    contra.position.set(4, 0.8, -5)
    const lateral = new THREE.DirectionalLight('#3a6fe0', 1.2)
    lateral.position.set(-5, 2, 2)
    this.cena.add(chave, frente, contra, lateral)

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
  }

  private aoMouse = (e: PointerEvent) => {
    if (e.pointerType !== 'mouse') return
    this.mouse.x = (e.clientX / innerWidth) * 2 - 1
    this.mouse.y = (e.clientY / innerHeight) * 2 - 1
  }

  /** Suaviza o mouse (chamado uma vez por quadro). */
  seguirMouse() {
    this.mouse.sx += (this.mouse.x - this.mouse.sx) * 0.04
    this.mouse.sy += (this.mouse.y - this.mouse.sy) * 0.04
  }

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

  render() {
    this.medir()
    this.composer.render()
  }

  /** Compila os shaders da cena sem travar a página (quando o navegador permite). */
  async compilar() {
    await this.renderer.compileAsync(this.cena, this.camera)
  }

  /** Projeta um ponto local de um objeto na tela (px), já com o enquadramento. */
  projetar(v: THREE.Vector3, objeto: THREE.Object3D) {
    this.aux.copy(v)
    objeto.updateWorldMatrix(true, false)
    this.camera.updateMatrixWorld()
    this.aux.applyMatrix4(objeto.matrixWorld)
    this.aux.project(this.camera)
    return { x: (this.aux.x * 0.5 + 0.5) * this.tam.w, y: (-this.aux.y * 0.5 + 0.5) * this.tam.h, frente: this.aux.z < 1 }
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
