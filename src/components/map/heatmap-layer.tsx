"use client";

import { useEffect, useId, useRef } from "react";
import { useMap } from "./map";

export type MapHeatmapLayerProps = {
    /** Optional unique identifier for the heatmap layer */
    id?: string;
    /** GeoJSON FeatureCollection data or URL to fetch GeoJSON from */
    data: string | GeoJSON.FeatureCollection<GeoJSON.Point>;
    /** Property name in GeoJSON to use for heatmap weight (0-1). Overrides the `weight` prop if set. */
    weightProp?: string;
    /** Heatmap weight expression or value (default: 1) */
    weight?: number | any[];
    /** Heatmap intensity expression or value (default: 1) */
    intensity?: number | any[];
    /** Heatmap radius in pixels (default: 30) */
    radius?: number | any[];
    /** Heatmap opacity from 0 to 1 (default: 1) */
    opacity?: number | any[];
    /** Array of colors for the heatmap gradient, from 0 to 1 */
    colors?: string[];
    /** Layer ID before which this layer should be inserted (to place under labels) */
    beforeId?: string;
};

const DEFAULT_COLORS = [
    "rgba(33,102,172,0)",
    "rgb(103,169,207)",
    "rgb(209,229,240)",
    "rgb(253,219,199)",
    "rgb(239,138,98)",
    "rgb(178,24,43)"
];

export function MapHeatmapLayer({
    id: propId,
    data,
    weightProp,
    weight = 1,
    intensity = 1,
    radius = 30,
    opacity = 1,
    colors = DEFAULT_COLORS,
    beforeId,
}: MapHeatmapLayerProps) {
    const { map, isLoaded } = useMap();
    const autoId = useId();
    const id = propId ?? autoId;
    const sourceId = `heatmap-source-${id}`;
    const layerId = `heatmap-layer-${id}`;

    const stylePropsRef = useRef({ colors, radius, opacity, intensity, weight, weightProp });

    // Add source and layer on mount
    useEffect(() => {
        if (!isLoaded || !map) return;

        // Prepare color ramp
        const colorRamp: any[] = ["interpolate", ["linear"], ["heatmap-density"]];
        const step = 1 / (colors.length - 1);
        colors.forEach((color, i) => {
            colorRamp.push(i * step, color);
        });

        // Determine weight expression
        let heatmapWeight: any = weight;
        if (weightProp) {
            heatmapWeight = ["get", weightProp];
        }

        try {
            map.addSource(sourceId, {
                type: "geojson",
                data,
            });

            map.addLayer(
                {
                    id: layerId,
                    type: "heatmap",
                    source: sourceId,
                    paint: {
                        "heatmap-weight": heatmapWeight as any,
                        "heatmap-intensity": intensity as any,
                        "heatmap-color": colorRamp as any,
                        "heatmap-radius": radius as any,
                        "heatmap-opacity": opacity as any,
                    },
                },
                beforeId
            );
        } catch (e) {
            console.warn("Error adding heatmap layer:", e);
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

    // Update source data when data prop changes
    useEffect(() => {
        if (!isLoaded || !map || typeof data === "string") return;

        const source = map.getSource(sourceId) as maplibregl.GeoJSONSource | undefined;
        if (source) {
            source.setData(data);
        }
    }, [isLoaded, map, data, sourceId]);

    // Update layer styles when props change
    useEffect(() => {
        if (!isLoaded || !map || !map.getLayer(layerId)) return;

        const prev = stylePropsRef.current;
        let colorsChanged = false;

        if (prev.colors.length !== colors.length) {
            colorsChanged = true;
        } else {
            for (let i = 0; i < colors.length; i++) {
                if (prev.colors[i] !== colors[i]) {
                    colorsChanged = true;
                    break;
                }
            }
        }

        if (colorsChanged) {
            const colorRamp: any[] = ["interpolate", ["linear"], ["heatmap-density"]];
            const step = 1 / (colors.length - 1);
            colors.forEach((color, i) => {
                colorRamp.push(i * step, color);
            });
            map.setPaintProperty(layerId, "heatmap-color", colorRamp as any);
        }

        if (prev.radius !== radius) map.setPaintProperty(layerId, "heatmap-radius", radius as any);
        if (prev.opacity !== opacity) map.setPaintProperty(layerId, "heatmap-opacity", opacity as any);
        if (prev.intensity !== intensity) map.setPaintProperty(layerId, "heatmap-intensity", intensity as any);

        const weightChanged = prev.weight !== weight || prev.weightProp !== weightProp;
        if (weightChanged) {
            let heatmapWeight: any = weight;
            if (weightProp) {
                heatmapWeight = ["get", weightProp];
            }
            map.setPaintProperty(layerId, "heatmap-weight", heatmapWeight as any);
        }

        stylePropsRef.current = { colors, radius, opacity, intensity, weight, weightProp };
    }, [isLoaded, map, layerId, colors, radius, opacity, intensity, weight, weightProp]);

    return null;
}
