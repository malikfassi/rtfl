# 🚀 Frontend Component Simplification - TODO Plan

## 📋 **Implementation Roadmap**

### **🎯 Goal**: Reduce 15 components to 7, simplify state management, eliminate redundancy

---

## **Phase 1: Data Layer Simplification** ⚡

### **Task 1.1: Split useGameLogic Hook**
- [ ] **1.1.1** Create `useGameData(date)` hook
  - [ ] Extract game fetching logic from useGameLogic
  - [ ] Return: `{ game, isLoading, error }`
  - [ ] Handle loading states and error handling
  - [ ] File: `src/app/front/hooks/useGameData.ts`

- [ ] **1.1.2** Create `useGameActions(date)` hook  
  - [ ] Extract guess submission logic
  - [ ] Extract sharing functionality
  - [ ] Return: `{ submitGuess, share, isSubmitting, error }`
  - [ ] File: `src/app/front/hooks/useGameActions.ts`

- [ ] **1.1.3** Create `useGameState(game)` hook
  - [ ] Extract progress calculations
  - [ ] Extract completion logic
  - [ ] Return: `{ isComplete, progress, foundWords }`
  - [ ] File: `src/app/front/hooks/useGameState.ts`

- [ ] **1.1.4** Update useGameLogic to use new hooks
  - [ ] Combine the three hooks
  - [ ] Reduce return values from 17 to 8-10
  - [ ] Maintain backward compatibility temporarily

### **Task 1.2: Simplify State Management**
- [ ] **1.2.1** Consolidate LyricsGame state
  - [ ] Create `UIState` type: `{ isShareOpen, showFullLyrics }` (REMOVED: isClient)
  - [ ] Create `InteractionState` type: `{ highlightedWord, scrollToWord }`
  - [ ] Reduce 11 state variables to 2 objects (IMPROVED: no isClient complexity)

- [ ] **1.2.2** Remove redundant state synchronization
  - [ ] Eliminate complex useEffect chains in GameControls
  - [ ] Simplify word highlighting logic
  - [ ] Remove duplicate state between parent/child

### **Task 1.3: Remove Data Redundancy**
- [ ] **1.3.1** Eliminate string versions of masked data
  - [ ] Keep only Token[] versions (maskedTitleParts, etc.)
  - [ ] Remove maskedTitle, maskedArtist, maskedLyrics strings
  - [ ] Update all components to use Token[] directly

- [ ] **1.3.2** Create computed values
  - [ ] Add getter functions for string representations when needed
  - [ ] Remove prop drilling of computed data
  - [ ] Centralize data transformations

---

## **Phase 2: Component Consolidation** 🔧

### **Task 2.1: Create New GameSidebar Component**
- [ ] **2.1.1** Design new GameSidebar interface
  - [ ] Props: `{ game: GameState, onGuess, onInteraction }` (NO ADMIN PROPS)
  - [ ] Combine GameProgress + GameControls + GuessHistory
  - [ ] File: `src/app/front/components/game/GameSidebar.tsx`

- [ ] **2.1.2** Implement GameSidebar sections
  - [ ] **Progress Section**: Move GameProgress logic
  - [ ] **Input Section**: Move guess input from GameControls  
  - [ ] **History Section**: Move GuessHistory logic
  - [ ] **Interaction Section**: Handle word highlighting/selection

- [ ] **2.1.3** Implement local state management
  - [ ] Manage guess input state
  - [ ] Handle word hover/selection
  - [ ] Manage history filtering (hide zero hits)

### **Task 2.2: Create New GameDisplay Component**
- [ ] **2.2.1** Design GameDisplay interface
  - [ ] Props: `{ game: GameState, interaction: InteractionState, showFullLyrics }` (NO ADMIN PROPS)
  - [ ] Combine GameHeader + MaskedLyricsDisplay (SIMPLIFIED)
  - [ ] File: `src/app/front/components/game/GameDisplay.tsx`

- [ ] **2.2.2** Implement GameDisplay sections
  - [ ] **Header Section**: Move GameHeader logic (title, countdown, NO ADMIN)
  - [ ] **Content Section**: Use new MaskedLyricsDisplay component
  - [ ] **Scroll Section**: Handle scroll-to-word functionality

