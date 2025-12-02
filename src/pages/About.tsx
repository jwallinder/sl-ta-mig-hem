import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

const About = () => {
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

        <div className="flex flex-col items-center text-center space-y-6">
          <img
            src="/johan_erik.png"
            alt="Johan & Erik"
            className="w-full max-w-md rounded-lg shadow-lg"
          />
          
          <div className="space-y-4">
            <p className="text-lg text-foreground">
              Vi wibe-kodar appen tillsammans.
            </p>
            <p className="text-muted-foreground">
              /Johan & Erik
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default About;

