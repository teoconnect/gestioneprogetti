import { NextResponse } from "next/server";
import { sendEmail } from "@/lib/email";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { error: "Email target is required" },
        { status: 400 }
      );
    }

    const subject = "Email di Test da Project Manager";
    const html = `
      <h2>Configurazione completata</h2>
      <p>Questa è un'email di test per confermare che l'invio delle notifiche tramite SMTP sta funzionando correttamente sul tuo progetto.</p>
    `;

    await sendEmail(email, subject, html);

    return NextResponse.json({ success: true, message: "Email di test inviata con successo!" });
  } catch (error) {
    console.error("Failed to send test email:", error);
    return NextResponse.json(
      { error: "Errore durante l'invio dell'email di test" },
      { status: 500 }
    );
  }
}
