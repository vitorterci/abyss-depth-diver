/**
 * main.js
 * Arquivo de inicialização do jogo
 */

document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('gameCanvas');

    if (!canvas) {
        console.error('Canvas não encontrado!');
        return;
    }

    // Criar instância do jogo
    const game = new Game(canvas);

    // Iniciar o jogo
    game.start();

    // Log inicial
    console.log('🎮 Abyss Depth Diver - Vanilla JS');
    console.log('Controles:');
    console.log('  A/D - Mover Horizontalmente');
    console.log('  W/S - Mover Verticalmente (Profundidade)');
    console.log('  ESPAÇO - Ativar Sonar');
    console.log('  M - Missões');
    console.log('  U - Upgrades');
    console.log('  B - Debug Mode');
    console.log('  ESC - Fechar Menu');
});
