
import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';

const geminiApiKey = process.env.GEMINI_API_KEY;

if (!geminiApiKey) {
  throw new Error(
    "A variável de ambiente GEMINI_API_KEY não está definida. " +
    "Por favor, obtenha uma chave de API do Google AI Studio e configure-a " +
    "no seu arquivo .env (para desenvolvimento local) ou nas configurações de ambiente do seu provedor de hospedagem. " +
    "O Frô não gera chaves de API automaticamente."
  );
}

export const ai = genkit({
  plugins: [googleAI({apiKey: geminiApiKey})],
  model: 'googleai/gemini-2.0-flash',
});
