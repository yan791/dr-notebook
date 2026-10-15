// Avaliações do Google, como estão em docs/briefing.md. Nenhum nome de cliente:
// o CLAUDE.md permite no máximo o primeiro nome, e o briefing não traz nomes.

// Citação é o texto literal de uma avaliação; relato é um resumo nosso do que a
// cliente contou, e aparece sem aspas para não parecer citação.
export type Trecho = { tipo: "citacao"; texto: string } | { tipo: "relato"; texto: string };

export const trechos: readonly Trecho[] = [
  { tipo: "citacao", texto: "Serviço de qualidade, preços excelentes e prazo de entrega!" },
  { tipo: "citacao", texto: "Troca da tela feita na frente do cliente." },
  {
    tipo: "relato",
    texto: "Uma cliente conta que o técnico avaliou o computador e disse que não precisava trocar peças.",
  },
];

// Temas mais citados nas avaliações, com o número de menções.
export const temasMaisCitados = [
  { tema: "Atendimento", mencoes: 24 },
  { tema: "Preços", mencoes: 20 },
  { tema: "Equipe", mencoes: 10 },
  { tema: "Eficientes", mencoes: 8 },
  { tema: "Atenção", mencoes: 7 },
] as const;
