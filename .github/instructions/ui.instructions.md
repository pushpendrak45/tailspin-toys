---
description: 'Central UI strategy and component development philosophy'
---

# UI Component Strategy

This file defines the central UI development strategy for Tailspin Toys. Technology-specific guidance is in separate instruction files.

## Component Architecture

### Technology Separation

- **Astro** (`.astro` files): Pages, layouts, components, routing, and static content. The site is fully prerendered (`output: 'static'`), so components render to HTML at build time.
- **Tailwind CSS** (utility classes): Styling
- **Astro `<script>`**: Reach for a small client-side script only when genuine interactivity is required — there is no client-side UI framework.

Refer to technology-specific instruction files:
- [`astro.instructions.md`](astro.instructions.md) - Astro pages, layouts, and components
- [`style.instructions.md`](style.instructions.md) - Tailwind CSS styling patterns

## Core Principles

### Testability

- Every interactive element MUST include a `data-testid` attribute
- Use descriptive test IDs that identify the element's purpose and context
- Examples: `data-testid="game-card-{game.id}"`, `data-testid="submit-button"`, `data-testid="nav-home"`

### Accessibility

- Use semantic HTML elements (`<nav>`, `<main>`, `<article>`, `<button>`)
- Provide ARIA labels and roles where semantic HTML isn't sufficient
- Use plain `<nav>` with `<a>`/`<button>` elements for site navigation — do **not** add `role="menu"`. Reserve `role="menu"` / `role="menuitem"` for true application-style menus that implement full composite keyboard semantics (arrow-key roving focus, Home/End, type-ahead)
- Loading states should use `role="status"` and `aria-live="polite"` for screen reader announcements
- Include Escape key handlers for dismissible elements (menus, modals)
- Ensure keyboard navigation works for all interactive elements, with proper focus management
- Include visible focus states: `focus:ring-2 focus:ring-blue-500 focus:outline-none`
- Maintain sufficient color contrast (especially in dark theme)

### Design Consistency

- Dark theme throughout the application
- Modern, clean UI with rounded corners and smooth transitions
- Consistent spacing and visual hierarchy
- Responsive design that works on mobile, tablet, and desktop

### Component Reusability

- Create reusable components for common UI patterns
- Keep components focused on a single responsibility
- Use props for configuration, not duplication
- Document component APIs with TypeScript types

## Development Workflow

1. **Choose the right tool**: 
   - Content & structure → Astro components/pages
   - Styling → Tailwind
   - Client interactivity (rare) → a scoped Astro `<script>`

2. **Follow technology-specific patterns**: 
   - Refer to the appropriate instruction file

3. **Ensure testability**: 
   - Add `data-testid` to all interactive elements

4. **Verify accessibility**: 
   - Test keyboard navigation
   - Check focus states
   - Validate semantic structure

## TypeScript Formatting Rules

### Explicit Type Annotations

**All functions must have explicit parameter and return type annotations.** This ensures type safety, clarity, and enables tools like TypeScript 7's native compiler (`tsgo`) to verify the code.

```ts
// ✅ Good
async function getAllGames(db: Database): Promise<GameWithRelations[]> {
  // …
}

function formatPrice(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

interface Props {
  game: GameWithRelations;
  variant?: 'default' | 'featured';
}

// ❌ Bad — inferred types are not explicit
async function getAllGames(db) {
  // …
}

// ❌ Bad — no return type
function formatPrice(cents: number) {
  return `$${(cents / 100).toFixed(2)}`;
}
```

### Comments and Documentation

Follow the comment philosophy in [`comments.instructions.md`](comments.instructions.md):

- **Export every function and component** in `db/`, `src/lib/`, and reusable `.astro` components with a **JSDoc/TSDoc comment block** describing purpose, parameters, and return value.
- **Comment intent, not mechanics.** Explain *why* code exists or what non-obvious decision was made, not what the code already says.
- **Keep comments current.** Treat outdated comments as bugs — update them with the code that touches them.

### Naming Conventions

- **Functions and variables:** camelCase
- **Types, interfaces, and classes:** PascalCase
- **Constants:** UPPER_SNAKE_CASE or camelCase (depending on mutability)
- **Test files:** `<module>.test.ts`
- **Astro components:** PascalCase (e.g., `GameCard.astro`)

### Module Organization

- **One responsibility per file.** Keep modules focused and easy to test and understand.
- **Group related exports.** When a file exports multiple items, organize them logically (e.g., types first, then functions).
- **Use named exports.** Prefer `export function X() {}` over default exports for better discoverability and refactoring.

### Type Imports and Exports

- Use `import type` for type-only imports to avoid accidental runtime dependencies.

```ts
import type { Game, Publisher } from './types';
import { formatPrice } from './utils';
```

### Linting

ESLint (`npm run lint`) enforces code quality across TypeScript and Astro files. The configuration includes rules for:

- Unused variables and imports
- Explicit return types on exported functions
- Consistent naming conventions
- No `any` types (unless explicitly justified)
- Accessibility in Astro components

Run `npm run lint` before committing. ESLint is also enforced in CI on pull requests to `main`.
