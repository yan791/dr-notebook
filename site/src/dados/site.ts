// Onde o site está publicado (ver vite.config.ts). BASE_URL termina em "/".
export const BASE = import.meta.env.BASE_URL
export const SITE_URL = String(import.meta.env.VITE_SITE_URL).replace(/\/+$/, '')
export const INDEXAR = import.meta.env.VITE_INDEXAR === 'sim'

/** Caminho interno ("servicos/drone/") para href com o subcaminho do site. */
export const href = (caminho = '') => `${BASE}${caminho.replace(/^\//, '')}`

/** Caminho interno para URL absoluta (og:url, canonical, dados estruturados). */
export const urlAbsoluta = (caminho = '') => `${SITE_URL}/${caminho.replace(/^\//, '')}`

/** Arquivo da pasta public (img/loja.jpg) com o subcaminho. */
export const arquivo = (caminho: string) => `${BASE}${caminho.replace(/^\//, '')}`
