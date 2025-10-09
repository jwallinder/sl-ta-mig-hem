# Stockholm Direkt

En minimalistisk mobilapp för att snabbt hitta bästa kollektivtrafikresan från din plats till populära destinationer i Stockholm.

## Funktioner

- ✅ Ett klick för att söka resor till Fruängen, T-Centralen eller XXL Kungens Kurva
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

### 3. Starta utvecklingsservern

```bash
npm run dev
```

Appen körs nu på `http://localhost:8080`

## Användning

1. Öppna appen i din mobila webbläsare eller desktop
2. Välj destination: **FRUÄNGEN**, **T-CENTRALEN** eller **XXL KUNGENS KURVA**
3. Tillåt webbläsaren att använda din position
4. Se de 3 bästa resealternativen till din valda destination!

## Teknisk stack

- **React** - UI-ramverk
- **TypeScript** - Typsäkerhet
- **Vite** - Build-verktyg
- **Tailwind CSS** - Styling
- **Shadcn/ui** - UI-komponenter
- **SL API via Trafiklab** - Realtidsdata

## API:er som används

### SL Journey-planner v2

Används för att hitta hållplatser och reseplanering (kräver ingen API-nyckel):

**Hållplatssökning:**
```
GET /api/sl/stop-finder?name_sf=Fruangen&any_obj_filter_sf=2&type_sf=any
```

**Reseplanering:**
```
GET /api/sl/trips?type_origin=coord&type_destination=any&name_origin=<LON>:<LAT>:WGS84[dd.ddddd]&name_destination=<DEST_ID>&calc_number_of_trips=3
```

**CORS-lösning:**
- **Development**: Appen använder en Vite-proxy för att undvika CORS-problem när API:et anropas från webbläsaren. Proxyn konfigureras i `vite.config.ts`.
- **Production**: Appen använder SL API:et direkt eftersom Lovable hanterar CORS-problem automatiskt.

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
