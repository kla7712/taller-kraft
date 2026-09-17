const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;
const STRIPE_PRICE_ID = process.env.STRIPE_PRICE_ID;

const SUCCESS_URL = "https://kla7712.github.io/taller-kraft/?resultado=exito";
const CANCEL_URL = "https://kla7712.github.io/taller-kraft/?resultado=cancelado";

export const handler = async () => {
  try {
    const params = new URLSearchParams();
    params.append("mode", "payment");
    params.append("line_items[0][price]", STRIPE_PRICE_ID);
    params.append("line_items[0][quantity]", "1");
    params.append("success_url", SUCCESS_URL);
    params.append("cancel_url", CANCEL_URL);

    const response = await fetch("https://api.stripe.com/v1/checkout/sessions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${STRIPE_SECRET_KEY}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: params.toString(),
    });

    const session = await response.json();

    if (!response.ok) {
      console.error("Error de Stripe:", session);
      return { statusCode: 500, body: JSON.stringify({ error: session.error?.message }) };
    }

    // Redirige el navegador directamente al checkout de Stripe
    return {
      statusCode: 302,
      headers: { Location: session.url },
      body: "",
    };

  } catch (error) {
    console.error("Fallo creando la sesión:", error);
    return { statusCode: 500, body: JSON.stringify({ error: error.message }) };
  }
};
