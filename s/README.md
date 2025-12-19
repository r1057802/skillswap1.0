# SkillSwap Frontend

Vue 3 + Vite frontend. Deze app praat met de backend (skillswap-main) via `VITE_API_BASE`.

## Vereisten
- Node.js 18+ en npm

## Installatie
```bash
cd s
npm install
```

## .env instellen
Maak `.env` met bijvoorbeeld:
```
VITE_API_BASE=http://localhost:3000
```
Gebruik `/api` als je een proxy gebruikt.

## Development
```bash
npm run dev
```
Open de getoonde URL (meestal http://localhost:5173).

## Build
```bash
npm run build
```

## Reset-wachtwoord link
De link in de reset-mail komt uit de backend (`FRONTEND_RESET_URL`, standaard `http://localhost:5173/reset-password`). Zorg dat die overeenkomt met de frontend-URL.
