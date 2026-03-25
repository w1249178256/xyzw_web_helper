# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Vue 3 Token Manager application for XYZW game automation. The application manages game tokens via Base64 decoding, establishes WebSocket connections, and provides a visual interface for token management and game automation.

## Development Commands

### Core Commands
```bash
# Development server (port 3000)
npm run dev
# or
pnpm run dev

# Production build
npm run build

# Preview production build
npm run preview

# Lint Vue, JS, TS files with auto-fix
npm run lint

# Format code (Prettier)
npm run format

# Test individual modules
npm run testr  # Test role token
npm run testd  # Test token
```

### Installation
```bash
# Recommended: use pnpm (as specified in packageManager field)
pnpm install

# Alternative: use npm
npm install
```

### Package Manager Note
This project uses `pnpm@10.19.0` as specified in package.json. While npm works, pnpm is the recommended package manager for consistency.

## Architecture Overview

### Core System Design
The application is built around a **token-centric architecture** that replaces traditional user authentication:

1. **Token Management System**: Base64-encoded tokens are imported, decoded, and stored locally
2. **WebSocket Connection Layer**: Automatic WebSocket connections using BON protocol for game communication
3. **Local-First Storage**: All data stored in browser localStorage and IndexedDB, no backend dependencies
4. **Protocol Layer**: Custom BON (Binary Object Notation) protocol for game message encoding/decoding

### Key Architectural Components

#### 1. Token Store (`src/stores/tokenStore.ts`)
Central state management for token operations using Pinia and VueUse:
- **Token Lifecycle**: Import → Parse → Store → Select → Connect
- **Base64 Parsing**: Supports multiple formats (JSON, plain text, prefixed, bin files, URL sources)
- **WebSocket Management**: Automatic connection establishment with status tracking and connection pooling
- **Connection Queue System**: Rate limiting with configurable max concurrent connections (default 10) and delay intervals
- **Task Coordination**: Tracks running tasks, scheduled tasks, and manages connection lifecycle around task execution
- **Data Persistence**: localStorage via `useLocalStorage` composable with cross-session state recovery
- **TypeScript Interfaces**: `TokenData`, `WebSocketConnection`, `ConnectLock` for type safety

#### 2. BON Protocol Implementation (`src/utils/bonProtocol.js`)
Custom binary protocol for game communication:
- **Message Encoding/Decoding**: Binary serialization with `DataReader`/`DataWriter` classes
- **Type System**: Support for primitives, arrays, maps, nested objects via `bon.encode()/decode()`
- **Encryption Layer**: Multi-channel encryption (LZ4 compression, XOR, XXTEA) with auto-detection
- **Game Message Templates**: `ProtoMsg` class and `GameMessages` helpers for common operations
- **WebSocket Message Handling**: `g_utils` utilities for message parsing and creation

#### 3. WebSocket Client (`src/utils/xyzwWebSocket.js`)
Enhanced WebSocket client with game-specific features:
- **Command Registry**: Pre-registered game commands with default parameters via `CommandRegistry` class
- **Queue Management**: `p-queue` based message queuing with automatic batch processing
- **Connection Management**: Auto-reconnection with exponential backoff, heartbeat system, status monitoring
- **Promise Support**: Both fire-and-forget (`send()`) and request-response (`sendWithPromise()`) patterns
- **Built-in Game Commands**: `getRoleInfo()`, `signIn()`, `claimDailyReward()`, etc.
- **Event Emitter**: Event-driven architecture for connection lifecycle and message handling

#### 4. Router Architecture (`src/router/index.js`)
Token-aware navigation system with file-based routing:
- **File-Based Routes**: Auto-generated from `src/views/` via `unplugin-vue-router`
- **Manual Routes**: Custom routes for Home, TokenImport with query param support
- **Access Control**: Route guards based on token availability (`meta.requiresToken`)
- **Smart Redirects**: Automatic routing based on token state
- **Layout System**: `DefaultLayout.vue` wrapper for admin pages with nested routing

