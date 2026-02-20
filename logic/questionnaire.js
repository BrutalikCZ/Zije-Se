// logic/questionnaire.js

const QuestionnaireManager = {
    active: false,

    init: function() {
        const isDebug = (typeof AppConfig !== 'undefined' && AppConfig.debug);
        
        const forceSurvey = new URLSearchParams(window.location.search).get('mode') === 'survey';

        if (!isDebug || forceSurvey) {
            this.active = true;
            console.log("Questionnare active, awaiting input");
            document.body.classList.add('mode-questionnaire');
            
            window.addEventListener('DOMContentLoaded', () => {
                this.createModal();
            });
        } else {
            console.log(" Debug mode: Questionnare skipped");
        }
        
        return this.active;
    },

    forceOpen: function() {
        if (document.getElementById('quest-overlay')) return;

        console.log("Debug: Vynucené otevření dotazníku.");
        this.active = true;
        document.body.classList.add('mode-questionnaire');
        this.createModal();
    },

    createModal: function() {
        const overlay = document.createElement('div');
        overlay.id = 'quest-overlay';

        overlay.innerHTML = `
            <div id="quest-box">
                <h1>Vítejte v průzkumu</h1>
                <p>
                    Tato aplikace slouží k analýze dostupnosti služeb ve vašem okolí.<br>
                    Pro nejpřesnější výsledky prosím zvolte vaši situaci:
                </p>
                
                <div class="quest-btn-group">
                    <button class="quest-btn btn-car" id="btn-has-car"> Mám auto</button>
                    <button class="quest-btn btn-nocar" id="btn-no-car"> Nemám auto (MHD/Pěšky)</button>
                    <button class="quest-btn btn-skip" id="btn-skip">Mód prohlížení (přeskočit)</button>
                </div>
            </div>
        `;

        document.body.appendChild(overlay);

        
        document.getElementById('btn-has-car').addEventListener('click', () => {
            console.log("Volba: Mám auto");
            this.closeModal();
        });

        document.getElementById('btn-no-car').addEventListener('click', () => {
            console.log("Volba: Nemám auto");
            this.closeModal();
        });

        document.getElementById('btn-skip').addEventListener('click', () => {
            console.log("Volba: Přeskočit");
            this.closeModal();
        });
    },

    closeModal: function() {
        const overlay = document.getElementById('quest-overlay');
        if (overlay) {
            overlay.style.transition = "opacity 0.3s";
            overlay.style.opacity = "0";
            
            setTimeout(() => {
                overlay.remove();
                document.body.classList.remove('mode-questionnaire');
                this.active = false;

                const isDebug = (typeof AppConfig !== 'undefined' && AppConfig.debug);

                if (!isDebug && typeof DebugManager !== 'undefined' && window.map) {
                    console.log("Questionare finished (User Mode). Starting App...");
                    DebugManager.autoLoadStandard(window.map);
                } else {
                    console.log("Questionare finished (Debug Mode). Returning to control panel.");
                }

            }, 300);
        }
    }
};

QuestionnaireManager.init();