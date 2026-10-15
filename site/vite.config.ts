import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

/*
 * Onde o site vai morar. No GitHub Pages de um repositório chamado "dr-notebook" o
 * caminho é /dr-notebook/; num domínio próprio (drnotebookmaceio.com.br) passa a ser /.
 * O build lê CAMINHO_BASE e SITE_URL do ambiente; sem eles, valem os padrões abaixo.
 */
const CAMINHO_BASE = process.env.CAMINHO_BASE ?? '/dr-notebook/'

export default defineConfig({
  base: CAMINHO_BASE,
  plugins: [react()],
  // a pasta está no OneDrive, que transforma os arquivos de node_modules em "arquivos na
  // nuvem" (reparse points); sem isto o empacotador tenta segui-los como atalhos e falha
  resolve: { preserveSymlinks: true },
  define: {
    'import.meta.env.VITE_SITE_URL': JSON.stringify(process.env.SITE_URL ?? 'https://yan791.github.io/dr-notebook'),
    // demonstração para a loja: fora do Google até ela aprovar (INDEXAR=sim libera)
    'import.meta.env.VITE_INDEXAR': JSON.stringify(process.env.INDEXAR ?? 'nao'),
  },
  build: {
    target: 'es2022',
    assetsInlineLimit: 0,
    chunkSizeWarningLimit: 800,
  },
  ssr: {
    noExternal: ['gsap', 'lenis'],
  },
})
