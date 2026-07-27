import Stripe from "stripe";

// Instanciation paresseuse : évite que l'import du module (ex. collecte des
// routes par `next build`) échoue si STRIPE_SECRET_KEY n'est pas encore définie.
let client: Stripe | null = null;
function getClient(): Stripe {
  if (!client) {
    client = new Stripe(process.env.STRIPE_SECRET_KEY ?? "", {
      apiVersion: "2025-02-24.acacia",
      typescript: true,
    });
  }
  return client;
}

export const stripe = new Proxy({} as Stripe, {
  get(_target, prop, receiver) {
    return Reflect.get(getClient(), prop, receiver);
  },
});
