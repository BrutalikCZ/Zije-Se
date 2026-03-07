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
    onClick?: (feature: any) => void;
};

export function MapCircleLayer({
    id: propId,
    data,
    color = "#ff6b35",
    radius = 8,
    opacity = 0.85,
    outlineColor = "#ffffff",
    autoFlyTo = false,
    onClick,
}: MapCircleLayerProps) {
    const { map, isLoaded } = useMap();
    const autoId = useId();
    const id = propId ?? autoId;
    const sourceId = `circle-source-${id}`;
    const layerId = `circle-layer-${id}`;
    const didFly = useRef(false);

    const onClickRef = useRef(onClick);
    onClickRef.current = onClick;

    useEffect(() => {
        if (!isLoaded || !map) return;

        try {
            if (!map.getSource(sourceId)) {
                map.addSource(sourceId, { type: "geojson", data: data as any });
            }

            if (!map.getLayer(layerId)) {
                // Use the provided color or a data-driven expression if color starts with 'expression:'
                const circleColor = (typeof color === 'string' && color.startsWith('expression:'))
                    ? JSON.parse(color.substring(11))
                    : color;

                const strokeColor = (typeof outlineColor === 'string' && outlineColor.startsWith('expression:'))
                    ? JSON.parse(outlineColor.substring(11))
                    : outlineColor;

                map.addLayer({
                    id: layerId,
                    type: "circle",
                    source: sourceId,
                    paint: {
                        "circle-color": circleColor,
                        "circle-radius": radius,
                        "circle-opacity": opacity,
                        "circle-stroke-width": 2,
                        "circle-stroke-color": strokeColor,
                    },
                });
            }

            const handleClick = (e: any) => {
                if (onClickRef.current && e.features?.length > 0) {
                    onClickRef.current(e.features[0]);
                }
            };

            const handleMouseEnter = () => {
                if (onClickRef.current) map.getCanvas().style.cursor = 'pointer';
            };

            const handleMouseLeave = () => {
                map.getCanvas().style.cursor = '';
            };

            map.on('click', layerId, handleClick);
            map.on('mouseenter', layerId, handleMouseEnter);
            map.on('mouseleave', layerId, handleMouseLeave);

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

            return () => {
                map.off('click', layerId, handleClick);
                map.off('mouseenter', layerId, handleMouseEnter);
                map.off('mouseleave', layerId, handleMouseLeave);
                try {
                    if (map.getLayer(layerId)) map.removeLayer(layerId);
                    if (map.getSource(sourceId)) map.removeSource(sourceId);
                } catch { }
            };
        } catch (e) {
            console.warn("[MapCircleLayer] Error adding layer:", e);
        }
    }, [isLoaded, map, sourceId, layerId, color, radius, opacity, outlineColor, autoFlyTo, data]);

    // Update source data when data prop changes
    useEffect(() => {
        if (!isLoaded || !map) return;
        const source = map.getSource(sourceId) as any;
        if (source?.setData) source.setData(data);
    }, [isLoaded, map, data, sourceId]);

    return null;
}
