import crypto from "crypto";
import { DynamoDBClient, PutItemCommand } from "@aws-sdk/client-dynamodb";

const client = new DynamoDBClient({});
const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET;

// Verifica que el webhook viene realmente de Stripe (firma HMAC-SHA256)
function verifyStripeSignature(rawBody, sigHeader, secret) {
  const parts = Object.fromEntries(sigHeader.split(",").map((p) => p.split("=")));
  const signedPayload = `${parts.t}.${rawBody}`;
  const expectedSig = crypto.createHmac("sha256", secret).update(signedPayload, "utf8").digest("hex");
  return expectedSig === parts.v1;
}

export const handler = async (event) => {
  try {
    const rawBody = event.isBase64Encoded
      ? Buffer.from(event.body, "base64").toString("utf8")
      : event.body;

    const sigHeader = event.headers["stripe-signature"];
    const firmaValida = verifyStripeSignature(rawBody, sigHeader, STRIPE_WEBHOOK_SECRET);

    if (!firmaValida) {
      console.error("Firma inválida — posible webhook falso");
      return { statusCode: 400, body: JSON.stringify({ error: "Firma inválida" }) };
    }

    const stripeEvent = JSON.parse(rawBody);
    console.log("Evento Stripe recibido:", stripeEvent.type);

    if (stripeEvent.type === "checkout.session.completed") {
      const session = stripeEvent.data.object;

      const item = {
        pedido_id: { S: session.id },
        cliente_email: { S: session.customer_details?.email || "desconocido" },
        total: { N: String((session.amount_total || 0) / 100) },
        fecha_sync: { S: new Date().toISOString() },
      };

      await client.send(new PutItemCommand({ TableName: "PedidosSync", Item: item }));
    }

    return { statusCode: 200, body: JSON.stringify({ received: true }) };

  } catch (error) {
    console.error("Fallo en la ejecución:", error);
    return { statusCode: 500, body: JSON.stringify({ ok: false, error: error.message }) };
  }
};
