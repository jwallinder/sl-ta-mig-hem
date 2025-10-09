import { Loader2 } from "lucide-react";

interface LoadingSpinnerProps {
  message: string;
}

const LoadingSpinner = ({ message }: LoadingSpinnerProps) => {
  return (
    <div 
      className="flex flex-col items-center justify-center gap-3 p-8"
      role="status"
      aria-live="polite"
      aria-label={message}
    >
      <Loader2 className="w-8 h-8 text-primary animate-spin" />
      <p className="text-sm text-muted-foreground">{message}</p>
    </div>
  );
};

export default LoadingSpinner;
