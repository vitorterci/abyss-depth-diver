/**
 * Game.js
 * Classe principal que gerencia o estado e a lógica do jogo
 */

class Game {
    constructor(canvas) {
        // Componentes principais
        this.canvas = canvas;
        this.renderer = new Renderer(canvas);
        this.inputHandler = new InputHandler(this);
        this.collisionDetector = new CollisionDetector();
        this.submarine = new Submarine(350, 270, 100, 60);

        // Estado do jogo
        this.gameState = {
            oxygen: 100,
            energy: 100,
            health: 100,
            depth: 0,
            score: 0,
            sonarActive: false,
            sonarCooldown: 0
        };

        // Objetos do jogo
        this.monsters = [];
        this.obstacles = [];
        this.bubbles = [];
        this.particles = [];

        // Upgrades
        this.upgrades = {
            oxygenTank: false,
            advancedSonar: false,
            reinforcedHull: false,
            turboThrust: false
        };

        // Controle de spawn
        this.nextMonsterId = 1;
        this.lastSpawnDepth = 0;
        this.lastResourceUpdate = 0;
        this.resourceUpdateInterval = 50;

        // Controle de estado
        this.gameOverTriggered = false;
        this.gameOverReason = '';
        this.debugMode = false;
        this.menuOpen = null;
        this.hint = '';
        this.hintTimeout = null;

        // Recompensas reclamadas
        this.claimedRewards = new Set();

        // Loop do jogo
        this.lastFrameTime = Date.now();
        this.frameCount = 0;
        this.fps = 0;

        this.initializeParticles();
        this.setupUIEventListeners();
    }

    /**
     * Inicializa partículas ambientes
     */
    initializeParticles() {
        this.particles = Array.from({ length: 50 }, () => ({
            x: Math.random() * 800,
            y: Math.random() * 600,
            size: Math.random() * 3 + 1,
            speed: Math.random() * 0.5 + 0.2
        }));
    }

    /**
     * Configura event listeners da UI
     */
    setupUIEventListeners() {
        // Botão de reiniciar
        const restartButton = document.getElementById('restartButton');
        if (restartButton) {
            restartButton.addEventListener('click', () => this.restart());
        }

        // Botões de fechar menus
        const closeMissionsBtn = document.getElementById('closeMissionsMenu');
        const closeUpgradesBtn = document.getElementById('closeUpgradesMenu');

        if (closeMissionsBtn) {
            closeMissionsBtn.addEventListener('click', () => this.closeMenu());
        }
        if (closeUpgradesBtn) {
            closeUpgradesBtn.addEventListener('click', () => this.closeMenu());
        }

        // Overlay de menu
        const menuOverlay = document.getElementById('menuOverlay');
        if (menuOverlay) {
            menuOverlay.addEventListener('click', () => this.closeMenu());
        }
    }

    /**
     * Ativa o sonar
     */
    activateSonar() {
        if (this.gameState.energy >= 20 && this.gameState.sonarCooldown <= 0 && !this.gameState.sonarActive) {
            this.gameState.energy = Math.max(0, this.gameState.energy - (this.upgrades.advancedSonar ? 10 : 20));
            this.gameState.sonarActive = true;
            this.gameState.sonarCooldown = 5;

            this.showHint('✓ Sonar ativado!');

            setTimeout(() => {
                this.gameState.sonarActive = false;
            }, 3000);
        } else if (this.gameState.energy < 20) {
            this.showHint('✗ Energia insuficiente!');
        } else if (this.gameState.sonarCooldown > 0) {
            this.showHint('✗ Sonar em cooldown!');
        }
    }

    /**
     * Alterna o menu
     * @param {string} menuName - Nome do menu (missions, upgrades)
     */
    toggleMenu(menuName) {
        if (this.menuOpen === menuName) {
            this.closeMenu();
        } else {
            this.openMenu(menuName);
        }
    }

