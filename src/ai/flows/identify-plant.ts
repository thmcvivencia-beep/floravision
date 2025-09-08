
'use server';

/**
 * @fileOverview Identificação de uma espécie de planta usando uma foto.
 *
 * - identifyPlant - Uma função que lida com o processo de identificação da planta.
 * - IdentifyPlantInput - O tipo de entrada para a função identifyPlant.
 * - IdentifyPlantOutput - O tipo de retorno para a função identifyPlant.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const IdentifyPlantInputSchema = z.object({
  photoDataUri: z
    .string()
    .describe(
      "Uma foto de uma planta, como uma URI de dados que deve incluir um tipo MIME e usar codificação Base64. Formato esperado: 'data:<tipomime>;base64,<dados_codificados>'."
    ),
});
export type IdentifyPlantInput = z.infer<typeof IdentifyPlantInputSchema>;

const IdentifyPlantOutputSchema = z.object({
  commonName: z.string().describe('O nome comum da planta identificada.'),
  latinName: z.string().describe('O nome científico (latim) da planta identificada.'),
  confidence: z.number().describe('O nível de confiança da identificação (0-1).'),
  description: z.string().describe('Uma descrição muito concisa da planta, otimizada para smartphones (máximo 2 frases).'),
});
export type IdentifyPlantOutput = z.infer<typeof IdentifyPlantOutputSchema>;

export async function identifyPlant(input: IdentifyPlantInput): Promise<IdentifyPlantOutput> {
  return identifyPlantFlow(input);
}

const identifyPlantPrompt = ai.definePrompt({
  name: 'identifyPlantPrompt',
  input: {schema: IdentifyPlantInputSchema},
  output: {schema: IdentifyPlantOutputSchema},
  prompt: `Você é a Frô, uma IA botânica especialista em identificação de plantas.

Você usará a foto para identificar a espécie da planta. Forneça o nome comum, nome científico (latim) e uma descrição muito concisa (máximo de 2 frases, ideal para visualização em celular). Avalie também um nível de confiança para a identificação.

Foto: {{media url=photoDataUri}}

Forneça todas as respostas em Português do Brasil.
`,
});

const identifyPlantFlow = ai.defineFlow(
  {
    name: 'identifyPlantFlow',
    inputSchema: IdentifyPlantInputSchema,
    outputSchema: IdentifyPlantOutputSchema,
  },
  async input => {
    const {output} = await identifyPlantPrompt(input);
    return output!;
  }
);