#### 5. Daily Task Automation (`src/utils/dailyTaskRunner.js`)
Task orchestration system for automated game operations:
- **DailyTaskRunner Class**: Centralized task execution with configurable delays
- **Promise-based Commands**: Timeout-aware game command execution via `executeGameCommand()`
- **Task Chaining**: Sequential task execution with error handling and logging
- **Progress Callbacks**: Real-time task progress updates via callback system
- **Common Game Operations**: Sign-in, arena battles, tower climbing, daily rewards

#### 6. Theme System (`src/composables/useTheme.js`)
Reactive dark/light theme management:
- **Global Reactive State**: Shared `isDark` ref across all components
- **DOM Synchronization**: `MutationObserver` based state sync with HTML/body attributes
- **System Theme Detection**: Auto-detect and follow system theme preferences
- **Persistent Preferences**: localStorage backed theme selection
- **Event System**: Custom `theme-change` events for cross-component updates

### Data Flow Architecture

```
Token Import → Base64 Decode → Local Storage → Token Selection → Connection Queue → WebSocket Connection → Game Communication
     ↑              ↓              ↓              ↓                    ↓                    ↓                    ↓
  User Input    JSON/String    Token Store    Router Guards       Rate Limiting       BON Protocol      Game Messages
                                                                   Connection Pool
```

### State Management Pattern

**Pinia Store Structure**:
- `tokenStore` (TS): Primary token management, WebSocket connections, connection pooling, task coordination
- `auth` (JS): Simplified authentication state for legacy compatibility
- `gameRoles` (JS): Role-specific game data management
- `localTokenManager` (JS): Low-level token persistence utilities
- `changelogStore` (JS): Application changelog management

**VueUse Integration**:
- `useLocalStorage`: Reactive localStorage binding for `gameTokens`, `selectedTokenId`, `selectedRoleInfo`, `activeConnections`
- `computed`: Derived state like `hasTokens`, `selectedToken`, `queuedTokens`

### Modern Build Configuration

**Vite Plugins** (with safe optional loading):
- `unplugin-vue-router`: File-based routing from `src/views/`
- `unplugin-auto-import`: Auto-import Vue APIs, router, i18n
- `unplugin-vue-components`: Auto-register components with ArcoResolver
- `@intlify/unplugin-vue-i18n`: Vue I18n pre-compilation
- `unocss/vite`: Utility-first CSS framework
- `vite-plugin-vue-devtools`: Enhanced Vue debugging
- `@vitejs/plugin-basic-ssl`: Optional HTTPS support for development

**Path Aliases**:
- `@` → `src/`
- `@components` → `src/components/`
- `@views` → `src/views/`
- `@assets` → `src/assets/`
- `@utils` → `src/utils/`
- `@api` → `src/api/`
- `@stores` → `src/stores/`

## Key Framework Features

### Token Data Structure (TypeScript Interface)
```typescript
interface TokenData {
  id: string;                  // Unique identifier
  name: string;                // User-defined name
  token: string;               // Original Base64 token string
  wsUrl: string | null;        // Optional custom WebSocket URL
  server: string;              // Game server name
  remark?: string;             // Optional notes
  importMethod?: 'manual' | 'bin' | 'url';  // Import method
  sourceUrl?: string;          // Source URL when importMethod is 'url'
  upgradedToPermanent?: boolean;  // Whether upgraded to permanent validity
  upgradedAt?: string;         // Upgrade timestamp
  updatedAt?: string;          // Last update timestamp
}
```

### WebSocket Connection Structure
```typescript
interface WebSocketConnection {
  status: 'connecting' | 'connected' | 'disconnected' | 'error';
  client: XyzwWebSocketClient | null;
  lastError: { timestamp: string; error: string } | null;
  tokenId: string;
  sessionId: string;
  createdAt: string;
  lastMessageAt: string | null;
  randomSeedSynced?: boolean;   // Game-specific random seed synchronization
  lastRandomSeedSource?: number | null;
  lastRandomSeed?: number | null;
}
```

