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
