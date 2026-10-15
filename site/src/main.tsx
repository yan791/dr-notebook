import { StrictMode } from 'react'
import { createRoot, hydrateRoot } from 'react-dom/client'
import '@fontsource-variable/plus-jakarta-sans'
import '@fontsource-variable/jetbrains-mono'
import './estilos/base.css'
import { App } from './App'

const caminho = location.pathname.startsWith(import.meta.env.BASE_URL) ? location.pathname.slice(import.meta.env.BASE_URL.length) : location.pathname
const raiz = document.getElementById('raiz')!
const app = (
  <StrictMode>
    <App caminho={caminho} />
  </StrictMode>
)

// o build entrega o HTML já pronto (pré-renderizado): o React só assume o controle
if (raiz.firstElementChild) hydrateRoot(raiz, app)
else createRoot(raiz).render(app)
