// logic/config.js

const AppConfig = {
    debug: false,
    language: 'cs',
    debugBannerText: "DEBUG MODE (Tiles & Grid Visible)",
};

(function initConfig() {
    const urlParams = new URLSearchParams(window.location.search);
    
    if (urlParams.has('debug')) {
        AppConfig.debug = urlParams.get('debug') === 'true' || urlParams.get('debug') === '';
    }
    
    if (urlParams.has('lang')) {
        AppConfig.language = urlParams.get('lang');
    }

    if (AppConfig.debug) {
        console.log("APLICATION IN DEBUG MODE");

        const applyDebugUI = () => {
            document.body.classList.add('is-debug');

            const banner = document.createElement('div');
            banner.id = 'debug-banner';
            banner.innerText = AppConfig.debugBannerText;
            document.body.appendChild(banner);
        };

        if (document.body) {
            applyDebugUI();
        } else {
            window.addEventListener('DOMContentLoaded', applyDebugUI);
        }
    }
})();