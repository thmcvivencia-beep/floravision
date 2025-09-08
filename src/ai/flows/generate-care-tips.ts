
'use server';

/**
 * @fileOverview Agente de IA que gera dicas de cuidados personalizadas para plantas com base em sua identificação e análise de saúde.
 *
 * - generateCareTips - Uma função que gera dicas de cuidados para plantas.
 * - GenerateCareTipsInput - O tipo de entrada para a função generateCareTips.
 * - GenerateCareTipsOutput - O tipo de retorno para a função generateCareTips.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateCareTipsInputSchema = z.object({
  plantName: z.string().describe('O nome comum da planta identificada.'),
  healthAnalysis: z.string().describe('A análise da saúde da planta.'),
});
export type GenerateCareTipsInput = z.infer<typeof GenerateCareTipsInputSchema>;

const GenerateCareTipsOutputSchema = z.object({
  careTips: z.string().describe('Dicas de cuidados personalizadas, estruturadas em tópicos (Rega, Luz, etc.) e com linguagem objetiva para fácil leitura em smartphones.'),
});
export type GenerateCareTipsOutput = z.infer<typeof GenerateCareTipsOutputSchema>;

export async function generateCareTips(input: GenerateCareTipsInput): Promise<GenerateCareTipsOutput> {
  return generateCareTipsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateCareTipsPrompt',
  input: {schema: GenerateCareTipsInputSchema},
  output: {schema: GenerateCareTipsOutputSchema},
  prompt: `Você é a Frô, uma IA especialista em cuidados com plantas. Sua tarefa é gerar um guia de cuidados completo, mas objetivo e fácil de ler em um smartphone.

Com base no nome da planta e na análise de saúde, crie dicas de cuidados personalizadas. Organize as dicas em tópicos claros e use frases curtas e diretas.

Estruture sua resposta usando os seguintes tópicos. Não use formatação markdown como asteriscos para os títulos dos tópicos, apenas o texto:
- Rega: Frequência e quantidade.
- Luz: Necessidade de luz solar (direta, indireta).
- Solo: Tipo de solo ideal.
- Fertilização: Quando e com o quê fertilizar.
- Problemas Comuns: Como lidar com problemas específicos mencionados na análise de saúde.

Nome da Planta: {{{plantName}}}
Análise de Saúde: {{{healthAnalysis}}}

Mantenha a linguagem simples e prática.`,
});

const generateCareTipsFlow = ai.defineFlow(
  {
    name: 'generateCareTipsFlow',
    inputSchema: GenerateCareTipsInputSchema,
    outputSchema: GenerateCareTipsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
