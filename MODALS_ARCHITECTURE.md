# Modals Architecture Guide

A type-safe, stack-based modal management system using Zustand. This architecture allows you to open modals imperatively from anywhere in your app while maintaining full type safety.

## Overview

```
entities/modals/          ← Domain layer: store, types, selectors
├── model/index.ts        ← Zustand store with modal stack
├── types/index.ts        ← Type definitions for all modals
├── selectors/index.ts    ← Hooks for accessing store
└── index.ts              ← Public API

features/open*Modal/      ← Feature layer: buttons/triggers that open modals
widgets/*Modal/           ← Widget layer: actual modal UI components
app/providers/AppModals.tsx ← Renders the modal stack
```

## File Structure

### 1. Types (`entities/modals/types/index.ts`)

Define all modal names and their props in a centralized type map:

```ts
export type ModalEntry = {
  modalName: ModalName;
  props?: Partial<ModalPropsMap[ModalName]> | unknown;
};

export type ModalState = {
  modals: ModalEntry[];
};

export type ModalsContextValue = {
  modals: ModalEntry[];
  openModal: <T extends ModalName>(modal: T, props: Omit<ModalPropsMap[T], "closeModal">) => void;
  closeModal: () => void;
  closeAllModals: () => void;
};

// Map modal names to their props — this is the source of truth
export type ModalPropsMap = {
  EditListModal: EditListModalProps;
  CreateListModal: CreateListModalProps;
  AddChannelModal: AddChannelModalProps;
  // ... add more modals here
};

export type ModalPropsBase = {
  closeModal: () => void;
};

export type ModalName = keyof ModalPropsMap;

export type ModalProps<T extends ModalName> = ModalPropsMap[T] & {
  closeModal: () => void;
};

// -------- Define props for each modal --------

export type CreateListModalProps = ModalPropsBase;

export type AddChannelModalProps = ModalPropsBase & {
  listId: string;
};

export type EditListModalProps = ModalPropsBase & {
  listId: string;
};
```

### 2. Store (`entities/modals/model/index.ts`)

A Zustand store managing a stack of open modals:

```ts
import { create } from "zustand";
import type { ModalEntry, ModalName, ModalPropsMap } from "../types";

export type ModalsStore = {
  modals: ModalEntry[];
  openModal: <T extends ModalName>(
    modal: T,
    props: Omit<ModalPropsMap[T], "closeModal">,
    options?: { closeOthers?: boolean }
  ) => void;
  closeModal: () => void;
  closeAllModals: () => void;
};

export const useModalsStore = create<ModalsStore>((set) => ({
  modals: [],
  openModal: (modal, props, options = { closeOthers: false }) => {
    set((state) => ({
      modals: options.closeOthers
        ? [{ modalName: modal, props }]
        : [...state.modals, { modalName: modal, props }],
    }));
  },
  closeModal: () => {
    set((state) => ({
      modals: state.modals.slice(0, -1), // Pop the last modal
    }));
  },
  closeAllModals: () => {
    set({ modals: [] });
  },
}));
```

### 3. Selectors (`entities/modals/selectors/index.ts`)

Expose convenient hooks:

```ts
import { useModalsStore } from "../model";

export const useOpenModal = () => {
  return useModalsStore((state) => state.openModal);
};
```

### 4. Public API (`entities/modals/index.ts`)

```ts
export { useOpenModal } from "./selectors";
export type { ModalName, ModalProps, ModalPropsMap } from "./types";
export type { ModalsContextValue } from "./types";
export { useModalsStore } from "./model";
```

## Rendering Modals (`app/providers/AppModals.tsx`)

The provider component renders all open modals and injects `closeModal`:

