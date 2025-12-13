import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

const Privacy = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-3xl mx-auto px-4 py-8">
        <Button
          variant="ghost"
          onClick={() => navigate("/")}
          className="mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Tillbaka
        </Button>

        <article className="prose prose-slate max-w-none">
          <h1 className="text-3xl font-bold text-foreground mb-6">
            Integritetspolicy
          </h1>

          <section className="mb-6">
            <h2 className="text-xl font-semibold text-foreground mb-3">
              Din integritet
            </h2>
            <p className="text-foreground mb-4">
              SL ta mig hem respekterar din integritet och hanterar dina personuppgifter
              med största försiktighet.
            </p>
          </section>

          <section className="mb-6">
            <h2 className="text-xl font-semibold text-foreground mb-3">
              Positionsdata
            </h2>
            <p className="text-foreground mb-4">
              När du använder appen ber vi om tillgång till din position för att kunna
              beräkna den bästa resan till Fruängen.
            </p>
            <ul className="list-disc list-inside space-y-2 text-foreground">
              <li>Din position används endast för att söka resor</li>
              <li>Vi sparar aldrig din position permanent</li>
              <li>Positionsdata lagras endast tillfälligt i minnet under sökningen</li>
              <li>När du stänger appen raderas all positionsdata automatiskt</li>
            </ul>
          </section>

          <section className="mb-6">
            <h2 className="text-xl font-semibold text-foreground mb-3">
              Externa tjänster
            </h2>
            <p className="text-foreground mb-4">
              Vi använder SL:s (Storstockholms Lokaltrafik) öppna API via Trafiklab
              för att hämta realtidsinformation om kollektivtrafiken. Läs mer om deras
              integritetspolicy på{" "}
              <a
                href="https://www.trafiklab.se"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                trafiklab.se
              </a>
              .
            </p>
          </section>

          <section className="mb-6">
            <h2 className="text-xl font-semibold text-foreground mb-3">
              Kontakt
            </h2>
            <p className="text-foreground">
              Om du har frågor om vår integritetspolicy, vänligen kontakta oss.
            </p>
          </section>
        </article>
      </div>
    </div>
  );
};

export default Privacy;
