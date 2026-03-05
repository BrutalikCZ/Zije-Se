"use client";

import { useEffect, useId, useRef } from "react";
import { useMap } from "./map";

export type MapCircleLayerProps = {
    id?: string;
    data: GeoJSON.FeatureCollection;
    color?: string;
    radius?: number;
    opacity?: number;
    outlineColor?: string;
    autoFlyTo?: boolean;
};

export function MapCircleLayer({
    id: propId,
    data,
    color = "#ff6b35",
    radius = 8,
    opacity = 0.85,
    outlineColor = "#ffffff",
    autoFlyTo = false,
}: MapCircleLayerProps) {
    const { map, isLoaded } = useMap();
    const autoId = useId();
    const id = propId ?? autoId;
    const sourceId = `circle-source-${id}`;
    const layerId = `circle-layer-${id}`;
    const didFly = useRef(false);

    useEffect(() => {
        if (!isLoaded || !map) return;

        try {
            map.addSource(sourceId, { type: "geojson", data: data as any });
            map.addLayer({
                id: layerId,
                type: "circle",
                source: sourceId,
                paint: {
                    "circle-color": color,
                    "circle-radius": radius,
                    "circle-opacity": opacity,
                    "circle-stroke-width": 2,
                    "circle-stroke-color": outlineColor,
                },
            });

            if (autoFlyTo && !didFly.current && data.features.length > 0) {
                didFly.current = true;
                let minLng = Infinity, minLat = Infinity, maxLng = -Infinity, maxLat = -Infinity;
                for (const f of data.features) {
                    const geom = f.geometry as any;
                    if (geom?.type === 'Point') {
                        const [lng, lat] = geom.coordinates;
                        minLng = Math.min(minLng, lng);
                        minLat = Math.min(minLat, lat);
                        maxLng = Math.max(maxLng, lng);
                        maxLat = Math.max(maxLat, lat);
                    }
                }
                if (isFinite(minLng)) {
                    const padded: [number, number, number, number] = [
                        minLng - 0.02, minLat - 0.02, maxLng + 0.02, maxLat + 0.02,
                    ];
                    map.fitBounds([padded[0], padded[1], padded[2], padded[3]] as any, {
                        padding: 80,
                        maxZoom: 15,
                        duration: 1000,
                    });
                }
            }
        } catch (e) {
            console.warn("[MapCircleLayer] Error adding layer:", e);
        }

        return () => {
            try {
                if (map.getLayer(layerId)) map.removeLayer(layerId);
                if (map.getSource(sourceId)) map.removeSource(sourceId);
            } catch { }
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isLoaded, map, sourceId, layerId]);

    // Update source data when data prop changes
    useEffect(() => {
        if (!isLoaded || !map) return;
        const source = map.getSource(sourceId) as any;
        if (source?.setData) source.setData(data);
    }, [isLoaded, map, data, sourceId]);

    return null;
}
