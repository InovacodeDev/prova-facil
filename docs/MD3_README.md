# Material Design 3 (MD3) Integration

ProvaFácil AI now includes a comprehensive Material Design 3 design system implementation through Tailwind CSS.

## 🎨 What's New

### Design Tokens
- **100+ MD3 design tokens** including colors, typography, elevation, shape, and motion
- **Surface system** with multiple container levels for proper depth and hierarchy
- **Elevation system** with 6 standardized shadow levels (0-5)
- **Typography scale** with semantic naming (display, headline, title, body, label)
- **Motion system** with MD3 easing curves and durations
- **Shape system** with comprehensive border radius options

### Enhanced Components

#### Button Component
New MD3 variants:
- `filled` - Primary filled button with elevation
- `filled-tonal` - Secondary emphasis with container color
- `elevated` - Elevated surface with subtle shadow
- `outlined` - 2px outline border
- `text` - Minimal text-only button

New shape options:
- `default` - Standard rounded corners
- `pill` - Fully rounded (pill shape)
- `square` - Minimal rounding

```tsx
<Button variant="filled">Primary Action</Button>
<Button variant="filled-tonal">Secondary Action</Button>
<Button variant="elevated">Elevated Action</Button>
<Button variant="outlined">Outlined Action</Button>
<Button variant="text">Text Action</Button>

<Button variant="filled" shape="pill">Pill Button</Button>
```

#### Card Component
New MD3 variants:
- `elevated` - Shadow-based elevation with hover effect
- `filled` - Surface container background
- `outlined` - 2px outline border

Explicit elevation control:
- `elevation={0}` through `elevation={5}`

```tsx
<Card variant="elevated">Elevated Card</Card>
<Card variant="filled">Filled Card</Card>
<Card variant="outlined">Outlined Card</Card>
<Card elevation={3}>Custom Elevation</Card>
```

## 📚 Documentation

### Quick Links
- **[MD3 Design System Guide](docs/MD3_DESIGN_SYSTEM.md)** - Comprehensive usage guide
- **[Migration Summary](MD3_MIGRATION_SUMMARY.md)** - Detailed changes and benefits
- **[Live Showcase](/md3-showcase)** - Interactive demonstration of all MD3 features

### Key Features

#### Color System
```tsx
// Surface colors
bg-surface
bg-surface-container
bg-surface-container-high

// Container colors
bg-primary-container
bg-secondary-container
bg-tertiary-container
bg-error-container

// On-surface text colors
text-on-surface
text-on-surface-variant
text-on-primary-container
```

#### Typography
```tsx
// Display (large headings)
text-display-large    // 57px
text-display-medium   // 45px
text-display-small    // 36px

// Headline (section headers)
text-headline-large   // 32px
text-headline-medium  // 28px
text-headline-small   // 24px

// Title (card headers, list items)
text-title-large      // 22px
text-title-medium     // 16px
text-title-small      // 14px

// Body (main content)
text-body-large       // 16px
text-body-medium      // 14px
text-body-small       // 12px

// Label (buttons, UI elements)
text-label-large      // 14px
text-label-medium     // 12px
text-label-small      // 11px
```

#### Elevation
```tsx
shadow-elevation-0    // No shadow
shadow-elevation-1    // Minimal elevation
shadow-elevation-2    // Low elevation (cards)
shadow-elevation-3    // Medium elevation
shadow-elevation-4    // High elevation (dialogs)
shadow-elevation-5    // Maximum elevation (modals)
```

#### Motion
```tsx
// Durations
duration-short-1 through duration-short-4    // 50-200ms
duration-medium-1 through duration-medium-4  // 250-400ms
duration-long-1 through duration-long-4      // 450-600ms

// Easing curves
ease-standard
ease-emphasized
ease-emphasized-decelerate
ease-emphasized-accelerate

// Example
<div className="
  transition-all 
  duration-medium-1 
  ease-emphasized 
  hover:scale-105
">
  Animated content
</div>
```

## 🔄 Backward Compatibility

All existing components continue to work without changes:
- ✅ Legacy button variants (default, hero, accent, success)
- ✅ Legacy shadow classes (shadow-sm, shadow-md, shadow-lg)
- ✅ Legacy duration classes (duration-fast, duration-smooth)
- ✅ Original component styling

No breaking changes were introduced.

## 🚀 Getting Started

### View the Showcase
Visit `/md3-showcase` in your browser to see an interactive demonstration of all MD3 features.

### Using MD3 in New Components

```tsx
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';

export default function MyComponent() {
  return (
    <Card variant="elevated">
      <CardHeader>
        <CardTitle>My Card</CardTitle>
        <CardDescription>Card description</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-body-medium text-on-surface-variant">
          Content with MD3 typography
        </p>
        <Button variant="filled" shape="pill">
          Primary Action
        </Button>
      </CardContent>
    </Card>
  );
}
```

### Migrating Existing Components

You can gradually adopt MD3 by:
1. Using MD3 variants in new components
2. Replacing custom colors with MD3 surface/container colors
3. Standardizing typography with MD3 text classes
4. Using MD3 elevation for shadows
5. Applying MD3 motion to transitions

## 📖 Learn More

- [Material Design 3 Guidelines](https://m3.material.io/)
- [MD3 Color System](https://m3.material.io/styles/color/overview)
- [MD3 Typography](https://m3.material.io/styles/typography/overview)
- [MD3 Motion](https://m3.material.io/styles/motion/overview)
- [MD3 Elevation](https://m3.material.io/styles/elevation/overview)

## 🎯 Benefits

1. **Consistency** - Standardized design language across the application
2. **Accessibility** - Proper contrast ratios and semantic color usage
3. **Maintainability** - Semantic naming makes code easier to understand
4. **Flexibility** - Multiple variants for different use cases
5. **Future-proof** - Based on Google's design standards
6. **Performance** - Optimized CSS variables and Tailwind classes

---

For detailed documentation, see [MD3_DESIGN_SYSTEM.md](docs/MD3_DESIGN_SYSTEM.md)
