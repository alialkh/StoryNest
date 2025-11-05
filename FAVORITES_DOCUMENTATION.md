/**
 * FAVORITES FEATURE - COMPLETE DOCUMENTATION
 * 
 * This document explains the entire favorites feature implementation
 * to prevent confusion and guide future development.
 * 
 * Table of Contents:
 * 1. Architecture Overview
 * 2. Data Flow
 * 3. Key Decisions and Why
 * 4. Common Mistakes to Avoid
 * 5. Testing Strategy
 * 6. Debugging Guide
 */

// ============================================================================
// 1. ARCHITECTURE OVERVIEW
// ============================================================================

/**
 * PERSONAL STORIES vs COMMUNITY STORIES
 * 
 * This app has TWO types of stories with DIFFERENT navigation:
 * 
 * PERSONAL STORIES (User's own stories):
 * - Storage: /stories endpoint, local stories[] array
 * - Navigation destination: Continuation screen (for editing)
 * - Displayed in: Home, Library screens
 * - Behavior: Can continue, edit, share
 * - Screen component: ContinuationScreen
 * 
 * COMMUNITY STORIES (Public feed stories):
 * - Storage: /feed/feed endpoint, public feed
 * - Navigation destination: StoryDetail screen (for reading + engaging)
 * - Displayed in: PublicFeed screen
 * - Behavior: Can comment, like, view
 * - Screen component: StoryDetailScreen
 * 
 * CRITICAL: Do not mix these up! LibraryScreen contains PERSONAL stories.
 * When user clicks on a library story, navigate to CONTINUATION screen,
 * NOT StoryDetail (which is for community stories).
 * 
 * This was the bug in the previous version:
 * onViewStory called navigation.navigate('StoryDetail', ...) ❌ WRONG
 * Should be:  navigation.navigate('Continue', ...) ✓ RIGHT
 */

// ============================================================================
// 2. DATA FLOW
// ============================================================================

/**
 * FAVORITES TOGGLE FLOW
 * 
 * User clicks heart icon on story in Library:
 * 
 * 1. StoryCard.handleToggleFavorite()
 *    - Receives: story object, isFavorite (current state = false if not favorited)
 *    - Calls: onToggleFavorite(story, false)
 *    - Sets: favoriteLoading = true (disable button)
 * 
 * 2. LibraryScreen.handleToggleFavorite()
 *    - Calls: toggleFavorite(story.id, false) from Zustand store
 *    - Key: isFavorite parameter is CURRENT state (false = not favorited)
 * 
 * 3. Zustand toggleFavorite action
 *    - Since isFavorite=false, makes: POST /stories/:id/favorite
 *    - On success: prepends story to favorites array
 *    - On error: returns false (stays at 400/error status)
 * 
 * 4. Backend POST /stories/:id/favorite
 *    - Calls: addFavorite(userId, storyId)
 *    - INSERT INTO story_favorites (id, user_id, story_id, created_at)
 *    - On success: returns 201 { success: true }
 *    - On duplicate: UNIQUE constraint violation → returns false → status 400
 * 
 * 5. Zustand store updates
 *    - Emits new favorites array
 *    - Triggers useEffect with [favorites] dependency
 * 
 * 6. LibraryScreen Effect
 *    - useEffect([favorites]) runs
 *    - Updates favoriteStoryIds Set
 *    - setFavoriteLoading(false)
 * 
 * 7. UI Updates
 *    - StoryCard re-renders with isFavorite={true}
 *    - Heart icon changes from outline to filled
 *    - Button is no longer disabled
 * 
 * Total: ~500ms end-to-end, but split into:
 * - 100ms local UI feedback
 * - 300ms API round trip
 * - 100ms state propagation
 */

