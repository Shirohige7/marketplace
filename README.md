# Multi-vendor Marketplace — Coding Factory 10 Final Project

Marketplace με πολλαπλούς vendors: κάθε buyer μπορεί να παραγγείλει προϊόντα
από διαφορετικούς vendors μέσα σε μία παραγγελία/πληρωμή, η οποία σπάει
εσωτερικά σε per-vendor sub-orders (`VendorOrder`).

## Αρχιτεκτονική

- **Backend**: Node.js + Express, layered (Controller → Service → Repository),
  PostgreSQL μέσω Prisma ORM.
- **Frontend**: React (Vite), React Router, Stripe Elements για checkout.
- **Auth**: JWT (role-based: BUYER / VENDOR / ADMIN‑ready), middleware guards
  και στα δύο άκρα.
- **Πληρωμές**: Stripe test mode. Ένα Payment Intent ανά checkout (όχι ένα
  ανά vendor) — η κατανομή στους vendors γίνεται εσωτερικά μέσω `VendorLedger`,
  όχι μέσω Stripe Connect (βλ. σχεδιαστική απόφαση παρακάτω).
- **Πηγή αλήθειας για πληρωμή**: το Stripe **webhook**
  (`payment_intent.succeeded`), όχι το frontend callback. Idempotent μέσω
  πίνακα `WebhookEvent`. Το stock μειώνεται ατομικά (`WHERE stockQty >= qty`)
  μόνο εκεί, ώστε να μην υπάρχει overselling σε ταυτόχρονα checkouts.

## Domain model (συνοπτικά)

`User` → `Vendor` (1-1) → `Product` (1-N)
`Order` (buyer) → `VendorOrder` (per vendor, ανεξάρτητο status) → `OrderItem`
`Order` → `Payment` (1-1, Stripe PaymentIntent)
`VendorOrder` → `VendorLedger` (τι οφείλεται σε κάθε vendor)

Πλήρες σχήμα: `backend/prisma/schema.prisma`.

## Build & Deploy (local development)

### 1. Προαπαιτούμενα
- Node.js 18+
- Docker (για PostgreSQL)
- Λογαριασμός Stripe (test mode) — https://dashboard.stripe.com/test/apikeys
- Stripe CLI για τοπικό webhook forwarding — https://stripe.com/docs/stripe-cli

### 2. Database
```bash
cd backend
docker compose up -d          # ξεκινά Postgres στο localhost:5432
cp .env.example .env          # συμπλήρωσε DATABASE_URL / JWT_SECRET / STRIPE_*
npm install
npx prisma migrate dev --name init
npm run prisma:seed           # δημιουργεί demo vendor + buyer + products
```

### 3. Backend API
```bash
npm run dev                   # http://localhost:4000
```

### 4. Stripe webhook (τοπικά)
Σε νέο terminal:
```bash
stripe listen --forward-to localhost:4000/webhooks/stripe
```
Αντίγραψε το `whsec_...` που εμφανίζεται στο `STRIPE_WEBHOOK_SECRET` του `.env`.

### 5. Frontend
```bash
cd frontend
cp .env.example .env          # βάλε VITE_STRIPE_PUBLISHABLE_KEY (pk_test_...)
npm install
npm run dev                   # http://localhost:5173
```

### 6. Δοκιμαστική ροή
1. Register ως VENDOR (ή login με `vendor@example.com` / `password123`)
2. Register ως BUYER (ή login με `buyer@example.com` / `password123`)
3. Ως buyer: πρόσθεσε προϊόντα από τον demo vendor στο καλάθι → checkout
4. Στο Stripe test checkout χρησιμοποίησε test card: `4242 4242 4242 4242`,
   οποιαδήποτε μελλοντική ημερομηνία λήξης, οποιοδήποτε CVC
5. Μετά την πληρωμή, το `stripe listen` θα προωθήσει το webhook event στο
   backend — η παραγγελία περνάει σε `PAID`, μειώνεται το stock, γεμίζει το
   vendor ledger

## API docs (Swagger)

Με το backend σε λειτουργία: **http://localhost:4000/docs**
(OpenAPI spec γραμμένο με JSDoc annotations πάνω στα routes, `src/config/swagger.js`).

## Tests

```bash
cd backend
npm test
```
Unit tests (Jest) καλύπτουν το πιο ρισκαρισμένο κομμάτι:
- `checkoutService`: σωστό split καλαθιού πολλαπλών vendors, έλεγχος stock, σωστό συνολικό ποσό στο Stripe PaymentIntent
- `webhookService`: idempotency (δεν ξαναπεξεργάζεται το ίδιο Stripe event), atomic stock decrement, guard για race condition σε ανεπαρκές stock

Integration tests: `backend/postman_collection.json` — import στο Postman, τρέξε register/login/checkout/orders flow με πραγματικό running server.

## Εναλλακτικό: όλο το stack σε Docker

Αντί για το βήμα-βήμα local setup παραπάνω, μπορείς να τρέξεις τα πάντα (Postgres + backend + frontend) με ένα compose file στη ρίζα:

```bash
export JWT_SECRET=change-me
export STRIPE_SECRET_KEY=sk_test_xxx
export STRIPE_WEBHOOK_SECRET=whsec_xxx
docker compose up --build
```
Backend: http://localhost:4000 (docs στο `/docs`), frontend: http://localhost:5173.
Το backend container τρέχει αυτόματα `prisma migrate deploy` πριν ξεκινήσει.
Το frontend image χρειάζεται τα `VITE_*` ως build args (βλ. σχόλιο στο `frontend/Dockerfile`).

## Production deploy (σύνοψη)
- Backend: container (Dockerfile πρόσθεσε ανάλογα με τον πάροχο), env vars
  μέσω του πάροχου (Railway/Render/Fly.io), migrate με `prisma migrate deploy`
- Webhook endpoint: registered στο Stripe dashboard (production URL) αντί για
  `stripe listen`
- Frontend: static build (`npm run build`) σε Vercel/Netlify, `VITE_API_URL`
  να δείχνει στο production backend

## Γιατί όχι Stripe Connect
Το project υιοθετεί ένα ενιαίο Stripe account της πλατφόρμας +
εσωτερικό `VendorLedger`, αντί για Stripe Connect (connected accounts ανά
vendor με αυτόματο transfer split). Ο λόγος είναι scope: το Connect
onboarding (KYC, ξεχωριστά webhooks ανά account) είναι εκτός του χρονικού
πλαισίου του project. Η πραγματική διανομή χρημάτων στους vendors θα ήταν
φυσική επέκταση.
