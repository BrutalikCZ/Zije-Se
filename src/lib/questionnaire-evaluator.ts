/**
 * Maps each question index (0-based) to a tile score property and rule type.
 *   positive  – tile gets +1 match if tile[category] > threshold
 *   blacklist – tile is excluded (matchPercent = 0) if tile[category] > threshold when answer is true
 *   negative  – tile gets -1 penalty if tile[category] > threshold, but is NOT excluded
 *
 * threshold     – raw comparison value (e.g. 1 for stopsScore integer counts)
 * percentThreshold – whole-number percentage (e.g. 30 means score > 0.30 for 0–1 normalized scores)
 *                    takes priority over threshold when set
 */
export const QUESTION_CATEGORY_MAP: Record<number, {
    category: string;
    type: 'positive' | 'blacklist' | 'negative';
    threshold?: number;
    percentThreshold?: number;
}> = {
    0: { category: 'transportScore', type: 'positive', percentThreshold: 60 },
    1: { category: 'flods', type: 'blacklist' }, // záplavy -> proxy
    2: { category: 'stopsScore', type: 'positive' },
    3: { category: 'healthcareScore', type: 'positive' },
    4: { category: 'educationScore', type: 'positive' },
    5: { category: 'agro', type: 'positive' }, // hluk - vysoká doprava = hluk
    6: { category: 'industry', type: 'blacklist' }, // průmyslové zóny - boolean tile property
    7: { category: 'cultureScore', type: 'positive', percentThreshold: 30 },
    8: { category: 'transportScore', type: 'positive', percentThreshold: 60 },
    9: { category: 'transportScore', type: 'negative', percentThreshold: 50 }, // ovzduší -> proxy
    10: { category: 'cultureScore', type: 'positive', percentThreshold: 80 },
    11: { category: 'healthcareScore', type: 'positive', percentThreshold: 20 },
    12: { category: 'educationScore', type: 'positive', percentThreshold: 40 },
    13: { category: 'airport', type: 'positive' }, // letiště - boolean, radius ~15 dlaždic v DB
    14: { category: 'castles', type: 'positive' }, // hrady/zámky - boolean
    15: { category: 'industry', type: 'positive', percentThreshold: 20 }, // průmyslové zóny - boolean
    16: { category: 'cultureScore', type: 'positive', percentThreshold: 50 },
    17: { category: 'healthcareScore', type: 'positive' },
    18: { category: 'natureScore', type: 'negative' }, // vedra -> proxy
    19: { category: 'healthcareScore', type: 'positive' },
    20: { category: 'castles', type: 'positive' }, // boolean
    21: { category: 'natureScore', type: 'positive', percentThreshold: 80 },
    22: { category: 'otherScore', type: 'positive', percentThreshold: 80 },
    23: { category: 'livePerformances', type: 'positive' }, // boolean
    24: { category: 'otherScore', type: 'positive' },
    25: { category: 'healthcareScore', type: 'positive', percentThreshold: 20 },
    26: { category: 'educationScore', type: 'positive', percentThreshold: 20 },
    27: { category: 'cultureScore', type: 'positive' },
    28: { category: 'transportScore', type: 'negative', percentThreshold: 70 }, // boolean
    29: { category: 'otherScore', type: 'positive' },
    30: { category: 'educationScore', type: 'positive' },
    31: { category: 'natureScore', type: 'negative', percentThreshold: 10 }, // větrná eroze -> proxy
    32: { category: 'cultureScore', type: 'positive' },
    33: { category: 'otherScore', type: 'positive' },
    34: { category: 'transportScore', type: 'positive' },
    35: { category: 'otherScore', type: 'positive', percentThreshold: 70 },
    36: { category: 'castles', type: 'positive' },
    37: { category: 'livePerformances', type: 'positive' }, // boolean
    38: { category: 'cultureScore', type: 'positive' },
    39: { category: 'otherScore', type: 'positive' },
    40: { category: 'cultureScore', type: 'positive' },
    41: { category: 'otherScore', type: 'positive' },
    42: { category: 'cultureScore', type: 'positive', percentThreshold: 90 },
    43: { category: 'otherScore', type: 'positive', percentThreshold: 90 }, // boolean
    44: { category: 'otherScore', type: 'positive' },
    45: { category: 'agro', type: 'positive' },
    46: { category: 'otherScore', type: 'positive' },
    47: { category: 'otherScore', type: 'positive' },
    48: { category: 'otherScore', type: 'positive' },
    49: { category: 'otherScore', type: 'positive' },
};

/**
 * Evaluates questionnaire answers against a tiles FeatureCollection.
 * Returns a new FeatureCollection with `matchPercent` written into each tile's properties.
 *   - Blacklisted tiles get matchPercent = 0
 *   - Other tiles get matchPercent = clamp(0, (positiveMatches - negativeMatches) / totalPositiveYes * 100, 100)
 */
export function evaluateAnswers(
    answers: Record<number, boolean>,
    tilesData: GeoJSON.FeatureCollection
): GeoJSON.FeatureCollection {
    const positiveQuestions = Object.entries(answers).filter(([index, answer]) => {
        const mapped = QUESTION_CATEGORY_MAP[parseInt(index, 10)];
        return answer === true && mapped && mapped.type === 'positive';
    });

    const negativeQuestions = Object.entries(answers).filter(([index, answer]) => {
        const mapped = QUESTION_CATEGORY_MAP[parseInt(index, 10)];
        return answer === true && mapped && mapped.type === 'negative';
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
                    const threshold = mapped.percentThreshold !== undefined
                        ? mapped.percentThreshold / 100
                        : (mapped.threshold ?? 0);
                    const isBlacklisted =
                        (typeof val === 'boolean' && val === true) ||
                        (typeof val === 'number' && val > threshold);
                    if (isBlacklisted) {
                        return null;
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
                    const threshold = mapped.percentThreshold !== undefined
                        ? mapped.percentThreshold / 100
                        : (mapped.threshold ?? 0);
                    const matches =
                        (typeof score === 'boolean' && score === true) ||
                        (typeof score === 'number' && score > threshold);
                    if (matches) matchCount++;
                }
            }
        }

        // Negative score: penalise tiles that match a negative question
        for (const [indexStr] of negativeQuestions) {
            const mapped = QUESTION_CATEGORY_MAP[parseInt(indexStr, 10)];
            if (mapped) {
                const score = props[mapped.category];
                const threshold = mapped.percentThreshold !== undefined
                    ? mapped.percentThreshold / 100
                    : (mapped.threshold ?? 0);
                const matches =
                    (typeof score === 'boolean' && score === true) ||
                    (typeof score === 'number' && score > threshold);
                if (matches) matchCount--;
            }
        }

        const rawPercent = totalPositiveYes > 0 ? (matchCount / totalPositiveYes) * 100 : 100;
        const matchPercent = Math.max(0, Math.min(100, rawPercent));
        return { ...feature, properties: { ...props, matchPercent } };
    });

    return { type: 'FeatureCollection', features: processedFeatures.filter(f => f !== null) };
}
