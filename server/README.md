# Honey Vision API foundation

The current MVP uses browser storage so it can be demonstrated without credentials or external services. This folder is the production handoff point.

1. Create a PostgreSQL database and apply `schema.sql`.
2. Build authenticated endpoints for `/products`, `/cart`, `/orders`, `/addresses`, and `/installations`.
3. Create payment orders only on the server; verify gateway signatures and webhooks before marking an order paid.
4. Reserve stock inside the same database transaction that creates the order.
5. Move all secrets to environment variables; never expose payment secrets in the React client.

Suggested order statuses: `placed`, `confirmed`, `packed`, `shipped`, `out_for_delivery`, `delivered`, `cancelled`.
