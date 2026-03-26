# Cross-Import Resolution Patterns

When two slices on the same layer need to share code, resolve using these strategies in priority order.

## Strategy 1: Merge Slices

If two slices always change together, they are likely one slice.

```
// Before: two features that share auth logic
features/login/
features/register/

// After: merged into one
features/auth/
├── ui/
│   ├── LoginForm.tsx
│   └── RegisterForm.tsx
└── lib/
    └── auth-validation.ts   # Shared logic lives here
```

## Strategy 2: Extract Shared Logic to a Lower Layer

Move the shared part to entities/ or shared/.

```
// Before: two features both define "device" types
features/sendContent/    → has DeviceSelector with device types
features/deviceManager/  → has DeviceList with same device types

// After: extract to entity
entities/device/
├── types/
│   └── index.ts         # Device types live here
└── hooks/
    └── useDevices.ts    # Shared device fetching

features/sendContent/    → imports from ~/entities/device
features/deviceManager/  → imports from ~/entities/device
```

## Strategy 3: Compose in a Higher Layer (Inversion of Control)

The parent layer imports both slices and connects them.

```typescript
// pages/root/ui/Root.tsx — composes two features without them knowing each other
import { SendContent } from "~/features/sendContent";
import { KindleSettings } from "~/features/openKindleSettings";

function Root() {
  const [selectedDevice, setSelectedDevice] = useState(null);

  return (
    <>
      <KindleSettings onDeviceSelect={setSelectedDevice} />
      <SendContent deviceId={selectedDevice?.id} />
    </>
  );
}
```

## Strategy 4: @x Notation (Last Resort)

Create explicit cross-imports between entities. Document the reason.

```
entities/
├── user/
│   └── @x/
│       └── device.ts    # Explicit import from entities/device
└── device/
```

**Rules for @x**:
- Only between entities (never features or widgets)
- Must be documented in the @x file why other strategies don't apply
- Review periodically — this should be temporary
