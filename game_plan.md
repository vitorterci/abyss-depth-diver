# Plano de Recriação do Jogo "Abyss Depth Diver" em Vanilla JS

**Objetivo:** Recriar o jogo "Abyss Depth Diver" em HTML, CSS e JavaScript puro (Vanilla JS), mantendo todas as funcionalidades do projeto original em React/TypeScript, com foco na correção de bugs de hitbox e otimização de performance (lag).

## 1. Estrutura do Projeto (Vanilla JS)

O projeto será estruturado de forma modular para facilitar a manutenção e o desenvolvimento.

| Arquivo | Descrição |
| :--- | :--- |
| `index.html` | Estrutura principal do HTML, incluindo o elemento `<canvas>` e a interface HUD básica. |
| `style.css` | Estilização da página, do HUD e dos elementos visuais. |
| `js/Game.js` | Classe principal que gerencia o estado do jogo, o loop principal e a coordenação de outros módulos. |
| `js/Submarine.js` | Classe para o submarino (jogador), gerenciando posição, movimento e rotação. |
| `js/GameObject.js` | Classe base para todos os objetos do jogo (monstros, obstáculos, bolhas), contendo propriedades como `x`, `y`, `width`, `height` e `type`. |
| `js/Renderer.js` | Classe responsável por todos os desenhos no Canvas (fundo, partículas, objetos, submarino, efeitos). |
| `js/InputHandler.js` | Gerencia os eventos de teclado e mouse (rolagem). |
| `js/CollisionDetector.js` | Módulo dedicado à lógica de detecção de colisão. |

## 2. Correções e Otimizações (Foco em Hitbox e Lag)

### 2.1. Correção de Hitbox (Melhoria da Detecção de Colisão)

A lógica de colisão atual em `GameCanvas.tsx` é:

```typescript
// Submarine Hitbox (55% width, 45% height, centered on main body)
const subHitbox = {
  x: submarine.x + submarine.width * 0.225,
  y: subWorldY + submarine.height * 0.275,
  width: submarine.width * 0.55,
  height: submarine.height * 0.45
};
// Colisão AABB (Axis-Aligned Bounding Box)
if (
  subHitbox.x < other.x + other.width &&
  subHitbox.x + subHitbox.width > other.x &&
  subHitbox.y < other.y + other.height &&
  subHitbox.y + subHitbox.height > other.y
) { /* ... */ }
```

**Plano de Ação:**
1.  **Isolar a Lógica:** Mover toda a lógica de colisão para o módulo `js/CollisionDetector.js`.
2.  **Reforçar a Precisão:** Manter a definição de `subHitbox` mais precisa (55% x 45%) para evitar falsos positivos.
3.  **Garantir Sincronia:** Assegurar que as coordenadas de colisão (`subHitbox.y` e `other.y`) estejam sempre no mesmo sistema de referência (coordenadas do mundo, não da tela) para evitar erros de deslocamento (o que parece ser o caso no original, mas será verificado e garantido na recriação).

### 2.2. Otimização de Performance (Lag)

O lag pode ser causado por renderização excessiva ou atualizações de estado frequentes no React. Na recriação em Vanilla JS, o foco será em:

1.  **Game Loop Otimizado:** Usar `requestAnimationFrame` para o loop principal (`Game.js`), garantindo que o movimento seja calculado com base no `deltaTime` (tempo decorrido entre frames) para ser independente da taxa de quadros (FPS).
2.  **Renderização Eficiente:**
    *   **Desenho Condicional:** Apenas desenhar objetos que estão visíveis na tela. O código original já filtra objetos por proximidade (`Math.abs(o.y - gameState.depth) < 1200`), o que será mantido e otimizado.
    *   **Canvas API Direta:** Evitar manipulações complexas do DOM, utilizando o Canvas 2D API diretamente para todos os gráficos, o que é inerentemente mais rápido que a renderização de componentes React.
    *   **Throttling:** Manter a otimização de atualização de recursos (Oxigênio/Energia) a cada 50ms, conforme o original, para reduzir cálculos desnecessários a cada frame.

## 3. Extração de Recursos (Assets)

Os seguintes assets de imagem serão necessários para o Canvas. Eles serão extraídos do repositório original e colocados em um diretório `assets/`.

| Asset | Uso |
| :--- | :--- |
| `submarine.png` | Jogador |
| `shark.png` | Monstro |
| `squid.png` | Monstro |
| `angler.png` | Monstro |
| `viper.png` | Monstro |
| `bubble.png` | Recurso (Oxigênio) |
| `rock.png` | Obstáculo |

## 4. Lógica do Jogo a Ser Replicada

| Funcionalidade | Descrição | Módulo Principal |
| :--- | :--- | :--- |
| **Movimento** | Horizontal (A/D), Vertical limitado (W/S), Rotação suave. | `js/Submarine.js`, `js/Game.js` |
| **Geração Procedural** | Spawn de monstros e obstáculos com base na profundidade (`gameState.depth`) e em intervalos de 400-700m. | `js/Game.js` |
| **Atualização de Recursos** | Oxigênio decai lentamente, Energia regenera lentamente. Sonar consome Energia. | `js/Game.js` |
| **Colisão** | Submarino vs. Monstros (dano), Submarino vs. Obstáculos (dano), Submarino vs. Bolhas (recupera Oxigênio). | `js/CollisionDetector.js` |
| **Upgrades** | Desbloqueio automático em profundidades específicas (3000m, 5000m, 7000m, 9000m) com bônus de jogo. | `js/Game.js` |
| **Fim de Jogo** | Condições: Oxigênio <= 0, Saúde <= 0, ou Profundidade >= 11000m (Vitória). | `js/Game.js` |
| **Renderização Visual** | Fundo gradiente, partículas, efeito de luz, sonar, e a renderização de todos os objetos. | `js/Renderer.js` |

Com este plano, posso começar a implementar a recriação do jogo.
