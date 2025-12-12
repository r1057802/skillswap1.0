# SkillSwap Backend (student versie)

Eenvoudige uitleg voor de API die de SkillSwap app voedt.

## Wat zit erin?
- Node.js + Express API
- Prisma ORM met MySQL (schema: `prisma/schema.prisma`)
- Sessies via `express-session`
- Uploads met `multer`
- Optioneel: e-mails voor wachtwoord reset (SMTP)

## Snel starten
1. Installeer:
   ```bash
   cd skillswap-main
   npm install
   ```
2. Zet `.env` goed (kopieer de meegeleverde en pas aan):
   - `DATABASE_URL` bv. `mysql://user:pass@localhost:3306/skillswap`
   - `SESSION_SECRET` een random string
   - Optioneel SMTP voor reset-mails: `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM`
   - `FRONTEND_RESET_URL` bv. `http://localhost:5173/reset-password`
3. Maak de database aan met Prisma:
   ```bash
   npx prisma migrate dev --name init
   npx prisma generate
   ```

## Runnen
- Ontwikkeling (autoreload): `npm run dev`
- Productie: `npm start`
Standaard poort: 3000 (pas `PORT` aan als je wilt).

### Optioneel: kaart genereren
De `/map` route gebruikt `map.html` uit `generate_map.py`. Om die te bouwen:
- Installeer Python 3.
- Installeer deps:
  ```bash
  pip install folium geopy pycountry mysql-connector-python
  ```
- Pas in `generate_map.py` de DB-config aan indien nodig.
- Run:
  ```bash
  python generate_map.py
  ```
Hiermee wordt `map.html` geüpdatet.

## Belangrijke routes
- `/auth` login/register/forgot/reset/me/logout
- `/listings` listings ophalen of aanmaken, bookings via `/:id/bookings`, favorites aan/uit
- `/bookings` beheer bookings (auth)
- `/users`, `/categories`, `/search`, `/upload`, `/map`, `/notifications`, `/sessions`, `/search-logs`

De frontend moet `VITE_API_BASE` laten wijzen naar deze server en requests doen met cookies (`credentials: 'include'`). Pas CORS/HTTPS aan in productie.
