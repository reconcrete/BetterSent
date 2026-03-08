import { InlineKeyboard } from "grammy";

export function buildExtractionTypeKeyboard(): InlineKeyboard {
  return new InlineKeyboard()
    .text("🔗 URL", "extract_type:url")
    .text("📝 Text", "extract_type:text")
    .text("📄 File", "extract_type:file");
}

export function buildConfirmKeyboard(prefix: string): InlineKeyboard {
  return new InlineKeyboard()
    .text("✅ Yes", `${prefix}:yes`)
    .text("❌ No", `${prefix}:no`);
}
