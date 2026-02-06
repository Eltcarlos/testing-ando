# CLAUDE.md — Project Context & Engineering Guidelines (Next.js)

> Purpose: Give an AI software development agent the context, conventions, and guardrails needed to work effectively in this Next.js codebase.  
> Priorities: **modularity**, **readability**, **DRY without overengineering**, **clear naming**, **dependency decoupling**, **predictable structure**.

---

## 1) Project Snapshot

- Framework: **Next.js** (App Router preferred unless project explicitly uses Pages Router)
- Language: **TypeScript**
- Styling: (fill in) `Tailwind | CSS Modules | styled-components | other`
- State: (fill in) `React state | Zustand | Redux | TanStack Query | other`
- API/Data: (fill in) `Next Route Handlers | external API | tRPC | GraphQL | other`
- Forms/Validation: (fill in) `react-hook-form + zod | other`
- Testing: (fill in) `Jest | Vitest | Playwright | Cypress`
- Lint/Format: `ESLint + Prettier` (and optional `husky + lint-staged`)

> If any of the above differs, follow the repo’s existing setup and patterns.

---

## 2) Engineering Principles (Non-Negotiables)

### Readability > Cleverness
- Prefer **obvious** code over “smart” code.
- Avoid deep nesting. Extract functions when it improves clarity.

### DRY, but don’t create abstractions too early
- Duplicate a small piece of code **up to ~2 times** if abstraction would reduce clarity.
- Abstract only when:
  - The same logic repeats **3+ times**, OR
  - There is a strong chance it will expand soon, OR
  - The abstraction meaningfully reduces bugs.

### Small modules, clear boundaries
- Each module should have **one reason to change**.
- Keep files focused and short when possible.

### Decouple dependencies
- Business logic should not be tightly bound to UI or network clients.
- Prefer **dependency injection via function parameters** over importing singletons everywhere.

### Make it easy to delete
- “Can we remove this later without fear?” is a good test.
- Avoid heavy frameworks/patterns unless the project already uses them.

---

## 3) Repository Structure (Recommended)

> Follow existing structure if present; otherwise adopt this.

```
src/
  app/                          # App Router routes, layouts, route handlers
    (routes)/
    api/                        # Route handlers (if used)
  features/                     # Feature-first modules (preferred)
    <feature>/
      components/
      hooks/
      services/                 # external calls, clients, SDK wrappers
      domain/                   # pure logic, rules, transforms
      types.ts
      constants.ts
      index.ts                  # public exports
  shared/                       # cross-cutting utilities and primitives
    components/
    hooks/
    lib/                        # generic helpers, wrappers
    types/
    config/
  styles/
  tests/
```

### Feature-first rules
- Put code where it is **used**. If it becomes shared across 2–3 features, promote it to `shared/`.
- Avoid `utils/` dumping grounds. Use meaningful module names:
  - ✅ `dateFormatters.ts`, `currency.ts`, `httpClient.ts`
  - ❌ `helpers.ts`, `misc.ts`, `common.ts`

---

## 4) Naming Conventions (Make it Self-Explaining)

### Variables / Functions
- Names should encode **intent**, not implementation detail.
- Prefer descriptive names:
  - ✅ `isPaymentOverdue`, `calculateCartTotal`, `fetchUserProfile`
  - ❌ `flag`, `calc`, `handleThing`, `data2`

### Booleans
- Start with: `is`, `has`, `can`, `should`, `did`, `was`
  - ✅ `shouldShowBanner`, `hasAcceptedTerms`

### Collections
- Use plural nouns:
  - ✅ `orders`, `usersById`, `activeSubscriptions`

### Event handlers
- UI: `onClickSave`, `onSubmitLogin`
- Internal: `handleSaveClick`, `handleLoginSubmit`

---

## 5) Code Style Guidelines

### Functions
- Prefer small functions with clear inputs/outputs.
- Avoid long parameter lists; use an options object when > 3 params.
- Keep functions **pure** when possible (no hidden state, no mutation of arguments).

### Comments
- Don’t comment what code already says.
- Comment **why** when the reason isn’t obvious:
  - constraints, edge cases, business rules, performance trade-offs.

### Early returns
- Prefer guard clauses:
```ts
if (!user) return null;
if (items.length === 0) return <EmptyState />;
```

### Error handling
- Fail loudly in development, gracefully in production.
- Normalize errors at boundaries (API client, route handlers).

---

## 6) Dependency Management & Decoupling

### Rule of thumb
**UI consumes services; services consume clients; domain is pure.**

- `domain/`: no `fetch`, no React, no Next imports.
- `services/`: talks to APIs/SDKs; minimal transformation.
- `components/`: only UI logic, calling services/hooks.

