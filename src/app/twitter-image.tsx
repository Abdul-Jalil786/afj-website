import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "AFJ Limited - Birmingham SEND & Patient Transport";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          width: "100%",
          height: "100%",
          backgroundColor: "#001c34",
          padding: "60px",
          position: "relative",
        }}
      >
        {/* Green accent bar at top */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: "8px",
            backgroundColor: "#00a85b",
          }}
        />

        {/* Green accent bar at bottom */}
        <div
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            height: "8px",
            backgroundColor: "#00a85b",
          }}
        />

        {/* Company name */}
        <div
          style={{
            display: "flex",
            fontSize: "72px",
            fontWeight: 700,
            color: "#ffffff",
            marginBottom: "24px",
            letterSpacing: "-1px",
          }}
        >
          AFJ Limited
        </div>

        {/* Divider */}
        <div
          style={{
            width: "120px",
            height: "4px",
            backgroundColor: "#00a85b",
            marginBottom: "32px",
            borderRadius: "2px",
          }}
        />

        {/* Tagline */}
        <div
          style={{
            display: "flex",
            fontSize: "28px",
            color: "#ffffff",
            opacity: 0.9,
            textAlign: "center",
            maxWidth: "800px",
            lineHeight: 1.4,
          }}
        >
          Birmingham&apos;s Trusted SEND &amp; Patient Transport Provider
        </div>

        {/* Website URL */}
        <div
          style={{
            display: "flex",
            fontSize: "18px",
            color: "#00a85b",
            marginTop: "40px",
            fontWeight: 600,
          }}
        >
          afjltd.co.uk
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
