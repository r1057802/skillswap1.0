# SkillSwap Frontend (student versie)

Vue 3 + Vite frontend voor SkillSwap. Gebruikt routes voor login/register/dashboard/admin en praat met de backend via `VITE_API_BASE`.

## Snel starten
1. Installeren:
   ```bash
   npm install
   ```
2. Zet in `.env` de API-base, bv.:
   ```
   VITE_API_BASE=http://localhost:3000
   ```
   (of `/api` als je via een proxy werkt).
3. Start dev-server:
   ```bash
   npm run dev
   ```
4. Productie build:
   ```bash
   npm run build
   ```

Let op: voor echte data moet de backend (in `skillswap-main`) draaien en `VITE_API_BASE` naar die server wijzen.

Tip: installeer de Vue Devtools in je browser voor debuggen.
