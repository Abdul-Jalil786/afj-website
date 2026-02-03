import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      serviceType,
      pickupAddress,
      dropoffAddress,
      date,
      time,
      returnRequired,
      returnDate,
      returnTime,
      passengers,
      wheelchairUsers,
      specialRequirements,
      name,
      email,
      phone,
      additionalNotes,
    } = body;

    // Basic validation
    if (!name || !email || !phone || !pickupAddress || !dropoffAddress) {
      return NextResponse.json(
        { error: "Required fields are missing" },
        { status: 400 }
      );
    }

    // If Resend API key is not configured, just log and return success
    if (!process.env.RESEND_API_KEY) {
      console.log("Booking form submission:", body);
      return NextResponse.json({ success: true });
    }

    // Dynamically import Resend only when API key is available
    const { Resend } = await import("resend");
    const resend = new Resend(process.env.RESEND_API_KEY);

    // Send email notification to bookings team
    await resend.emails.send({
      from: "AFJ Website <noreply@afjltd.co.uk>",
      to: ["bookings@afjltd.co.uk"],
      replyTo: email,
      subject: `New Booking Request - ${serviceType} - ${name}`,
      html: `
        <h2>New Booking Request</h2>

        <h3>Service Details</h3>
        <p><strong>Service Type:</strong> ${serviceType}</p>

        <h3>Journey Details</h3>
        <p><strong>Pickup:</strong> ${pickupAddress}</p>
        <p><strong>Drop-off:</strong> ${dropoffAddress}</p>
        <p><strong>Date:</strong> ${date}</p>
        <p><strong>Time:</strong> ${time}</p>
        ${
          returnRequired === "yes"
            ? `
        <p><strong>Return Required:</strong> Yes</p>
        <p><strong>Return Date:</strong> ${returnDate || "Not specified"}</p>
        <p><strong>Return Time:</strong> ${returnTime || "Not specified"}</p>
        `
            : ""
        }

        <h3>Passenger Details</h3>
        <p><strong>Passengers:</strong> ${passengers}</p>
        <p><strong>Wheelchair Users:</strong> ${wheelchairUsers || "0"}</p>
        ${
          specialRequirements
            ? `<p><strong>Special Requirements:</strong> ${specialRequirements}</p>`
            : ""
        }

        <h3>Contact Details</h3>
        <p><strong>Name:</strong> ${name}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Phone:</strong> ${phone}</p>
        ${
          additionalNotes
            ? `<p><strong>Additional Notes:</strong> ${additionalNotes}</p>`
            : ""
        }
      `,
    });

    // Send confirmation email to customer
    await resend.emails.send({
      from: "AFJ Limited <noreply@afjltd.co.uk>",
      to: [email],
      subject: "Booking Request Received - AFJ Limited",
      html: `
        <h2>Thank you for your booking request, ${name}!</h2>

        <p>We have received your booking request and will be in touch within 2 hours during business hours to confirm availability and provide you with a quote.</p>

        <h3>Your Booking Summary</h3>
        <p><strong>Service:</strong> ${serviceType}</p>
        <p><strong>From:</strong> ${pickupAddress}</p>
        <p><strong>To:</strong> ${dropoffAddress}</p>
        <p><strong>Date:</strong> ${date}</p>
        <p><strong>Time:</strong> ${time}</p>
        <p><strong>Passengers:</strong> ${passengers}</p>

        <p>If you need to make any changes or have urgent queries, please call us on <strong>0121 123 4567</strong>.</p>

        <br>
        <p>Best regards,</p>
        <p>The AFJ Limited Bookings Team</p>
      `,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Booking form error:", error);
    return NextResponse.json(
      { error: "Failed to submit booking" },
      { status: 500 }
    );
  }
}
