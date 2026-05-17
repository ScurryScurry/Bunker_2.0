# AI System Prompt / Architecture Guide for Bunker Project

This document serves as a comprehensive guide for AI models interacting with the "Bunker" project, covering its architecture, database structure, core mechanics, and development conventions.

## 1. General Game Architecture

The "Bunker" project is a real-time multiplayer game built with Node.js, Express, Socket.io, and MongoDB.

### Frontend-Backend Communication (Socket.io):

*   **Server Initialization**: The [`server.js`](server.js) file sets up an Express server and initializes Socket.io, attaching it to the HTTP server. Static assets are served from the `public` directory.
*   **Connection Handling**: Upon a new Socket.io connection, the [`server.js`](server.js) orchestrates the initialization of [`sockets/roomManager.js`](sockets/roomManager.js) (for lobby functionalities), [`sockets/gameManager.js`](sockets/gameManager.js) (for in-game functionalities), and [`services/gameHandler.js`](services/gameHandler.js) (for general game logic).
*   **Lobby Management [`sockets/roomManager.js`](sockets/roomManager.js)**:
    *   Handles events like `createRoom`, `joinRoom`, `disconnect` (when in lobby), and `startGame`.
    *   Uses [`models/Room`](models/Room.js) and [`models/GamePlayer`](models/GamePlayer.js) to persist room and player data.
    *   Utilizes `services/BunkerGenerator.js`, `services/DisasterGenerator.js`, and `services/PlayerGenerator.js` during game startup.
    *   Emits `roomCreated`, `roomJoined`, `roomUpdated`, `gameStarted`, and `error` events.
*   **In-Game Management [`sockets/gameManager.js`](sockets/gameManager.js)**:
    *   Handles `playerReadyInGame` and `leaveGame` events.
    *   Upon `playerReadyInGame`, it joins the player to the room, fetches relevant `GamePlayer` and `Room` data, and emits `playerLoaded` with `username`, `players` list, `bunkerData`, and `disasterData`.
    *   Directs profession-based actions to [`services/ActionManager.js`](services/ActionManager.js) via the `useProfessionAction` event.
*   **Game Logic Handling [`services/gameHandler.js`](services/gameHandler.js)**:
    *   Acts as a central point for various game logic events.
    *   Crucially, it finds `GamePlayer` instances using `socket.id` (see Development Rules).
    *   Calls functions within [`services/ActionManager.js`](services/ActionManager.js) to execute specific game actions based on player inputs.
    *   After successful actions, it emits `gameStateUpdated` to all clients in the room.
*   **Client-Side Interaction [`public/game.js`](public/game.js)**:
    *   Establishes a Socket.io connection and authenticates using a JWT stored in `localStorage`.
    *   Emits `playerReadyInGame` when the game view is loaded.
    *   Listens for `error` and `playerLoaded` events to update the UI.
    *   The `renderMyCards` function is responsible for displaying a player's character cards.
    *   The `handleProfessionAction` function processes card logic and emits `useProfessionAction` to the server.

## 2. Database Structure

MongoDB is used as the database. Mongoose models define the schema for various data entities.

### Model Auto-Import

The [`models/index.js`](models/index.js) file automatically imports all `.js` files (excluding itself) from the `models` directory and exports them as an object. The key for each model in this object is its `modelName`.

### [`models/GamePlayer.js`](models/GamePlayer.js) Schema

This is the central model for individual players within a game room.

*   `roomCode`: `String`, required, indexed for fast lookup.
*   `userId`: `String`, required.
*   `username`: `String`.
*   `isHost`: `Boolean`, default `false`.
*   `cards`: `Object`, default `{}`. This nested object holds all character-defining cards for a player.
*   `revealedCards`: `Object`, default `{}`.

### `cards` Object Structure (within `GamePlayer`)

The `cards` object is a flexible container where various character attributes are stored as sub-documents or embedded objects. Key fields include:

