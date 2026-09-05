---
description: 'Comment philosophy, documentation standards, and code clarity'
---

# Comments and Documentation Guidelines

This document establishes a clear philosophy for comments and documentation across the Tailspin Toys codebase. The goal is consistency, clarity, and reduced noise — comments should explain **why** code exists, not restate **what** it already says.

## Core Principle: Intent, Not Mechanics

**Comment intent and decisions, not mechanics.** If a reader can understand what code does by reading it, they don't need a comment explaining the code. They need a comment explaining *why* the code exists, what non-obvious decision was made, or what context they need to understand it.

### ✅ Good Comments

```ts
// Calculate rating deterministically from title to ensure reproducible builds
// and consistent static output across different environments
function ratingFromTitle(title: string): number {
  let hash = 0;
  for (let i = 0; i < title.length; i++) {
    const char = title.charCodeAt(i);
    hash = (hash << 5) - hash + char;
  }
  return 3.0 + ((Math.abs(hash) % 20) / 10);
}
```

```ts
// Pre-render the full site at build time, not on demand.
// This keeps hosting simple (static hosting) and guarantees all pages
// reflect the database state in games.csv at build time.
export const prerender = true;
```

### ❌ Poor Comments

```ts
// Calculate rating from title
function ratingFromTitle(title: string): number {
  let hash = 0;
  for (let i = 0; i < title.length; i++) {
    // Get the character code
    const char = title.charCodeAt(i);
    // Update hash
    hash = (hash << 5) - hash + char;
  }
  // Add 3 and scale by mod 20
  return 3.0 + ((Math.abs(hash) % 20) / 10);
}
```

**Why these are poor:** They restate what the code already says. A reader who understands `charCodeAt()` doesn't need a comment explaining what it does.

```ts
// Always pre-render the site
export const prerender = true;
```

**Why this is poor:** It doesn't explain *why* pre-rendering is required or what it enables.

## When to Comment

### Always Comment:

1. **Non-obvious decisions or constraints**
   - Why a particular algorithm or pattern was chosen over alternatives
   - Business or architectural constraints that limit implementation choices
   - Performance or reproducibility implications (e.g., "deterministic for static builds")

2. **Workarounds and hacks**
   - If you're doing something counterintuitive or there's a better way but it's blocked, say so
   - Link to issues, bugs, or documentation that explain the blocker

3. **Context for future maintainers**
   - The purpose of a module or function that isn't obvious from its name or signature
   - What assumptions the code makes (e.g., "assumes title is non-empty and normalized")

### Rarely or Never Comment:

- Implementation details that are obvious from reading the code
- What a built-in function does (e.g., `.charCodeAt()`, `.map()`)
- What a variable holds immediately after assignment
- Loop mechanics or control flow that's standard

## TSDoc/JSDoc for Exported Functions

Every exported function in `db/` and `src/lib/` **must** have a TSDoc/JSDoc comment block describing:

- **Purpose:** What the function does and why it exists
- **Parameters:** Type and meaning of each argument, including the injectable `db` (mention its role in testing)
- **Return value:** What the function returns and any guarantees (e.g., "ordered by title", "returns null if not found")

### Example: Data-Access Helper with Injectable DB

```ts
/**
 * Fetch all games from the database, ordered by title.
 *
 * @param db - The database client (injectable for testing with an in-memory database)
 * @returns An array of games with their related publisher and category, sorted alphabetically by title.
 *          Returns an empty array if no games exist.
 */
export async function getAllGames(db: Database): Promise<GameWithRelations[]> {
  // …
}
```

```ts
/**
 * Fetch a single game by its ID with its related publisher and category.
 *
 * @param db - The database client (injectable for testing)
 * @param id - The game's numeric ID
 * @returns The game object with relations, or null if the game is not found
 */
export async function getGameById(db: Database, id: number): Promise<GameWithRelations | null> {
  // …
}
```

### Example: Transform Function

```ts
/**
 * Parse a CSV row into a game object with computed fields.
 *
 * Description is built from multiple fields and normalized.
 * Rating is computed deterministically from the title to ensure
 * reproducible static builds.
 *
 * @param row - Raw CSV row object with title, description, starRating, publisherName, categoryName
 * @returns A game object ready for database insertion
 */
export function parseGameRow(row: Record<string, string>): Game {
  // …
}
```

## Astro Component Props Documentation

Each reusable `.astro` component **must** document its `Props` interface with JSDoc comments. This makes the component API self-explanatory and helps users understand what data to pass.

### Example: GameCard Component

```astro
---
/**
 * Props for the GameCard component.
 *
 * @property {GameWithRelations} game - The game object with its related publisher and category
 * @property {string} [cardVariant="default"] - Visual style variant: "default", "featured", or "compact"
 * @property {boolean} [showDescription=true] - Whether to display the full game description
 */
interface Props {
  game: GameWithRelations;
  cardVariant?: 'default' | 'featured' | 'compact';
  showDescription?: boolean;
}

const { game, cardVariant = 'default', showDescription = true } = Astro.props;
---

<article class="game-card" data-testid={`game-card-${game.id}`}>
  {/* … */}
</article>
```

## Keeping Comments Current

**Treat outdated comments as bugs.** If you change code behavior, update the related comments in the same change. If a comment is no longer accurate:

1. Update it to reflect the current behavior
2. Or delete it if the comment is now redundant (the code speaks for itself)

Include comment updates in the same commit as the code change so they stay in sync.

## Summary: The Test

Before writing a comment, ask yourself:

1. **Does this comment explain *why* the code exists or what non-obvious decision was made?** If yes, keep it.
2. **Does this comment restate what the code already says?** If yes, delete it.
3. **Is this an exported function or component that a user needs to understand how to call?** If yes, add a JSDoc/TSDoc block.
4. **Is there a better way to make this code clear?** If yes (rename a variable, break into smaller functions, use a more obvious algorithm), do that instead of commenting.

Good comments make code easier to understand and maintain. Poor comments add noise and drift out of sync with the code. Strive for clarity through code first, comments second.
