//logic/tileLayer.js
function initTileLayer(map) {

    const TILE_FILE = 'data/tiles_database_final.json';
    let RAW_DATA = [];

    function updateInfoPanel(properties) {
        const detailsDiv = document.getElementById('details');
        if (!properties) {
            detailsDiv.innerHTML = "Klikněte na dlaždici pro data.";
            return;
        }
        const p = properties;
        let html = `<b>Tile ID:</b> ${p.tile_id || 'N/A'}<br><hr>`;
        html += `<div class="stat-row"><span>Zdraví:</span> <b>${p.healthcareScore || 0}</b></div>`;
        html += `<div class="stat-row"><span>Vzdělání:</span> <b>${p.educationScore || 0}</b></div>`;
        html += `<div class="stat-row"><span>Doprava:</span> <b>${p.transportScore || 0}</b></div>`;
        html += `<div class="stat-row"><span>Kultura:</span> <b>${p.cultureScore || 0}</b></div>`;
        html += `<div class="stat-row"><span>Ostatní:</span> <b>${p.otherScore || 0}</b></div>`;
        detailsDiv.innerHTML = html;
    }

    fetch(TILE_FILE)
        .then(res => res.json())
        .then(data => {
            console.log("Dlaždice načteny:", data.length);

            data.forEach((f, i) => { 
                if (!f.properties) f.properties = {};
                f.properties.INTERNAL_INDEX = i; 
            });
            RAW_DATA = data;
            
            const statusElem = document.getElementById('status-tile');
            if(statusElem) statusElem.innerText = `Dlaždice: ${data.length} ks`;

            if (!map.getSource('special-tiles')) {
                map.addSource('special-tiles', { 
                    'type': 'geojson', 
                    'data': { "type": "FeatureCollection", "features": data }
                });
            }

            const isDebug = (typeof AppConfig !== 'undefined' && AppConfig.debug);
            
            const gridVisibility = isDebug ? 'visible' : 'none';
            
            const fillOpacity = isDebug ? 0.2 : 0.0; 


            if (!map.getLayer('special-tiles-fill')) {
                map.addLayer({ 
                    'id': 'special-tiles-fill', 
                    'type': 'fill', 
                    'source': 'special-tiles', 
                    'paint': { 
                        'fill-color': '#FF0000', 
                        'fill-opacity': fillOpacity 
                    } 
                });
            }
            
            if (!map.getLayer('special-tiles-line')) {
                map.addLayer({ 
                    'id': 'special-tiles-line', 
                    'type': 'line', 
                    'source': 'special-tiles', 
                    'layout': {
                        'visibility': gridVisibility
                    },
                    'paint': { 'line-color': '#FF0000', 'line-width': 1 } 
                });
            }

            if (!map.getSource('context-points')) {
                map.addSource('context-points', { 
                    'type': 'geojson', 
                    'data': { "type": "FeatureCollection", "features": [] } 
                });
            }
            if (!map.getLayer('context-points-circle')) {
                map.addLayer({ 
                    'id': 'context-points-circle', 
                    'type': 'circle', 
                    'source': 'context-points', 
                    'paint': { 
                        'circle-radius': 5, 
                        'circle-color': '#ffff00', 
                        'circle-stroke-width': 1,
                        'circle-stroke-color': '#000'
                    } 
                });
            }

            map.on('mouseenter', 'special-tiles-fill', () => map.getCanvas().style.cursor = 'pointer');
            map.on('mouseleave', 'special-tiles-fill', () => map.getCanvas().style.cursor = '');

            map.on('click', 'special-tiles-fill', (e) => {
                const props = e.features[0].properties;
                const index = props.INTERNAL_INDEX;
                if (index === undefined || index === null) return;

                const originalRecord = RAW_DATA[index];
                updateInfoPanel(originalRecord.properties);

                let context = originalRecord.properties.context_scored || {};
                let points = [];
                Object.keys(context).forEach(cat => {
                    context[cat].forEach(item => {
                        if(item.coords) {
                            points.push({ 
                                "type": "Feature", 
                                "geometry": { "type": "Point", "coordinates": item.coords }, 
                                "properties": { "category": cat, "name": item.name || cat } 
                            });
                        }
                    });
                });

                map.getSource('context-points').setData({ 
                    "type": "FeatureCollection", 
                    "features": points 
                });
            });

        })
        .catch(e => {
            console.error("Chyba načítání dlaždic:", e);
            const statusElem = document.getElementById('status-tile');
            if(statusElem) statusElem.innerText = "Chyba dat.";
        });
}