import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

export type NumberPlacement = "bottom-outer" | "bottom-center" | "top-outer";

export async function addPageNumbers(
  fileBuffer: ArrayBuffer,
  options: {
    startPageIndex: number;
    placement: NumberPlacement;
    fontSize?: number;
  }
): Promise<Uint8Array> {
  const { startPageIndex, placement, fontSize = 10 } = options;
  const doc = await PDFDocument.load(fileBuffer);
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const pages = doc.getPages();
  const textColor = rgb(0.15, 0.15, 0.15);

  for (let i = 0; i < pages.length; i++) {
    if (i < startPageIndex) continue;
    const pageNumber = i - startPageIndex + 1;
    const isOdd = pageNumber % 2 !== 0;
    const page = pages[i];
    const { width, height } = page.getSize();
    const hInset = Math.max(36, width * 0.07);
    const vInset = 28;
    const numStr = String(pageNumber);
    const textWidth = font.widthOfTextAtSize(numStr, fontSize);

    let x: number;
    let y: number;

    if (placement === "bottom-outer") {
      y = vInset;
      x = isOdd ? width - hInset - textWidth : hInset;
    } else if (placement === "bottom-center") {
      y = vInset;
      x = (width - textWidth) / 2;
    } else {
      // top-outer
      y = height - vInset;
      x = isOdd ? width - hInset - textWidth : hInset;
    }

    page.drawText(numStr, { x, y, size: fontSize, font, color: textColor });
  }

  return doc.save();
}
