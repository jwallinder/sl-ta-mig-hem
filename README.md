# Fruängen Direkt

En minimalistisk mobilapp för att snabbt hitta bästa kollektivtrafikresan från din plats till Fruängen i Stockholm.

## Funktioner

- ✅ Ett klick för att söka resor till Fruängen
- ✅ Automatisk geolokalisering
- ✅ Realtidsdata från SL
- ✅ Visa 3 bästa reseförslag
- ✅ Detaljerad visning av varje resa med linjenummer och byten
- ✅ Mobiloptimerad design
- ✅ Ingen permanent lagring av positionsdata

## Installation

### 1. Klona projektet

```bash
git clone <repository-url>
cd fruangen-direkt
```

### 2. Installera beroenden

```bash
npm install
```

### 3. Konfigurera API-nyckel

Du behöver en API-nyckel från Trafiklab för att använda SL:s API:er.

**Skapa Trafiklab-konto:**

1. Gå till [https://www.trafiklab.se](https://www.trafiklab.se)
2. Registrera ett konto
3. Skapa ett nytt projekt
4. Lägg till följande API:er till ditt projekt:
   - **SL Reseplanerare 3.1** (Journey Planner)
   - **SL Platsuppslag** (Stop Lookup / Typeahead)
5. Kopiera din API-nyckel (samma nyckel används för båda API:erna)

**Lägg till API-nyckeln:**

Skapa en fil `.env` i projektets rotkatalog:

```bash
VITE_TRAFIKLAB_KEY=din_api_nyckel_här
```

**Viktigt:** Lägg ALDRIG till `.env` i git. Den är redan tillagd i `.gitignore`.

### 4. Starta utvecklingsservern

```bash
npm run dev
```

Appen körs nu på `http://localhost:8080`

## Användning

1. Öppna appen i din mobila webbläsare eller desktop
2. Klicka på den stora **FRUÄNGEN**-knappen
3. Tillåt webbläsaren att använda din position
4. Se de 3 bästa resealternativen till Fruängen!

## Teknisk stack

- **React** - UI-ramverk
- **TypeScript** - Typsäkerhet
- **Vite** - Build-verktyg
- **Tailwind CSS** - Styling
- **Shadcn/ui** - UI-komponenter
- **SL API via Trafiklab** - Realtidsdata

## API:er som används

### SL Platsuppslag (Typeahead)

Används för att hitta SiteId för Fruängen:

```
GET https://api.sl.se/api2/typeahead.json?key=<API_KEY>&searchstring=Fruängen&stationsonly=true&maxresults=1
```

### SL Reseplanerare 3.1 (Trip)

Används för att hämta reseförslag:

```
GET https://api.sl.se/api2/TravelplannerV3_1/trip.json?key=<API_KEY>&originCoordLat=<LAT>&originCoordLong=<LON>&destId=<DEST_ID>&numTrips=3
```

## Integritet

- Din position används endast för att söka resor
- Vi sparar aldrig din position permanent
- Positionsdata lagras endast tillfälligt i minnet under sökningen
- När du stänger appen raderas all positionsdata automatiskt

## CORS och Proxy (om nödvändigt)

Om du får CORS-fel i utvecklingsläge kan du konfigurera en proxy i `vite.config.ts`:

```typescript
export default defineConfig({
  server: {
    proxy: {
      '/api': {
        target: 'https://api.sl.se',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, '')
      }
    }
  }
})
```

## Bygg för produktion

```bash
npm run build
```

Byggd app hamnar i `dist/`-mappen.

## Licens

MIT

## Support

Vid frågor eller problem, öppna en issue på GitHub eller kontakta utvecklaren.
