import { Resend } from "resend";
import type { VercelRequest, VercelResponse } from "@vercel/node";

const resend = new Resend(process.env.RESEND_API_KEY);

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  // Only allow POST requests
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { name, email, message } = req.body;

    // Validate input
    if (!name || !email || !message) {
      return res.status(400).json({ error: "Alla fält är obligatoriska" });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: "Ogiltig e-postadress" });
    }

    // Get recipient email from environment variable
    const recipientEmail = process.env.CONTACT_EMAIL;
    if (!recipientEmail) {
      console.error("CONTACT_EMAIL environment variable is not set");
      return res.status(500).json({ error: "Serverkonfiguration saknas" });
    }

    // Send email using Resend
    // For production, replace with your verified domain
    // For testing, you can use: "onboarding@resend.dev"
    const fromEmail = process.env.RESEND_FROM_EMAIL || "onboarding@resend.dev";
    
    const { data, error } = await resend.emails.send({
      from: `SL ta mig hem <${fromEmail}>`,
      to: recipientEmail,
      replyTo: email,
      subject: `Kontaktformulär: ${name}`,
      html: `
        <h2>Nytt meddelande från kontaktformuläret</h2>
        <p><strong>Från:</strong> ${name}</p>
        <p><strong>E-post:</strong> ${email}</p>
        <p><strong>Meddelande:</strong></p>
        <p>${message.replace(/\n/g, "<br>")}</p>
      `,
      text: `
Nytt meddelande från kontaktformuläret

Från: ${name}
E-post: ${email}

Meddelande:
${message}
      `,
    });

    if (error) {
      console.error("Resend error:", error);
      return res.status(500).json({ error: "Kunde inte skicka e-post" });
    }

    return res.status(200).json({ 
      success: true, 
      message: "Meddelandet har skickats",
      id: data?.id 
    });
  } catch (error) {
    console.error("Error processing contact form:", error);
    return res.status(500).json({ error: "Ett oväntat fel uppstod" });
  }
}

