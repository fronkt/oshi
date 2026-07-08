/** The v0 reaction set (shared server/client). Stickers arrive in Phase 3. */
export const REACTION_EMOJI = ["❤️", "🔥", "😭", "👀", "✨", "💯"] as const;
export type ReactionEmoji = (typeof REACTION_EMOJI)[number];
