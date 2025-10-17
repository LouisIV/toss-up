# Plausible Custom Events

This document describes all custom events tracked with Plausible Analytics in the Toss Up application.

## Required Events (LLO-68)

### 1. Free Agent Signup
**Event Name:** `Free Agent Signup`

**Triggered when:** A user successfully registers as a free agent

**Properties:**
- `name`: Name of the free agent

**Location:** `components/teams/free-agent-form.tsx`

---

### 2. Team Created
**Event Name:** `Team Created`

**Triggered when:** A user successfully creates a new team

**Properties:**
- `teamName`: Name of the team

**Location:** `components/teams/team-form.tsx`

---

### 3. Toss Button Used
**Event Name:** `Toss Button Used`

**Triggered when:** A user confirms an action using the "toss to submit" feature

**Properties:**
- `buttonText`: The fallback text of the button (e.g., "Register as Free Agent", "Register Team", "Generate Tournament Bracket")
- `isDesktop`: Boolean indicating if the user is on a desktop device

**Location:** `components/ui/toss-button.tsx`

---

## Additional Events

### 4. Team Updated
**Event Name:** `Team Updated`

**Triggered when:** A user successfully updates an existing team

**Properties:**
- `teamName`: Name of the team

**Location:** `components/teams/team-form.tsx`

---

### 5. Team Deleted
**Event Name:** `Team Deleted`

**Triggered when:** A user deletes a team

**Properties:** None

**Location:** `hooks/useTeams.ts`

---

### 6. Free Agents Paired
**Event Name:** `Free Agents Paired`

**Triggered when:** Free agents are paired together (either manually or automatically)

**Properties:**
- `pairingType`: "manual" or "auto"
- `pairCount`: (auto-pairing only) Number of pairs created
- `totalPaired`: (auto-pairing only) Total number of agents paired

**Location:** `hooks/useFreeAgents.ts`

---

### 7. Tournament Created
**Event Name:** `Tournament Created`

**Triggered when:** A new tournament is successfully created

**Properties:**
- `teamCount`: Number of teams in the tournament
- `tableCount`: Number of concurrent game tables

**Location:** `lib/tournament-utils.ts`

---

### 8. Match Result Updated
**Event Name:** `Match Result Updated`

**Triggered when:** A match winner is recorded in a tournament

**Properties:**
- `tournamentId`: ID of the tournament

**Location:** `lib/tournament-utils.ts`

---

## Implementation Details

All events are tracked using the `usePlausible` hook from the `next-plausible` package. The hook is used in client components to track events after successful operations.

### Example Usage

```typescript
import { usePlausible } from 'next-plausible'

export function MyComponent() {
  const plausible = usePlausible()
  
  const handleAction = async () => {
    // ... perform action
    
    // Track event
    plausible('Event Name', {
      props: {
        propertyKey: 'propertyValue',
      }
    })
  }
}
```

## Configuration

Plausible is configured in:
- `app/layout.tsx` - PlausibleProvider wrapper
- `next.config.ts` - withPlausibleProxy for custom domain support
- `.env` - NEXT_PUBLIC_PLAUSIBLE_DOMAIN environment variable

Events will only be tracked when `NEXT_PUBLIC_PLAUSIBLE_DOMAIN` is set in the environment variables.
