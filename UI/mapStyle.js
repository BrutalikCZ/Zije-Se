/**
 * Defines the visual style for map features.
 * Returns an array of layer configurations for MapLibre GL.
 * * @param {number} index - The unique index of the file (used for unique IDs).
 * @param {string} sourceId - The ID of the data source to apply styles to.
 */
function getMapLayers(index, sourceId) {
    // Configuration for colors and sizes
    const styleConfig = {
        fillColor: '#3388ff',
        fillOpacity: 0.4,
        lineColor: '#ff3333',
        lineWidth: 2,
        pointColor: '#ff3333',
        pointRadius: 6
    };

    return [
        // 1. Fill Layer (Polygons)
        {
            'id': `layer-${index}-fill`,
            'type': 'fill',
            'source': sourceId,
            'paint': {
                'fill-color': styleConfig.fillColor,
                'fill-opacity': styleConfig.fillOpacity
            },
            // Only apply to Polygons
            'filter': ['==', '$type', 'Polygon']
        },

        // 2. Line Layer (Outlines and LineStrings)
        {
            'id': `layer-${index}-line`,
            'type': 'line',
            'source': sourceId,
            'paint': {
                'line-color': styleConfig.lineColor,
                'line-width': styleConfig.lineWidth
            },
            // Apply to Lines and Polygons (as outlines)
            'filter': ['in', '$type', 'LineString', 'Polygon']
        },

        // 3. Point Layer (Points)
        {
            'id': `layer-${index}-point`,
            'type': 'circle',
            'source': sourceId,
            'paint': {
                'circle-radius': styleConfig.pointRadius,
                'circle-color': styleConfig.pointColor,
                'circle-stroke-width': 1,
                'circle-stroke-color': '#ffffff'
            },
            // Only apply to Points
            'filter': ['==', '$type', 'Point']
        }
    ];
}