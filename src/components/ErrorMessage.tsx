import { Card } from "@/components/ui/card";
import { AlertCircle } from "lucide-react";

interface ErrorMessageProps {
  message: string;
}

const ErrorMessage = ({ message }: ErrorMessageProps) => {
  return (
    <Card className="p-6 bg-destructive/10 border-destructive/30">
      <div className="flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-destructive mt-0.5" />
        <div>
          <h3 className="font-semibold text-destructive mb-1">Ett fel uppstod</h3>
          <p className="text-sm text-foreground">{message}</p>
        </div>
      </div>
    </Card>
  );
};

export default ErrorMessage;