    /**
     * Abre um menu
     * @param {string} menuName - Nome do menu
     */
    openMenu(menuName) {
        this.menuOpen = menuName;
        const overlay = document.getElementById('menuOverlay');
        const missionsMenu = document.getElementById('missionsMenu');
        const upgradesMenu = document.getElementById('upgradesMenu');

        if (overlay) overlay.style.display = 'block';
        if (missionsMenu) missionsMenu.style.display = menuName === 'missions' ? 'block' : 'none';
        if (upgradesMenu) upgradesMenu.style.display = menuName === 'upgrades' ? 'block' : 'none';

        this.updateUpgradesDisplay();
    }

    /**
     * Fecha o menu
     */
    closeMenu() {
        this.menuOpen = null;
        const overlay = document.getElementById('menuOverlay');
        const missionsMenu = document.getElementById('missionsMenu');
        const upgradesMenu = document.getElementById('upgradesMenu');

        if (overlay) overlay.style.display = 'none';
        if (missionsMenu) missionsMenu.style.display = 'none';
        if (upgradesMenu) upgradesMenu.style.display = 'none';
    }

    /**
     * Alterna o modo debug
     */
    toggleDebugMode() {
        this.debugMode = !this.debugMode;
        this.showHint(this.debugMode ? '🔧 Debug ON' : '🔧 Debug OFF');
    }

    /**
     * Mostra uma dica na tela
     * @param {string} text - Texto da dica
     */
    showHint(text) {
        this.hint = text;
        const hintDisplay = document.getElementById('hintDisplay');
        if (hintDisplay) {
            hintDisplay.textContent = text;
            hintDisplay.classList.add('active');
        }

        if (this.hintTimeout) clearTimeout(this.hintTimeout);
        this.hintTimeout = setTimeout(() => {
            this.hint = '';
            if (hintDisplay) hintDisplay.classList.remove('active');
        }, 3000);
    }

    /**
     * Atualiza a exibição de upgrades no menu
     */
    updateUpgradesDisplay() {
        const upgradeIds = ['oxygenTank', 'advancedSonar', 'reinforcedHull', 'turboThrust'];
        upgradeIds.forEach(id => {
            const element = document.getElementById(`upgrade-${id}`);
            if (element) {
                if (this.upgrades[id]) {
                    element.classList.add('unlocked');
                    const status = element.querySelector('.upgrade-status');
                    if (status) status.textContent = '✓ Desbloqueado';
                } else {
                    element.classList.remove('unlocked');
                }
            }
        });
    }

    /**
     * Atualiza a HUD
     */
    updateHUD() {
        document.getElementById('oxygenBar').style.width = `${Math.max(0, this.gameState.oxygen)}%`;
        document.getElementById('oxygenValue').textContent = `${Math.round(this.gameState.oxygen)}%`;

        document.getElementById('energyBar').style.width = `${Math.max(0, this.gameState.energy)}%`;
        document.getElementById('energyValue').textContent = `${Math.round(this.gameState.energy)}%`;

        document.getElementById('healthBar').style.width = `${Math.max(0, this.gameState.health)}%`;
        document.getElementById('healthValue').textContent = `${Math.round(this.gameState.health)}%`;

        document.getElementById('depthValue').textContent = `${Math.round(this.gameState.depth)}m`;
        document.getElementById('scoreValue').textContent = `${Math.round(this.gameState.score)}`;

        if (this.gameState.sonarCooldown > 0) {
            document.getElementById('sonarValue').textContent = `${this.gameState.sonarCooldown.toFixed(1)}s`;
        } else {
            document.getElementById('sonarValue').textContent = 'Pronto';
        }
    }

