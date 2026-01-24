/**
 * mapStyle.js
 * Contains all logic related to map styling, layers, and visual interactions.
 */

// Configuration constants for easy customization
const COLORS = {
    clusterSmall: '#51bbd6',  // Blue
    clusterMedium: '#f1f075', // Yellow
    clusterLarge: '#f28cb1',  // Pink
    point: '#11b4da',         // Cyan for single points
    stroke: '#ffffff'         // White border
};

export const SOURCE_ID = 'schools-source';

/**
 * Adds the GeoJSON source and all related visual layers to the map.
 * @param {maplibregl.Map} map - The map instance.
 * @param {Object} geojsonData - The merged FeatureCollection.
 */
export function addMapLayers(map, geojsonData) {
    
    // 1. Add Source
    if (map.getSource(SOURCE_ID)) {
        // If source exists, just update data
        map.getSource(SOURCE_ID).setData(geojsonData);
    } else {
        map.addSource(SOURCE_ID, {
            type: 'geojson',
            data: geojsonData,
            cluster: true,
            clusterMaxZoom: 14,
            clusterRadius: 50
        });
    }

    // 2. Add Layer: Clusters (Circles)
    // Only add layers if they don't exist yet
    if (!map.getLayer('clusters')) {
        map.addLayer({
            id: 'clusters',
            type: 'circle',
            source: SOURCE_ID,
            filter: ['has', 'point_count'],
            paint: {
                'circle-color': [
                    'step',
                    ['get', 'point_count'],
                    COLORS.clusterSmall,
                    100,
                    COLORS.clusterMedium,
                    750,
                    COLORS.clusterLarge
                ],
                'circle-radius': [
                    'step',
                    ['get', 'point_count'],
                    20,
                    100,
                    30,
                    750,
                    40
                ]
            }
        });
    }

    // 3. Add Layer: Cluster Counts (Text)
    if (!map.getLayer('cluster-count')) {
        map.addLayer({
            id: 'cluster-count',
            type: 'symbol',
            source: SOURCE_ID,
            filter: ['has', 'point_count'],
            layout: {
                'text-field': '{point_count_abbreviated}',
                'text-font': ['DIN Offc Pro Medium', 'Arial Unicode MS Bold'],
                'text-size': 12
            }
        });
    }

    // 4. Add Layer: Unclustered Points (Individual Schools)
    if (!map.getLayer('unclustered-point')) {
        map.addLayer({
            id: 'unclustered-point',
            type: 'circle',
            source: SOURCE_ID,
            filter: ['!', ['has', 'point_count']],
            paint: {
                'circle-color': COLORS.point,
                'circle-radius': 6,
                'circle-stroke-width': 1,
                'circle-stroke-color': COLORS.stroke
            }
        });
    }
}

/**
 * Sets up mouse interactions (clicks, hovers).
 * @param {maplibregl.Map} map - The map instance.
 */
export function setupInteractions(map) {
    
    // Zoom on cluster click
    map.on('click', 'clusters', async (e) => {
        const features = map.queryRenderedFeatures(e.point, { layers: ['clusters'] });
        const clusterId = features[0].properties.cluster_id;
        const source = map.getSource(SOURCE_ID);
        
        const zoom = await source.getClusterExpansionZoom(clusterId);
        map.easeTo({
            center: features[0].geometry.coordinates,
            zoom: zoom
        });
    });

    // Popup on individual point click
    map.on('click', 'unclustered-point', (e) => {
        const coordinates = e.features[0].geometry.coordinates.slice();
        const props = e.features[0].properties;

        // Ensure popup appears over the point even if map is zoomed out
        while (Math.abs(e.lngLat.lng - coordinates[0]) > 180) {
            coordinates[0] += e.lngLat.lng > coordinates[0] ? 360 : -360;
        }

        new maplibregl.Popup()
            .setLngLat(coordinates)
            .setHTML(`
                <div style="font-family: sans-serif; padding: 5px;">
                    <strong>School Info</strong><br>
                    ${JSON.stringify(props, null, 2)}
                </div>
            `)
            .addTo(map);
    });

    // Change cursor on hover
    const layers = ['clusters', 'unclustered-point'];
    layers.forEach(layer => {
        map.on('mouseenter', layer, () => { map.getCanvas().style.cursor = 'pointer'; });
        map.on('mouseleave', layer, () => { map.getCanvas().style.cursor = ''; });
    });
}