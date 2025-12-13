import { useLocation } from "react-router-dom";
import { useEffect } from "react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="text-center max-w-2xl mx-auto px-4">
        <img 
          src="/sl-buss-dike.png" 
          alt="SL buss i dike" 
          className="mb-6 mx-auto rounded-lg shadow-lg max-w-full h-auto"
        />
        <h1 className="mb-4 text-4xl font-bold text-foreground">404</h1>
        <p className="mb-4 text-xl text-muted-foreground">Oops! Sidan hittades inte</p>
        <a href="/" className="text-primary underline hover:text-primary/80">
          Tillbaka till startsidan
        </a>
      </div>
    </div>
  );
};

export default NotFound;
