// debug/debugPanel.js
import("../logic/questionnaire.js")
const DebugManager = {
   init: function(map) {
        if (typeof QuestionnaireManager !== 'undefined' && QuestionnaireManager.active) {
            console.warn("DebugManager: Standard loading blocked by Questionnaire Mode.");
            return; 
        }

        if (typeof AppConfig === 'undefined' || !AppConfig.debug) {
            this.autoLoadStandard(map);
            return;
        }

        this.createUI(map);
    }, 

    autoLoadStandard: function(map) {
        console.log("Normal mode: Activating standard UI.");

        const leftPanel = document.getElementById('status-panel');
        if (leftPanel) {
            leftPanel.style.display = 'flex'; 
        }

        if (typeof initTileLayer === 'function') {
            initTileLayer(map);
        }

        if (typeof FileLoader !== 'undefined' && FileLoader.init) {
            FileLoader.init(map);
        } else {
            console.error("Chyba: FileLoader nenalezen nebo nemá funkci init(). Zkontrolujte logic/fileLoader.js");
            const list = document.getElementById('status-list');
            if (list) list.innerHTML = "<div class='status-error'>Chyba načítání skriptu FileLoader.</div>";
        }
    },

    createUI: function(map) {
        const panel = document.createElement('div');
        panel.id = 'debug-panel';
        panel.style.display = 'block';
        
        const leftPanel = document.getElementById('status-panel');
        if (leftPanel) leftPanel.style.display = 'none';

        panel.innerHTML = `
            <h3>Debug Control</h3>
            
            <h4>Tiles System</h4>
            <div class="debug-row">
                <input type="checkbox" id="debug-toggle-tiles">
                <label for="debug-toggle-tiles">Load Tile Layer & Context</label>
            </div>
            <button class="debug-btn" id="btn-generate-quest">
                Vygenerovat dotazník
            </button>

            <hr style="border-color: #636e72; margin: 10px 0;">
            <h4>Datasets (GeoJSON)</h4>
            <div class="debug-row">
                <input type="checkbox" id="debug-toggle-all-files">
                <label for="debug-toggle-all-files"><strong>Toggle ALL Datasets</strong></label>
            </div>
            <div id="debug-file-list">Loading files...</div>
        `;

        document.body.appendChild(panel);

        // Listenmap.onery
        document.getElementById('debug-toggle-tiles').addEventListener('change', (e) => {
            if (e.target.checked) {
                if (typeof initTileLayer === 'function') initTileLayer(map);
            }
        });

      document.getElementById('btn-generate-quest').addEventListener('click', () => {
            if (typeof QuestionnaireManager !== 'undefined') {
                QuestionnaireManager.forceOpen();
            } else {
                alert("Chyba: QuestionnaireManager nenalezen.");
            }
        });
        this.loadFileList(map);
    },

    loadFileList: function(map) {
        const container = document.getElementById('debug-file-list');
        
        fetch('/api/files')
            .then(res => res.json())
            .then(files => {
                container.innerHTML = ''; 
                const toggleAll = document.getElementById('debug-toggle-all-files');
                const fileCheckboxes = [];

                files.forEach(file => {
                    const row = document.createElement('div');
                    row.className = 'debug-row';
                    
                    const cb = document.createElement('input');
                    cb.type = 'checkbox';
                    cb.id = `file-${file}`;
                    
                    const lbl = document.createElement('label');
                    lbl.htmlFor = `file-${file}`;
                    lbl.innerText = file;

                    cb.addEventListener('change', (e) => {
                        if (e.target.checked) {
                            FileLoader.loadFile(map, file, null);
                        } else {
                            FileLoader.removeFile(map, file);
                        }
                    });

                    fileCheckboxes.push(cb);
                    row.appendChild(cb);
                    row.appendChild(lbl);
                    container.appendChild(row);
                });

                toggleAll.addEventListener('change', (e) => {
                    const shouldCheck = e.target.checked;
                    fileCheckboxes.forEach(cb => {
                        if (cb.checked !== shouldCheck) {
                            cb.checked = shouldCheck;
                            cb.dispatchEvent(new Event('change'));
                        }
                    });
                });
            })
            .catch(err => {
                if(container) container.innerText = "Error loading files.";
                console.error(err);
            });
    }
};