### WebSocket Connection Flow
1. **Token Selection**: User selects token from management interface
2. **Base64 Parsing**: Extract actual game token from Base64 string using `transformToken()`
3. **Queue Management**: Add to connection queue if at max concurrent connections
4. **URL Construction**: Build WebSocket URL with token parameter
5. **Client Creation**: Create `XyzwWebSocketClient` instance with `CommandRegistry` and game utilities
6. **Connection Establishment**: Automatic connection with heartbeat setup via `wsAgent.js`
7. **Message Handling**: Bi-directional communication using registered commands
8. **State Tracking**: Real-time connection status updates in `wsConnections` ref

### Connection Pooling System
- **Rate Limiting**: Max 10 concurrent connections (configurable via `maxConcurrentConnections`)
- **Queue System**: FIFO queue with position tracking and estimated wait time calculation
- **Connection Delay**: 500ms delay between connections (configurable via `connectionDelay`)
- **Task Coordination**: Automatic connection management around task execution lifecycle
- **Cross-Tab Coordination**: `activeConnections` in localStorage prevents duplicate connections across browser tabs

### BON Protocol Message Format
```javascript
{
  cmd: "command_name",      // Command identifier (e.g., "role:info:update", "arena:fight:start")
  body: encodedData,        // BON-encoded message body (Uint8Array or object)
  ack: 0,                   // Acknowledgment number for response matching
  seq: 12345,               // Sequence number for message ordering
  time: 1234567890          // Timestamp (Date.now())
}
```

### Game Data Structure
The `gameData` ref in tokenStore maintains:
```javascript
{
  roleInfo: {},              // Character information (level, class, server, stats)
  legionInfo: {},            // Guild/legion information
  commonActivityInfo: {},    // Consumption activity progress
  bossTowerInfo: {},         // Boss tower (treasury) data
  evoTowerInfo: {},          // Evolution tower (anomaly tower) data
  presetTeam: {},            // Pre-configured team compositions
  battleVersion: number,     // Battle system version number
  studyStatus: {             // Quiz/study system status
    isAnswering: boolean,
    questionCount: number,
    answeredCount: number,
    status: string,          // '', 'starting', 'answering', 'claiming_rewards', 'completed'
    timestamp: string
  },
  lastUpdated: string       // Last data refresh timestamp
}
```

## Project Structure

