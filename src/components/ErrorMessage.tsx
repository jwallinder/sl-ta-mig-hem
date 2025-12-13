import { Card } from "@/components/ui/card";
import { AlertCircle } from "lucide-react";

interface ErrorMessageProps {
  message: string;
}

const ErrorMessage = ({ message }: ErrorMessageProps) => {
  return (
    <Card className="p-6 bg-destructive/10 border-destructive/30">
      <div className="flex flex-col items-center gap-3">
        <img 
          src="/sl-buss-dike.png" 
          alt="SL buss i dike" 
          className="max-w-full h-auto rounded"
        />
        <div className="text-center">
          <div className="flex items-center justify-center gap-2 mb-1">
            <AlertCircle className="w-4 h-4 text-destructive" />
            <h3 className="font-semibold text-destructive">Ett fel uppstod</h3>
          </div>
          <p className="text-sm text-foreground">{message}</p>
        </div>
      </div>
    </Card>
  );
};

export default ErrorMessage;