/**
 * FAVORITES FETCH FLOW
 * 
 * User opens LibraryScreen:
 * 
 * 1. Component mounts
 * 
 * 2. useEffect([fetchFavorites]) runs
 *    - Calls: fetchFavorites()
 *    - Makes: GET /stories/favorites/list
 *    - Stores: response.data.stories in state
 * 
 * 3. Backend GET /stories/favorites/list
 *    - Calls: getFavoritesForUser(userId)
 *    - Query: SELECT s.* FROM stories s
 *            INNER JOIN story_favorites sf ON s.id = sf.story_id
 *            WHERE sf.user_id = ? ORDER BY sf.created_at DESC
 *    - Returns: Array of Story objects (newest favorites first)
 * 
 * 4. Zustand updates favorites array
 *    - Triggers useEffect([favorites])
 * 
 * 5. useEffect([favorites]) runs
 *    - Updates favoriteStoryIds Set
 * 
 * 6. UI Updates
 *    - All story cards re-render with correct isFavorite prop
 * 
 * IMPORTANT: These are TWO separate effects!
 * If both were in ONE effect: (INFINITE LOOP BUG)
 * ```
 * useEffect(() => {
 *   fetchFavorites().then(updateUI);
 * }, [fetchFavorites, favorites]); // ❌ favorites in deps = loop!
 * ```
 * 
 * Every time favorites updates, this runs again → fetches again → updates → loops
 * 
 * Solution (current correct code):
 * ```
 * useEffect(() => {
 *   fetchFavorites();
 * }, [fetchFavorites]); // Only fetch on mount
 * 
 * useEffect(() => {
 *   updateUI(favorites);
 * }, [favorites]); // Only update UI when data changes
 * ```
 */

// ============================================================================
// 3. KEY DECISIONS AND WHY
// ============================================================================

/**
 * DECISION 1: Separate useEffects for fetch and UI update
 * 
 * Why: Prevents infinite loop
 * Alternative considered: Single effect with .then()
 * 
 * Problem with single effect:
 * - fetchFavorites() changes favorites array
 * - favorites is in dependency array
 * - Effect runs again → fetches again → infinite loop
 * 
 * Solution: Split into two effects with single responsibility
 * - Effect 1: Fetch (runs once on mount)
 * - Effect 2: Sync UI (runs when data changes)
 * 
 * This pattern is recommended in React docs for data fetching
 */

/**
 * DECISION 2: FavoriteStoryIds as local Set instead of array search
 * 
 * Why: O(1) lookup instead of O(n)
 * 
 * When checking if story is favorited:
 * - Bad: favorites.find(s => s.id === id)     → O(n)
 * - Good: favoriteStoryIds.has(id)             → O(1)
 * 
 * With 100+ stories, this matters for performance
 * Set provides efficient membership testing
 * 
 * Trade-off: Need to keep Set in sync with array
 * That's what useEffect([favorites]) does
 */

/**
 * DECISION 3: isFavorite parameter is CURRENT state, not desired new state
 * 
 * Why: Allows parent component to control UX flow
 * 
 * API call depends on current state:
 * - If currently favorited (true) → DELETE request
 * - If not favorited (false) → POST request
 * 
 * Alternative: Pass boolean indicating desired state
 * - Problem: Parent doesn't know current state, needs extra query
 * - Current solution: Parent knows state (from isFavorite prop), passes it
 * 
 * This is more efficient and clearer intent:
 * toggleFavorite(storyId, false) = "unfavorite this story"
 * (because current state is false = not favorited)
 */

/**
 * DECISION 4: New favorites prepended to array (most recent first)
 * 
 * Why: Better UX - see what you just favorited
 * 
 * Code: favorites: [story, ...get().favorites]
 * 
 * Alternative: append to end
 * - Problem: User has to scroll to see their new favorite
 * - Current: Appears at top of list immediately
 */

