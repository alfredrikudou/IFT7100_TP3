/** Aligné sur le sélecteur du modal « Vendre » et sur uint8 iconId du contrat (0–9). */
export const FRUIT_EMOJIS = [
  "🍎",
  "🍐",
  "🍊",
  "🍋",
  "🍇",
  "🍉",
  "🍓",
  "🥝",
  "🥭",
  "🍑",
] as const;

export function emojiFromIconId(iconId: number): string {
  if (!Number.isFinite(iconId) || iconId < 0 || iconId >= FRUIT_EMOJIS.length) return "📦";
  return FRUIT_EMOJIS[iconId];
}
