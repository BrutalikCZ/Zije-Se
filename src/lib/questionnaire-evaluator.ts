/**
 * Maps each question index (0-based) to a tile score property and rule type.
 *   positive  – tile gets +1 match if tile[category] > threshold
 *   blacklist – tile is excluded if tile[category] > threshold when answer is true
 */
export const QUESTION_CATEGORY_MAP: Record<number, {
    category: string;
    type: 'positive' | 'blacklist';
    threshold?: number;
}> = {
    0:  { category: 'otherScore',       type: 'positive' },
    1:  { category: 'otherScore',       type: 'blacklist' }, // záplavy -> proxy
    2:  { category: 'stopsScore',       type: 'positive', threshold: 1 },
    3:  { category: 'healthcareScore',  type: 'positive' },
    4:  { category: 'educationScore',   type: 'positive' },
    5:  { category: 'otherScore',       type: 'blacklist' }, // hluk -> proxy
    6:  { category: 'industry',          type: 'blacklist' }, // průmyslové zóny - boolean tile property
    7:  { category: 'transportScore',   type: 'positive' },
    8:  { category: 'transportScore',   type: 'positive' },
    9:  { category: 'otherScore',       type: 'blacklist' }, // ovzduší -> proxy
    10: { category: 'otherScore',       type: 'positive' },
    11: { category: 'healthcareScore',  type: 'positive' },
    12: { category: 'cultureScore',     type: 'positive' },
    13: { category: 'airport',          type: 'positive' }, // letiště - boolean, radius ~15 dlaždic v DB
    14: { category: 'cultureScore',     type: 'positive' },
    15: { category: 'otherScore',       type: 'positive' },
    16: { category: 'otherScore',       type: 'positive' },
    17: { category: 'healthcareScore',  type: 'positive' },
    18: { category: 'otherScore',       type: 'blacklist' }, // vedra -> proxy
    19: { category: 'cultureScore',     type: 'positive' },
    20: { category: 'otherScore',       type: 'positive' },
    21: { category: 'otherScore',       type: 'positive' },
    22: { category: 'otherScore',       type: 'positive' },
    23: { category: 'cultureScore',     type: 'positive' },
    24: { category: 'cultureScore',     type: 'positive' },
    25: { category: 'otherScore',       type: 'positive' },
    26: { category: 'otherScore',       type: 'positive' },
    27: { category: 'otherScore',       type: 'positive' },
    28: { category: 'otherScore',       type: 'positive' },
    29: { category: 'otherScore',       type: 'positive' },
    30: { category: 'educationScore',   type: 'positive' },
    31: { category: 'otherScore',       type: 'blacklist' }, // větrná eroze -> proxy
    32: { category: 'cultureScore',     type: 'positive' },
    33: { category: 'otherScore',       type: 'positive' },
    34: { category: 'cultureScore',     type: 'positive' },
    35: { category: 'otherScore',       type: 'positive' },
    36: { category: 'cultureScore',     type: 'positive' },
    37: { category: 'cultureScore',     type: 'positive' },
    38: { category: 'cultureScore',     type: 'positive' },
    39: { category: 'healthcareScore',  type: 'positive' },
    40: { category: 'healthcareScore',  type: 'positive' },
    41: { category: 'cultureScore',     type: 'positive' },
    42: { category: 'otherScore',       type: 'positive' },
    43: { category: 'otherScore',       type: 'positive' },
    44: { category: 'healthcareScore',  type: 'positive' },
    45: { category: 'cultureScore',     type: 'positive' },
    46: { category: 'otherScore',       type: 'positive' },
    47: { category: 'otherScore',       type: 'positive' },
    48: { category: 'otherScore',       type: 'positive' },
    49: { category: 'otherScore',       type: 'positive' },
};

/**
 * Evaluates questionnaire answers against a tiles FeatureCollection.
 * Returns a new FeatureCollection with `matchPercent` written into each tile's properties.
 *   - Blacklisted tiles get matchPercent = 0
 *   - Other tiles get matchPercent = (positiveMatches / totalPositiveYes) * 100
 */
export function evaluateAnswers(
    answers: Record<number, boolean>,
    tilesData: GeoJSON.FeatureCollection
): GeoJSON.FeatureCollection {
    const positiveQuestions = Object.entries(answers).filter(([index, answer]) => {
        const mapped = QUESTION_CATEGORY_MAP[parseInt(index, 10)];
        return answer === true && mapped && mapped.type === 'positive';
    });

    const totalPositiveYes = positiveQuestions.length;

    const processedFeatures = tilesData.features.map(feature => {
        const props = feature.properties || {};

        // Blacklist check: answer===true + type==='blacklist' + tile score > threshold
        for (const [indexStr, answer] of Object.entries(answers)) {
            if (answer === true) {
                const mapped = QUESTION_CATEGORY_MAP[parseInt(indexStr, 10)];
                if (mapped && mapped.type === 'blacklist') {
                    const val = props[mapped.category];
                    const threshold = mapped.threshold ?? 0;
                    const isBlacklisted =
                        (typeof val === 'boolean' && val === true) ||
                        (typeof val === 'number' && val > threshold);
                    if (isBlacklisted) {
                        return { ...feature, properties: { ...props, matchPercent: 0 } };
                    }
                }
            }
        }

        // Positive score
        let matchCount = 0;
        if (totalPositiveYes > 0) {
            for (const [indexStr] of positiveQuestions) {
                const mapped = QUESTION_CATEGORY_MAP[parseInt(indexStr, 10)];
                if (mapped) {
                    const score = props[mapped.category];
                    const threshold = mapped.threshold ?? 0;
                    const matches =
                        (typeof score === 'boolean' && score === true) ||
                        (typeof score === 'number' && score > threshold);
                    if (matches) matchCount++;
                }
            }
        }

        const matchPercent = totalPositiveYes > 0 ? (matchCount / totalPositiveYes) * 100 : 0;
        return { ...feature, properties: { ...props, matchPercent } };
    });

    return { type: 'FeatureCollection', features: processedFeatures };
}
