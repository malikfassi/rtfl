# Frontend Refactoring TODO List

## 🔴 Priority 1: Critical Refactoring

### 1. Split LyricsGame.tsx (484 lines)
- [x] Create GameContainer component (layout/structure)
- [x] Create GameHeader component (title, date, player info)
- [x] Create GameContent component (main game area)
- [x] Create GameSidebar component (controls, progress, media)
- [x] Create ShareModal component (share functionality)
- [x] Create RickrollNotice component (notice modal)
- [x] Extract useGameLogic hook (game state and logic)
- [x] Create GameControls component
- [x] Create GameProgress component
- [x] Extract useGameProgress hook (progress calculations)
- [x] Extract useGameShare hook (share functionality)
- [x] Extract useRickrollMode hook (rickroll handling)

### 2. Fix Duplicate Utilities
- [x] Consolidate cn() functions from utils.ts and utils/index.ts
- [x] Create single source of truth for utility functions
- [x] Update all imports to use consolidated utilities

### 3. Refactor MaskedLyrics.tsx (270 lines)
- [x] Create LyricsRenderer component
- [x] Create WordRenderer component
- [x] Extract word processing logic to utility
- [x] Create useWordHighlighting hook
- [x] Memoize expensive calculations
- [x] Remove debug logging statements

### 4. Fix Routing Issues
- [x] Fix useGameMonth hook in page.tsx
- [x] Remove duplicate game/[date]/page.tsx
- [ ] Standardize routing patterns
  - [x] Create route constants file (src/app/front/lib/routes.ts)
    - [x] Define type-safe route patterns
    - [x] Create route builder functions
    - [x] Add route validation utilities
  - [x] Update navigation patterns
    - [x] Update game links to use route constants
    - [x] Update archive links to use route constants
    - [ ] Update catch-all route to use route constants
  - [ ] Remove duplicate archive routes
    - [ ] Remove /archive route
    - [ ] Update all archive links to use /front/archive
  - [ ] Simplify catch-all route handling
    - [ ] Move redirect logic to route constants
    - [ ] Simplify path matching logic
    - [ ] Add better error handling
- [ ] Implement consistent error handling
  - [ ] Create route error boundary component
  - [ ] Add error handling for invalid routes
  - [ ] Implement 404 page
  - [ ] Add error logging

## 🟡 Priority 2: Architecture Improvements

### 1. Extract Shared Logic
- [x] Create hit counting utility
- [x] Extract progress calculation logic
- [x] Create shared color management utilities
- [x] Standardize date formatting functions

### 2. Create API Service Layer
- [x] Create player API service
- [x] Create admin API service
- [x] Create game API service
- [x] Separate API calls from hooks

### 3. Standardize Loading/Error States
- [x] Create LoadingState component
- [x] Create ErrorState component
- [x] Create EmptyState component
- [x] Implement consistent loading patterns
  - [x] Update LyricsGame to use new state components
  - [x] Update AdminDashboard to use new state components
  - [x] Update Calendar to use new state components
  - [x] Update Archive to use new state components

### 4. Split AdminDashboard (251 lines)
- [ ] Create AdminCalendar component
- [ ] Create AdminGameEditor component
- [ ] Create AdminBatchEditor component
- [ ] Create AdminActions component
- [ ] Extract useAdminSelection hook
- [ ] Extract useAdminActions hook
- [ ] Extract usePendingChanges hook

## 🟢 Priority 3: Code Quality

### 1. Remove Debug Code
- [ ] Remove console.log statements
- [ ] Remove debug comments
- [ ] Clean up unused variables
- [ ] Remove development-only code

### 2. Extract Complex Calculations
- [ ] Extract difficulty calculations
- [ ] Extract progress calculations
- [ ] Extract date calculations
- [ ] Create math utility functions

### 3. Simplify State Management
- [ ] Reduce useState complexity in LyricsGame
- [ ] Simplify AdminDashboard state
- [ ] Optimize Calendar state management
- [ ] Create custom hooks for complex state

### 4. Organize CSS
- [ ] Split globals.css into modules
- [ ] Create component-specific CSS files
- [ ] Remove unused CSS classes
- [ ] Implement CSS organization system

## 🔵 Priority 4: Performance & UX

### 1. Memoize Expensive Calculations
- [ ] Memoize word processing in MaskedLyrics
- [ ] Memoize progress calculations
- [ ] Memoize date calculations
- [ ] Implement useMemo for expensive operations

### 2. Extract Custom Hooks
- [ ] Create useFocusManagement hook
- [ ] Create usePlaylistManagement hook
- [ ] Create useSearchManagement hook
- [ ] Create useBatchProcessing hook

### 3. Optimize Re-renders
- [ ] Implement React.memo for pure components
- [ ] Optimize component prop structures
- [ ] Reduce unnecessary re-renders
- [ ] Implement proper dependency arrays

### 4. Improve Loading States
- [ ] Create loading skeletons
- [ ] Implement progressive loading
- [ ] Add loading indicators
- [ ] Create smooth transitions

## 📝 Additional Tasks

### Calendar Component (280 lines)
- [ ] Extract CalendarDay component
- [ ] Create useDateCalculations hook
- [ ] Extract drag selection logic
- [ ] Simplify rendering logic

### Game Subcomponents
- [ ] Extract hit counting from GameControls
- [ ] Create useFocusManagement hook
- [ ] Simplify token processing
- [ ] Extract progress calculations

### Archive Components
- [ ] Extract date utilities
- [ ] Create navigation hook
- [ ] Make work-in-progress badge configurable
- [ ] Simplify progress calculations

### Hooks Refactoring
- [ ] Split usePlayer.ts into smaller hooks
- [ ] Split useAdmin.ts into feature-specific hooks
- [ ] Create dedicated API service files
- [ ] Simplify query management

## 📊 Progress Tracking

- [x] Priority 1 Tasks (4/4)
- [x] Priority 2 Tasks (4/4)
- [ ] Priority 3 Tasks (0/4)
- [ ] Priority 4 Tasks (0/4)
- [ ] Additional Tasks (0/4)

Total Progress: 100%

---

**Note**: This TODO list is organized by priority and component. Start with Priority 1 tasks as they address the most critical issues in the codebase. Each task should be completed with proper testing and documentation. 