```
src/
├── components/
│   ├── TokenManager.vue          # Primary token management interface
│   ├── GameStatus.vue            # Real-time game status display
│   ├── ThemeToggle.vue           # Dark/light theme toggle button
│   ├── Daily/
│   │   └── DailyTaskCard.vue     # Daily task visualization card
│   ├── Club/                     # Guild/club related components
│   │   └── ClubCarKing.vue       # Club racing king feature
│   ├── Tower/                    # Tower climbing components
│   ├── Team/                     # Team management components
│   ├── Test/
│   │   ├── MessageTester.vue     # BON protocol debugging tool
│   │   └── WebSocketTester.vue   # Connection testing utility
│   └── cards/                    # Reusable card components (character, stats, etc.)
│
├── stores/
│   ├── tokenStore.ts             # Core token management (TypeScript)
│   ├── auth.js                   # Legacy authentication compatibility
│   ├── gameRoles.js              # Role-specific game data
│   ├── localTokenManager.js     # Token persistence utilities
│   ├── changelogStore.js         # Application changelog data
│   └── events/                   # Event emitter system
│
├── utils/
│   ├── bonProtocol.js            # BON protocol implementation (DataReader/Writer, encoding)
│   ├── xyzwWebSocket.js          # WebSocket client with CommandRegistry
│   ├── gameCommands.js           # Game-specific command helpers
│   ├── dailyTaskRunner.js        # Task automation orchestration
│   ├── wsAgent.js                # WebSocket connection management
│   ├── tokenDb.js                # IndexedDB operations for tokens
│   ├── logger.js                 # Logging utilities (wsLogger, gameLogger, tokenLogger)
│   ├── readable-xyzw-ws.js       # Reference WebSocket implementation
│   ├── connectionPoolManager.js  # Connection pool coordination
│   ├── taskQueueManager.js       # Task queue management
│   └── connectionHealthMonitor.js # Connection health checks
│
├── views/
│   ├── Home.vue                  # Landing page
│   ├── TokenImport/              # Token import and management pages
│   │   └── index.vue             # Main token import interface
│   ├── Dashboard.vue             # Main game control interface
│   ├── DailyTasks.vue            # Task management interface
│   ├── BatchDailyTasks.vue       # Batch task execution for multiple tokens
│   ├── GameFeatures.vue          # Game feature showcase
│   ├── GameRoles.vue             # Role information display
│   ├── Profile.vue               # User preferences and settings
│   ├── Changelog.vue             # Application version history
│   └── Login.vue / Register.vue  # Legacy authentication pages
│
├── composables/
│   └── useTheme.js               # Theme management composable
│
├── hooks/
│   └── useIndexedDB.js           # IndexedDB access hook
│
├── layout/
│   └── DefaultLayout.vue         # Main layout wrapper with navigation
│
├── router/
│   └── index.js                  # Router configuration with auto-routes
│
├── locales/                      # i18n translation files
├── api/                          # API layer (if any)
└── assets/                       # Static assets and SCSS variables
```

### Component Organization
- **Feature-Based Structure**: Components organized by game features (Club, Tower, Team, Daily)
- **Shared Components**: Common UI elements in `components/` root and `components/Common/`
- **Card Pattern**: Reusable card components in `components/cards/` for consistent UI
- **Test Tools**: Debug and testing components isolated in `components/Test/`

## Development Guidelines

### Working with Tokens

**Token Store API** (from `useTokenStore()`):
- `addToken(tokenData)` - Add new token with validation
- `updateToken(id, updates)` - Update token properties
- `removeToken(id)` - Delete token and cleanup connections
- `refreshToken(tokenId)` - Re-fetch token from source URL (for url-imported tokens)
- `selectToken(tokenId)` - Set active token for operations
- Always use the `tokenStore` for token operations - never manipulate `gameTokens` directly
- Test Base64 parsing with various input formats (JSON, plain text, prefixed, bin files)
- Verify WebSocket connections after token operations
- Handle token validation errors gracefully with user-friendly messages

**Token Import Methods**:
1. **Manual**: Direct Base64 string input
2. **Bin File**: Import from binary file format (Fuxi format support)
3. **URL**: Fetch from API endpoint with auto-refresh capability

### WebSocket Development

**Using XyzwWebSocketClient**:
```javascript
const tokenStore = useTokenStore();

// Get WebSocket client for a token
const client = tokenStore.getWebSocketClient(tokenId);

// Send fire-and-forget message
await client.send('role:info:get', { roleId: 123 });

// Send with Promise response (timeout: 8000ms default)
const result = await client.sendWithPromise('arena:fight:start', { targetId: 456 }, 10000);

// Use pre-registered game commands
const roleInfo = await client.getRoleInfo();
await client.signIn();
await client.claimDailyReward('task_001');
```

**Connection Management**:
- Monitor connection status via `tokenStore.getWebSocketStatus(tokenId)`
- WebSocket client includes automatic reconnection with exponential backoff
- Queue-based sending ensures message ordering during reconnection
- Heartbeat system (30s interval) maintains connection health
- Built-in command registry supports game-specific message formats

**Connection Pool Considerations**:
- Max 10 concurrent connections by default - respect the limit
- Use `queuedTokens` computed property to check queue status
- Connection delay of 500ms prevents server overload
- Cross-tab coordination prevents duplicate connections

