# XYZW Web Helper - Commit Log

## Repository Information
- **Name**: XYZW Web Helper
- **Project Type**: Vue 3 game automation tool
- **Description**: Game token management system with WebSocket connectivity for XYZW game automation
- **Version**: 2.0.0 (latest)
- **Technology Stack**: Vue 3, Vite, Naive UI, Pinia, TypeScript

## Major Milestones

### Version 2.0.0 - January 20, 2024
**Major Release: Token Management System Complete Rewrite**
- **Complete architectural overhaul**: Transitioned from user authentication system to token-centric architecture
- **Base64 Token Import**: Implemented sophisticated Base64 parsing supporting multiple formats
- **Visual Token Management**: Developed intuitive card-based interface for managing multiple game tokens
- **WebSocket Connection Management**: Added automatic WebSocket connection establishment and monitoring
- **Batch Operation Features**: Implemented import/export and cleanup functionality
- **Responsive UI**: Redesigned interface for desktop and mobile device compatibility
- **Local-First Architecture**: Removed all backend dependencies with complete local storage solution
- **Enhanced Security**: Local-only storage ensuring token privacy

### Pre-Version 2.0.0 Era
**Traditional Authentication System**
- User registration and login system
- Backend API dependency for data management
- CRUD operations for game roles
- Daily task management functionality

## Feature Development Timeline

### Core Architecture
- **Token Store System** (`src/stores/tokenStore.ts`): Centralized state management for token operations
- **BON Protocol Implementation** (`src/utils/bonProtocol.js`): Custom binary protocol for game communication
- **WebSocket Client** (`src/utils/xyzwWebSocket.js`): Enhanced WebSocket client with game-specific features
- **Router Architecture** (`src/router/index.js`): Token-aware navigation system
- **Daily Task Automation** (`src/utils/dailyTaskRunner.js`): Task orchestration system
- **Theme System** (`src/composables/useTheme.js`): Reactive dark/light theme management

### Frontend Technologies
- **Vue 3.5.22**: Progressive JavaScript framework with Composition API
- **Vite 5.0+**: Modern build tool with HMR support
- **Naive UI 2.43.1**: Component library with theme system
- **Pinia 2.3.1**: State management solution
- **TypeScript**: Type-safe development

### Key Utilities
- **Token Management**: Supports manual input, URL fetching, and bulk import of Base64 tokens
- **WebSocket Communication**: BON protocol with LZ4 compression, XOR, and XXTEA encryption
- **Game Automation**: Daily tasks, sign-ins, arena battles, tower climbing
- **Connection Pooling**: Rate-limited connections with queue management
- **Theme Switching**: Automatic system theme detection with preference persistence

## Technical Improvements

### Performance Enhancements
- **Connection Pooling**: Maximum 10 concurrent WebSocket connections with queue management
- **Rate Limiting**: 500ms delay between connections to prevent server overload
- **Local Storage**: Efficient localStorage and IndexedDB usage
- **Lazy Loading**: On-demand component loading for improved startup time

### Security Features
- **Token Encryption**: Local storage with obfuscation
- **No Backend Dependency**: All data stored locally eliminating server-side risks
- **Connection Isolation**: Separate WebSocket connections per token
- **Input Validation**: Comprehensive token format validation

### User Experience
- **Intuitive Interface**: Card-based token management with status indicators
- **Real-time Feedback**: Live connection status and task progress updates
- **Cross-device Compatibility**: Responsive design for desktop and mobile
- **Accessibility**: Proper ARIA labels and keyboard navigation

## Deployment & Infrastructure

### Frontend Deployment
- **Cloudflare Pages**: Recommended deployment platform with API proxy support
- **Static Hosting**: Production builds optimized for static hosting
- **Worker Integration**: Built-in `_worker.js` for API proxy functionality

### Backend Services
- **Node.js Express Server** (`backend/server.js`): Authentication and WebSocket proxy
- **SQL.js Database**: Client-side database implementation
- **Authentication**: JWT-based user management
- **WebSocket**: Real-time game communication layer

### Docker Support
- **Multi-container Setup**: Separate containers for frontend and backend
- **Database Integration**: SQL.js integration for data persistence
- **Environment Configuration**: Flexible environment variable support

## Code Quality & Development

### Development Tools
- **ESLint**: Code quality enforcement with Antfu configuration
- **Prettier**: Consistent code formatting
- **TypeScript**: Full type safety across the codebase
- **Auto-import**: Vite plugin for automatic API imports
- **Component Registration**: Automated component registration system

### Testing & Debugging
- **Module Testing**: Individual module testing with dedicated scripts
- **WebSocket Testing**: Built-in WebSocket debugging tools
- **Protocol Testing**: BON protocol encoding/decoding verification
- **Theme Testing**: Cross-theme compatibility verification

## Future Development Areas

### Planned Enhancements
- **Advanced Task Scheduling**: More sophisticated automation workflows
- **Multi-game Support**: Extension to support additional games beyond XYZW
- **Mobile App**: Native mobile application development
- **Analytics Dashboard**: Usage statistics and performance metrics

### Known Limitations
- **Browser Storage Limits**: Dependent on browser local storage capacity
- **Single Device Sync**: No cross-device synchronization mechanism
- **Network Reliability**: Dependent on stable network connection for WebSocket

## Repository Structure

```
xyzw_web_helper/
├── src/                 # Main source code
│   ├── components/     # Reusable UI components
│   ├── views/          # Page components
│   ├── stores/         # Pinia stores
│   ├── composables/    # Vue composition functions
│   ├── utils/          # Utility functions
│   └── assets/         # Static assets
├── backend/            # Node.js backend services
├── docker/             # Docker configuration
├── deploy/             # Deployment scripts
├── public/             # Public assets
└── tests/              # Test files
```

## License
- **Creative Commons Attribution-NonCommercial-ShareAlike 4.0 International (CC BY-NC-SA 4.0)**
- Commercial use prohibited without explicit permission
- Modifications must be shared under the same license

## Contributors
- **Primary Developer**: Li Tong (tong.li@desaysv.com)
- **Repository Origin**: Forked from Agnosis/xyzw_web_helper.git

## Project Status
- **Active Development**: Maintained with regular updates
- **Stable Release**: Version 2.0.0 considered stable for production use
- **Community Support**: Documentation and guides provided in README.md and CLAUDE.md