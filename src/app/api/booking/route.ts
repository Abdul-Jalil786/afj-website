import { NextRequest, NextResponse } from "next/server";
import { escapeHtml } from "@/lib/utils";

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

    // If Resend API key is not configured, log without PII and return success
    if (!process.env.RESEND_API_KEY) {
      console.log("Booking form submission received (Resend not configured)");
      return NextResponse.json({ success: true });
    }

    // Escape all user inputs for HTML email
    const safeServiceType = escapeHtml(serviceType || "");
    const safePickupAddress = escapeHtml(pickupAddress);
    const safeDropoffAddress = escapeHtml(dropoffAddress);
    const safeDate = escapeHtml(date || "");
    const safeTime = escapeHtml(time || "");
    const safeReturnDate = returnDate ? escapeHtml(returnDate) : "Not specified";
    const safeReturnTime = returnTime ? escapeHtml(returnTime) : "Not specified";
    const safePassengers = escapeHtml(String(passengers || ""));
    const safeWheelchairUsers = escapeHtml(String(wheelchairUsers || "0"));
    const safeSpecialRequirements = specialRequirements ? escapeHtml(specialRequirements) : "";
    const safeName = escapeHtml(name);
    const safeEmail = escapeHtml(email);
    const safePhone = escapeHtml(phone);
    const safeAdditionalNotes = additionalNotes ? escapeHtml(additionalNotes) : "";

    // Dynamically import Resend only when API key is available
    const { Resend } = await import("resend");
    const resend = new Resend(process.env.RESEND_API_KEY);

    // Send email notification to bookings team
    await resend.emails.send({
      from: "AFJ Website <noreply@afjltd.co.uk>",
      to: ["bookings@afjltd.co.uk"],
      replyTo: email,
      subject: `New Booking Request - ${safeServiceType} - ${safeName}`,
      html: `
        <h2>New Booking Request</h2>

        <h3>Service Details</h3>
        <p><strong>Service Type:</strong> ${safeServiceType}</p>

        <h3>Journey Details</h3>
        <p><strong>Pickup:</strong> ${safePickupAddress}</p>
        <p><strong>Drop-off:</strong> ${safeDropoffAddress}</p>
        <p><strong>Date:</strong> ${safeDate}</p>
        <p><strong>Time:</strong> ${safeTime}</p>
        ${
          returnRequired === "yes"
            ? `
        <p><strong>Return Required:</strong> Yes</p>
        <p><strong>Return Date:</strong> ${safeReturnDate}</p>
        <p><strong>Return Time:</strong> ${safeReturnTime}</p>
        `
            : ""
        }

        <h3>Passenger Details</h3>
        <p><strong>Passengers:</strong> ${safePassengers}</p>
        <p><strong>Wheelchair Users:</strong> ${safeWheelchairUsers}</p>
        ${
          safeSpecialRequirements
            ? `<p><strong>Special Requirements:</strong> ${safeSpecialRequirements}</p>`
            : ""
        }

        <h3>Contact Details</h3>
        <p><strong>Name:</strong> ${safeName}</p>
        <p><strong>Email:</strong> ${safeEmail}</p>
        <p><strong>Phone:</strong> ${safePhone}</p>
        ${
          safeAdditionalNotes
            ? `<p><strong>Additional Notes:</strong> ${safeAdditionalNotes}</p>`
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
        <h2>Thank you for your booking request, ${safeName}!</h2>

        <p>We have received your booking request and will be in touch within 2 hours during business hours to confirm availability and provide you with a quote.</p>

        <h3>Your Booking Summary</h3>
        <p><strong>Service:</strong> ${safeServiceType}</p>
        <p><strong>From:</strong> ${safePickupAddress}</p>
        <p><strong>To:</strong> ${safeDropoffAddress}</p>
        <p><strong>Date:</strong> ${safeDate}</p>
        <p><strong>Time:</strong> ${safeTime}</p>
        <p><strong>Passengers:</strong> ${safePassengers}</p>

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
