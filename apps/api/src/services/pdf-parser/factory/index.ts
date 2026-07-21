import { PdfParserService } from "../implementation";

export function createPdfParserService(): PdfParserService {
  return new PdfParserService();
}
