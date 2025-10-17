<!-- 7f5ff368-8c62-49f7-8287-ff80508fc5e1 d92f7df6-ea1e-4eae-8cea-25ff5c8a1c75 -->
# Table View Interface

## Overview

Create a new table-centric view component that shows the tournament organized by physical tables, making it easy to see what's happening at each table and record results.

## Implementation Steps

### 1. Create Table View Component

**File**: `components/tournament/table-view.tsx`

Create a new component that:

- Groups matches by table number
- Shows active/current matches for each table
- Displays the next queued match for each table
- Provides quick win buttons for each match
- Uses card-based layout for each table
- Implements responsive grid (1 column mobile, 2-3 columns tablet/desktop)

Key features:

- Filter matches to show only current round's unfinished matches
- Show "Next Up" preview for each table
- Color-coded table headers (using existing theme colors)
- Large, touch-friendly buttons for mobile

### 2. Add View Toggle to Tournament Page

**File**: `app/tournament/[id]/page.tsx`

Add a toggle between:

- "Bracket View" (existing `BracketView` component)
- "Table View" (new `TableView` component)

Use tabs or button toggle to switch views, defaulting to Table View when tournament is active.

### 3. Update Tournament Stats

**File**: `app/tournament/[id]/page.tsx` (Tournament Statistics section)

Add table count to the statistics display:

```typescript
<div className="text-center">
  <div className="text-3xl font-bold text-accent mb-2">
    {tournament.tableCount}
  </div>
  <div className="text-sm text-white/70">Tables</div>
</div>
```

### 4. Mobile Responsiveness

Ensure mobile-friendly design:

- Stack tables vertically on mobile (single column)
- Use large touch targets (min 44px) for win buttons
- Ensure text is readable at mobile sizes (min 16px for body text)
- Test overflow and scrolling behavior
- Use responsive padding/margins

## Technical Details

### Helper Functions Needed

In the `TableView` component:

- `getActiveMatchesForTable(tableId)` - filters current round matches
- `getNextMatchForTable(tableId)` - finds next queued match
- `isMatchActive(match)` - checks if both teams are assigned and no winner yet

### Data Flow

- Matches already have `tableId` assigned during bracket generation
- Use existing `useUpdateMatchWinner` hook for recording wins
- Leverage existing query invalidation for automatic updates

### UI Structure

```
[Table 1 Card]
  Current Match: Team A vs Team B
    [Team A Win] [Team B Win]
  Next Up: Team C vs Team D

[Table 2 Card]
  Current Match: Team E vs Team F
    [Team E Win] [Team F Win]
  Next Up: Winner of Match X vs Winner of Match Y
```

## Files to Modify

- Create: `components/tournament/table-view.tsx` (~150 lines)
- Modify: `app/tournament/[id]/page.tsx` (add view toggle, ~20 lines)
- Modify: `app/tournament/[id]/page.tsx` (stats section, ~10 lines)

### To-dos

- [ ] Create table-view.tsx component with table-centric match display
- [ ] Add view toggle between bracket and table views in tournament page
- [ ] Add table count to tournament statistics display
- [ ] Verify mobile responsiveness and touch targets