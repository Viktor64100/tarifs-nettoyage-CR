import OpenAI from "openai";

// Instanciation paresseuse : évite que l'import du module (ex. collecte des
// routes par `next build`) échoue si OPENAI_API_KEY n'est pas encore définie.
let client: OpenAI | null = null;
function getClient(): OpenAI {
  if (!client) client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  return client;
}

export const openai = new Proxy({} as OpenAI, {
  get(_target, prop, receiver) {
    return Reflect.get(getClient(), prop, receiver);
  },
});
