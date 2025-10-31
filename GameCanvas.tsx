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
      const bubbleScreenHitbox = getWorldObjectScreenHitbox(bubble, gameState.depth, cameraOffset);
      if (checkAABB(subHitbox, bubbleScreenHitbox)) {
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