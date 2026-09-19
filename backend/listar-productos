import { DynamoDBClient, ScanCommand } from "@aws-sdk/client-dynamodb";

const client = new DynamoDBClient({});

export const handler = async () => {
  try {
    const resultado = await client.send(new ScanCommand({ TableName: "Productos" }));

    const productos = (resultado.Items || []).map((item) => ({
      id: item.product_id.S,
      nombre: item.nombre.S,
      precio: Number(item.precio.N),
      stock: Number(item.stock.N),
    }));

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
      body: JSON.stringify(productos),
    };
  } catch (error) {
    console.error("Error listando productos:", error);
    return {
      statusCode: 500,
      headers: { "Access-Control-Allow-Origin": "*" },
      body: JSON.stringify({ error: error.message }),
    };
  }
};
