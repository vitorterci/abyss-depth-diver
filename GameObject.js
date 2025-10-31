/**
 * GameObject.js
 * Classe base para todos os objetos do jogo (monstros, obstáculos, bolhas)
 */

class GameObject {
    /**
     * Construtor do GameObject
     * @param {number} x - Posição X do objeto
     * @param {number} y - Posição Y do objeto (em coordenadas do mundo)
     * @param {number} width - Largura do objeto
     * @param {number} height - Altura do objeto
     * @param {string} type - Tipo do objeto (shark, squid, angler, viper, rock, bubble)
     */
    constructor(x, y, width, height, type) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.type = type;
        
        // Propriedades de movimento
        this.velocityX = 0;
        this.velocityY = 0;
        
        // Propriedades específicas para monstros
        this.health = 0;
        this.speed = 0;
        this.id = 0;
        
        // Visibilidade (para sonar)
        this.visible = false;
        
        // Timestamp para animação
        this.createdAt = Date.now();
    }

    /**
     * Atualiza a posição do objeto com base na velocidade
     * @param {number} deltaTime - Tempo decorrido desde o último frame (em ms)
     */
    update(deltaTime = 1) {
        this.x += this.velocityX;
        this.y += this.velocityY;
    }

    /**
     * Verifica se o objeto está fora da tela
     * @param {number} screenWidth - Largura da tela
     * @param {number} screenHeight - Altura da tela
     * @param {number} depth - Profundidade atual do jogador
     * @returns {boolean} - true se o objeto está fora da tela
     */
    isOffScreen(screenWidth, screenHeight, depth) {
        // Verificar se está fora dos limites horizontais
        if (this.x < -200 || this.x > screenWidth + 200) {
            return true;
        }
        
        // Verificar se está muito longe da profundidade do jogador
        if (Math.abs(this.y - depth) > 1200) {
            return true;
        }
        
        return false;
    }

    /**
     * Obtém o hitbox do objeto
     * @returns {Object} - Objeto com propriedades x, y, width, height
     */
    getHitbox() {
        let offsetX = 0;
        let offsetY = 0;
        let hitboxWidth = this.width;
        let hitboxHeight = this.height;

        // Ajustes de Hitbox para objetos específicos (estimativas baseadas em formas típicas)
        switch (this.type) {
            case 'shark':
                // Corpo principal do tubarão (ignorar cauda e nadadeiras)
                offsetX = this.width * 0.1;
                offsetY = this.height * 0.2;
                hitboxWidth = this.width * 0.8;
                hitboxHeight = this.height * 0.6;
                break;
            case 'squid':
                // Corpo principal da lula (ignorar tentáculos)
                offsetX = this.width * 0.2;
                offsetY = this.height * 0.1;
                hitboxWidth = this.width * 0.6;
                hitboxHeight = this.height * 0.8;
                break;
            case 'angler':
                // Corpo principal do peixe (ignorar luz e nadadeiras)
                offsetX = this.width * 0.15;
                offsetY = this.height * 0.2;
                hitboxWidth = this.width * 0.7;
                hitboxHeight = this.height * 0.6;
                break;
            case 'viper':
                // Corpo da víbora (ignorar cauda fina)
                offsetX = this.width * 0.05;
                offsetY = this.height * 0.1;
                hitboxWidth = this.width * 0.9;
                hitboxHeight = this.height * 0.8;
                break;
            case 'rock':
                // Rocha (usar 80% do tamanho para um buffer)
                offsetX = this.width * 0.1;
                offsetY = this.height * 0.1;
                hitboxWidth = this.width * 0.8;
                hitboxHeight = this.height * 0.8;
                break;
            case 'bubble':
                // Bolha (usar 70% do tamanho para um buffer)
                offsetX = this.width * 0.15;
                offsetY = this.height * 0.15;
                hitboxWidth = this.width * 0.7;
                hitboxHeight = this.height * 0.7;
                break;
            default:
                // Submarino já tem sua própria lógica de hitbox em Submarine.js
                break;
        }

        return {
            x: this.x + offsetX,
            y: this.y + offsetY,
            width: hitboxWidth,
            height: hitboxHeight
        };
    }

    /**
     * Verifica colisão AABB (Axis-Aligned Bounding Box) com outro objeto
     * @param {GameObject} other - Outro objeto para verificar colisão
     * @returns {boolean} - true se há colisão
     */
    collidesWith(other) {
        const hitbox1 = this.getHitbox();
        const hitbox2 = other.getHitbox();

        return (
            hitbox1.x < hitbox2.x + hitbox2.width &&
            hitbox1.x + hitbox1.width > hitbox2.x &&
            hitbox1.y < hitbox2.y + hitbox2.height &&
            hitbox1.y + hitbox1.height > hitbox2.y
        );
    }

    /**
     * Obtém o centro do objeto
     * @returns {Object} - Objeto com propriedades x, y
     */
    getCenter() {
        return {
            x: this.x + this.width / 2,
            y: this.y + this.height / 2
        };
    }

    /**
     * Calcula a distância até outro objeto
     * @param {GameObject} other - Outro objeto
     * @returns {number} - Distância em pixels
     */
    distanceTo(other) {
        const center1 = this.getCenter();
        const center2 = other.getCenter();
        const dx = center2.x - center1.x;
        const dy = center2.y - center1.y;
        return Math.sqrt(dx * dx + dy * dy);
    }

    /**
     * Retorna uma representação em string do objeto (para debug)
     * @returns {string}
     */
    toString() {
        return `GameObject(type: ${this.type}, x: ${this.x}, y: ${this.y}, width: ${this.width}, height: ${this.height})`;
    }
}
