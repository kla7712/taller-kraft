[README (1).md](https://github.com/user-attachments/files/32333402/README.1.md)
# Taller Kraft — Checkout serverless con Stripe + AWS Lambda

Proyecto personal para practicar una integración serverless real: un frontend que
inicia un pago, y un backend que lo procesa y sincroniza de forma asíncrona,
como haría cualquier tienda con su CRM/ERP.

**Demo en vivo:** https://kla7712.github.io/taller-kraft/

## Arquitectura

```
[Frontend estático]
   Taller Kraft (HTML/CSS/JS)
          │  clic en "Comprar"
          ▼
[Lambda: crear-checkout]
   Crea una sesión de pago en Stripe (API REST, fetch nativo)
   y redirige al checkout alojado por Stripe
          │
          ▼
[Stripe Checkout]
   El usuario paga con tarjeta (modo test)
          │  evento: checkout.session.completed
          ▼
[Lambda: sync-pedidos]
   Verifica la firma del webhook (HMAC-SHA256, sin librerías externas)
   Transforma el evento y lo guarda
          │
          ▼
[DynamoDB: tabla PedidosSync]
   Persiste el pedido ya procesado
```

## Stack

- **Frontend**: HTML, CSS y JavaScript puro, sin frameworks
- **Backend**: Node.js (ES Modules) en AWS Lambda
- **API**: Amazon API Gateway (HTTP API)
- **Base de datos**: DynamoDB
- **Pagos**: Stripe (Checkout Sessions + Webhooks, modo test)

## Estructura del repositorio

```
/index.html                        → frontend (servido por GitHub Pages)
/backend/crear-checkout/index.mjs  → Lambda que inicia el pago
/backend/sync-pedidos/index.mjs    → Lambda que procesa el webhook
```

## Puntos técnicos a destacar

- **Verificación de firma de webhook**: implementada manualmente con el
  módulo `crypto` nativo de Node, sin depender del SDK de Stripe.
- **Separación de responsabilidades**: cada función Lambda hace una sola
  cosa (iniciar el pago / procesar el resultado).
- **Sin claves hardcodeadas**: los secretos (`STRIPE_SECRET_KEY`,
  `STRIPE_WEBHOOK_SECRET`) viven como variables de entorno en Lambda.
- **Manejo de errores**: cada función devuelve códigos de estado y
  mensajes claros ante fallos (JSON inválido, firma inválida, error de
  Stripe, fallo al guardar en DynamoDB).

## Nota

Todo el flujo de pago usa el **modo de pruebas (test mode)** de Stripe —
no se procesa dinero real. Tarjeta de prueba: `4242 4242 4242 4242`,
cualquier fecha futura y CVC.