    /**
     * Gera monstros proceduralmente
     */
    spawnMonsters() {
        const currentDepth = this.gameState.depth;

        if (currentDepth - this.lastSpawnDepth >= 400 + Math.random() * 300) {
            this.lastSpawnDepth = currentDepth;

            const enemyCount = Math.min(1 + Math.floor(currentDepth / 2000), 3);

            for (let i = 0; i < enemyCount; i++) {
                const monsterTypes = ['squid', 'angler', 'viper', 'shark'];
                const type = monsterTypes[Math.floor(Math.random() * monsterTypes.length)];

                const depthMultiplier = 1 + currentDepth / 5000;
                const direction = Math.random() > 0.5 ? 1 : -1;
                const baseSpeed = (type === 'viper' ? 1.5 : type === 'shark' ? 1.2 : type === 'squid' ? 0.8 : 0.6);

                const monster = new GameObject(
                    direction > 0 ? -100 : 900,
                    currentDepth + 600 + Math.random() * 400,
                    type === 'shark' ? 150 : type === 'angler' ? 100 : type === 'viper' ? 120 : 80,
                    type === 'shark' ? 100 : type === 'angler' ? 80 : type === 'viper' ? 60 : 80,
                    type
                );

                monster.id = this.nextMonsterId++;
                monster.velocityX = direction * baseSpeed * (1 + currentDepth / 10000);
                monster.velocityY = (Math.random() - 0.5) * 0.3;
                monster.health = Math.floor((type === 'shark' ? 200 : type === 'angler' ? 150 : type === 'viper' ? 120 : 100) * depthMultiplier);
                monster.speed = baseSpeed * (1 + currentDepth / 10000);
                monster.visible = false;

                this.monsters.push(monster);
            }
        }
    }

    /**
     * Gera obstáculos e bolhas proceduralmente
     */
    spawnProceduralElements() {
        const currentDepth = this.gameState.depth;

        // Spawn de obstáculos
        if (this.obstacles.length < 4 && Math.random() < 0.02) {
            const obstacle = new GameObject(
                Math.random() * 700 + 50,
                currentDepth + 400 + Math.random() * 400,
                80 + Math.random() * 40,
                80 + Math.random() * 40,
                'rock'
            );
            obstacle.id = this.nextMonsterId++;
            this.obstacles.push(obstacle);
        }

        // Spawn de bolhas
        if (this.bubbles.length < 5 && Math.random() < 0.025) {
            const bubble = new GameObject(
                Math.random() * 750 + 25,
                currentDepth + 500 + Math.random() * 300,
                40,
                40,
                'bubble'
            );
            bubble.id = this.nextMonsterId++;
            this.bubbles.push(bubble);
        }
    }

