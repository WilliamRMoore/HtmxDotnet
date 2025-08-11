# Jazz - 2D Platform Fighter Game Engine

Jazz is a deterministic 2D game engine written in TypeScript, specifically designed for creating platform fighting games (like *Super Smash Bros. Melee*). It is built with a modern, data-driven approach using an Entity-Component-System (ECS) architecture and is designed from the ground up to support advanced features like rollback netcode.

## Key Features

*   **Entity-Component-System - like (ECS) Architecture**: A clean separation of data (Components) from logic (Systems) for better organization, performance, and scalability.
*   **Deterministic Game Loop**: The engine's core loop is designed to produce the exact same output given the same input, which is a critical requirement for rollback netcode and replays.
*   **Rollback-Ready History System**: Every piece of mutable player state is snapshotted each frame, allowing the game state to be rolled back and re-simulated.
*   **Powerful Finite State Machine (FSM)**: Player logic is driven by a robust FSM that manages character states (idle, walking, attacking, etc.) and transitions based on player input and game events.
*   **Data-Driven Character Design**: Characters and their attacks are defined in configuration files, not hard-coded into the engine. This makes it easy to create, tweak, and add new characters and moves.
*   **2D Physics & Collision**: Features a custom 2D collision system for environment interaction (Separating Axis Theorem) and a hitbox/hurtbox system for combat.

---

## Architecture

ECS-Like architecture, entitilies are "composed" of components. Components are built with Domain Driven Design, they offer some near data compute, but are only responsible for their own state and mostly dependencyless. 

Advanced Finite State Machine. Supports translations, condtionals, and default conditionals. 

![Diagran](https://raw.githubusercontent.com/WilliamRMoore/HtmxDotnet/refs/heads/main/game-architecture-Finite%20State%20Machine%20Arch.webp)

### 1. The Core Loop (`jazz.ts`)

The main entry point to the engine is the `Jazz` class. Its responsibilities are simple:
1.  **Initialization**: Sets up the game `World` with players and a stage.
2.  **Input Handling**: Receives and stores player inputs for the current frame.
3.  **Ticking**: Executes a single frame of the game simulation.

The `Tick()` method is the heart of the engine. In a precise order, it:
1.  Executes all game logic **Systems** (see below).
2.  Cleans up memory pools used during the frame.
3.  Records the state of all components for the history buffer.
4.  Increments the frame counter.

```typescript
// d:\Repos\HtmxDotnet\App\JavaScript\game\engine\jazz.ts

// The main tick function orchestrates all systems in a specific, deterministic order.
private tick() {
    const world = this.world;
    // ...
    PlayerInput(playerCount, players, stateMachines, world);
    Gravity(playerCount, players, stage);
    ApplyVelocty(playerCount, players);
    // ... more systems
    PlayerAttacks(/* ... */);
    // ...
    RecordHistory(frame, playerCount, players, histories, world);
}
