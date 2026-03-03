export const ALL_REGIONS = [
    { id: 'praha', label: 'Hlavní město Praha' },
    { id: 'stredocesky', label: 'Středočeský kraj' },
    { id: 'jihocesky', label: 'Jihočeský kraj' },
    { id: 'plzensky', label: 'Plzeňský kraj' },
    { id: 'karlovarsky', label: 'Karlovarský kraj' },
    { id: 'ustecky', label: 'Ústecký kraj' },
    { id: 'liberecky', label: 'Liberecký kraj' },
    { id: 'kralovehradecky', label: 'Královéhradecký kraj' },
    { id: 'pardubicky', label: 'Pardubický kraj' },
    { id: 'kraj_vysocina', label: 'Kraj Vysočina' },
    { id: 'jihomoravsky', label: 'Jihomoravský kraj' },
    { id: 'olomoucky', label: 'Olomoucký kraj' },
    { id: 'zlinsky', label: 'Zlínský kraj' },
    { id: 'moravskoslezsky', label: 'Moravskoslezský kraj' },
];

export const ALL_CATEGORIES = [
    { id: 'administrativni_cleneni', label: 'Administrativní členění' },
    { id: 'doprava', label: 'Doprava' },
    { id: 'mapa', label: 'Mapa' },
    { id: 'odpady', label: 'Odpady' },
    { id: 'rekreace', label: 'Rekreace' },
    { id: 'socioekonomicke_jevy', label: 'Socioekonomické jevy' },
    { id: 'trh_prace', label: 'Trh práce' },
    { id: 'voda_a_priroda', label: 'Voda a příroda' },
    { id: 'volny_cas_a_kultura', label: 'Volný čas a kultura' },
    { id: 'vzdelavani', label: 'Vzdělávání' },
    { id: 'zdravotnictvi', label: 'Zdravotnictví' },
];

export const getRegionLabel = (id: string) => ALL_REGIONS.find(r => r.id === id)?.label || id;
export const getCategoryLabel = (id: string) => ALL_CATEGORIES.find(c => c.id === id)?.label || id;
