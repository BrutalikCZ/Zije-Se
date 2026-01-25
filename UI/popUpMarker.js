// file: popupConfig.js

/**
 * Configuration object for Map Popups.
 * Handles styling and HTML content generation.
 */
const PopupConfig = {
    /**
     * CSS styles for the popup table.
     */
    css: `
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
        /* Adjustment for MapLibre popup (remove excessive padding) */
        .maplibregl-popup-content {
            padding: 10px;
        }
    `,

    /**
     * Injects the CSS into the document head.
     */
    injectStyles: function() {
        const styleSheet = document.createElement("style");
        styleSheet.textContent = this.css;
        document.head.appendChild(styleSheet);
        console.log("Popup styles injected.");
    },

    /**
     * Generates HTML table for feature properties.
     * @param {Object} properties - The feature properties.
     * @returns {string} HTML string.
     */
    createContent: function(properties) {
        if (!properties || Object.keys(properties).length === 0) {
            return '<strong>No details available</strong>';
        }

        let html = '<table class="popup-table">';
        for (const key in properties) {
            // Basic protection against null/undefined values
            const value = properties[key] !== null ? properties[key] : '';
            html += `
                <tr>
                    <th>${key}</th>
                    <td>${value}</td>
                </tr>
            `;
        }
        html += '</table>';
        return html;
    }
};

// Automatically inject styles when this script is loaded
PopupConfig.injectStyles();