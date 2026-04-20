# SplitBill Frontend

React + TypeScript + Vite frontend for SplitBill backend.

## Run

1. Install packages:

```bash
npm install
```

2. Start dev server:

```bash
npm run dev
```

3. Open browser:

- http://127.0.0.1:5173

## Backend

By default, frontend calls backend through Vite proxy:

- frontend request path: `/api/v1`
- proxied target: `http://127.0.0.1:8000`

Optional override for deployed environments:

```bash
VITE_API_BASE_URL=https://your-domain.com/api/v1
```
