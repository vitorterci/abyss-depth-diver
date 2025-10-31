/**
 * InputHandler.js
 * Módulo responsável pela entrada de teclado e mouse
 */

class InputHandler {
    constructor(gameInstance) {
        this.game = gameInstance;
        this.keys = new Set();
        this.cameraOffset = 0;
        this.targetCameraOffset = 0;
        
        this.setupEventListeners();
    }

    /**
     * Configura os event listeners para teclado e mouse
     */
    setupEventListeners() {
        window.addEventListener('keydown', (e) => this.handleKeyDown(e));
        window.addEventListener('keyup', (e) => this.handleKeyUp(e));
        window.addEventListener('wheel', (e) => this.handleWheel(e), { passive: false });
    }

    /**
     * Manipula o evento de tecla pressionada
     * @param {KeyboardEvent} e - Evento de teclado
     */
    handleKeyDown(e) {
        const key = e.key.toLowerCase();
        this.keys.add(key);

        // Ações especiais
        if (key === ' ') {
            e.preventDefault();
            this.game.activateSonar();
        }
        if (key === 'arrowup') {
            e.preventDefault();
            this.targetCameraOffset = Math.max(-100, this.targetCameraOffset - 30);
        }
        if (key === 'arrowdown') {
            e.preventDefault();
            this.targetCameraOffset = Math.min(100, this.targetCameraOffset + 30);
        }
        if (key === 'm') {
            this.game.toggleMenu('missions');
        }
        if (key === 'u') {
            this.game.toggleMenu('upgrades');
        }
        if (key === 'escape') {
            this.game.closeMenu();
        }
        if (key === 'b') {
            this.game.toggleDebugMode();
        }
    }

    /**
     * Manipula o evento de tecla liberada
     * @param {KeyboardEvent} e - Evento de teclado
     */
    handleKeyUp(e) {
        const key = e.key.toLowerCase();
        this.keys.delete(key);
    }

    /**
     * Manipula o evento de rolagem do mouse
     * @param {WheelEvent} e - Evento de rolagem
     */
    handleWheel(e) {
        e.preventDefault();
        const delta = e.deltaY > 0 ? 30 : -30;
        this.targetCameraOffset = Math.max(-100, Math.min(100, this.targetCameraOffset + delta));
    }

    /**
     * Atualiza o offset da câmera com interpolação suave
     */
    updateCameraOffset() {
        this.cameraOffset += (this.targetCameraOffset - this.cameraOffset) * 0.1;
    }

    /**
     * Obtém o conjunto de teclas pressionadas
     * @returns {Set<string>}
     */
    getKeys() {
        return this.keys;
    }

    /**
     * Obtém o offset da câmera
     * @returns {number}
     */
    getCameraOffset() {
        return this.cameraOffset;
    }

    /**
     * Obtém o offset alvo da câmera
     * @returns {number}
     */
    getTargetCameraOffset() {
        return this.targetCameraOffset;
    }

    /**
     * Reseta o estado de entrada
     */
    reset() {
        this.keys.clear();
        this.cameraOffset = 0;
        this.targetCameraOffset = 0;
    }

    /**
     * Verifica se uma tecla está pressionada
     * @param {string} key - Tecla a verificar
     * @returns {boolean}
     */
    isKeyPressed(key) {
        return this.keys.has(key.toLowerCase());
    }

    /**
     * Remove todos os event listeners
     */
    destroy() {
        window.removeEventListener('keydown', (e) => this.handleKeyDown(e));
        window.removeEventListener('keyup', (e) => this.handleKeyUp(e));
        window.removeEventListener('wheel', (e) => this.handleWheel(e));
    }
}
