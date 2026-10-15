import type { Icone as TipoIcone } from '../dados/servicos'

/*
 * Ícones de traço, desenhados aqui (24 x 24, traço 1.6) para combinar com a logo.
 * O glifo do WhatsApp é o do Simple Icons (CC0), como no projeto original.
 */

const TRACOS: Record<TipoIcone | 'seta' | 'diagonal' | 'pin' | 'relogio' | 'menu' | 'fechar' | 'check' | 'alerta' | 'mais' | 'estrela' | 'rota' | 'insta' | 'email' | 'chip', string> = {
  placa: 'M4 4h16v16H4zM9 9h6v6H9zM12 4v5M12 15v5M4 12h5M15 12h5M7 4v2M17 18v2M4 17h2M18 7h2',
  notebook: 'M5 5.5h14a1 1 0 0 1 1 1V15H4V6.5a1 1 0 0 1 1-1ZM2.5 15h19l-1.2 2.6a1 1 0 0 1-.9.6H4.6a1 1 0 0 1-.9-.6Z',
  mac: 'M5.5 6h13a.8.8 0 0 1 .8.8V15H4.7V6.8a.8.8 0 0 1 .8-.8ZM3 15h18v.8a1.4 1.4 0 0 1-1.4 1.4H4.4A1.4 1.4 0 0 1 3 15.8ZM10 15.2h4',
  gamer: 'M7 3h10a1 1 0 0 1 1 1v16a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1ZM9 7h6M9 10h6M12 15.5a1.5 1.5 0 1 0 0 .01',
  videogame: 'M7.5 8h9a4.5 4.5 0 0 1 4.3 5.8l-.9 2.9a2 2 0 0 1-3.4.7L15 15.6H9l-1.5 1.8a2 2 0 0 1-3.4-.7l-.9-2.9A4.5 4.5 0 0 1 7.5 8ZM7 11v3M5.5 12.5h3M15.5 11.5h.01M17.5 13h.01',
  drone: 'M10 10h4v4h-4zM10 10 7 7M14 10l3-3M10 14l-3 3M14 14l3 3M4 7h6M14 7h6M4 17h6M14 17h6',
  celular: 'M8 2.5h8a1.5 1.5 0 0 1 1.5 1.5v16a1.5 1.5 0 0 1-1.5 1.5H8A1.5 1.5 0 0 1 6.5 20V4A1.5 1.5 0 0 1 8 2.5ZM11 18.5h2',
  software: 'M3.5 4.5h17v11h-17zM9 20h6M12 15.5V20M12 7.5v1M12 11.5v1M10 10h-1M15 10h-1M12 10h.01',
  loja: 'M4.5 8h15l-1.2 11.2a1 1 0 0 1-1 .8H6.7a1 1 0 0 1-1-.8ZM9 8V6.5a3 3 0 0 1 6 0V8',
  chip: 'M7 7h10v10H7zM10 10h4v4h-4zM9 3v4M12 3v4M15 3v4M9 17v4M12 17v4M15 17v4M3 9h4M3 12h4M3 15h4M17 9h4M17 12h4M17 15h4',
  seta: 'M5 12h14M13 6l6 6-6 6',
  diagonal: 'M7 17 17 7M8 7h9v9',
  pin: 'M12 21s-6.5-5.6-6.5-11A6.5 6.5 0 0 1 18.5 10c0 5.4-6.5 11-6.5 11ZM12 12.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z',
  relogio: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18ZM12 7v5l3 2',
  menu: 'M4 7h16M4 12h16M4 17h10',
  fechar: 'M6 6l12 12M18 6 6 18',
  check: 'M5 12.5 10 17 19 7.5',
  alerta: 'M12 3.5 21.5 20h-19ZM12 10v4.5M12 17h.01',
  mais: 'M12 5v14M5 12h14',
  estrela: 'M12 3.5l2.6 5.4 5.9.8-4.3 4.1 1.1 5.8L12 16.8l-5.3 2.8 1.1-5.8-4.3-4.1 5.9-.8Z',
  rota: 'M3 11.5 21 3l-8.5 18-2-7.5Z',
  insta: 'M7.5 3h9A4.5 4.5 0 0 1 21 7.5v9a4.5 4.5 0 0 1-4.5 4.5h-9A4.5 4.5 0 0 1 3 16.5v-9A4.5 4.5 0 0 1 7.5 3ZM12 16a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM17.2 6.8h.01',
  email: 'M3.5 5.5h17v13h-17ZM3.5 6l8.5 7 8.5-7',
}

export type NomeIcone = keyof typeof TRACOS

export function Icone({ nome, tamanho = 20, className }: { nome: NomeIcone; tamanho?: number; className?: string }) {
  return (
    <svg
      width={tamanho}
      height={tamanho}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      className={className}
    >
      <path d={TRACOS[nome]} />
    </svg>
  )
}

export function IconeWhatsApp({ tamanho = 20, className }: { tamanho?: number; className?: string }) {
  return (
    <svg width={tamanho} height={tamanho} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" focusable="false" className={className}>
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
    </svg>
  )
}