- [ ] **2.2.3** Simplify rendering logic
  - [ ] Backend provides revealed/masked via isToGuess property
  - [ ] Simple highlighting based on props
  - [ ] Clean scroll management (NO COMPLEX WORD LOGIC)

### **Task 2.3: Create New GameActions Component**
- [ ] **2.3.1** Design GameActions interface
  - [ ] Props: `{ game: GameState, onShare, date }` (REMOVED: isAdmin, onChooseSong)
  - [ ] Combine YesterdayStats + Share (NO ADMIN)
  - [ ] File: `src/app/front/components/game/GameActions.tsx`

- [ ] **2.3.2** Implement GameActions sections
  - [ ] **Stats Section**: Move YesterdayStats
  - [ ] **Share Section**: Share button and modal trigger
  - [ ] **Completion Section**: Full lyrics toggle when complete (NO ADMIN SECTION)

### **Task 2.4: Update LyricsGame Root Component**
- [ ] **2.4.1** Simplify LyricsGame structure (ADMIN IGNORANT)
  - [ ] Remove complex state management
  - [ ] Use new simplified hooks (NO ADMIN LOGIC)
  - [ ] Clean up useEffect chains
  - [ ] Remove isClient state handling

- [ ] **2.4.2** Update LyricsGame layout
  - [ ] Replace old components with new ones:
    - GameSidebar (left column)
    - GameDisplay (center column)  
    - GameActions (right column)
  - [ ] Maintain responsive grid layout
  - [ ] Remove admin-specific layout logic

- [ ] **2.4.3** Implement clean prop passing (NO ADMIN PROPS)
  - [ ] Pass game state to all children
  - [ ] Handle interaction state coordination
  - [ ] Manage modal states (share, error)
  - [ ] Remove admin prop drilling

---

## **Phase 3: Component Cleanup** 🧹

### **Task 3.1: Remove Obsolete Components**
- [ ] **3.1.1** Delete unused components
  - [ ] Delete `GameContainer.tsx` (unused)
  - [ ] Delete `GameContent.tsx` (replaced by GameDisplay)
  - [ ] Delete `GameCompletion.tsx` (unused)
  - [ ] Delete old `GameSidebar.tsx` (replaced)

- [ ] **3.1.2** Delete complex components
  - [ ] Delete `GameControls.tsx` (merged into new GameSidebar)
  - [ ] Delete `GameProgress.tsx` (merged into new GameSidebar)
  - [ ] Delete `GuessHistory.tsx` (merged into new GameSidebar)
  - [ ] Delete `GameHeader.tsx` (merged into GameDisplay)
  - [ ] Delete `WordRenderer.tsx` (replaced with simple display logic)
  - [ ] Delete `LyricsRenderer.tsx` (replaced with MaskedLyricsDisplay)
  - [ ] Delete `MaskedLyrics.tsx` (replaced with MaskedLyricsDisplay)

- [ ] **3.1.3** Update exports and imports
  - [ ] Update `lyrics-game/index.ts` exports
  - [ ] Remove imports from deleted components
  - [ ] Update any remaining references

### **Task 3.2: Create MaskedLyricsDisplay Component**
- [ ] **3.2.1** Design MaskedLyricsDisplay interface
  - [ ] Props: `{ maskedData: MaskedLyrics, highlightedWord?, scrollToWord?, showFullLyrics?, fullLyrics? }`
  - [ ] Simple logic: just display what backend provides
  - [ ] Backend handles revealed/masked via isToGuess property

- [ ] **3.2.2** Implement simple rendering logic
  - [ ] Display tokens based on isToGuess property
  - [ ] Apply highlighting based on props
  - [ ] Handle scroll-to-word functionality
  - [ ] Show full lyrics when requested
  - [ ] NO COMPLEX WORD STATE LOGIC

### **Task 3.3: Update Type Definitions**
- [ ] **3.3.1** Create new component interfaces
  - [ ] `GameSidebarProps`
  - [ ] `GameDisplayProps`  
  - [ ] `GameActionsProps`
  - [ ] `InteractionState` type
  - [ ] `UIState` type

