          if (newHealth === 0 && !gameOverTriggered.current) {
            gameOverTriggered.current = true;
            setTimeout(() => onGameOver(prev.score, prev.depth, "Impacto com rocha!"), 100);
          }
          return { ...prev, health: newHealth };
        });
        toast.error(`-${damage} HP - Rocha!`);
      }
    });
    
    if (obstaclesToRemove.size > 0) {
      setObstacles(prev => prev.filter(o => !obstaclesToRemove.has(o)));
      // Clean up cooldown after removal
      setTimeout(() => {
        obstaclesToRemove.forEach(o => collisionCooldownRef.current.delete(o));
      }, 100);
    }

    // Check bubble collection and remove them efficiently
    const collectedBubbles = new Set<GameObject>();
    bubbles.forEach(bubble => {
      if (
        subHitbox.x < bubble.x + bubble.width &&
        subHitbox.x + subHitbox.width > bubble.x &&
        subHitbox.y < bubble.y + bubble.height &&
        subHitbox.y + subHitbox.height > bubble.y
      ) {
        collectedBubbles.add(bubble);
      }
    });
    
    if (collectedBubbles.size > 0) {
      setGameState(prev => ({ ...prev, oxygen: Math.min(100, prev.oxygen + 15 * collectedBubbles.size) }));
      setBubbles(prev => prev.filter(b => !collectedBubbles.has(b)));
      toast.success(`+${15 * collectedBubbles.size} Oxigênio!`);
    }

    // Spawn entities procedurally
    spawnProceduralElements();

    // Check win condition
    if (gameState.depth >= 11000 && !gameOverTriggered.current) {
      gameOverTriggered.current = true;
      toast.success("Você alcançou o fundo do abismo!");
      setTimeout(() => onGameOver(gameState.score + 10000, gameState.depth, "Vitória! Fundo do abismo alcançado!"), 100);
    }
    
    // Check game over conditions
    if (gameState.oxygen <= 0 && !gameOverTriggered.current) {
      gameOverTriggered.current = true;
      setTimeout(() => onGameOver(gameState.score, gameState.depth, "Oxigênio esgotado!"), 100);
    }
    if (gameState.health <= 0 && !gameOverTriggered.current) {
      gameOverTriggered.current = true;
      setTimeout(() => onGameOver(gameState.score, gameState.depth, "Submarino destruído!"), 100);
    }
  }, [
    submarine,
    keys,
    monsters,
    obstacles,
    bubbles,
    gameState,
    menuOpen,
    onGameOver,
    spawnProceduralElements,
    hint,
    upgrades,
    claimedRewards,
    targetCameraOffset,
  ]);

  useGameLoop(update, !menuOpen);

  // Render with enhanced visuals
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Clear canvas and enable crisp pixel rendering
    ctx.imageSmoothingEnabled = false;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw ocean background gradient
    const bgGradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    bgGradient.addColorStop(0, `rgb(${depthColorRef.current.r}, ${depthColorRef.current.g + 50}, ${depthColorRef.current.b + 100})`);
    bgGradient.addColorStop(0.5, `rgb(${depthColorRef.current.r}, ${depthColorRef.current.g}, ${depthColorRef.current.b})`);
    bgGradient.addColorStop(1, `rgb(${depthColorRef.current.r}, ${Math.max(0, depthColorRef.current.g - 20)}, ${Math.max(0, depthColorRef.current.b - 40)})`);
    ctx.fillStyle = bgGradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw light rays from above (only in shallow depths) - optimized
    if (gameState.depth < 2000) {
      const lightOpacity = Math.max(0, (2000 - gameState.depth) / 2000) * 0.15;
      for (let i = 0; i < 3; i++) {
        const rayGradient = ctx.createLinearGradient(
          150 + i * 200,
          0,
          200 + i * 200,
          canvas.height
        );
        rayGradient.addColorStop(0, `rgba(100, 200, 255, ${lightOpacity})`);
        rayGradient.addColorStop(1, "rgba(100, 200, 255, 0)");
        ctx.fillStyle = rayGradient;
        ctx.fillRect(150 + i * 200, 0, 60, canvas.height);
      }
    }

    // Apply camera offset transform - translate based on submarine depth
    ctx.save();
    const depthOffset = -gameState.depth + 300 + cameraOffset;
    ctx.translate(0, depthOffset);

    // Draw ambient particles
    particles.forEach(p => {
      ctx.fillStyle = `rgba(100, 200, 255, ${0.3 * (p.size / 4)})`;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
    });

    // Draw bubbles with optimized glow
    bubbles.forEach(bubble => {
      const img = imagesRef.current['bubble'];
      if (img) {
        ctx.save();
        ctx.shadowColor = "rgba(100, 200, 255, 0.6)";
        ctx.shadowBlur = 10;
        ctx.drawImage(img, bubble.x, bubble.y, bubble.width, bubble.height);
        ctx.restore();
      }
    });

    // Draw obstacles with rock image
    obstacles.forEach(obstacle => {
      const rockImage = imagesRef.current['rock'];
      if (rockImage) {
        ctx.save();
        
        // Subtle glow effect for depth
        ctx.shadowColor = "rgba(150, 150, 150, 0.5)";
        ctx.shadowBlur = 15;
        
        ctx.drawImage(rockImage, obstacle.x, obstacle.y, obstacle.width, obstacle.height);
        
        ctx.restore();
      }
    });

    // Draw monsters with optimized glow
    monsters.forEach(monster => {
      if (monster.visible) {
        ctx.save();
        
        // Optimized bioluminescent glow
        const glowColors: { [key: string]: string } = {
          squid: "rgba(0, 255, 255, 0.5)",
          angler: "rgba(0, 255, 100, 0.6)",
          viper: "rgba(0, 150, 255, 0.4)",
          shark: "rgba(255, 100, 0, 0.3)",
        };
        
        ctx.shadowColor = glowColors[monster.type] || "rgba(0, 255, 255, 0.4)";
        ctx.shadowBlur = 15;
        
        const monsterImg = imagesRef.current[monster.type];
        if (monsterImg) {
          const flipX = monster.type === 'squid' ? -1 : 1;
          if (flipX === -1) {
            ctx.translate(monster.x + monster.width, monster.y);
            ctx.scale(-1, 1);
            ctx.drawImage(monsterImg, 0, 0, monster.width, monster.height);
          } else {
            ctx.drawImage(monsterImg, monster.x, monster.y, monster.width, monster.height);
          }
        }
        
        ctx.restore();
      }
    });

    ctx.restore(); // Restore camera offset transform

    // Draw sonar effect (outside camera transform, on submarine screen position)
    if (gameState.sonarActive) {
      const centerX = submarine.x + submarine.width / 2;
      const centerY = submarine.y + submarine.height / 2;
      const time = Date.now() / 1000;

      // Multiple sonar rings
      for (let i = 0; i < 3; i++) {
        const radius = ((time * 200 + i * 100) % 400);
        const opacity = Math.max(0, 0.3 - radius / 400);
        
        ctx.save();
        ctx.strokeStyle = `rgba(0, 217, 255, ${opacity})`;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      }

      // Sonar glow
      const gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, 300);
      gradient.addColorStop(0, "rgba(0, 217, 255, 0.2)");
      gradient.addColorStop(1, "rgba(0, 217, 255, 0)");
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    // Draw submarine with rotation and glow (fixed position on screen)
    const submarineImage = imagesRef.current['submarine'];
    if (submarineImage) {
      ctx.save();
      
      // Draw headlight beam first (behind submarine)
      ctx.translate(submarine.x + submarine.width / 2, submarine.y + submarine.height / 2);
      ctx.rotate((submarine.rotation * Math.PI) / 180);
      
      const beamGradient = ctx.createLinearGradient(0, 0, 150, 0);
      beamGradient.addColorStop(0, "rgba(255, 255, 200, 0.4)");
      beamGradient.addColorStop(1, "rgba(255, 255, 200, 0)");
      ctx.fillStyle = beamGradient;
      ctx.beginPath();
      ctx.moveTo(submarine.width / 2, 0);
      ctx.lineTo(submarine.width / 2 + 150, -50);
      ctx.lineTo(submarine.width / 2 + 150, 50);
      ctx.closePath();
      ctx.fill();
      
      // Submarine glow/lights - optimized
      ctx.shadowColor = "rgba(255, 255, 100, 0.6)";
      ctx.shadowBlur = 12;
      
      // Draw submarine image
      ctx.drawImage(submarineImage, -submarine.width / 2, -submarine.height / 2, submarine.width, submarine.height);
      
      ctx.restore();
    }

    // Draw debug hitboxes
    if (debugMode) {
      // Submarine Hitbox (fixed position on screen)
      const subHitbox = {
        x: submarine.x + submarine.width * 0.225,
        y: submarine.y + submarine.height * 0.275,
        width: submarine.width * 0.55,
        height: submarine.height * 0.45
      };
      
      ctx.save();
      ctx.strokeStyle = "rgba(255, 0, 0, 0.8)";
      ctx.lineWidth = 2;
      ctx.strokeRect(subHitbox.x, subHitbox.y, subHitbox.width, subHitbox.height);
      ctx.restore();

      // World objects hitboxes (translated by depthOffset)
      ctx.save();
      ctx.translate(0, depthOffset);

      const drawHitbox = (obj: GameObject) => {
        ctx.strokeStyle = "rgba(0, 255, 0, 0.8)";
        ctx.lineWidth = 2;
        ctx.strokeRect(obj.x, obj.y, obj.width, obj.height);
      };

      monsters.forEach(drawHitbox);
      obstacles.forEach(drawHitbox);
      bubbles.forEach(drawHitbox);

      ctx.restore();
    }

    // Draw depth transition vignette (no offset)
    const vignette = ctx.createRadialGradient(
      canvas.width / 2,
      canvas.height / 2,
      canvas.width / 4,
      canvas.width / 2,
      canvas.height / 2,
      canvas.width
    );
    vignette.addColorStop(0, "rgba(0, 0, 0, 0)");
    vignette.addColorStop(1, `rgba(0, 0, 0, ${Math.min(0.5, gameState.depth / 11000)})`);
    ctx.fillStyle = vignette;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }, [submarine, monsters, obstacles, bubbles, gameState.sonarActive, gameState.depth, particles, cameraOffset]);


  return (
    <div className="relative w-full h-full">
      <canvas
        ref={canvasRef}
        width={800}
        height={600}
        className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 border border-primary/30 rounded-lg shadow-2xl pixel-art"
        style={{ imageRendering: 'pixelated' }}
      />
      
        <GameHUD 
        oxygen={gameState.oxygen}
        energy={gameState.energy}
        health={gameState.health}
        depth={gameState.depth}
        score={gameState.score}
        sonarCooldown={gameState.sonarCooldown}
        upgrades={upgrades}
        debugMode={debugMode}
      />

      {hint && (
        <div className="absolute top-24 left-1/2 transform -translate-x-1/2 glass-panel px-6 py-3 animate-fade-in">
          <p className="text-primary font-semibold">{hint}</p>
        </div>
      )}

      {menuOpen && (
        <GameMenus
          activeMenu={menuOpen}
          onClose={() => setMenuOpen(null)}
          depth={gameState.depth}
          upgrades={upgrades}
        />
      )}
    </div>
  );
};

export default GameCanvas;
