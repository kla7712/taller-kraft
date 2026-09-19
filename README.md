[README (2).md](https://github.com/user-attachments/files/32422018/README.2.md)
# Taller Kraft — Tienda serverless con Stripe + AWS Lambda

Proyecto personal para practicar una integración serverless real: un catálogo
de productos con stock real, un checkout con Stripe, y sincronización
automática vía webhook — incluyendo control de concurrencia para evitar
sobreventa.

**Demo en vivo:** https://kla7712.github.io/taller-kraft/

## Arquitectura

```
[Frontend estático]
   Catálogo cargado dinámicamente (fetch a listar-productos)
          │  clic en "Comprar"
          ▼
[Lambda: crear-checkout]
   Consulta el producto en DynamoDB (precio, stock)
   Crea la sesión de pago en Stripe con el producto_id en los metadatos
          │
          ▼
[Stripe Checkout] → el usuario paga (modo test)
          │  evento: checkout.session.completed
          ▼
[Lambda: sync-pedidos]
   Verifica la firma del webhook (HMAC-SHA256)
   Guarda el pedido en PedidosSync
   Resta 1 al stock con una actualización ATÓMICA CONDICIONAL
   (evita que dos compras simultáneas vendan la misma última unidad)
          │
          ▼
[DynamoDB]
   Tabla Productos (catálogo + stock) · Tabla PedidosSync (pedidos)
```

## Stack

- **Frontend**: HTML, CSS y JavaScript puro, sin frameworks
- **Backend**: Node.js (ES Modules) en AWS Lambda
- **API**: Amazon API Gateway (HTTP API)
- **Base de datos**: DynamoDB
- **Pagos**: Stripe (Checkout Sessions + Webhooks, modo test)

## Estructura del repositorio

```
/index.html                          → frontend (servido por GitHub Pages)
/backend/listar-productos/index.mjs  → Lambda que expone el catálogo (GET)
/backend/crear-checkout/index.mjs    → Lambda que inicia el pago
/backend/sync-pedidos/index.mjs      → Lambda que procesa el webhook
```

## Puntos técnicos a destacar

- **Control de concurrencia real**: la resta de stock usa `UpdateItem` con
  `ConditionExpression` en DynamoDB, para que dos compras simultáneas del
  último producto no puedan vender la misma unidad dos veces.
- **Verificación de firma de webhook**: implementada manualmente con el
  módulo `crypto` nativo de Node, sin depender del SDK de Stripe.
- **Separación de responsabilidades**: cada función Lambda hace una sola
  cosa (listar catálogo / iniciar el pago / procesar el resultado).
- **Sin claves hardcodeadas**: los secretos viven como variables de entorno.
- **Manejo de errores**: cada función devuelve códigos de estado claros
  ante fallos (JSON inválido, firma inválida, producto no encontrado,
  sin stock, error de Stripe, sobreventa detectada).

## Nota

Todo el flujo de pago usa el **modo de pruebas (test mode)** de Stripe —
no se procesa dinero real. Tarjeta de prueba: `4242 4242 4242 4242`,
cualquier fecha futura y CVC.