    /**
     * Atualiza o estado do jogo
     * @param {number} deltaTime - Tempo decorrido desde o último frame
     */
    update(deltaTime) {
        if (this.gameOverTriggered || this.menuOpen) return;

        // Atualizar entrada
        this.inputHandler.updateCameraOffset();
        const keys = this.inputHandler.getKeys();

        // Atualizar submarino
        const { worldOffsetY } = this.submarine.update(keys, deltaTime);

        // Mover objetos do mundo
        if (worldOffsetY !== 0) {
            this.monsters.forEach(m => m.y += worldOffsetY);
            this.obstacles.forEach(o => o.y += worldOffsetY);
            this.bubbles.forEach(b => b.y += worldOffsetY);
        }

        // Atualizar profundidade
        if (keys.has('s')) {
            this.gameState.depth = Math.min(11000, this.gameState.depth + 5);

            // Verificar recompensas de profundidade
            this.checkDepthRewards();
        }

        // Atualizar profundidade de cor
        this.renderer.updateDepthColor(this.gameState.depth);

        // Atualizar partículas
        this.particles = this.particles.map(p => ({
            ...p,
            y: (p.y - p.speed + 600) % 600,
            x: p.x + Math.sin(Date.now() / 1000 + p.y) * 0.5
        }));

        // Atualizar recursos (throttled)
        const now = Date.now();
        if (now - this.lastResourceUpdate >= this.resourceUpdateInterval) {
            this.lastResourceUpdate = now;

            this.gameState.oxygen = Math.max(0, this.gameState.oxygen - 0.05);
            this.gameState.energy = Math.min(100, this.gameState.energy + 0.02);
            this.gameState.sonarCooldown = Math.max(0, this.gameState.sonarCooldown - 0.016);

            if (this.gameState.oxygen < 20 && this.hint === '') {
                this.showHint('⚠ Oxigênio baixo! Colete bolhas de ar!');
            }
        }

        // Atualizar monstros
        this.monsters.forEach(m => {
            const swimMotion = Math.sin(Date.now() / 500 + m.x) * 0.5;
            m.x += m.velocityX;
            m.y += m.velocityY + swimMotion;

            // Bounce nas bordas
            if (m.x < -150 || m.x > 950) {
                m.velocityX = -m.velocityX;
            }

            m.visible = this.gameState.sonarActive;
        });

        // Limpar objetos fora de tela
        this.monsters = this.monsters.filter(m => !m.isOffScreen(800, 600, this.gameState.depth));
        this.obstacles = this.obstacles.filter(o => !o.isOffScreen(800, 600, this.gameState.depth));
        this.bubbles = this.bubbles.filter(b => !b.isOffScreen(800, 600, this.gameState.depth));

        // Verificar colisões com monstros
        const cameraOffset = this.inputHandler.getCameraOffset();
        const monsterCollisions = this.collisionDetector.checkMonsterCollisions(
            this.submarine,
            this.monsters,
            this.gameState.depth,
            cameraOffset
        );

        monsterCollisions.forEach(monster => {
            const damage = this.upgrades.reinforcedHull ? 7 : 10;
            this.gameState.health = Math.max(0, this.gameState.health - damage);
            this.showHint(`✗ -${damage} HP - Criatura marinha!`);
        });

        this.monsters = this.monsters.filter(m => !monsterCollisions.includes(m));

        // Verificar colisões com obstáculos
        const obstacleCollisions = this.collisionDetector.checkObstacleCollisions(
            this.submarine,
            this.obstacles,
            this.gameState.depth,
            cameraOffset
        );

        obstacleCollisions.forEach(obstacle => {
            const damage = this.upgrades.reinforcedHull ? 17 : 25;
            this.gameState.health = Math.max(0, this.gameState.health - damage);
            this.showHint(`✗ -${damage} HP - Impacto com rocha!`);
        });

        this.obstacles = this.obstacles.filter(o => !obstacleCollisions.includes(o));

        // Verificar colisões com bolhas
        const bubbleCollisions = this.collisionDetector.checkBubbleCollisions(
            this.submarine,
            this.bubbles,
            this.gameState.depth,
            cameraOffset
        );

        if (bubbleCollisions.length > 0) {
            this.gameState.oxygen = Math.min(100, this.gameState.oxygen + 15 * bubbleCollisions.length);
            this.showHint(`✓ +${15 * bubbleCollisions.length} Oxigênio!`);
        }

        this.bubbles = this.bubbles.filter(b => !bubbleCollisions.includes(b));

        // Spawn procedural
        this.spawnMonsters();
        this.spawnProceduralElements();

        // Verificar condições de fim de jogo
        if (this.gameState.depth >= 11000) {
            this.endGame('Vitória! Você alcançou o fundo do abismo!', this.gameState.score + 10000);
        } else if (this.gameState.oxygen <= 0) {
            this.endGame('Oxigênio esgotado!', this.gameState.score);
        } else if (this.gameState.health <= 0) {
            this.endGame('Submarino destruído!', this.gameState.score);
        }

        // Atualizar HUD
        this.updateHUD();
    }

    /**
     * Verifica recompensas de profundidade
     */
    checkDepthRewards() {
        const depth = this.gameState.depth;

        const rewards = [
            { depth: 2000, oxygen: 20, points: 500, message: '🎉 Zona Batial alcançada!' },
            { depth: 4000, oxygen: 30, points: 1000, message: '🎉 Zona Abissal alcançada!' },
            { depth: 6000, oxygen: 40, points: 2000, message: '🎉 Zona Hadal alcançada!' }
        ];

        rewards.forEach(reward => {
            if (depth >= reward.depth && !this.claimedRewards.has(reward.depth)) {
                this.claimedRewards.add(reward.depth);
                this.gameState.oxygen = Math.min(100, this.gameState.oxygen + reward.oxygen);
                this.gameState.score += reward.points;
                this.showHint(reward.message);
            }
        });

        // Desbloquear upgrades
        if (depth >= 3000 && !this.upgrades.oxygenTank) {
            this.upgrades.oxygenTank = true;
            this.showHint('🔓 Upgrade: Tanque de Oxigênio Expandido!');
        }
        if (depth >= 5000 && !this.upgrades.advancedSonar) {
            this.upgrades.advancedSonar = true;
            this.showHint('🔓 Upgrade: Sonar Avançado!');
        }
        if (depth >= 7000 && !this.upgrades.reinforcedHull) {
            this.upgrades.reinforcedHull = true;
            this.showHint('🔓 Upgrade: Casco Reforçado!');
        }
        if (depth >= 9000 && !this.upgrades.turboThrust) {
            this.upgrades.turboThrust = true;
            this.showHint('🔓 Upgrade: Propulsor Turbo!');
        }
    }

