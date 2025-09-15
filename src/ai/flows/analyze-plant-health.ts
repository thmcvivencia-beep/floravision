
'use server';

/**
 * @fileOverview Este arquivo define um fluxo Genkit para analisar a saúde de uma planta com base em uma foto.
 *
 * analyzePlantHealth - Uma função que recebe uma foto e descrição da planta como entrada e retorna uma análise da saúde da planta.
 * AnalyzePlantHealthInput - O tipo de entrada para a função analyzePlantHealth.
 * AnalyzePlantHealthOutput - O tipo de retorno para a função analyzePlantHealth.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AnalyzePlantHealthInputSchema = z.object({
  photoDataUri: z
    .string()
    .describe(
      'Uma foto de uma planta, como uma URI de dados que deve incluir um tipo MIME e usar codificação Base64. Formato esperado: \'data:<tipomime>;base64,<dados_codificados>\'.'
    ),
  description: z.string().describe('Uma descrição da planta.'),
});
export type AnalyzePlantHealthInput = z.infer<typeof AnalyzePlantHealthInputSchema>;

const AnalyzePlantHealthOutputSchema = z.object({
  isHealthy: z.boolean().describe('Indica se a planta está saudável ou não.'),
  diagnosis: z.string().describe('Um diagnóstico conciso e direto da saúde da planta (máximo 2-3 frases).'),
  careTips: z.string().describe('Conselhos de cuidado imediatos e objetivos, em formato de tópicos ou frases curtas.'),
});
export type AnalyzePlantHealthOutput = z.infer<typeof AnalyzePlantHealthOutputSchema>;

export async function analyzePlantHealth(input: AnalyzePlantHealthInput): Promise<AnalyzePlantHealthOutput> {
  return analyzePlantHealthFlow(input);
}

const analyzePlantHealthPrompt = ai.definePrompt({
  name: 'analyzePlantHealthPrompt',
  input: {schema: AnalyzePlantHealthInputSchema},
  output: {schema: AnalyzePlantHealthOutputSchema},
  prompt: `Você é a Frô, uma IA botânica especialista em saúde de plantas. Seu objetivo é fornecer respostas claras e objetivas, ideais para visualização em smartphones.

Com base na foto e descrição, faça o seguinte:
1. Diagnóstico: Forneça um diagnóstico direto e conciso (máximo 2-3 frases) sobre a saúde da planta.
2. Dicas de Cuidado Imediatas: Ofereça conselhos práticos e breves (use tópicos se necessário) para a ação imediata.

Descrição: {{{description}}}
Foto: {{media url=photoDataUri}}

Seja direto e objetivo em todas as respostas. Não use formatação markdown como asteriscos para negrito.`,
});

const analyzePlantHealthFlow = ai.defineFlow(
  {
    name: 'analyzePlantHealthFlow',
    inputSchema: AnalyzePlantHealthInputSchema,
    outputSchema: AnalyzePlantHealthOutputSchema,
  },
  async input => {
    const {output} = await analyzePlantHealthPrompt(input);
    return output!;
  }
);
