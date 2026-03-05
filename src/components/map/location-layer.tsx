"use client";

import { useEffect, useId, useRef } from "react";
import { useMap } from "./map";

export type MapLocationLayerProps = {
    id?: string;
    data: GeoJSON.FeatureCollection;
    fillColor?: string;
    fillOpacity?: number;
    outlineColor?: string;
    outlineWidth?: number;
    autoFlyTo?: boolean;
};

function getBBoxFromFeatureCollection(fc: GeoJSON.FeatureCollection): [number, number, number, number] | null {
    let minLng = Infinity, minLat = Infinity, maxLng = -Infinity, maxLat = -Infinity;

    function processCoords(coords: any) {
        if (typeof coords[0] === 'number') {
            const [lng, lat] = coords as [number, number];
            minLng = Math.min(minLng, lng);
            minLat = Math.min(minLat, lat);
            maxLng = Math.max(maxLng, lng);
            maxLat = Math.max(maxLat, lat);
        } else {
            for (const c of coords) processCoords(c);
        }
    }

    for (const f of fc.features) {
        const geom = f.geometry as any;
        if (geom?.coordinates) processCoords(geom.coordinates);
    }

    return isFinite(minLng) ? [minLng, minLat, maxLng, maxLat] : null;
}

export function MapLocationLayer({
    id: propId,
    data,
    fillColor = "rgba(51, 136, 255, 0.15)",
    fillOpacity = 1,
    outlineColor = "#3388ff",
    outlineWidth = 2,
    autoFlyTo = true,
}: MapLocationLayerProps) {
    const { map, isLoaded } = useMap();
    const autoId = useId();
    const id = propId ?? autoId;
    const sourceId = `location-source-${id}`;
    const fillLayerId = `location-fill-${id}`;
    const outlineLayerId = `location-outline-${id}`;
    const didFly = useRef(false);

    useEffect(() => {
        if (!isLoaded || !map) return;

        try {
            map.addSource(sourceId, { type: "geojson", data: data as any });

            map.addLayer({
                id: fillLayerId,
                type: "fill",
                source: sourceId,
                paint: {
                    "fill-color": fillColor,
                    "fill-opacity": fillOpacity,
                },
            });

            map.addLayer({
                id: outlineLayerId,
                type: "line",
                source: sourceId,
                paint: {
                    "line-color": outlineColor,
                    "line-width": outlineWidth,
                    "line-opacity": 0.9,
                },
            });

            if (autoFlyTo && !didFly.current) {
                didFly.current = true;
                const bbox = getBBoxFromFeatureCollection(data);
                if (bbox) {
                    map.fitBounds([[bbox[0], bbox[1]], [bbox[2], bbox[3]]], {
                        padding: 60,
                        maxZoom: 14,
                        duration: 1200,
                    });
                }
            }
        } catch (e) {
            console.warn("[MapLocationLayer] Error adding layer:", e);
        }

        return () => {
            try {
                if (map.getLayer(outlineLayerId)) map.removeLayer(outlineLayerId);
                if (map.getLayer(fillLayerId)) map.removeLayer(fillLayerId);
                if (map.getSource(sourceId)) map.removeSource(sourceId);
            } catch { }
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isLoaded, map, sourceId, fillLayerId, outlineLayerId]);

    // Update data
    useEffect(() => {
        if (!isLoaded || !map) return;
        const source = map.getSource(sourceId) as any;
        if (source?.setData) source.setData(data);
    }, [isLoaded, map, data, sourceId]);

    return null;
}