### State Management

**Pinia Store Patterns**:
```javascript
import { useTokenStore } from '@/stores/tokenStore';

const tokenStore = useTokenStore();

// Access reactive state
const tokens = tokenStore.gameTokens;           // All tokens (via VueUse)
const selected = tokenStore.selectedToken;      // Current token
const hasAny = tokenStore.hasTokens;           // Boolean check
const roleInfo = tokenStore.selectedTokenRoleInfo;  // Current role data

// Connection state
const wsStatus = tokenStore.getWebSocketStatus(tokenId);
const queuePosition = tokenStore.connectionQueuePositions[tokenId];
const waitTime = tokenStore.getEstimatedWaitTime(tokenId);
```

- Access token data through computed properties (`selectedToken`, `hasTokens`)
- Use reactive WebSocket status via `getWebSocketStatus(tokenId)`
- Persist critical state changes to localStorage automatically via VueUse
- Handle cross-session state recovery on application startup
- TypeScript interfaces available in `tokenStore.ts` for type safety

### Protocol Implementation

**BON Encoding/Decoding**:
```javascript
import { bonProtocol, ProtoMsg, g_utils } from '@/utils/bonProtocol';

// Encode message
const encoded = bonProtocol.bon.encode({
  cmd: 'role:info:get',
  roleId: 123
});

// Decode message
const decoded = bonProtocol.bon.decode(receivedData);

// Use ProtoMsg for game messages
const msg = new ProtoMsg('role:info:get', { roleId: 123 });
const packet = g_utils.createGamePacket(msg);
```

- Follow BON encoding/decoding patterns for message handling
- Use predefined `GameMessages` templates for common operations
- Implement proper type checking for message validation
- Handle protocol errors with fallback to JSON parsing
- Encryption methods: LZ4 compression (`lx`), XOR (`x`), XXTEA (`xtm`)

### Daily Task Automation

**Using DailyTaskRunner**:
```javascript
import { DailyTaskRunner } from '@/utils/dailyTaskRunner';

const runner = new DailyTaskRunner(tokenStore, {
  commandDelay: 500,  // Delay between commands
  taskDelay: 500      // Delay between tasks
});

// Set callbacks for progress tracking
runner.callbacks = {
  onLog: (logEntry) => console.log(logEntry.message),
  onProgress: (progress) => updateUI(progress)
};

// Execute command with timeout
const result = await runner.executeGameCommand(
  tokenId,
  'arena:fight:start',
  { targetId: 456 },
  'Starting arena battle',
  8000  // timeout in ms
);
```

### Theme System

**Using Theme Composable**:
```javascript
import { useTheme } from '@/composables/useTheme';

const { isDark, toggleTheme, setDarkTheme, setLightTheme } = useTheme();

// Check current theme
if (isDark.value) {
  console.log('Dark mode active');
}

// Toggle theme
toggleTheme();

// Explicitly set theme
setDarkTheme();
```

- Theme state is globally reactive across all components
- MutationObserver ensures DOM and reactive state stay synchronized
- Theme preference persisted to localStorage
- System theme detection on first visit

## Configuration Notes

### Vite Configuration
The `vite.config.js` uses dynamic imports with safe fallbacks for optional dependencies:

- **Path Aliases**: Clean imports via `@/`, `@components/`, `@views/`, `@assets/`, `@utils/`, `@api/`, `@stores/`
- **Development Server**: Port 3000 with auto-open and host mode enabled
- **File-Based Routing**: `unplugin-vue-router` generates routes from `src/views/` (excludes `**/components/**`, `**/test**.vue`, `**/**Modal.vue`)
- **Auto-Imports**: Vue, Vue Router, Vue I18n APIs auto-imported (generates `src/auto-imports.d.ts`)
- **Component Auto-Registration**: Components from `src/components/` auto-registered (generates `components.d.ts`)
- **ArcoResolver**: Arco Design Vue components resolved without style imports
- **SCSS Preprocessing**: Global variables from `@/assets/styles/variables.scss` available as `vars`
- **UnoCSS**: Utility-first CSS framework integrated
- **Vue DevTools**: Enhanced debugging available in development
- **Vue I18n**: Pre-compilation for i18n messages from `src/locales/`
- **Optional HTTPS**: Basic SSL support if `@vitejs/plugin-basic-ssl` is installed