/**
 * DECISION 5: UNIQUE constraint on (user_id, story_id)
 * 
 * Why: Prevents duplicate favorites at database level
 * 
 * Frontend validation alone is not enough:
 * - Race conditions possible (click twice before response)
 * - Database backup/restore could introduce duplicates
 * - API testing might bypass checks
 * 
 * Database constraint:
 * - Enforced by SQLite/PostgreSQL
 * - Prevents any path to duplicates
 * - addFavorite() catches constraint violation → returns false
 */

// ============================================================================
// 4. COMMON MISTAKES TO AVOID
// ============================================================================

/**
 * MISTAKE 1: Infinite Loop - Including data in useEffect dependency
 * 
 * ❌ WRONG:
 * useEffect(() => {
 *   fetchFavorites().then(() => setLocalState(favorites));
 * }, [fetchFavorites, favorites]); // favorites triggers re-run
 * 
 * ✓ CORRECT:
 * useEffect(() => {
 *   fetchFavorites();
 * }, [fetchFavorites]); // Only fetch on mount
 * 
 * useEffect(() => {
 *   setLocalState(favorites);
 * }, [favorites]); // Only update when data changes
 */

/**
 * MISTAKE 2: Wrong navigation for personal stories
 * 
 * ❌ WRONG (shows community story UI):
 * onViewStory = (story) => navigate('StoryDetail', { storyId: story.id, story })
 * 
 * ✓ CORRECT (shows edit/continue UI):
 * onViewStory = (story) => {
 *   setContinuationStory(story);
 *   navigate('Continue', { story });
 * }
 * 
 * Remember: LibraryScreen = personal stories → ContinuationScreen
 *           PublicFeedScreen = community stories → StoryDetailScreen
 */

/**
 * MISTAKE 3: Treating isFavorite parameter as "desired state"
 * 
 * ❌ WRONG:
 * const handleFavorite = () => {
 *   toggleFavorite(storyId, true); // "make it favorited"
 * }
 * // But if already favorited, DELETE is called, unfavoriting it!
 * 
 * ✓ CORRECT:
 * const handleFavorite = async () => {
 *   const success = await toggleFavorite(storyId, isFavorite);
 *   // If currently favorited (true), removes it
 *   // If not favorited (false), adds it
 * }
 */

/**
 * MISTAKE 4: Not awaiting async toggleFavorite
 * 
 * ❌ WRONG:
 * toggleFavorite(story.id, false);
 * // Code continues immediately, assuming it's done
 * 
 * ✓ CORRECT:
 * await toggleFavorite(story.id, false);
 * // Waits for API call before continuing
 * 
 * Or use loading state:
 * setFavoriteLoading(true);
 * await toggleFavorite(...);
 * setFavoriteLoading(false);
 */

/**
 * MISTAKE 5: Directly mutating favorites array
 * 
 * ❌ WRONG:
 * favorites.push(story); // Mutates state directly
 * 
 * ✓ CORRECT:
 * set({ favorites: [story, ...get().favorites] })
 * // Creates new array, triggers updates
 */

// ============================================================================
// 5. TESTING STRATEGY
// ============================================================================

/**
 * AUTOMATED TESTS TO RUN
 * 
 * npm run test (in mobile folder):
 * - Runs all .test.ts and .test.js files
 * - Uses Node test runner
 * - Tests compile via tsconfig.test.json
 * 
 * Test files:
 * - tests/LibraryScreen.test.js → 15+ test cases
 * - tests/storyStore.test.js → 20+ test cases
 * - backend/tests/api.favorites.test.js → 20+ test cases
 * 
 * These test the critical paths that caused the original bug
 */

