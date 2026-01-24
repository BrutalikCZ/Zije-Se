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


