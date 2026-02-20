"use client";

import { useEffect, useRef, useMemo } from "react";
import { useMap } from "@/components/map/map";
import { MapboxOverlay } from "@deck.gl/mapbox";
import { GeoJsonLayer } from "@deck.gl/layers";

export interface LegacyLayersProps {
    activeLayers: Record<string, boolean>;
    colorBlindMode?: boolean;
    showFills?: boolean;
    layerOpacity?: number;
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
        // Colorblind safe palette (Okabe-Ito inspired)
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
    layerOpacity = 0.8
}: LegacyLayersProps) {
    const { map, isLoaded } = useMap();
    const overlayRef = useRef<MapboxOverlay | null>(null);

    // Initialize MapboxOverlay once when map is loaded
    useEffect(() => {
        if (!map || !isLoaded) return;

        if (!overlayRef.current) {
            const overlay = new MapboxOverlay({
                interleaved: false, // Prevents Z-fighting and opacity bleed
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

        const deckLayers = Object.entries(activeLayers)
            .filter(([_, isVisible]) => isVisible)
            .map(([filename]) => {
                const color = colorFromStr(filename, colorBlindMode);
                const safeOpac = Math.max(0, Math.min(1, layerOpacity));

                return new GeoJsonLayer({
                    id: `geojson-${filename}`,
                    data: `/data/${filename}`,

                    // Style config
                    filled: showFills,
                    opacity: safeOpac,
                    stroked: true,
                    extruded: false,

                    // Points styling
                    pointType: 'circle',
                    pointRadiusScale: 5,
                    getPointRadius: 20,
                    pointRadiusMinPixels: 6,

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
                        if (info.object) {
                            console.log("Clicked GeoJSON Object:", info.object);
                        }
                    }
                });
            });

        // Push new layers configuration to the existing overlay
        overlayRef.current.setProps({ layers: deckLayers });

    }, [map, isLoaded, activeLayers, colorBlindMode, showFills, layerOpacity]);

    return null;
}
