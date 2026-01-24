// --- 1. Dynamické vložení CSS stylů ---
const popupStyles = `
    .popup-table {
        width: 100%;
        border-collapse: collapse;
        font-family: sans-serif;
        font-size: 12px;
    }
    .popup-table td, .popup-table th {
        border: 1px solid #ddd;
        padding: 4px 8px;
    }
    .popup-table tr:nth-child(even) {
        background-color: #f2f2f2;
    }
    .popup-table th {
        text-align: left;
        background-color: #3388ff;
        color: white;
    }
    /* Úprava pro MapLibre popup (aby nebyl tak velký padding okolo) */
    .maplibregl-popup-content {
        padding: 10px;
    }
`;

const styleSheet = document.createElement("style");
styleSheet.textContent = popupStyles;
document.head.appendChild(styleSheet);





const statusList = document.getElementById('status-list');

/**
 * Updates the visual status panel.
 */
function updateFileStatus(filename, status, type) {
    let item = document.getElementById(`status-${filename}`);
    if (!item) {
        item = document.createElement('div');
        item.id = `status-${filename}`;
        item.className = 'file-item';
        statusList.appendChild(item);
    }
    
    let statusClass = 'status-loading';
    if (type === 'success') statusClass = 'status-ok';
    if (type === 'error') statusClass = 'status-error';

    item.innerHTML = `<span>${filename}</span><span class="${statusClass}">${status}</span>`;
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
    updateFileStatus(filename, 'Loading...', 'loading');
    const sourceId = `source-${index}`;

    try {
        const res = await fetch(`/data/${filename}`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        
        let geojsonData = await res.json();

        // TopoJSON support
        if (filename.endsWith('.topojson')) {
            const keys = Object.keys(geojsonData.objects);
            if (keys.length > 0) {
                geojsonData = topojson.feature(geojsonData, geojsonData.objects[keys[0]]);
            }
        }

        // Add the data source
        map.addSource(sourceId, {
            type: 'geojson',
            data: geojsonData
        });

        // Get layer definitions from mapStyle.js (assumed to be loaded globally)
        const layers = getMapLayers(index, sourceId);

        // Add each layer to the map and attach interaction
        layers.forEach(layer => {
            map.addLayer(layer);
            addInteractivityToLayer(layer.id);
        });

        updateFileStatus(filename, 'Loaded', 'success');

    } catch (err) {
        console.error(err);
        updateFileStatus(filename, 'Failed', 'error');
    }
}

/**
 * Adds click and hover events to a specific layer.
 * @param {string} layerId - The ID of the layer to make interactive.
 */
function addInteractivityToLayer(layerId) {
    // 1. CLICK EVENT: Show Popup
    map.on('click', layerId, (e) => {
        // Prevent click from propagating to lower layers if multiple overlap
        // (optional, but good for overlapping features)
        
        if (!e.features || e.features.length === 0) return;

        const feature = e.features[0];
        const coordinates = e.lngLat; // Where the user clicked on the map
        const properties = feature.properties;

        // Generate HTML table for properties
        const description = createPopupContent(properties);

        // Ensure that if the map is zoomed out such that multiple
        // copies of the feature are visible, the popup appears
        // over the copy being pointed to.
        // (Standard MapLibre handling for wrapping maps)
        while (Math.abs(e.lngLat.lng - coordinates.lng) > 180) {
            coordinates.lng += e.lngLat.lng > coordinates.lng ? 360 : -360;
        }

        new maplibregl.Popup()
            .setLngLat(coordinates)
            .setHTML(description)
            .addTo(map);
    });

    // 2. MOUSE ENTER: Change cursor to pointer
    map.on('mouseenter', layerId, () => {
        map.getCanvas().style.cursor = 'pointer';
    });

    // 3. MOUSE LEAVE: Reset cursor
    map.on('mouseleave', layerId, () => {
        map.getCanvas().style.cursor = '';
    });
}

/**
 * Helper function to turn JSON properties into an HTML table.
 * @param {Object} properties - The feature properties.
 * @returns {string} HTML string.
 */
function createPopupContent(properties) {
    if (!properties || Object.keys(properties).length === 0) {
        return '<strong>No details available</strong>';
    }

    let html = '<table class="popup-table">';
    for (const key in properties) {
        html += `
            <tr>
                <th>${key}</th>
                <td>${properties[key]}</td>
            </tr>
        `;
    }
    html += '</table>';
    return html;
}