- [ ] **3.3.2** Remove obsolete interfaces
  - [ ] Remove `GameControlsProps`
  - [ ] Remove `GameProgressProps`
  - [ ] Remove `GuessHistoryProps`
  - [ ] Remove `GameHeaderProps`
  - [ ] Clean up `components.ts`

---

## **Phase 4: Testing & Validation** ✅

### **Task 4.1: Component Testing**
- [ ] **4.1.1** Test new GameSidebar
  - [ ] Test guess input functionality
  - [ ] Test progress display
  - [ ] Test guess history interactions
  - [ ] Test word highlighting

- [ ] **4.1.2** Test new GameDisplay
  - [ ] Test lyrics rendering
  - [ ] Test word highlighting
  - [ ] Test scroll functionality
  - [ ] Test full lyrics toggle

- [ ] **4.1.3** Test new GameActions
  - [ ] Test stats display
  - [ ] Test share functionality
  - [ ] Test admin controls
  - [ ] Test responsive behavior

### **Task 4.2: Integration Testing**
- [ ] **4.2.1** Test complete game flow
  - [ ] Test game loading
  - [ ] Test guess submission
  - [ ] Test game completion
  - [ ] Test error handling

- [ ] **4.2.2** Test responsive design
  - [ ] Test mobile layout
  - [ ] Test tablet layout
  - [ ] Test desktop layout
  - [ ] Test component interactions

### **Task 4.3: Performance Validation**
- [ ] **4.3.1** Measure performance improvements
  - [ ] Compare bundle size before/after
  - [ ] Measure render performance
  - [ ] Check memory usage
  - [ ] Validate re-render frequency

- [ ] **4.3.2** Optimize if needed
  - [ ] Add React.memo where beneficial
  - [ ] Optimize expensive calculations
  - [ ] Minimize unnecessary re-renders

---

## **Phase 5: Documentation & Cleanup** 📚

### **Task 5.1: Update Documentation**
- [ ] **5.1.1** Update component documentation
  - [ ] Document new component architecture
  - [ ] Update prop interfaces
  - [ ] Add usage examples

- [ ] **5.1.2** Update development guides
  - [ ] Update component creation guidelines
  - [ ] Document new patterns
  - [ ] Update testing approaches

### **Task 5.2: Final Cleanup**
- [ ] **5.2.1** Clean up unused files
  - [ ] Remove old component files
  - [ ] Clean up unused imports
  - [ ] Remove unused types

- [ ] **5.2.2** Optimize imports and exports
  - [ ] Consolidate exports
  - [ ] Optimize import paths
  - [ ] Clean up barrel exports

---

## **🎯 Success Metrics**

### **Before → After Comparison**
| Metric | Before | Target | Success Criteria |
|--------|---------|---------|------------------|
| **Components** | 15 | 6 | ✅ 60% reduction |
| **Props Complexity** | 18 props | 2-3 props | ✅ 80% reduction |
| **State Variables** | 11 | 2 | ✅ 85% reduction |
| **Hook Returns** | 17 values | 8-10 values | ✅ 40% reduction |
| **Bundle Size** | Current | -30% | ✅ Significant reduction |
| **Re-renders** | High | Low | ✅ Optimized performance |

### **Quality Gates**
- [ ] All tests pass
- [ ] No TypeScript errors
- [ ] Performance improved
- [ ] User experience maintained
- [ ] Code maintainability improved

---

## **🚨 Risk Mitigation**

### **Backup Strategy**
- [ ] Create feature branch for refactoring
- [ ] Keep old components until testing complete
- [ ] Maintain backward compatibility during transition
- [ ] Have rollback plan ready

### **Testing Strategy**
- [ ] Test each phase independently
- [ ] Validate user flows after each change
- [ ] Performance monitoring throughout
- [ ] User acceptance testing before final merge

---

## **📅 Estimated Timeline**

- **Phase 1**: 2-3 days (Data layer)
- **Phase 2**: 3-4 days (Component consolidation)
- **Phase 3**: 1-2 days (Cleanup)
- **Phase 4**: 2-3 days (Testing)
- **Phase 5**: 1 day (Documentation)

**Total: 9-13 days**

---

**Ready to start implementation? Which phase should we begin with?** 