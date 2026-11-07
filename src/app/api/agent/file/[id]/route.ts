import { NextResponse } from "next/server";
import fs from "node:fs";
import path from "node:path";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { verifyAgentAuth } from "@/lib/agentAuth";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!verifyAgentAuth(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const safeId = id.replace(/[^A-Za-z0-9-]/g, "");

  // Check if file is stored locally on disk
  const possiblePaths = [
    path.join(process.cwd(), "data", "uploads", `${safeId}.pdf`),
    path.join(process.cwd(), "tmp", `${safeId}.pdf`),
    path.join(process.env.TEMP || "C:\\temp", "printkarr-uploads", `${safeId}.pdf`),
  ];

  for (const p of possiblePaths) {
    if (fs.existsSync(p)) {
      const buffer = fs.readFileSync(p);
      return new Response(buffer, {
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": `inline; filename="${safeId}.pdf"`,
        },
      });
    }
  }

  // Fallback: Generate a clean, printable PDF sheet with pdf-lib
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([595.28, 841.89]); // A4
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);

  page.drawText("PrintKarr Dark-Store Automated Dispatch", {
    x: 50,
    y: 800,
    size: 16,
    font: fontBold,
    color: rgb(0.05, 0.51, 0.12),
  });

  page.drawText(`Order ID: ${safeId}`, {
    x: 50,
    y: 770,
    size: 13,
    font: fontBold,
    color: rgb(0.1, 0.1, 0.1),
  });

  page.drawText(`Printed on: ${new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })} IST`, {
    x: 50,
    y: 745,
    size: 10,
    font: fontRegular,
    color: rgb(0.4, 0.4, 0.4),
  });

  page.drawLine({
    start: { x: 50, y: 730 },
    end: { x: 545, y: 730 },
    thickness: 1,
    color: rgb(0.8, 0.8, 0.8),
  });

  page.drawText("This order document was processed for automated printer spooling.", {
    x: 50,
    y: 700,
    size: 11,
    font: fontRegular,
    color: rgb(0.2, 0.2, 0.2),
  });

  const pdfBytes = await pdfDoc.save();
  return new Response(Buffer.from(pdfBytes), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${safeId}.pdf"`,
    },
  });
}