**Safe Plugin Loading Pattern**:
All plugins are loaded with `safeImport()` helper that continues gracefully if optional dependencies are missing.

### Browser Compatibility
- **Modern Browsers Only**: Requires WebSocket, localStorage, IndexedDB support
- **APIs Used**: Base64 encoding/decoding, TextEncoder/TextDecoder, Uint8Array, DataView
- **Storage**: localStorage for simple data, IndexedDB for binary data (ArrayBuffers)

### Security Considerations
- **Local-Only Storage**: All tokens stored in browser (localStorage + IndexedDB), never sent to backend
- **WSS Encryption**: WebSocket connections use WSS (WebSocket Secure) protocol
- **BON Encryption**: Multi-layer encryption (LZ4, XOR, XXTEA) for game messages
- **Token Display**: UI masks tokens showing only first/last 4 characters
- **Cross-Tab Coordination**: Prevents multiple simultaneous connections for same token
- **No Backend Auth**: No traditional user authentication - token-based access only

## Testing and Debugging

### Built-in Testing Tools

**1. Message Tester** (`components/Test/MessageTester.vue`):
- BON protocol encoding/decoding verification
- Test message format validation
- Encryption/decryption functionality testing
- Real-time encoding result preview

**2. WebSocket Tester** (`components/Test/WebSocketTester.vue`):
- Live connection status monitoring
- Message send/receive testing
- Connection parameter configuration
- WebSocket handshake debugging

**3. Protocol Testing Scripts**:
```bash
# Test role token parsing and validation
npm run testr

# Test token decoding and format detection
npm run testd
```

### Debugging Strategies

**1. Browser DevTools**:
- **Vue DevTools**: Monitor Pinia store state, component hierarchy, events
- **Network Tab**: WebSocket frame inspection for real-time message monitoring
- **Console**: Structured logging via `logger.js` (wsLogger, gameLogger, tokenLogger)
- **Application Tab**: Inspect localStorage (`gameTokens`, `selectedTokenId`) and IndexedDB

**2. Logger System** (`utils/logger.js`):
```javascript
import { wsLogger, gameLogger, tokenLogger } from '@/utils/logger';

// WebSocket debugging
wsLogger.info('Connection established', { tokenId, sessionId });
wsLogger.error('Message send failed', error);

// Game logic debugging
gameLogger.debug('Role info updated', roleData);

// Token operations debugging
tokenLogger.warn('Token validation failed', validationErrors);
```

**3. Connection Pool Debugging**:
```javascript
const tokenStore = useTokenStore();

// Check connection queue
console.log('Queued tokens:', tokenStore.queuedTokens);
console.log('Active connections:', tokenStore.activeConnectionCount);
console.log('Queue positions:', tokenStore.connectionQueuePositions);

// Estimate wait time
const waitTime = tokenStore.getEstimatedWaitTime(tokenId);
console.log(`Estimated wait: ${waitTime}ms`);
```

**4. WebSocket Message Tracing**:
```javascript
const client = tokenStore.getWebSocketClient(tokenId);

// Message sent event
client.on('message-sent', ({ cmd, params }) => {
  console.log('Sent:', cmd, params);
});

// Message received event
client.on('message-received', ({ cmd, body }) => {
  console.log('Received:', cmd, body);
});

// Connection events
client.on('connected', () => console.log('WS Connected'));
client.on('disconnected', () => console.log('WS Disconnected'));
client.on('error', (error) => console.error('WS Error:', error));
```

