---
name: fsd
description: >
  Feature-Sliced Design architecture guide. Use when creating, modifying, or reviewing
  frontend code in apps/web. Triggers on: new components, pages, features, widgets, entities,
  file placement decisions, import questions, FSD structure discussions.
user-invocable: true
argument-hint: "[component-or-task description]"
effort: high
---

# Feature-Sliced Design (FSD) — Bettersent Project Skill

You are assisting with frontend code in `apps/web/src/` which follows **Feature-Sliced Design v2.1**.

When the user asks you to create, move, or modify frontend code, follow this guide to determine correct placement, structure, naming, and imports.

## Layer Hierarchy (strict top-down imports)

```
app/        → Application init, providers, routing, global styles
pages/      → Route-level components, page-specific logic
widgets/    → Large composite UI blocks reused across pages
features/   → Reusable user interactions (used in 2+ places)
entities/   → Reusable business domain models (used in 2+ places)
shared/     → Infrastructure with NO business logic (UI kit, utils, API client)
```

**Import rule**: A module may ONLY import from layers strictly below it. Cross-imports between slices on the same layer are **forbidden**.

```typescript
// ✅ Allowed
import { Button } from "~/shared/ui";           // feature → shared
import { useOpenModal } from "~/entities/modals"; // page → entity

// ❌ Forbidden
import { SendContent } from "~/features/sendContent"; // entity → feature (upward)
import { ThemeToggle } from "~/features/toggleTheme";  // feature → feature (same layer)
```

## Path Aliases

Always use these aliases for cross-layer imports:

```
~/app/*       → apps/web/src/app/*
~/pages/*     → apps/web/src/pages/*
~/widgets/*   → apps/web/src/widgets/*
~/features/*  → apps/web/src/features/*
~/entities/*  → apps/web/src/entities/*
~/shared/*    → apps/web/src/shared/*
~/api/*       → apps/api/src/*          (backend types for Eden)
```

Use **relative imports** only within the same slice.

## Decision Framework: Where Does This Code Go?

Follow this decision tree for every new piece of code:

### Step 1 — How many places use it?

- **One page only** → Keep it in that `pages/` slice. Do NOT extract prematurely.
- **2+ pages** → Continue to Step 2.

### Step 2 — Is it infrastructure with no business logic?

- UI components (Button, Dialog, Input) → `shared/ui/`
- Utility functions (formatDate, cn) → `shared/lib/`
- API client, CRUD helpers → `shared/lib/treaty/` or `shared/api/`
- Auth tokens, session → `shared/lib/auth/`
- Hooks with no business logic → `shared/hooks/`

### Step 3 — Is it a complete user action reused in 2+ places?

- Yes → `features/featureName/`
- No / uncertain → Keep in the page.

### Step 4 — Is it a business domain model reused in 2+ places?

- Yes → `entities/entityName/`
- No / uncertain → Keep in the page.

### Step 5 — Is it a large composite UI block combining multiple features?

- Yes → `widgets/widgetName/`

### Step 6 — Is it app-wide configuration?

- Providers, routing, global styles → `app/`

**Golden rule**: When in doubt, keep it in `pages/`. Extract only when genuinely needed.

## Scaffold Scripts

Use these scripts from `apps/web/` to create new slices and components with the correct structure:

```bash
bun run scripts/addUiComponent.ts <component-name>  # Add shadcn/ui component (runs shadcn CLI, moves to folder, updates barrel)
bun run scripts/createWidget.ts <WidgetName>         # Scaffold FSD widget
bun run scripts/createFeature.ts <FeatureName>       # Scaffold FSD feature
bun run scripts/createPage.ts <PageName>             # Scaffold FSD page
```

Always use these scripts instead of manually creating files. They ensure the consistent folder-per-component structure described below.

## Slice Structure Template

Every slice (in pages, features, widgets, entities) follows this pattern:

