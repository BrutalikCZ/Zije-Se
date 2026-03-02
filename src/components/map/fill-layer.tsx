"use client";

import { useCallback, useEffect, useId, useRef } from "react";
import { useMap } from "./map";

export type MapFillLayerProps = {
    /** Optional unique identifier for the fill layer */
    id?: string;
    /** GeoJSON FeatureCollection data with Polygon geometries */
    data: GeoJSON.FeatureCollection;
    /** Property name in GeoJSON to use for coloring */
    colorProp: string;
    /** Step-based color scale: array of { threshold, color } sorted ascending.
     *  Values below the first threshold get defaultColor. */
    colorScale: { threshold: number; color: string }[];
    /** Color for values below the first threshold (default: transparent) */
    defaultColor?: string;
    /** Fill opacity from 0 to 1 (default: 0.8) */
    opacity?: number;
    /** Outline color (default: transparent) */
    outlineColor?: string;
    /** Layer ID before which this layer should be inserted */
    beforeId?: string;
    /** Callback when a feature in this layer is clicked */
    onClick?: (feature: GeoJSON.Feature) => void;
};

export function MapFillLayer({
    id: propId,
    data,
    colorProp,
    colorScale,
    defaultColor = "rgba(0,0,0,0)",
    opacity = 0.8,
    outlineColor = "rgba(0,0,0,0)",
    beforeId,
    onClick,
}: MapFillLayerProps) {
    const { map, isLoaded } = useMap();
    const autoId = useId();
    const id = propId ?? autoId;
    const sourceId = `fill-source-${id}`;
    const layerId = `fill-layer-${id}`;

    const stylePropsRef = useRef({ colorScale, colorProp, opacity, outlineColor, defaultColor });

    // Build a MapLibre step expression from the color scale
    function buildColorExpression(
        prop: string,
        scale: { threshold: number; color: string }[],
        defColor: string
    ): any {
        // If no scale provided, use flat default color
        if (scale.length === 0) return defColor;
        // ["step", ["get", prop], defaultColor, threshold1, color1, threshold2, color2, ...]
        const expr: any[] = ["step", ["get", prop], defColor];
        for (const s of scale) {
            expr.push(s.threshold, s.color);
        }
        return expr;
    }

    // Add source and layer on mount
    useEffect(() => {
        if (!isLoaded || !map) return;

        const fillColor = buildColorExpression(colorProp, colorScale, defaultColor);

        try {
            map.addSource(sourceId, {
                type: "geojson",
                data,
            });

            map.addLayer(
                {
                    id: layerId,
                    type: "fill",
                    source: sourceId,
                    paint: {
                        "fill-color": fillColor as any,
                        "fill-opacity": opacity,
                        "fill-outline-color": outlineColor,
                    },
                },
                beforeId
            );
        } catch (e) {
            console.warn("Error adding fill layer:", e);
        }

        return () => {
            try {
                if (map.getLayer(layerId)) map.removeLayer(layerId);
                if (map.getSource(sourceId)) map.removeSource(sourceId);
            } catch {
                // ignore
            }
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isLoaded, map, sourceId, layerId]);

    // Click handler
    const onClickRef = useRef(onClick);
    onClickRef.current = onClick;

    useEffect(() => {
        if (!isLoaded || !map || !onClick) return;

        const handleClick = (e: any) => {
            const features = map.queryRenderedFeatures(e.point, { layers: [layerId] });
            if (features && features.length > 0) {
                onClickRef.current?.(features[0] as unknown as GeoJSON.Feature);
            }
        };

        map.on('click', layerId, handleClick);

        // Change cursor on hover
        const handleEnter = () => { map.getCanvas().style.cursor = 'pointer'; };
        const handleLeave = () => { map.getCanvas().style.cursor = ''; };
        map.on('mouseenter', layerId, handleEnter);
        map.on('mouseleave', layerId, handleLeave);

        return () => {
            map.off('click', layerId, handleClick);
            map.off('mouseenter', layerId, handleEnter);
            map.off('mouseleave', layerId, handleLeave);
            map.getCanvas().style.cursor = '';
        };
    }, [isLoaded, map, layerId, !!onClick]);

    // Update source data when data prop changes
    useEffect(() => {
        if (!isLoaded || !map) return;

        const source = map.getSource(sourceId) as maplibregl.GeoJSONSource | undefined;
        if (source) {
            source.setData(data as any);
        }
    }, [isLoaded, map, data, sourceId]);

    // Update paint properties when style props change
    useEffect(() => {
        if (!isLoaded || !map || !map.getLayer(layerId)) return;

        const prev = stylePropsRef.current;

        const scaleChanged =
            prev.colorProp !== colorProp ||
            prev.defaultColor !== defaultColor ||
            prev.colorScale.length !== colorScale.length ||
            prev.colorScale.some((s, i) => s.threshold !== colorScale[i]?.threshold || s.color !== colorScale[i]?.color);

        if (scaleChanged) {
            const fillColor = buildColorExpression(colorProp, colorScale, defaultColor);
            map.setPaintProperty(layerId, "fill-color", fillColor as any);
        }

        if (prev.opacity !== opacity) {
            map.setPaintProperty(layerId, "fill-opacity", opacity);
        }

        if (prev.outlineColor !== outlineColor) {
            map.setPaintProperty(layerId, "fill-outline-color", outlineColor);
        }

        stylePropsRef.current = { colorScale, colorProp, opacity, outlineColor, defaultColor };
    }, [isLoaded, map, layerId, colorScale, colorProp, opacity, outlineColor, defaultColor]);

    return null;
}