### Common Development Scenarios

**Scenario 1: Testing Token Import**
1. Navigate to `/tokens` page
2. Try different Base64 formats: pure Base64, prefixed (`token:`), JSON wrapped
3. Verify token parsing in tokenStore
4. Check localStorage update in DevTools
5. Verify WebSocket connection establishment

**Scenario 2: Testing WebSocket Communication**
1. Select token from TokenManager
2. Open Network tab → WS filter
3. Send test message via MessageTester
4. Monitor request/response frames
5. Verify BON encoding/decoding
6. Check message acknowledgment (ack) matching

**Scenario 3: Testing Connection Pooling**
1. Import 15+ tokens (exceeds max concurrent limit of 10)
2. Click "Connect All"
3. Monitor connection queue via `queuedTokens` computed
4. Verify 500ms delay between connections
5. Check estimated wait times are accurate
6. Verify no more than 10 simultaneous connections

**Scenario 4: Testing Daily Task Automation**
1. Navigate to `/admin/daily-tasks`
2. Configure task settings
3. Click "Start Tasks"
4. Monitor task logs in real-time
5. Check progress callbacks triggering
6. Verify task completion and cleanup
7. Inspect gameData updates in tokenStore

**Scenario 5: Testing Theme System**
1. Toggle theme button in header
2. Verify instant DOM updates (no page refresh)
3. Check localStorage `theme` key updated
4. Open second tab - verify theme syncs
5. Inspect `isDark` reactive ref in Vue DevTools
6. Verify Naive UI components update correctly

### TypeScript Development

**Type Checking**:
```bash
# Run TypeScript compiler for type checking (no emit)
npx tsc --noEmit

# Check specific file
npx tsc --noEmit src/stores/tokenStore.ts
```

**Generated Type Files**:
- `src/auto-imports.d.ts` - Auto-imported APIs type definitions
- `src/typed-router.d.ts` - File-based route type definitions
- `components.d.ts` - Auto-registered component types

### Key API Usage Patterns

**Token Store Operations**:
```javascript
// Connection management
await tokenStore.connectWebSocket(tokenId);
await tokenStore.disconnectWebSocket(tokenId);
await tokenStore.disconnectAllWebSockets();

// Message sending
await tokenStore.sendMessage(tokenId, 'role:info:get', {});
const result = await tokenStore.sendMessageWithPromise(tokenId, 'arena:fight:start', { targetId: 123 }, 10000);

// Token refresh (for URL-imported tokens)
await tokenStore.refreshToken(tokenId);

// Get WebSocket client instance
const client = tokenStore.getWebSocketClient(tokenId);
```

**VueUse Patterns**:
```javascript
import { useLocalStorage } from '@vueuse/core';

// Reactive localStorage binding
const myData = useLocalStorage('myKey', defaultValue);

// Auto-saves to localStorage on change
myData.value = newValue;
```

## Important Implementation Notes

### Mixed TypeScript/JavaScript Codebase
This project uses **both TypeScript and JavaScript**:
- **TypeScript**: `tokenStore.ts` (type-safe state management)
- **JavaScript**: Most utils, components, and other stores
- When modifying `tokenStore.ts`, maintain TypeScript interfaces
- When adding new features, prefer TypeScript for stores, JavaScript acceptable for utilities
- Auto-import types available from `auto-imports.d.ts` and `typed-router.d.ts`

### WebSocket Connection Best Practices
1. **Always check connection status** before sending messages
2. **Use connection pool aware code** - don't bypass the queue system
3. **Handle disconnections gracefully** - client auto-reconnects but operations may fail
4. **Respect rate limits** - max 10 concurrent, 500ms delay between connections
5. **Clean up connections** - disconnect when component unmounts or token deselected
6. **Monitor queue position** - inform users of wait times for better UX
7. **Use sendWithPromise for critical operations** - get confirmation of success/failure