*   `profession`: Details from [`models/Profession.js`](models/Profession.js).
    *   `_id`: `String` (custom ID, e.g., 'cls_traumatologist').
    *   `pack_id`: `String`.
    *   `name`: `String`.
    *   `description`: `String`.
    *   `type`: `String` (e.g., 'ACTION', 'PASSIVE', 'NEUTRAL').
    *   `logic`: `Object` (contains rules for actions, effects, targets: `logic`, `effect`, `action`, `target`).
*   `health`: Details from [`models/Health.js`](models/Health.js).
    *   `_id`: `String`.
    *   `pack_id`: `String`.
    *   `name`: `String`.
    *   `type`: `String` (e.g., 'INFECTIOUS', 'CHRONIC').
    *   `danger_level`: `String` (e.g., 'minor', 'major', 'fatal').
    *   `description`: `String`.
*   `phobia`: Details from [`models/Phobia.js`](models/Phobia.js).
    *   `_id`: `String`.
    *   `pack_id`: `String`.
    *   `name`: `String`.
*   `inventorySmall`: Array of objects from [`models/ItemSmall.js`](models/ItemSmall.js).
    *   `_id`: `String`.
    *   `pack_id`: `String`.
    *   `name`: `String`.
*   `inventoryBig`: Array of objects from [`models/ItemBig.js`](models/ItemBig.js).
    *   `_id`: `String`.
    *   `pack_id`: `String`.
    *   `name`: `String`.
*   Other fields like `bio`, `body`, `hobby`, `character`, `extraInfo` follow similar object structures, often referencing their respective models in the `models` directory.

## 3. Asset Mechanics (Card Logic)

Card logic dictates how player abilities and item effects are structured and executed.

*   **Card `logic` Field**: Found within card schemas (e.g., `profession.logic`), this `Object` defines the rules for using an asset.
    *   It typically contains `effect` or `action` (e.g., 'DESTROY', 'TRANSFER', 'SET', 'REVEAL'), `target` (e.g., "SELECT", indicating a player target), `attribute` or `field` (the specific card field to modify), `filter` (for conditional actions), and `mode` (e.g., 'SWAP' for transfer actions).
*   **[`services/ActionManager.js`](services/ActionManager.js)**: This service is responsible for executing card actions.
    *   The `execute` method acts as a dispatcher, using the `actionType` from the `logic` object to call specialized handler functions (e.g., `handleDestroy`, `handleTransfer`, `handleSet`).
    *   `handleDestroy`: Sets the target player's specified card field to `null` in the database, optionally filtered by `logic.filter`.
    *   `handleTransfer`: Facilitates the exchange of card attributes between players (e.g., `mode: 'SWAP'`).
    *   `handleSet`: Directly updates a specific card field with a new value.
*   **Interaction with [`services/gameHandler.js`](services/gameHandler.js)**: `gameHandler.js` receives client-side `useProfessionAction` events and, after identifying the acting player, delegates the execution of the profession's `logic` to `ActionManager.js`.

## 4. Current Development Rules

Adherence to these rules ensures consistency and stability across the project.

*   **`null` for Default States**: When a card attribute represents a condition that can be absent or in a default, healthy state (e.g., `health`, `phobia`), it should be stored as `null` in the `GamePlayer.cards` object. For instance, `health: null` signifies "absolutely healthy" or "no current health condition".
*   **Player Search by `socket.id`**: On the backend, when searching for a `GamePlayer` associated with an active socket, always use `socket.id` for identification. Avoid relying on potentially unstable `playerData` sent directly from the client for critical lookups.
*   **Mandatory Optional Chaining (`?.`) on Frontend**: In frontend code, especially within rendering functions like `renderMyCards`, always use Optional Chaining (`?.`) when accessing nested properties of potentially `null` or `undefined` objects (e.g., `player.cards?.profession?.experience`). This prevents runtime errors and enhances UI robustness.