```tsx
import { useModalsStore, type ModalName, type ModalPropsMap } from "~/entities/modals";
import { CreateListModal } from "~/widgets/createListModal";
import { EditListModal } from "~/widgets/editListModal";
// ... import other modal widgets

const renderModalByName = (
  modalName: ModalName,
  props: Partial<ModalPropsMap[ModalName]> | undefined,
  handlers: { closeModal: () => void }
) => {
  switch (modalName) {
    case "CreateListModal":
      return <CreateListModal {...(props as ModalPropsMap["CreateListModal"])} closeModal={handlers.closeModal} />;
    case "EditListModal":
      return <EditListModal {...(props as ModalPropsMap["EditListModal"])} closeModal={handlers.closeModal} />;
    // ... add cases for each modal
    default:
      return null;
  }
};

export const AppModals = () => {
  const { modals, closeModal } = useModalsStore();

  if (modals.length === 0) return null;

  return modals.map((modal, index) => (
    <div key={`${modal.modalName}-${index}`}>
      {renderModalByName(modal.modalName, modal.props as Partial<ModalPropsMap[typeof modal.modalName]>, {
        closeModal,
      })}
    </div>
  ));
};
```

Mount it at app root:

```tsx
// app/entrypoint.tsx
<AppModals />
```

## Usage Examples

### Opening a Modal (Feature Layer)

```tsx
// features/openCreateListModal/ui/OpenCreateListModal.tsx
import { memo } from "react";
import { useOpenModal } from "~/entities/modals";
import { Button } from "~/shared/ui/components";

export const OpenCreateListModal = memo(() => {
  const openModal = useOpenModal();

  const onClick = () => {
    openModal("CreateListModal", {});
  };

  return <Button onClick={onClick}>Create List</Button>;
});
```

### Opening a Modal with Props

```tsx
const openModal = useOpenModal();

// Type-safe: TypeScript will require `listId` for AddChannelModal
openModal("AddChannelModal", { listId: "abc123" });

// Close all other modals when opening this one
openModal("CreateListModal", {}, { closeOthers: true });
```

### Modal Widget Component

```tsx
// widgets/createListModal/ui/CreateListModal.tsx
import { Dialog, DialogContent, DialogHeader } from "~/shared/ui/components";
import type { CreateListModalProps } from "~/entities/modals/types";
import { CreateList } from "~/features/createList";

export const CreateListModal = ({ closeModal }: CreateListModalProps) => {
  return (
    <Dialog open onOpenChange={closeModal}>
      <DialogContent className="sm:max-w-[340px]">
        <DialogHeader title="Create List" />
        <CreateList onSuccess={closeModal} />
      </DialogContent>
    </Dialog>
  );
};
```

## Adding a New Modal

1. **Define types** in `entities/modals/types/index.ts`:
   ```ts
   // Add to ModalPropsMap
   export type ModalPropsMap = {
     // ... existing
     MyNewModal: MyNewModalProps;
   };

   // Define the props
   export type MyNewModalProps = ModalPropsBase & {
     someRequiredProp: string;
   };
   ```

2. **Create the modal widget** in `widgets/myNewModal/`:
   ```tsx
   // widgets/myNewModal/ui/MyNewModal.tsx
   import type { MyNewModalProps } from "~/entities/modals/types";

   export const MyNewModal = ({ closeModal, someRequiredProp }: MyNewModalProps) => {
     return (
       <Dialog open onOpenChange={closeModal}>
         <DialogContent>{someRequiredProp}</DialogContent>
       </Dialog>
     );
   };
   ```

3. **Register in AppModals**:
   ```tsx
   case "MyNewModal":
     return <MyNewModal {...(props as ModalPropsMap["MyNewModal"])} closeModal={handlers.closeModal} />;
   ```

4. **Create a feature to open it** (optional):
   ```tsx
   // features/openMyNewModal/ui/OpenMyNewModal.tsx
   const openModal = useOpenModal();
   openModal("MyNewModal", { someRequiredProp: "Hello" });
   ```

## Key Benefits

- **Type Safety**: `openModal("ModalName", props)` is fully typed — TypeScript enforces correct props
- **Stack-Based**: Supports nested modals; `closeModal()` pops the top modal
- **Imperative API**: Open modals from anywhere without prop drilling
- **Separation of Concerns**:
  - `entities/modals` — state management & types
  - `widgets/*Modal` — modal UI components
  - `features/open*Modal` — triggers/buttons that open modals
- **Single Source of Truth**: All modal types defined in one place

## Dependencies

- **Zustand** (`zustand`) — State management
- **Dialog Component** — Any dialog/modal primitive (shadcn/ui, Radix, etc.)
