/**
 * Submarine.js
 * Classe que gerencia o submarino (jogador)
 */

class Submarine extends GameObject {
    /**
     * Construtor do Submarino
     * @param {number} x - Posição X inicial
     * @param {number} y - Posição Y inicial (na tela)
     * @param {number} width - Largura do submarino
     * @param {number} height - Altura do submarino
     */
    constructor(x, y, width, height) {
        super(x, y, width, height, 'submarine');
        
        // Posição fixa na tela
        this.screenX = x;
        this.screenY = y;
        
        // Rotação (em graus)
        this.rotation = 0;
        this.targetRotation = 0;
        
        // Limites de movimento vertical
        this.centerY = y;
        this.maxVerticalOffset = 80; // Máximo de pixels para cima/baixo
        
        // Velocidade de movimento
        this.moveSpeed = 0.18; // Pixels por ms
        this.rotationSpeed = 1; // Graus por frame
        
        // Hitbox do submarino (55% width, 45% height, centrado no corpo principal)
        this.hitboxOffsetX = width * 0.225;  // Começa 22.5% da esquerda
        this.hitboxOffsetY = height * 0.275; // Começa 27.5% do topo (ignora a torre)
        this.hitboxWidth = width * 0.55;     // 55% da largura total
        this.hitboxHeight = height * 0.45;   // 45% da altura total
    }

    /**
     * Atualiza a posição do submarino com base nas teclas pressionadas
     * @param {Set<string>} keys - Conjunto de teclas pressionadas
     * @param {number} deltaTime - Tempo decorrido desde o último frame
     * @returns {Object} - Objeto com worldOffsetY (para mover o mundo)
     */
    update(keys, deltaTime = 1) {
        const speed = this.moveSpeed * deltaTime;
        let worldOffsetY = 0;

        // Movimento horizontal (A/D)
        if (keys.has('a')) {
            this.screenX = Math.max(0, this.screenX - speed);
            this.targetRotation = Math.max(-15, this.targetRotation - 1);
        } else if (keys.has('d')) {
            this.screenX = Math.min(800 - this.width, this.screenX + speed);
            this.targetRotation = Math.min(15, this.targetRotation + 1);
        } else {
            // Retorno suave ao centro
            this.targetRotation *= 0.9;
        }

        // Movimento vertical (W/S) - submarino se move ligeiramente, mundo se move para profundidade
        if (keys.has('w')) {
            // Mover submarino para cima (limitado)
            this.screenY = Math.max(
                this.centerY - this.maxVerticalOffset,
                this.screenY - (speed * 0.5)
            );
            worldOffsetY = speed; // Mover mundo para baixo (simulando subida)
        }
        if (keys.has('s')) {
            // Mover submarino para baixo (limitado)
            this.screenY = Math.min(
                this.centerY + this.maxVerticalOffset,
                this.screenY + (speed * 0.5)
            );
            worldOffsetY = -speed; // Mover mundo para cima (simulando descida)
        }

        // Suavizar rotação
        this.rotation += (this.targetRotation - this.rotation) * 0.1;

        return { worldOffsetY };
    }

    /**
     * Obtém o hitbox do submarino em coordenadas de tela
     * @returns {Object} - Objeto com x, y, width, height
     */
    getScreenHitbox() {
        return {
            x: this.screenX + this.hitboxOffsetX,
            y: this.screenY + this.hitboxOffsetY,
            width: this.hitboxWidth,
            height: this.hitboxHeight
        };
    }

    /**
     * Obtém o hitbox do submarino em coordenadas do mundo
     * @param {number} depth - Profundidade atual
     * @returns {Object} - Objeto com x, y, width, height
     */
    getWorldHitbox(depth) {
        const screenHitbox = this.getScreenHitbox();
        return {
            x: screenHitbox.x,
            y: screenHitbox.y + depth,
            width: screenHitbox.width,
            height: screenHitbox.height
        };
    }

    /**
     * Obtém o centro do submarino em coordenadas de tela
     * @returns {Object} - Objeto com x, y
     */
    getScreenCenter() {
        return {
            x: this.screenX + this.width / 2,
            y: this.screenY + this.height / 2
        };
    }

    /**
     * Reseta a posição do submarino
     */
    reset() {
        this.screenX = 350;
        this.screenY = this.centerY;
        this.rotation = 0;
        this.targetRotation = 0;
    }

    /**
     * Retorna uma representação em string do submarino (para debug)
     * @returns {string}
     */
    toString() {
        return `Submarine(screenX: ${this.screenX}, screenY: ${this.screenY}, rotation: ${this.rotation})`;
    }
}