### Avoid hidden globals
- Don’t import a single `apiClient` everywhere unless it’s a well-defined boundary.
- Prefer passing dependencies:

```ts
export function createUserService(client: HttpClient) {
  return {
    getProfile: (id: string) => client.get(`/users/${id}`),
  };
}
```

---

## 7) Next.js Best Practices (App Router)

### Server vs Client Components
- Default to **Server Components**.
- Use `"use client"` only when necessary (state, effects, browser APIs).
- Keep Client Components **leafy**: isolate them at the edge of the tree.

### Data fetching
- Prefer fetching in Server Components or Route Handlers.
- Use caching intentionally:
  - Use `fetch` options (`cache`, `next: { revalidate }`) deliberately.
  - Avoid accidental stale data; document caching decisions.

### Route Handlers
- Validate input at boundaries (query/body params).
- Return consistent JSON shapes.
- Centralize response helpers if repeated.

### Environment variables
- Never expose secrets to the client.
- Use `NEXT_PUBLIC_` only for safe public values.
- Validate required env vars at startup when possible.

---

## 8) State Management Rules

- Prefer local state for local UI.
- Prefer server state tools (e.g., TanStack Query) for remote data.
- Avoid putting everything in a global store.
- If using a store (Zustand/Redux), keep slices feature-scoped.

---

## 9) Reuse Patterns (Good Defaults)

### Prefer composition over inheritance
- Build small components and compose.

### Extract when meaningfully reusable
- A good reusable component:
  - has a clear API
  - is not over-configurable
  - matches real repeated use-cases

### Keep hooks focused
- `useX()` should do one job:
  - data fetching OR
  - UI coordination OR
  - event wiring
- Avoid “god hooks”.

---

## 10) Typescript Rules

- Avoid `any`. Use `unknown` and narrow.
- Prefer type inference; explicitly type public boundaries.
- Use `zod`/schema validation at runtime for external data.

Example:
```ts
import { z } from "zod";

export const UserSchema = z.object({
  id: z.string(),
  email: z.string().email(),
});
export type User = z.infer<typeof UserSchema>;
```

---

## 11) Testing Guidance

- Test business logic in `domain/` with unit tests.
- Test integration boundaries (route handlers/services) with lightweight integration tests.
- Use e2e tests for critical user paths only (avoid huge suites).

Test naming:
- `should_<expected>_when_<condition>()`

---

## 12) PR & Commit Expectations

### Pull Requests
- Small, reviewable PRs are preferred.
- Include:
  - What changed and why
  - Screenshots for UI changes
  - Any trade-offs or follow-ups

### Commits
- Prefer conventional style:
  - `feat: ...`
  - `fix: ...`
  - `refactor: ...`
  - `chore: ...`

---

## 13) “Stop and Ask” Conditions (Agent Guardrails)

The agent should pause and propose options (instead of guessing) when:
- A change impacts **auth**, **payments**, or **security boundaries**
- A refactor could affect multiple features with unclear coupling
- There are multiple competing patterns in the repo and no clear winner
- The right behavior depends on business rules not present in code

When pausing, propose:
1) minimal safe change  
2) slightly better structured change  
3) larger refactor (only if justified)

---

## 14) Definition of Done (DoD)

Before considering a task finished:
- ✅ Code compiles and lint passes
- ✅ Types are correct; no unsafe casts without justification
- ✅ Naming is clear; no “mystery meat” variables
- ✅ No unnecessary abstraction
- ✅ Feature is covered by tests where it matters
- ✅ Error states handled (loading/empty/error if UI)
- ✅ No secrets leaked to client
- ✅ Documentation updated if behavior changed

---

## 15) Quick Examples (Preferred Patterns)

### Prefer explicit parameter objects for clarity
```ts
type CreateOrderParams = {
  userId: string;
  items: Array<{ sku: string; quantity: number }>;
};

export async function createOrder(params: CreateOrderParams) {
  // ...
}
```

### Prefer “domain transforms” separated from API calls
```ts
// domain/price.ts
export function calculateTotalCents(lineItems: { priceCents: number; qty: number }[]) {
  return lineItems.reduce((sum, item) => sum + item.priceCents * item.qty, 0);
}
```

```ts
// services/orders.ts
export async function submitOrder(payload: SubmitOrderPayload) {
  return fetch("/api/orders", { method: "POST", body: JSON.stringify(payload) });
}
```

---

## 16) Project-Specific Notes (Fill in)

- Auth provider:
- UI library:
- API base URL / clients:
- Key features:
- Coding conventions already present:

---

> If you’re the agent: first read `README.md`, inspect `src/`, and follow existing patterns.  
> If patterns conflict, prefer the most common and simplest approach in the repo.
