"use client";

import { useEffect, useRef, useState } from "react";
import { useMap } from "@/components/map/map";
import { MapboxOverlay } from "@deck.gl/mapbox";
import { GeoJsonLayer } from "@deck.gl/layers";

export interface LegacyLayersProps {
    activeLayers: Record<string, boolean>;
    colorBlindMode?: boolean;
    showFills?: boolean;
    layerOpacity?: number;
    pointSize?: number;
}

// Generate deterministic colors
const hashCode = (str: string) => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash);
    return hash;
};

const colorFromStr = (str: string, cbMode: boolean): [number, number, number] => {
    const h = Math.abs(hashCode(str));
    if (cbMode) {
        const palette = [
            [230, 159, 0], [86, 180, 233], [0, 158, 115],
            [240, 228, 66], [0, 114, 178], [213, 94, 0], [204, 121, 167]
        ];
        return palette[h % palette.length] as [number, number, number];
    } else {
        return [(h % 200) + 55, ((h >> 8) % 200) + 55, ((h >> 16) % 200) + 55];
    }
};

export function LegacyLayers({
    activeLayers,
    colorBlindMode = false,
    showFills = true,
    layerOpacity = 0.8,
    pointSize = 8,
}: LegacyLayersProps) {
    const { map, isLoaded } = useMap();
    const overlayRef = useRef<MapboxOverlay | null>(null);
    const [zoom, setZoom] = useState(6.5);

    // Track zoom level
    useEffect(() => {
        if (!map || !isLoaded) return;
        const onZoom = () => setZoom(map.getZoom());
        map.on('zoom', onZoom);
        setZoom(map.getZoom());
        return () => { map.off('zoom', onZoom); };
    }, [map, isLoaded]);

    // Initialize MapboxOverlay once when map is loaded
    useEffect(() => {
        if (!map || !isLoaded) return;

        if (!overlayRef.current) {
            const overlay = new MapboxOverlay({
                interleaved: false,
                layers: []
            });
            map.addControl(overlay as any);
            overlayRef.current = overlay;
        }

        return () => {
            if (overlayRef.current && map) {
                map.removeControl(overlayRef.current as any);
                overlayRef.current = null;
            }
        };
    }, [map, isLoaded]);

    // Update Deck.GL layers whenever state/props change
    useEffect(() => {
        if (!overlayRef.current || !isLoaded || !map) return;

        // Bigger when zoomed out, smaller when zoomed in
        const factor = Math.max(0.2, 1 + (10 - zoom) * 0.1);
        const radius = Math.round(pointSize * factor);

        const deckLayers = Object.entries(activeLayers)
            .filter(([_, isVisible]) => isVisible)
            .map(([filename]) => {
                const color = colorFromStr(filename, colorBlindMode);
                const safeOpac = Math.max(0, Math.min(1, layerOpacity));

                // WFS layer: key format is wfs::{encodedServiceUrl}::{typeName}
                let dataUrl: string;
                let layerId: string;
                if (filename.startsWith('wfs::')) {
                    const withoutPrefix = filename.slice(5);
                    const sep = withoutPrefix.indexOf('::');
                    if (sep !== -1) {
                        const serviceUrl = decodeURIComponent(withoutPrefix.slice(0, sep));
                        const typeName = withoutPrefix.slice(sep + 2);
                        dataUrl = `/api/wfs?url=${encodeURIComponent(serviceUrl)}&request=GetFeature&typeName=${encodeURIComponent(typeName)}`;
                    } else {
                        return null;
                    }
                    layerId = `wfs-${filename}`;
                } else {
                    // Encode the URI but keep the slashes
                    const encodedPath = filename.split('/').map(segment => encodeURIComponent(segment)).join('/');
                    dataUrl = `/data/${encodedPath.split('?')[0]}`;
                    layerId = `geojson-${filename}`;
                }

                return new GeoJsonLayer({
                    id: layerId,
                    data: dataUrl,

                    // Style config
                    filled: showFills,
                    opacity: safeOpac,
                    stroked: true,
                    extruded: false,

                    // Points styling — zoom-responsive pixel radius
                    pointType: 'circle',
                    pointRadiusUnits: 'pixels',
                    getPointRadius: radius,
                    pointRadiusMinPixels: 4,
                    pointRadiusMaxPixels: 5,

                    // Polygons & Lines styling
                    getFillColor: [...color, showFills ? 180 : 0],
                    getLineColor: [...color, 255],
                    getLineWidth: 2,
                    lineWidthMinPixels: 2,

                    // Interactivity
                    pickable: true,
                    autoHighlight: true,
                    highlightColor: [255, 255, 255, 128],

                    onClick: (info) => {
                        if (info.object && overlayRef.current) {
                            try {
                                const deck = (overlayRef.current as any)._deck;
                                if (deck && info.x !== undefined && info.y !== undefined) {
                                    const picked = deck.pickMultipleObjects({ x: info.x, y: info.y, radius: 2 });
                                    if (picked && picked.length > 0) {
                                        window.dispatchEvent(new CustomEvent('dataset-features-clicked', { detail: { features: picked } }));
                                    }
                                } else {
                                    window.dispatchEvent(new CustomEvent('dataset-features-clicked', { detail: { features: [info] } }));
                                }
                            } catch (e) {
                                window.dispatchEvent(new CustomEvent('dataset-features-clicked', { detail: { features: [info] } }));
                            }
                        }
                    }
                });
            });

        overlayRef.current.setProps({ layers: deckLayers.filter(Boolean) });

    }, [map, isLoaded, activeLayers, colorBlindMode, showFills, layerOpacity, zoom, pointSize]);

    return null;
}
