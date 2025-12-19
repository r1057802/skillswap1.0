# SkillSwap Backend

Complete setup-instructies voor een schone machine.

## Vereisten
- Node.js 18+ en npm
- MySQL 8 (luistert op `localhost:3306`, database `skillswap`)
- Python 3 + pip (voor de Folium kaartgenerator)

## Installatie
```bash
cd skillswap-main
npm install
```

## .env invullen
Maak `.env` aan (of vul de bestaande) met bijvoorbeeld:
```
DATABASE_URL="mysql://root:Senina12@localhost:3306/skillswap"
SESSION_SECRET=een_random_string
FRONTEND_RESET_URL=http://localhost:5173/reset-password

SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=jouw_gmail
SMTP_PASS=app_password_zonder_spaties
SMTP_FROM="SkillSwap <jouw_gmail>"

FRONTEND_BASE_URL=http://localhost:5173
BACKEND_BASE_URL=http://localhost:3000
```
> Zorg dat `SESSION_SECRET` niet leeg is. Voor Gmail heb je een app password nodig.

## Database klaarzetten
1. Start MySQL en zorg dat de database `skillswap` bestaat.
2. Sync schema:
```bash
npx prisma db push
```
   (of `npx prisma migrate deploy` als je migrations wilt toepassen)

## Python dependencies (kaart)
```bash
pip install folium geopy pycountry mysql-connector-python
```

## Server starten
- Development (nodemon): `npm run dev`
- Zonder nodemon: `node -r dotenv/config server.js`
Standaard draait hij op poort 3000.

## Kaart regenereren
- Via frontend-knop (roept `/map?regenerate=1` aan), of
- Handmatig: `curl "http://localhost:3000/map?regenerate=1"`

## Wachtwoord reset testen
1. POST `/auth/forgot-password` met `{"email":"<bestaat>"}`.
2. Token uit mail of DB (`SELECT passwordResetToken FROM users WHERE email='...'`).
3. POST `/auth/reset-password` met `{"token":"<token>","password":"NieuwPass!"}`.

## Admin snel aanmaken (SQL)
```sql
INSERT INTO users (username,email,passwordHash,role,updatedAt)
VALUES ('admin','admin@example.com',
'$2b$10$VNkEr3CQ0/92QxzZ42TvIutY0LcwGvAUBrmxfGs6obHuhbKpH6LRO',
'admin', NOW());
```
Wachtwoord = `1` (pas aan naar iets sterks in met verander wachtwoord).

## Handige scripts
- `npm run dev` – start backend met nodemon
- `npm start` – start backend zonder nodemon
