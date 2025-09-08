
import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';

const geminiApiKey = process.env.GEMINI_API_KEY;

if (!geminiApiKey) {
  // Em ambientes de produção (como Vercel), `dotenv` não é usado, então a verificação deve ser robusta.
  // Lançar um erro claro aqui ajuda a diagnosticar problemas de configuração no deploy.
  if (process.env.NODE_ENV === 'production') {
    throw new Error(
      'A variável de ambiente GEMINI_API_KEY não foi configurada no ambiente de produção. ' +
      'Por favor, adicione a chave de API nas configurações de ambiente do seu provedor de hospedagem (ex: Vercel, Firebase Hosting).'
    );
  } else {
    throw new Error(
      "A variável de ambiente GEMINI_API_KEY não está definida. " +
      "Por favor, obtenha uma chave de API do Google AI Studio e configure-a " +
      "no seu arquivo .env (para desenvolvimento local). " +
      "O Frô não gera chaves de API automaticamente."
    );
  }
}

export const ai = genkit({
  plugins: [googleAI({apiKey: geminiApiKey})],
  model: 'googleai/gemini-2.0-flash',
});
