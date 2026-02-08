// logic/fileLoader.js

const FileLoader = {

    /**
     * Start point for "Normal Mode". 
     * Fetches file list and populates the left-side UI.
     */
    init: async function(map) {
        const statusList = document.getElementById('status-list');
        if (!statusList) return; 

        statusList.innerHTML = '';
        
        try {
            const response = await fetch('/api/files');
            const files = await response.json();

            if (files.length === 0) {
                statusList.innerHTML = 'No files found in /data';
                return;
            }

            for (const [index, filename] of files.entries()) {
                this.loadFile(map, filename, index); 
            }
        } catch (error) {
            statusList.innerHTML = `<div class="status-error">API Error: ${error.message}</div>`;
        }
    },

    /**
     * Universal loader. 
     * Can be called by 'init' (with uiIndex) or by DebugManager (without uiIndex).
     */
    loadFile: async function(map, filename, uiIndex = null) {
        // Generate a safe ID for map sources (removes special chars)
        const safeId = filename.replace(/[^a-zA-Z0-9]/g, '_');
        const sourceId = `source-${safeId}`;

        // Prevent double loading
        if (map.getSource(sourceId)) {
            console.log(`File ${filename} already loaded.`);
            return;
        }

        if (uiIndex !== null) updateFileStatus(filename, uiIndex, 'Loading...', 'loading');

        try {
            const res = await fetch(`/data/${filename}`);
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            
            const geojsonData = await res.json();

            // Add Source
            map.addSource(sourceId, {
                type: 'geojson',
                data: geojsonData
            });

            const layers = getMapLayers(safeId, sourceId);

            // Add layers
            layers.forEach(layer => {
                map.addLayer(layer);
                addInteractivityToLayer(map, layer.id);
            });

            if (uiIndex !== null) {
                updateFileStatus(filename, uiIndex, 'Loaded', 'success', (isVisible) => {
                    // Callback for the UI checkbox to toggle visibility
                    toggleLayerVisibility(map, safeId, isVisible);
                });
            }

        } catch (err) {
            console.error(err);
            if (uiIndex !== null) updateFileStatus(filename, uiIndex, 'Failed', 'error');
        }
    },

    /**
     * Removes a file (Source + Layers).
     * Used by DebugManager.
     */
    removeFile: function(map, filename) {
        const safeId = filename.replace(/[^a-zA-Z0-9]/g, '_');
        const sourceId = `source-${safeId}`;

        // 1. Remove Layers
        const styles = map.getStyle();
        if (styles && styles.layers) {
            // Find layers that belong to this source
            const fileLayers = styles.layers.filter(l => l.source === sourceId);
            fileLayers.forEach(l => map.removeLayer(l.id));
        }

        // 2. Remove Source
        if (map.getSource(sourceId)) {
            map.removeSource(sourceId);
        }
    }
};

/* --- HELPER FUNCTIONS --- */

/**
 * Updates the visual status panel (Left Side).
 * Added 'onToggle' callback to decouple UI from Map logic.
 */
function updateFileStatus(filename, index, status, type, onToggle) {
    const statusList = document.getElementById('status-list');
    if (!statusList) return;

    let item = document.getElementById(`status-${index}`);
    
    if (!item) {
        item = document.createElement('div');
        item.id = `status-${index}`;
        item.className = 'file-item';
        statusList.appendChild(item);
    }
    
    if (type === 'loading') {
        item.innerHTML = `
            <span class="filename-text" title="${filename}">${filename}</span>
            <span class="status-loading">${status}</span>
        `;
    } else if (type === 'error') {
        item.innerHTML = `
            <span class="filename-text" title="${filename}">${filename}</span>
            <span class="status-error">${status}</span>
        `;
    } else if (type === 'success') {
        createLayerControl(item, filename, index, onToggle);
    }
}

function createLayerControl(containerElement, filename, index, onToggle) {
    containerElement.innerHTML = ''; 

    const label = document.createElement('label');
    label.className = 'file-label';
    label.title = filename;

    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.checked = true;
    checkbox.id = `cb-${index}`;

    const span = document.createElement('span');
    span.className = 'filename-text';
    span.textContent = filename;

    label.appendChild(checkbox);
    label.appendChild(span);
    containerElement.appendChild(label);

    // Link checkbox to the provided callback function
    checkbox.addEventListener('change', (e) => {
        if (onToggle) onToggle(e.target.checked);
    });
}

function toggleLayerVisibility(map, safeId, isVisible) {
    const visibility = isVisible ? 'visible' : 'none';
    const layerTypes = ['fill', 'line', 'point'];

    layerTypes.forEach(type => {
        const layerId = `layer-${safeId}-${type}`;
        if (map.getLayer(layerId)) {
            map.setLayoutProperty(layerId, 'visibility', visibility);
        }
    });
}

function addInteractivityToLayer(map, layerId) {
    map.on('click', layerId, (e) => {
        const layout = map.getLayoutProperty(layerId, 'visibility');
        if (layout === 'none') return;

        if (!e.features || e.features.length === 0) return;

        const feature = e.features[0];
        const coordinates = e.lngLat;
        const properties = feature.properties;

        // Ensure PopupConfig exists (from popUpMarker.js)
        if (typeof PopupConfig !== 'undefined') {
            const description = PopupConfig.createContent(properties);
            
            // Fix wrap for worlds > 360 deg
            const lngLat = e.lngLat; // maplibre object copy
            while (Math.abs(e.lngLat.lng - coordinates.lng) > 180) {
                coordinates.lng += e.lngLat.lng > coordinates.lng ? 360 : -360;
            }

            new maplibregl.Popup()
                .setLngLat(coordinates)
                .setHTML(description)
                .addTo(map);
        }
    });

    map.on('mouseenter', layerId, () => map.getCanvas().style.cursor = 'pointer');
    map.on('mouseleave', layerId, () => map.getCanvas().style.cursor = '');
}