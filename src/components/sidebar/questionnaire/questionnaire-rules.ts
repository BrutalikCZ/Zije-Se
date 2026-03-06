/**
 * Questionnaire evaluation rules.
 *
 * Each entry maps a question index (0-based) to a blacklist rule.
 * A tile is blacklisted when the user's answer for that question is `true`
 * AND the tile's property matches `blacklistWhenTileIs`.
 *
 * Format: { tileProperty: string; blacklistWhenTileIs: boolean }
 */
export interface BlacklistRule {
    tileProperty: string;
    blacklistWhenTileIs: boolean;
}

export const questionBlacklist: Record<number, BlacklistRule> = {
    // Q7 (index 6): "Je pro vás klíčové, aby se ve vašem okolí nenacházely velké průmyslové zóny?"
    // Blacklist tiles where industry === true
    6: { tileProperty: 'industry', blacklistWhenTileIs: true },
};
