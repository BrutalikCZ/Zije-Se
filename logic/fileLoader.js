// logic/fileLoader.js

const statusList = document.getElementById('status-list');

/**
 * Updates the visual status panel.
 * If type is 'success', it renders a checkbox control instead of text.
 */
function updateFileStatus(filename, index, status, type) {
    let item = document.getElementById(`status-${index}`);
    
    // Create container if it doesn't exist
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
        // Replace loading text with a checkbox control
        createLayerControl(item, filename, index);
    }
}

/**
 * Creates the HTML checkbox and attaches the event listener for toggling layers.
 */
function createLayerControl(containerElement, filename, index) {
    containerElement.innerHTML = ''; // Clear loading status

    const label = document.createElement('label');
    label.className = 'file-label';
    label.title = filename; // Tooltip for long names

    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.checked = true; // Default to visible
    checkbox.id = `cb-${index}`;

    const span = document.createElement('span');
    span.className = 'filename-text';
    span.textContent = filename;

    // Append elements
    label.appendChild(checkbox);
    label.appendChild(span);
    containerElement.appendChild(label);

    // Event Listener: Toggle Layer Visibility
    checkbox.addEventListener('change', (e) => {
        toggleLayerVisibility(index, e.target.checked);
    });
}

/**
 * Toggles the visibility property of all layers associated with a specific file index.
 */
function toggleLayerVisibility(index, isVisible) {
    const visibility = isVisible ? 'visible' : 'none';
    const layerTypes = ['fill', 'line', 'point'];

    layerTypes.forEach(type => {
        const layerId = `layer-${index}-${type}`;
        if (map.getLayer(layerId)) {
            map.setLayoutProperty(layerId, 'visibility', visibility);
        }
    });
}

// Ensure map is loaded before fetching files
map.on('load', () => {
    loadFiles();
});

/**
 * Fetches the list of files and processes them.
 */
async function loadFiles() {
    statusList.innerHTML = '';
    try {
        const response = await fetch('/api/files');
        const files = await response.json();

        if (files.length === 0) {
            statusList.innerHTML = 'No files found in /data';
            return;
        }

        for (const [index, filename] of files.entries()) {
            loadSingleFile(filename, index);
        }
    } catch (error) {
        statusList.innerHTML = `<div class="status-error">API Error: ${error.message}</div>`;
    }
}

/**
 * Loads a single GeoJSON/TopoJSON file and adds it to the map.
 */
async function loadSingleFile(filename, index) {
    updateFileStatus(filename, index, 'Loading...', 'loading');
    const sourceId = `source-${index}`;

    try {
        const res = await fetch(`/data/${filename}`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        
        let geojsonData = await res.json();

        // TopoJSON support logic
        /* if (filename.endsWith('.topojson')) {
            const keys = Object.keys(geojsonData.objects);
            if (keys.length > 0) {
                geojsonData = topojson.feature(geojsonData, geojsonData.objects[keys[0]]);
            }
        } */

        // Add the data source
        map.addSource(sourceId, {
            type: 'geojson',
            data: geojsonData
        });

        // Get layer definitions from mapStyle.js
        const layers = getMapLayers(index, sourceId);

        // Add each layer to the map and attach interaction
        layers.forEach(layer => {
            map.addLayer(layer);
            addInteractivityToLayer(layer.id);
        });

        // Update UI to show checkbox
        updateFileStatus(filename, index, 'Loaded', 'success');

    } catch (err) {
        console.error(err);
        updateFileStatus(filename, index, 'Failed', 'error');
    }
}

/**
 * Adds click and hover events to a specific layer.
 */
function addInteractivityToLayer(layerId) {
    map.on('click', layerId, (e) => {
        // Ensure the layer is visible before showing popup
        const layout = map.getLayoutProperty(layerId, 'visibility');
        if (layout === 'none') return;

        if (!e.features || e.features.length === 0) return;

        const feature = e.features[0];
        const coordinates = e.lngLat;
        const properties = feature.properties;

        const description = PopupConfig.createContent(properties);

        while (Math.abs(e.lngLat.lng - coordinates.lng) > 180) {
            coordinates.lng += e.lngLat.lng > coordinates.lng ? 360 : -360;
        }

        new maplibregl.Popup()
            .setLngLat(coordinates)
            .setHTML(description)
            .addTo(map);
    });

    map.on('mouseenter', layerId, () => {
        map.getCanvas().style.cursor = 'pointer';
    });

    map.on('mouseleave', layerId, () => {
        map.getCanvas().style.cursor = '';
    });
}