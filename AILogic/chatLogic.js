
/**AILogic/chatLogic */

/**
 * Configuration constants to avoid magic strings throughout the code.
 */
const CHAT_CONFIG = {
    domIds: {
        container: 'ai-chat-container',
        header: 'chat-header',
        messages: 'chat-messages',
        input: 'chat-input',
        sendBtn: 'chat-send-btn',
        toggleIcon: 'chat-toggle-icon',
        typingIndicator: 'typing-indicator'
    },
    api: {
        endpoint: '/api/chat',
        model: 'gpt-oss:latest'
    },
    cssClasses: {
        minimized: 'minimized',
        msgUser: 'message msg-user',
        msgAi: 'message msg-ai'
    }
};

const AIChat = {
    // Cache for DOM elements to avoid repeated lookups
    elements: {},

    init: function() {
        this.createUI();
        this.cacheDOMElements();
        this.attachEvents();
    },

    /**
     * Renders the chat interface into the DOM.
     */
    createUI: function() {
        const { domIds, cssClasses } = CHAT_CONFIG;
        
        const container = document.createElement('div');
        container.id = domIds.container;
        container.className = cssClasses.minimized;

        container.innerHTML = `
            <div class="chat-header" id="${domIds.header}">
                <span>AI Assistant (Ollama)</span>
                <span id="${domIds.toggleIcon}">▲</span>
            </div>
            <div class="chat-messages" id="${domIds.messages}">
                <div class="${cssClasses.msgAi}">Hello! I am your local AI assistant. How can I help you with the map?</div>
            </div>
            <div class="typing-indicator" id="${domIds.typingIndicator}">AI is thinking...</div>
            <div class="chat-input-area">
                <input type="text" id="${domIds.input}" placeholder="Type a message..." autocomplete="off">
                <button id="${domIds.sendBtn}">Send</button>
            </div>
        `;

        document.body.appendChild(container);
    },

    /**
     * Stores references to DOM elements for efficient access.
     */
    cacheDOMElements: function() {
        const ids = CHAT_CONFIG.domIds;
        this.elements = {
            container: document.getElementById(ids.container),
            header: document.getElementById(ids.header),
            messages: document.getElementById(ids.messages),
            input: document.getElementById(ids.input),
            sendBtn: document.getElementById(ids.sendBtn),
            toggleIcon: document.getElementById(ids.toggleIcon),
            indicator: document.getElementById(ids.typingIndicator)
        };
    },

    attachEvents: function() {
        const { header, input, sendBtn } = this.elements;

        // 1. Toggle Minimize/Maximize
        header.addEventListener('click', () => this.toggleChatWindow());

        // 2. Send Message interactions
        sendBtn.addEventListener('click', () => this.handleUserSubmit());
        input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.handleUserSubmit();
        });
    },

    toggleChatWindow: function() {
        const { container, toggleIcon } = this.elements;
        const isMinimized = container.classList.toggle(CHAT_CONFIG.cssClasses.minimized);
        toggleIcon.innerText = isMinimized ? '▲' : '▼';
    },

    handleUserSubmit: function() {
        const text = this.elements.input.value.trim();
        if (!text) return;

        this.addMessage(text, 'user');
        this.elements.input.value = '';
        this.processAIRequest(text);
    },

    addMessage: function(text, type) {
        const { messages } = this.elements;
        const div = document.createElement('div');
        
        div.className = type === 'user' 
            ? CHAT_CONFIG.cssClasses.msgUser 
            : CHAT_CONFIG.cssClasses.msgAi;
            
        div.innerText = text;
        messages.appendChild(div);
        messages.scrollTop = messages.scrollHeight;
    },

    /**
     * Sets the UI state (loading indicator, button disable).
     */
    setLoadingState: function(isLoading) {
        const { indicator, sendBtn } = this.elements;
        indicator.style.display = isLoading ? 'block' : 'none';
        sendBtn.disabled = isLoading;
    },

    /**
     * Constructs the prompt based on whether a map tile is selected.
     */
    buildPromptWithContext: function(userPrompt) {
        const context = window.CurrentTileContext;

        if (!context) {
            return `USER QUESTION (No specific map tile selected): ${userPrompt}`;
        }

        const systemInstruction = `
[SYSTEM CONTEXT - CURRENT MAP SELECTION]
Tile ID: ${context.id}
Scores (0-100): 
- Health: ${context.scores.healthcare}
- Education: ${context.scores.education}
- Transport: ${context.scores.transport}
- Culture: ${context.scores.culture}

LIST OF OBJECTS IN THIS AREA:
${JSON.stringify(context.objects_nearby, null, 2)}

INSTRUCTION: You are an urban analysis assistant. Answer the user's question based strictly on the data above. If the data shows low scores, explain why based on the missing objects.
--------------------------------------------------
`;
        return `${systemInstruction}\nUSER QUESTION: ${userPrompt}`;
    },

    /**
     * Main logic for handling the backend communication.
     */
    processAIRequest: async function(userText) {
        this.setLoadingState(true);
        const finalPrompt = this.buildPromptWithContext(userText);

        try {
            const response = await fetch(CHAT_CONFIG.api.endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    prompt: finalPrompt,
                    model: CHAT_CONFIG.api.model 
                })
            });

            const data = await response.json();

            if (data.error) {
                this.addMessage(`Error: ${data.error}`, 'ai');
            } else {
                this.addMessage(data.reply, 'ai');
            }

        } catch (error) {
            console.error("Chat error:", error);
            this.addMessage("Connection error. Is the Python server running?", 'ai');
        } finally {
            this.setLoadingState(false);
        }
    }
};

// Initialize application
document.addEventListener('DOMContentLoaded', () => {
    AIChat.init();
});