    /**
     * Finaliza o jogo
     * @param {string} reason - Motivo do fim de jogo
     * @param {number} finalScore - Pontuação final
     */
    endGame(reason, finalScore) {
        this.gameOverTriggered = true;
        this.gameOverReason = reason;

        const gameOverScreen = document.getElementById('gameOverScreen');
        const gameOverTitle = document.getElementById('gameOverTitle');
        const gameOverReasonEl = document.getElementById('gameOverReason');
        const finalScoreEl = document.getElementById('finalScore');
        const maxDepthEl = document.getElementById('maxDepth');

        if (gameOverScreen) {
            gameOverScreen.style.display = 'flex';
        }

        if (gameOverTitle) {
            if (reason.includes('Vitória')) {
                gameOverTitle.textContent = 'VITÓRIA!';
                gameOverTitle.classList.add('victory');
            } else {
                gameOverTitle.textContent = 'GAME OVER';
                gameOverTitle.classList.remove('victory');
            }
        }

        if (gameOverReasonEl) {
            gameOverReasonEl.textContent = reason;
        }

        if (finalScoreEl) {
            finalScoreEl.textContent = Math.round(finalScore);
        }

        if (maxDepthEl) {
            maxDepthEl.textContent = `${Math.round(this.gameState.depth)}m`;
        }
    }

    /**
     * Reinicia o jogo
     */
    restart() {
        this.gameState = {
            oxygen: 100,
            energy: 100,
            health: 100,
            depth: 0,
            score: 0,
            sonarActive: false,
            sonarCooldown: 0
        };

        this.monsters = [];
        this.obstacles = [];
        this.bubbles = [];
        this.initializeParticles();

        this.upgrades = {
            oxygenTank: false,
            advancedSonar: false,
            reinforcedHull: false,
            turboThrust: false
        };

        this.nextMonsterId = 1;
        this.lastSpawnDepth = 0;
        this.lastResourceUpdate = 0;

        this.gameOverTriggered = false;
        this.gameOverReason = '';
        this.debugMode = false;
        this.menuOpen = null;
        this.hint = '';

        this.claimedRewards = new Set();

        this.submarine.reset();
        this.inputHandler.reset();
        this.collisionDetector.reset();
        this.renderer.reset();

        const gameOverScreen = document.getElementById('gameOverScreen');
        if (gameOverScreen) {
            gameOverScreen.style.display = 'none';
        }

        this.updateHUD();
    }

    /**
     * Inicia o loop do jogo
     */
    start() {
        const gameLoop = (currentTime) => {
            const deltaTime = currentTime - this.lastFrameTime;
            this.lastFrameTime = currentTime;

            // Limitar deltaTime a um máximo de 16ms (60 FPS mínimo)
            const clampedDeltaTime = Math.min(deltaTime, 16);

            this.update(clampedDeltaTime);

            const cameraOffset = this.inputHandler.getCameraOffset();
            this.renderer.render(
                this.gameState,
                this.submarine,
                this.monsters,
                this.obstacles,
                this.bubbles,
                this.particles,
                cameraOffset,
                this.debugMode
            );

            requestAnimationFrame(gameLoop);
        };

        requestAnimationFrame(gameLoop);
    }
}
