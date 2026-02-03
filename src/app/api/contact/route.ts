import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email, phone, service, message } = body;

    // Basic validation
    if (!name || !email || !message) {
      return NextResponse.json(
        { error: "Name, email, and message are required" },
        { status: 400 }
      );
    }

    // If Resend API key is not configured, just log and return success
    if (!process.env.RESEND_API_KEY) {
      console.log("Contact form submission:", { name, email, phone, service, message });
      return NextResponse.json({ success: true });
    }

    // Dynamically import Resend only when API key is available
    const { Resend } = await import("resend");
    const resend = new Resend(process.env.RESEND_API_KEY);

    // Send email notification
    await resend.emails.send({
      from: "AFJ Website <noreply@afjltd.co.uk>",
      to: ["info@afjltd.co.uk"],
      replyTo: email,
      subject: `New Contact Form Submission from ${name}`,
      html: `
        <h2>New Contact Form Submission</h2>
        <p><strong>Name:</strong> ${name}</p>
        <p><strong>Email:</strong> ${email}</p>
        ${phone ? `<p><strong>Phone:</strong> ${phone}</p>` : ""}
        ${service ? `<p><strong>Service Interest:</strong> ${service}</p>` : ""}
        <p><strong>Message:</strong></p>
        <p>${message.replace(/\n/g, "<br>")}</p>
      `,
    });

    // Send confirmation email to user
    await resend.emails.send({
      from: "AFJ Limited <noreply@afjltd.co.uk>",
      to: [email],
      subject: "Thank you for contacting AFJ Limited",
      html: `
        <h2>Thank you for contacting us, ${name}!</h2>
        <p>We have received your message and will get back to you within 24 hours.</p>
        <p>If your enquiry is urgent, please call us on <strong>0121 123 4567</strong>.</p>
        <br>
        <p>Best regards,</p>
        <p>The AFJ Limited Team</p>
      `,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Contact form error:", error);
    return NextResponse.json(
      { error: "Failed to send message" },
      { status: 500 }
    );
  }
}