```
sliceName/
├── index.tsx             # Public API — re-exports from "./ui"
├── ui/                   # UI components
│   ├── index.tsx         # Re-exports from "./ComponentName/ComponentName"
│   ├── ComponentName/
│   │   ├── ComponentName.tsx
│   │   └── SubComponent.tsx  # (if internal sub-components needed)
├── model/                # State, business logic, stores
│   └── domain-name.ts    # Domain-based naming, NOT types.ts/utils.ts
├── api/                  # API integration, mutations, query hooks
│   └── index.ts          # Re-exports all API hooks (import from "./api")
├── lib/                  # Internal utilities for this slice
│   └── index.ts          # Re-exports all helpers (import from "./lib")
├── hooks/                # Custom hooks (alternative to model/ for simpler cases)
│   └── index.ts          # Re-exports all hooks (import from "./hooks")
├── types/                # Type definitions (when complex enough to separate)
│   └── index.ts
└── config/               # Slice-specific configuration
    └── index.ts          # Re-exports all constants (import from "./config")
```

Not all segments are required. Use only what you need.

**Key convention**: Every UI component lives in its own folder (`ComponentName/ComponentName.tsx`), never as a flat file directly under `ui/`. The export chain is always: `index.tsx` → `ui/index.tsx` → `ComponentName/ComponentName.tsx`.

## Public API Rules (index.ts)

Every slice MUST export through `index.ts`. External consumers MUST NOT import internal files directly.

```typescript
// ✅ Correct
import { SendContent } from "~/features/sendContent";
import { useOpenModal } from "~/entities/modals";

// ❌ Violation — bypasses public API
import { SendContent } from "~/features/sendContent/ui/SendContent/SendContent";
import { modalStore } from "~/entities/modals/model/index";
```

### Public API patterns used in this project:

**Standard re-export** (pages, features, widgets):
```typescript
// features/sendContent/index.tsx
export * from "./ui";

// features/sendContent/ui/index.tsx
export * from "./SendContent/SendContent";
```

**Multi-export** (entities with rich API):
```typescript
// entities/modals/index.ts
export { useOpenModal, useCloseModal } from "./selectors";
export { useModalsStore, useModals, openModal, closeModal } from "./model";
export type { ModalName, ModalProps } from "./types";
```

## File Naming Rules

### Domain-based naming (MUST)
Name files after the business domain, NOT their technical role:

```
// ❌ Bad — technical-role naming
model/types.ts
model/utils.ts
lib/helpers.ts

// ✅ Good — domain-based naming
model/user.ts
model/order.ts
api/fetch-profile.ts
lib/theme-storage.ts
```

### Component naming
- **Components**: PascalCase matching file name (`SendContent.tsx` exports `SendContent`)
- **Hooks**: `use` prefix + PascalCase (`useCreateDevice.ts` exports `useCreateDevice`)
- **Utilities**: camelCase or kebab-case files
- **Types**: PascalCase (`ModalPropsMap`, `KindleEmail`)

## Layer-Specific Conventions in This Project

### app/ layer
- `entrypoint.tsx` — React initialization, routing, provider composition
- `providers/` — `AppModals.tsx`, `AnalyticsProvider.tsx`, `QueryProvider.tsx`
- `styles/` — `tailwind.css`
- No slices — organized directly by segments

### pages/ layer
```
pages/pageName/
├── index.tsx
├── ui/
│   ├── index.tsx
│   └── PageName/
│       └── PageName.tsx
└── hooks/                # Page-specific hooks
    └── index.ts          # Re-exports all hooks (import from "./hooks")
```
- Pages compose features, widgets, and entities
- Page-specific logic stays in the page (hooks, state, API calls)
- Auth is handled at the layout level (AppLayout widget), not in individual pages

### features/ layer
```
features/featureName/
├── index.tsx
├── ui/
│   ├── index.tsx
│   └── FeatureName/
│       └── FeatureName.tsx
└── lib/                  # (optional) feature-specific logic
    └── index.ts
```
- Feature names follow `verbNoun` pattern: `sendContent`, `toggleTheme`
- The main component name matches the feature name in PascalCase and represents the **action**, not the UI element type. For example: `GoogleSignIn` (not `GoogleSignInButton`), `MagicLinkSignIn` (not `MagicLinkSignInForm`), `SendContent` (not `SendContentButton`).
- Small features: just `ui/`
- Medium features: `ui/` + `lib/`
- Features handle their own mutations and analytics events