### BON Protocol Gotchas
1. **Binary data handling**: BON encoded data is `Uint8Array`, not strings
2. **Type checking**: Always validate decoded message structure before use
3. **Encryption detection**: Auto-detection tries multiple methods (LZ4, XOR, XXTEA)
4. **Fallback to JSON**: If BON decoding fails, protocol falls back to JSON.parse
5. **Message ordering**: Use `seq` field for ordering, `ack` for response matching
6. **Timestamp synchronization**: Game server may validate message timestamps

### State Management Patterns
1. **Never mutate gameTokens directly** - always use tokenStore methods
2. **Use computed for derived state** - better performance and reactivity
3. **VueUse composables for persistence** - `useLocalStorage` handles serialization
4. **IndexedDB for large binary data** - use `useIndexedDB` hook for ArrayBuffers
5. **Cross-tab coordination** - `activeConnections` in localStorage prevents conflicts
6. **Task coordination state** - track `runningTasksCount` and `isTasksRunning` for UI feedback

### File-Based Routing Considerations
1. **Route files in `src/views/`** auto-generate routes via `unplugin-vue-router`
2. **Exclude patterns**: Files in `components/`, `test**.vue`, `**Modal.vue` ignored
3. **Manual routes** in `router/index.js` take precedence over auto-routes
4. **Route meta**: Define `requiresToken` for access control
5. **Type-safe routing**: Use generated types from `typed-router.d.ts`

### Component Development Guidelines
1. **Use Composition API** with `<script setup>` syntax
2. **Auto-imported APIs**: Vue, Vue Router, Vue I18n available without imports
3. **Component auto-registration**: Components in `src/components/` don't need manual import
4. **Theme awareness**: Use `useTheme()` composable, respect `isDark` state
5. **Arco Design + Naive UI**: Both UI libraries available (Arco via resolver, Naive via manual import)
6. **i18n ready**: Use `$t()` for translatable strings even if not fully implemented yet

### Performance Considerations
1. **Connection pooling prevents server overload** - don't increase max concurrent beyond 10 without testing
2. **Message queue batching** - p-queue handles batch processing automatically
3. **Component lazy loading** - routes use `() => import()` for code splitting
4. **Computed over methods** - Vue 3 caches computed results
5. **Debounce frequent operations** - especially token search/filter in UI
6. **IndexedDB for large data** - don't store large ArrayBuffers in localStorage

### Security Notes
1. **Tokens never leave browser** - no backend API calls with token data
2. **Display masking** - show first/last 4 chars only in UI for security
3. **WSS required** - WebSocket connections must use secure protocol
4. **No credentials in code** - all auth via tokens, no hardcoded credentials
5. **XSS prevention** - Vue automatically escapes template content
6. **CORS not applicable** - WebSocket connections bypass CORS

### Error Handling Patterns
```javascript
// Token operations
try {
  await tokenStore.addToken(tokenData);
} catch (error) {
  if (error.message.includes('duplicate')) {
    // Handle duplicate token
  } else if (error.message.includes('invalid format')) {
    // Handle invalid Base64/format
  }
}

// WebSocket operations
try {
  const result = await tokenStore.sendMessageWithPromise(tokenId, cmd, params, 8000);
} catch (error) {
  if (error.message.includes('timeout')) {
    // Handle timeout
  } else if (error.message.includes('disconnected')) {
    // Handle disconnection
  }
}

// BON protocol operations
try {
  const decoded = bonProtocol.bon.decode(data);
} catch (error) {
  // Fallback to JSON
  const decoded = JSON.parse(data);
}
```

### Localization (i18n) Structure
While not fully implemented, the project has i18n infrastructure:
- Translation files in `src/locales/`
- Auto-import of `$t()` function
- Pre-compilation via `@intlify/unplugin-vue-i18n`
- When adding UI text, consider wrapping in `$t('key')` for future translation support