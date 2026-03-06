export interface WfsService {
    id: string;
    name: string;
    url: string;
}

export const WFS_SERVICES: WfsService[] = [
    {
        id: 'zabaged-polohopis',
        name: 'ZABAGED® - polohopis',
        url: 'https://ags.cuzk.gov.cz/arcgis/services/ZABAGED_POLOHOPIS/MapServer/WFSServer',
    },
    {
        id: 'zabaged-vrstevnice',
        name: 'ZABAGED® - vrstevnice',
        url: 'https://ags.cuzk.gov.cz/arcgis/services/ZABAGED_VRSTEVNICE/MapServer/MapServer/WFSServer',
    },
    {
        id: 'data50',
        name: 'Data50',
        url: 'https://ags.cuzk.gov.cz/arcgis/services/DATA50/MapServer/WFSServer',
    },
    {
        id: 'data250',
        name: 'Data250',
        url: 'https://ags.cuzk.gov.cz/arcgis/services/DATA250/MapServer/WFSServer',
    },
    {
        id: 'geonames',
        name: 'Geonames',
        url: 'https://ags.cuzk.gov.cz/arcgis/services/GEONAMES/Geonames/MapServer/WFSServer',
    },
    {
        id: 'bodova-pole',
        name: 'Bodová pole',
        url: 'https://ags.cuzk.gov.cz/arcgis/services/BodovaPole/MapServer/WFSServer',
    },
    {
        id: 'inspire-gn',
        name: 'INSPIRE - Zeměpisná jména (GN)',
        url: 'https://geoportal.cuzk.gov.cz/geoserver/gn/wfs',
    },
    {
        id: 'inspire-au',
        name: 'INSPIRE - Územní správní jednotky (AU)',
        url: 'https://services.cuzk.cz/wfs/inspire-au-wfs.asp',
    },
    {
        id: 'inspire-ad',
        name: 'INSPIRE - Adresy (AD)',
        url: 'https://services.cuzk.cz/wfs/inspire-ad-wfs.asp',
    },
    {
        id: 'inspire-cp',
        name: 'INSPIRE - Parcely (CP)',
        url: 'https://services.cuzk.cz/wfs/inspire-cp-wfs.asp',
    },
    {
        id: 'inspire-cpx',
        name: 'INSPIRE - Parcely národní rozšíření (CPX)',
        url: 'https://services.cuzk.cz/wfs/inspire-cpx-wfs.asp',
    },
    {
        id: 'inspire-tn-air',
        name: 'INSPIRE - Dopravní sítě - letecká doprava (TN_AIR)',
        url: 'https://geoportal.cuzk.gov.cz/geoserver/tn-a/wfs',
    },
    {
        id: 'inspire-tn-cable',
        name: 'INSPIRE - Dopravní sítě - lanová dráha (TN_CABLE)',
        url: 'https://geoportal.cuzk.gov.cz/geoserver/tn-c/wfs',
    },
    {
        id: 'inspire-tn-rail',
        name: 'INSPIRE - Dopravní sítě - železniční doprava (TN_RAIL)',
        url: 'https://geoportal.cuzk.gov.cz/geoserver/tn-ra/wfs',
    },
    {
        id: 'inspire-tn-road',
        name: 'INSPIRE - Dopravní sítě - silniční doprava (TN_ROAD)',
        url: 'https://geoportal.cuzk.gov.cz/geoserver/tn-ro/wfs',
    },
    {
        id: 'inspire-tn-water',
        name: 'INSPIRE - Dopravní sítě - vodní doprava (TN_WATER)',
        url: 'https://geoportal.cuzk.gov.cz/geoserver/tn-w/wfs',
    },
    {
        id: 'inspire-hy-p',
        name: 'INSPIRE - Vodstvo - fyzické vody (HY_P)',
        url: 'https://geoportal.cuzk.gov.cz/geoserver/hy-p/wfs',
    },
    {
        id: 'inspire-hy-net',
        name: 'INSPIRE - Vodstvo - sítě (HY_NET)',
        url: 'https://geoportal.cuzk.gov.cz/geoserver/hy-n/wfs',
    },
    {
        id: 'inspire-lu',
        name: 'INSPIRE - Využití území (LU)',
        url: 'https://geoportal.cuzk.gov.cz/geoserver/elu/wfs',
    },
    {
        id: 'inspire-el-tin',
        name: 'INSPIRE - Nadmořská výška - TIN (EL_TIN)',
        url: 'https://geoportal.cuzk.gov.cz/geoserver/el-tin/wfs',
    },
    {
        id: 'inspire-bu',
        name: 'INSPIRE - Budovy (BU)',
        url: 'https://services.cuzk.cz/wfs/inspire-bu-wfs.asp',
    },
    {
        id: 'zaplavova-uzemi',
        name: 'Záplavová území',
        url: 'https://ags2.vuv.cz/arcgis/services/isvs_voda/isvs_voda/MapServer/WFSServer',
    },
];

/** Build a stable layer key for a WFS feature type */
export function wfsLayerKey(serviceUrl: string, typeName: string): string {
    return `wfs::${encodeURIComponent(serviceUrl)}::${typeName}`;
}

/** Parse a WFS layer key back to its components */
export function parseWfsLayerKey(key: string): { serviceUrl: string; typeName: string } | null {
    if (!key.startsWith('wfs::')) return null;
    const withoutPrefix = key.slice(5); // remove 'wfs::'
    const sep = withoutPrefix.indexOf('::');
    if (sep === -1) return null;
    return {
        serviceUrl: decodeURIComponent(withoutPrefix.slice(0, sep)),
        typeName: withoutPrefix.slice(sep + 2),
    };
}
