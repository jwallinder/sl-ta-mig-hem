# Kontaktformulär - Setup Guide

Detta projekt använder Resend för att skicka e-post från kontaktformuläret. Din e-postadress exponeras inte publikt.

## Steg 1: Skapa Resend-konto

1. Gå till [resend.com](https://resend.com) och skapa ett konto
2. Verifiera din e-postadress
3. Gå till API Keys och skapa en ny API-nyckel
4. Kopiera API-nyckeln

## Steg 2: Konfigurera miljövariabler på Vercel

1. Gå till ditt Vercel-projekt
2. Gå till Settings → Environment Variables
3. Lägg till följande variabler:

   - `RESEND_API_KEY`: Din Resend API-nyckel
   - `CONTACT_EMAIL`: Din e-postadress dit meddelanden ska skickas (t.ex. `din.epost@example.com`)
   - `RESEND_FROM_EMAIL` (valfritt): E-postadress att skicka från. Om inte satt används `onboarding@resend.dev` (endast för test)

## Steg 3: Verifiera domän (valfritt men rekommenderat)

För produktion bör du verifiera din domän i Resend:

1. Gå till Resend Dashboard → Domains
2. Lägg till din domän (t.ex. `sl-ta-mig-hem.vercel.app`)
3. Följ instruktionerna för att verifiera DNS-poster
4. Uppdatera `from`-adressen i `api/contact.ts` med din verifierade domän

## Steg 4: Testa formuläret

1. Deploya projektet till Vercel
2. Gå till `/contact` på din webbplats
3. Fyll i formuläret och skicka
4. Kontrollera att du får e-postmeddelandet

## Alternativ: Använd Resend's testläge

Om du inte vill verifiera en domän kan du använda Resend's testläge med `onboarding@resend.dev` som `from`-adress, men detta är endast för utveckling.

## Felsökning

- **"Serverkonfiguration saknas"**: Kontrollera att `CONTACT_EMAIL` är satt i Vercel
- **"Kunde inte skicka e-post"**: Kontrollera att `RESEND_API_KEY` är korrekt och aktiv
- **CORS-fel**: Kontrollera att API-routen är korrekt konfigurerad i `vercel.json`

