Stripe payment integration

Setup:
- Add environment variables to your backend `.env`:
  - `STRIPE_SECRET_KEY` => your Stripe secret key (starts with `sk_...`)
  - `FRONTEND_URL` => e.g. `http://localhost:5173`

Install dependencies in the backend folder:

```powershell
cd my-react-project\backend
npm install
```

Run the backend:

```powershell
npm run dev
```

Usage:
- POST `/api/payments/create-checkout-session` with JSON body { amount, currency, orderId, items }
- The endpoint will return `{ url }` to redirect the user to Stripe Checkout.

Note: For production, set proper success/cancel URLs and implement webhooks to capture payment completion and fulfill orders.
