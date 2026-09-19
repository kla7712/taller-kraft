import { DynamoDBClient, GetItemCommand } from "@aws-sdk/client-dynamodb";

const client = new DynamoDBClient({});
const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;

const SUCCESS_URL = "https://kla7712.github.io/taller-kraft/?resultado=exito";
const CANCEL_URL = "https://kla7712.github.io/taller-kraft/?resultado=cancelado";

export const handler = async (event) => {
  try {
    const productoId = event.queryStringParameters?.producto;
    if (!productoId) {
      return { statusCode: 400, body: JSON.stringify({ error: "Falta el parámetro 'producto'" }) };
    }

    const resultado = await client.send(new GetItemCommand({
      TableName: "Productos",
      Key: { product_id: { S: productoId } },
    }));

    if (!resultado.Item) {
      return { statusCode: 404, body: JSON.stringify({ error: "Producto no encontrado" }) };
    }

    const stock = Number(resultado.Item.stock.N);
    if (stock <= 0) {
      return { statusCode: 302, headers: { Location: `${CANCEL_URL}&motivo=agotado` }, body: "" };
    }

    const stripePriceId = resultado.Item.stripe_price_id.S;

    const params = new URLSearchParams();
    params.append("mode", "payment");
    params.append("line_items[0][price]", stripePriceId);
    params.append("line_items[0][quantity]", "1");
    params.append("success_url", SUCCESS_URL);
    params.append("cancel_url", CANCEL_URL);
    params.append("metadata[producto_id]", productoId);

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

    return { statusCode: 302, headers: { Location: session.url }, body: "" };

  } catch (error) {
    console.error("Fallo creando la sesión:", error);
    return { statusCode: 500, body: JSON.stringify({ error: error.message }) };
  }
};