/**
 * MANUAL TESTING CHECKLIST
 * 
 * 1. Favorites Toggle:
 *    □ Click heart on story in Library → should toggle
 *    □ Click twice quickly → second click shouldn't duplicate API call
 *    □ Go offline, click heart → should show error
 * 
 * 2. Navigation:
 *    □ Click story title in Library → goes to Continuation screen (not Community)
 *    □ Can edit story from there
 *    □ Favorite status correct on return
 * 
 * 3. Filtering:
 *    □ "All Stories" tab shows all stories
 *    □ "Favorites" tab shows only favorited stories
 *    □ Toggle between tabs works smoothly
 *    □ Empty states correct for each
 * 
 * 4. No Infinite Loop:
 *    □ Open Library → check backend console
 *    □ Should see 1 GET /stories/favorites/list
 *    □ Should NOT see infinite requests
 *    □ Toggle favorite → should see 1 POST/DELETE, not infinite
 * 
 * 5. Sync Across Screens:
 *    □ Favorite story in Library
 *    □ Go to Home → favorite count should update
 *    □ Back to Library → Favorites tab shows the story
 */

// ============================================================================
// 6. DEBUGGING GUIDE
// ============================================================================

/**
 * SYMPTOM: Infinite GET requests in backend console
 * 
 * DIAGNOSIS: useEffect with both fetch and data in dependencies
 * 
 * FIX: Split into two separate useEffects
 * See: MISTAKE 1 above
 */

/**
 * SYMPTOM: Click story in Library, goes to wrong screen
 * 
 * DIAGNOSIS: onViewStory navigates to 'StoryDetail' instead of 'Continue'
 * 
 * FIX: Update AppNavigator.tsx
 * Change: navigation.navigate('StoryDetail', { storyId: story.id, story })
 * To: navigation.navigate('Continue', { story })
 * See: MISTAKE 2 above
 */

/**
 * SYMPTOM: Heart icon doesn't toggle on first click
 * 
 * DIAGNOSIS: Probably not awaiting toggleFavorite, or isFavorite prop not updating
 * 
 * FIX: 
 * 1. Check handleToggleFavorite awaits the async call
 * 2. Check useEffect correctly updates favoriteStoryIds
 * 3. Check StoryCard re-renders with new isFavorite prop
 */

/**
 * SYMPTOM: "Story is already favorited" error when clicking new story
 * 
 * DIAGNOSIS: toggleFavorite called with wrong parameter
 * 
 * FIX: Check the isFavorite parameter value
 * If false (not favorited) but getting "already favorited" error:
 * - Verify isFavorite prop correctly reflects store state
 * - Check favoriteStoryIds Set is in sync with store.favorites
 */

/**
 * SYMPTOM: Favorites don't persist after app refresh
 * 
 * DIAGNOSIS: Probably not calling fetchFavorites on app start
 * 
 * FIX: LibraryScreen should call fetchFavorites in useEffect
 * See: LibraryScreen.tsx useEffect([fetchFavorites])
 */

// ============================================================================
// REFERENCES
// ============================================================================

/*
 * Files to review for context:
 * 
 * Mobile:
 * - mobile/src/screens/LibraryScreen.tsx
 * - mobile/src/components/StoryCard.tsx
 * - mobile/src/store/storyStore.ts
 * - mobile/src/navigation/AppNavigator.tsx
 * 
 * Backend:
 * - backend/src/routes/storyRoutes.ts
 * - backend/src/db/repositories/favoritesRepository.ts
 * - backend/src/db/index.ts (schema)
 * 
 * Tests:
 * - mobile/tests/LibraryScreen.test.js
 * - mobile/tests/storyStore.test.js
 * - backend/tests/api.favorites.test.js
 * 
 * External references:
 * - React docs: https://react.dev/learn/synchronizing-with-effects
 * - Zustand docs: https://github.com/pmndrs/zustand
 * - SQLite docs: https://www.sqlite.org/
 */

module.exports = {
  documentation: 'See above for complete implementation guide',
  keyTakeaways: [
    'Separate useEffects to prevent infinite loops',
    'Personal stories ≠ Community stories',
    'isFavorite parameter is CURRENT state, not desired state',
    'Use Set for O(1) favorite lookups',
    'Database constraints prevent duplicates'
  ]
};
