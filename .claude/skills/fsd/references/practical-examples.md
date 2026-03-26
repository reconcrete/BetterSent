# Practical Examples for Bettersent

## Example 1: Adding a New Feature

Task: Create a "copy link" feature used on both the root and history pages.

Use the scaffold script:
```bash
bun run scripts/createFeature.ts CopyLink
```

This creates:
```
features/copyLink/
├── index.tsx             # export * from "./ui"
├── ui/
│   ├── index.tsx         # export * from "./CopyLink/CopyLink"
│   └── CopyLink/
│       └── CopyLink.tsx
```

If you also need internal utilities, add a `lib/` segment manually:
```
features/copyLink/
├── index.tsx
├── ui/
│   ├── index.tsx
│   └── CopyLink/
│       └── CopyLink.tsx
└── lib/
    └── clipboard.ts
```

**ui/CopyLink/CopyLink.tsx:**
```typescript
import { memo } from "react";
import { Button } from "~/shared/ui";
import { useAnalytics } from "~/shared/lib";
import { copyToClipboard } from "../../lib/clipboard";

interface CopyLinkProps {
  url: string;
}

export const CopyLink = memo(({ url }: CopyLinkProps) => {
  const analytics = useAnalytics();

  const handleCopy = async () => {
    await copyToClipboard(url);
    analytics.capture("link_copied", { url });
  };

  return <Button onClick={handleCopy}>Copy Link</Button>;
});
```

## Example 2: Adding a New Page

Task: Create a profile page.

Use the scaffold script:
```bash
bun run scripts/createPage.ts Profile
```

This creates:
```
pages/profile/
├── index.tsx             # export * from "./ui"
└── ui/
    ├── index.tsx         # export * from "./Profile/Profile"
    └── Profile/
        └── Profile.tsx
```

Then register in `app/entrypoint.tsx` routing (inside the `<AppLayout />` route).

## Example 3: Adding a New Widget (Modal)

Task: Create a confirmation modal used across multiple pages.

**Step 1** — Scaffold the widget:
```bash
bun run scripts/createWidget.ts ConfirmationModal
```

**Step 2** — Add to modal types:
```typescript
// entities/modals/types/index.ts
export type ModalPropsMap = {
  // ... existing modals
  ConfirmationModal: ConfirmationModalProps;
};

interface ConfirmationModalProps {
  title: string;
  message: string;
  onConfirm: () => void;
}
```

**Step 3** — Register in `app/providers/AppModals.tsx`:
```typescript
case "ConfirmationModal":
  return <ConfirmationModal {...props} closeModal={handlers.closeModal} />;
```

**Step 4** — Use anywhere:
```typescript
import { openModal } from "~/entities/modals";
openModal("ConfirmationModal", { title: "Delete?", message: "...", onConfirm: handleDelete });
```

## Example 4: Adding a Shared UI Component

Task: Add a Badge component to the design system.

Use the scaffold script:
```bash
bun run scripts/addUiComponent.ts badge
```

This runs the shadcn CLI, moves the file into `shared/ui/Badge/Badge.tsx`, and updates `shared/ui/index.ts` with the barrel export.

Use CVA for variants, cn for class merging, same as existing components.

## Example 5: Page-Specific Code That Shouldn't Be Extracted

Task: A complex form only used on one page.

```
// ✅ Keep it in the page
pages/profile/
├── index.tsx
├── ui/
│   ├── index.tsx
│   └── Profile/
│       ├── Profile.tsx
│       ├── ProfileForm.tsx      # Page-specific sub-component
│       └── AvatarUploader.tsx   # Page-specific sub-component
├── hooks/
│   └── useProfileForm.ts
└── api/
    └── useUpdateProfile.ts
```

Do NOT extract `ProfileForm` to features/ if only this page uses it.
