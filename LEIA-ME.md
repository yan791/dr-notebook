# Dr. Notebook Maceió · versão 2

- `original/` é o clone do repositório do projeto anterior (github.com/queirozarthur/dr-notebook), mantido intacto como referência. Dele vieram os dados da loja, a logo em SVG, a foto e o briefing.
- `site/` é a versão nova: React + Vite + GSAP (ScrollTrigger e SplitText) + Lenis, 3D em three.js puro.
- `review/` tem o pacote de design (`pacote-de-design.md`) e as prévias em imagem.
- `ferramentas/` tem os testes com o Chrome (capturas, fluidez, imagem de compartilhamento).

## O conceito
A loja é o "médico dos aparelhos" e o site é o atendimento. O topo é a **recepção**: a
pergunta "O que aconteceu com o seu aparelho?", os aparelhos e os sintomas. O aparelho
escolhido entra em 3D (notebook, Mac, PC gamer, celular, videogame ou drone) e o ponto
provável do defeito acende em âmbar, com a possível causa. Em dois toques o botão abre o
WhatsApp com a ficha escrita. No **laboratório**, o notebook se abre sozinho até a placa
e cada procedimento acende a sua peça (reballing, BIOS, SSD, trilhas). Nenhuma seção
prende a rolagem e o WhatsApp fica a um toque em toda a página.

## Rodar
```
cd site
npm install
npm run dev        # http://127.0.0.1:5250/dr-notebook/ (launch.json: "dr-notebook")
npm run build      # gera site/dist com todas as páginas em HTML
npm run preview    # http://127.0.0.1:5251/dr-notebook/ (launch.json: "dr-notebook-final")
```

## Onde mexer
- Dados da loja (telefone, endereço, horário, nota): `site/src/dados/loja.ts`
- Serviços e páginas de serviço: `site/src/dados/servicos.ts`
- Triagem (aparelhos, sintomas, causas comuns): `site/src/dados/triagem.ts`
- Avaliações: `site/src/dados/avaliacoes.ts`
- Base 3D (luzes, fundo, pós): `site/src/tres/palco.ts`; notebook: `notebook.ts`; laboratório: `laboratorio.ts`
- Topo (recepção): `site/src/secoes/Recepcao.tsx`, aparelhos 3D em `site/src/tres/aparelhos.ts` e `recepcao.ts`

## Publicar
O build lê do ambiente: `CAMINHO_BASE` (padrão `/dr-notebook/`), `SITE_URL` (padrão
`https://yan791.github.io/dr-notebook`) e `INDEXAR` (padrão `nao`). Para GitHub Pages em
outro repositório, troque o caminho e a URL. A pasta `site/dist` é o site pronto.

## Observação técnica
A pasta está no OneDrive. Depois de um tempo o OneDrive transforma os arquivos de
`node_modules` em "arquivos na nuvem" e o Vite deixa de achar os pacotes. Por isso o
`vite.config.ts` tem `resolve.preserveSymlinks: true`. Se mesmo assim o build reclamar de
"failed to resolve import", rode `npm install` de novo.
