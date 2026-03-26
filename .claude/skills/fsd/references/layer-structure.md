# Layer Structure Reference

## Full Directory Structure for Bettersent Web

```
apps/web/src/
├── app/                          # No slices, segments only
│   ├── entrypoint.tsx
│   ├── providers/
│   │   ├── AppModals.tsx
│   │   ├── AnalyticsProvider.tsx
│   │   └── QueryProvider.tsx
│   └── styles/
│       └── tailwind.css
│
├── pages/                        # Slices → segments
│   ├── root/
│   │   ├── index.tsx
│   │   └── ui/
│   │       ├── index.tsx
│   │       └── Root/
│   │           └── Root.tsx
│   ├── history/
│   │   ├── index.tsx
│   │   └── ui/
│   │       ├── index.tsx
│   │       └── History/
│   │           └── History.tsx
│   └── settings/
│       ├── index.tsx
│       └── ui/
│           ├── index.tsx
│           └── Settings/
│               └── Settings.tsx
│
├── widgets/                      # Slices → segments
│   ├── appLayout/
│   │   ├── index.tsx
│   │   ├── hooks/
│   │   │   └── useOnboardingGuard.ts
│   │   └── ui/
│   │       ├── index.tsx
│   │       ├── AppLayout/
│   │       │   └── AppLayout.tsx
│   │       ├── NavBar/
│   │       │   └── NavBar.tsx
│   │       └── UserMenu/
│   │           └── UserMenu.tsx
│   ├── kindleDeviceManager/
│   │   ├── index.tsx
│   │   └── ui/
│   │       ├── index.tsx
│   │       └── KindleDeviceManager/
│   │           └── KindleDeviceManager.tsx
│   ├── kindleEmailSelector/
│   │   ├── index.tsx
│   │   └── ui/
│   │       ├── index.tsx
│   │       └── KindleEmailSelector/
│   │           └── KindleEmailSelector.tsx
│   ├── kindleSettingsModal/
│   │   ├── index.tsx
│   │   └── ui/
│   │       ├── index.tsx
│   │       └── KindleSettingsModal/
│   │           └── KindleSettingsModal.tsx
│   ├── markdownPreviewModal/
│   │   ├── index.tsx
│   │   └── ui/
│   │       ├── index.tsx
│   │       └── MarkdownPreviewModal/
│   │           └── MarkdownPreviewModal.tsx
│   ├── onboardingModal/
│   │   ├── index.tsx
│   │   ├── api/
│   │   │   └── useMarkOnboarded.ts
│   │   └── ui/
│   │       ├── index.tsx
│   │       └── OnboardingModal/
│   │           ├── OnboardingModal.tsx
│   │           ├── WelcomeStep.tsx
│   │           ├── ApprovedSendersStep.tsx
│   │           └── AddKindleEmailStep.tsx
│   ├── sendUrlWidget/
│   ├── sendTextWidget/
│   ├── sendYoutubeWidget/
│   ├── sendTopicWidget/
│   ├── sendFileWidget/
│   └── signInCard/
│       ├── index.tsx
│       └── ui/
│           ├── index.tsx
│           └── SignInCard/
│               └── SignInCard.tsx
│
├── features/                     # Slices → segments
│   ├── sendContent/
│   │   ├── index.tsx
│   │   └── ui/
│   │       ├── index.tsx
│   │       └── SendContent/
│   │           └── SendContent.tsx
│   ├── toggleTheme/
│   │   ├── index.tsx
│   │   ├── ui/
│   │   │   ├── index.tsx
│   │   │   └── ThemeToggle/
│   │   │       └── ThemeToggle.tsx
│   │   └── lib/
│   │       └── index.ts
│   ├── previewExtraction/
│   └── signInMagicLink/
│
├── entities/                     # Slices → segments
│   ├── modals/
│   │   ├── index.ts
│   │   ├── types/
│   │   │   └── index.ts
│   │   ├── model/
│   │   │   └── index.ts
│   │   └── selectors/
│   │       └── index.ts
│   └── device/
│       ├── index.ts
│       └── hooks/
│           └── index.ts
│
└── shared/                       # No slices, segments only
    ├── ui/
    │   ├── Avatar/
    │   │   └── Avatar.tsx
    │   ├── Badge/
    │   │   └── Badge.tsx
    │   ├── Button/
    │   │   └── Button.tsx
    │   ├── Card/
    │   │   └── Card.tsx
    │   ├── Dialog/
    │   │   └── Dialog.tsx
    │   ├── DropdownMenu/
    │   │   └── DropdownMenu.tsx
    │   ├── Input/
    │   │   └── Input.tsx
    │   ├── Select/
    │   │   └── Select.tsx
    │   ├── Separator/
    │   │   └── Separator.tsx
    │   ├── Table/
    │   │   └── Table.tsx
    │   ├── Tabs/
    │   │   └── Tabs.tsx
    │   ├── Textarea/
    │   │   └── Textarea.tsx
    │   └── index.ts
    ├── lib/
    │   ├── treaty/
    │   │   └── index.ts
    │   ├── auth/
    │   │   └── index.ts
    │   ├── analytics/
    │   │   └── index.ts
    │   ├── cn/
    │   │   └── index.ts
    │   └── index.ts
    └── hooks/
        ├── useIsMobile/
        └── index.ts
```

## Scaffold Scripts

Always use these from `apps/web/`:

```bash
bun run scripts/addUiComponent.ts <component-name>  # Add shadcn/ui component
bun run scripts/createWidget.ts <WidgetName>         # Scaffold FSD widget
bun run scripts/createFeature.ts <FeatureName>       # Scaffold FSD feature
bun run scripts/createPage.ts <PageName>             # Scaffold FSD page
```

## Rules by Layer

| Layer | Has slices? | Import from | Imported by |
|-------|-------------|-------------|-------------|
| app | No (segments only) | All layers | Nothing |
| pages | Yes | widgets, features, entities, shared | app (routing) |
| widgets | Yes | features, entities, shared | pages, app |
| features | Yes | entities, shared | pages, widgets |
| entities | Yes | shared | pages, widgets, features |
| shared | No (segments only) | Nothing (self-referencing OK) | All layers |

## Naming Conventions Summary

| Thing | Convention | Example |
|-------|-----------|---------|
| Slice folder | camelCase | `sendContent`, `kindleSettingsModal` |
| Component folder | PascalCase | `SendContent/`, `Root/` |
| Component file | PascalCase | `SendContent.tsx`, `Root.tsx` |
| Hook file | camelCase with use prefix | `useCreateDevice.ts` |
| Util/lib file | kebab-case or camelCase | `theme-storage.ts` |
| Type file | Domain-based | `index.ts` in `types/` folder |
| Index file | Always `index.tsx` for slices | — |