### widgets/ layer
```
widgets/widgetName/
├── index.tsx
├── ui/
│   ├── index.tsx
│   └── WidgetName/
│       ├── WidgetName.tsx
│       └── SubComponent.tsx   # Internal sub-components in same folder
└── api/                  # (optional) widget-specific mutations
    └── index.ts          # Re-exports all API hooks (import from "./api")
```
- Widgets often manage multi-step flows or complex forms
- Widget names are descriptive: `kindleSettingsModal`, `onboardingModal`

### entities/ layer
```
entities/entityName/
├── index.ts
├── types/
│   └── index.ts
├── model/
│   └── index.ts          # Store + hooks
├── selectors/
│   └── index.ts
└── hooks/
    └── index.ts          # Re-exports all hooks (import from "./hooks")
```
- Current entities: `modals` (global modal state), `device` (Kindle device operations)
- Modal system uses `useSyncExternalStore` (not Zustand)
- Be conservative — don't create entities prematurely

### shared/ layer
```
shared/
├── ui/                   # shadcn/ui components (Button, Dialog, Input, etc.)
│   ├── ComponentName/
│   │   └── ComponentName.tsx
│   └── index.ts          # Barrel export
├── lib/
│   ├── treaty/           # Eden API client
│   ├── auth/             # Better Auth (signIn, signOut, useSession)
│   ├── analytics/        # PostHog (useAnalytics hook)
│   ├── cn/               # clsx + tailwind-merge
│   └── index.ts
└── hooks/
    ├── useIsMobile/
    └── index.ts
```
- No business logic here
- UI components use Radix + Tailwind + CVA for variants
- All API calls go through `~/shared/lib/treaty`

## Project-Specific Patterns

### API calls
```typescript
import { api } from "~/shared/lib/treaty";
const response = await api.endpoint.get();
if (response.error) {
  const errorValue = response.error.value;
  const errorMessage = typeof errorValue === "object" && "error" in errorValue
    ? errorValue.error
    : "Default error message";
  throw new Error(errorMessage);
}
return response.data?.data;
```

### Analytics
```typescript
import { useAnalytics } from "~/shared/lib";
const analytics = useAnalytics();
analytics.capture("event_name", { key: value });
```

### Modal system
To add a new modal:
1. Add type to `entities/modals/types/index.ts` → `ModalPropsMap`
2. Create widget in `widgets/newModal/`
3. Register in `app/providers/AppModals.tsx`
4. Open with: `openModal("ModalName", { props })`

### State management
- **Local UI state**: `useState` + `useRef`
- **Server state**: TanStack Query (`useQuery`, `useMutation`)
- **Global UI state**: External store via entities (modals)
- **Auth state**: `useSession()` from `~/shared/lib/auth`

## Anti-patterns to AVOID

1. **Don't create entities prematurely** — data used in one place stays in that place
2. **Don't put CRUD in entities** — CRUD goes in `shared/api/` or `shared/lib/treaty/`
3. **Don't put business logic in shared/** — shared is infrastructure only
4. **Don't use technical-role file names** — `types.ts`, `utils.ts`, `helpers.ts` are forbidden
5. **Don't bypass public API** — always import from `index.ts`
6. **Don't cross-import between same-layer slices** — resolve via merge, extract down, or compose up
7. **Don't extract single-use code** — keep it in the page until genuinely reused
8. **Don't import directly from posthog-js** — use `useAnalytics()` hook

## Cross-Import Resolution (when two same-layer slices need shared code)

Try in order:
1. **Merge slices** — if they always change together
2. **Extract to lower layer** — move shared logic to entities or shared
3. **Compose in higher layer** — parent connects them via props/slots
4. **@x notation** — last resort, document why

## Checklist Before Creating/Moving Code

- [ ] Determined correct layer using the decision framework
- [ ] Created `index.ts` public API
- [ ] Used domain-based file naming
- [ ] Used path aliases (`~/layer/`) for cross-layer imports
- [ ] Used relative imports within the slice
- [ ] No upward or cross-layer import violations
- [ ] No business logic in shared/
- [ ] Analytics use `useAnalytics()` hook
- [ ] API calls use Eden treaty client

For detailed examples and edge cases, see [references/](references/).
