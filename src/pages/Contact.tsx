import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { ArrowLeft, Mail, Send } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

const Contact = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    message: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Något gick fel");
      }

      toast.success("Tack för ditt meddelande! Vi återkommer så snart som möjligt.");
      setFormData({ name: "", email: "", message: "" });
    } catch (error) {
      console.error("Error sending message:", error);
      toast.error("Kunde inte skicka meddelandet. Försök igen senare.");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-2xl mx-auto px-4 py-8">
        <Button
          variant="ghost"
          onClick={() => navigate("/")}
          className="mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Tillbaka
        </Button>

        <Card className="p-6 md:p-8">
          <div className="flex items-center gap-3 mb-6">
            <Mail className="w-6 h-6 text-primary" />
            <h1 className="text-3xl font-bold text-foreground">
              Kontakta oss
            </h1>
          </div>

          <p className="text-muted-foreground mb-6">
            Har du frågor eller förslag? Skicka oss ett meddelande så återkommer
            vi så snart som möjligt.
          </p>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="name">Namn</Label>
              <Input
                id="name"
                name="name"
                type="text"
                required
                value={formData.name}
                onChange={handleChange}
                placeholder="Ditt namn"
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">E-post</Label>
              <Input
                id="email"
                name="email"
                type="email"
                required
                value={formData.email}
                onChange={handleChange}
                placeholder="din.epost@example.com"
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="message">Meddelande</Label>
              <Textarea
                id="message"
                name="message"
                required
                value={formData.message}
                onChange={handleChange}
                placeholder="Ditt meddelande..."
                rows={6}
                disabled={loading}
              />
            </div>

            <Button type="submit" disabled={loading} className="w-full">
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Skickar...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  Skicka meddelande
                </>
              )}
            </Button>
          </form>
        </Card>
      </div>
    </div>
  );
};

export default Contact;

