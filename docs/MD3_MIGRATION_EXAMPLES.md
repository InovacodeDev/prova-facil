# MD3 Migration Examples

This document shows practical examples of migrating from legacy styles to MD3.

## Button Migration Examples

### Before (Legacy)
```tsx
// Legacy button styles
<Button>Default Button</Button>
<Button variant="secondary">Secondary</Button>
<Button variant="outline">Outline</Button>
<Button className="bg-blue-500 hover:bg-blue-600">Custom</Button>
```

### After (MD3)
```tsx
// MD3 button variants with semantic naming
<Button variant="filled">Primary Action</Button>
<Button variant="filled-tonal">Secondary Action</Button>
<Button variant="outlined">Outlined Action</Button>
<Button variant="elevated">Elevated Action</Button>
<Button variant="text">Text Action</Button>

// With shapes
<Button variant="filled" shape="pill">Pill Button</Button>
```

## Card Migration Examples

### Before (Legacy)
```tsx
// Legacy card with custom styling
<Card className="shadow-lg hover:shadow-xl transition-shadow">
  <CardHeader>
    <CardTitle className="text-2xl font-semibold">Title</CardTitle>
    <CardDescription className="text-sm text-gray-500">
      Description
    </CardDescription>
  </CardHeader>
  <CardContent>Content</CardContent>
</Card>
```

### After (MD3)
```tsx
// MD3 card with variant and semantic typography
<Card variant="elevated">
  <CardHeader>
    <CardTitle>Title</CardTitle> {/* Uses text-title-large */}
    <CardDescription>Description</CardDescription> {/* Uses text-body-medium */}
  </CardHeader>
  <CardContent>Content</CardContent>
</Card>

// Or with explicit elevation
<Card elevation={2}>
  <CardHeader>
    <CardTitle>Elevated Card</CardTitle>
  </CardHeader>
</Card>
```

## Typography Migration Examples

### Before (Legacy)
```tsx
// Custom text styles
<h1 className="text-4xl font-bold">Heading</h1>
<h2 className="text-2xl font-semibold">Subheading</h2>
<p className="text-base text-gray-700">Body text</p>
<span className="text-sm text-gray-500">Caption</span>
```

### After (MD3)
```tsx
// MD3 semantic typography
<h1 className="text-display-large text-on-surface">Heading</h1>
<h2 className="text-headline-medium text-on-surface">Subheading</h2>
<p className="text-body-large text-on-surface">Body text</p>
<span className="text-body-small text-on-surface-variant">Caption</span>
```

## Color Migration Examples

### Before (Legacy)
```tsx
// Custom colors
<div className="bg-white border border-gray-200">
  <p className="text-gray-900">Primary text</p>
  <p className="text-gray-600">Secondary text</p>
</div>

<div className="bg-blue-500 text-white rounded-lg p-4">
  Primary container
</div>
```

### After (MD3)
```tsx
// MD3 surface system
<div className="bg-surface-container border border-outline">
  <p className="text-on-surface">Primary text</p>
  <p className="text-on-surface-variant">Secondary text</p>
</div>

<div className="bg-primary-container text-on-primary-container rounded-lg p-4">
  Primary container
</div>
```

## Elevation Migration Examples

### Before (Legacy)
```tsx
// Custom shadows
<Card className="shadow-sm hover:shadow-md">Card 1</Card>
<Card className="shadow-lg">Card 2</Card>
<Card className="shadow-xl">Card 3</Card>
```

### After (MD3)
```tsx
// MD3 elevation levels
<Card elevation={1}>Card with level 1 elevation</Card>
<Card elevation={2}>Card with level 2 elevation</Card>
<Card elevation={3}>Card with level 3 elevation</Card>

// Or using variants
<Card variant="elevated">Elevated card with hover effect</Card>
```

## Motion Migration Examples

### Before (Legacy)
```tsx
// Custom transitions
<button className="
  transition-all 
  duration-200 
  ease-in-out 
  hover:scale-105
">
  Button
</button>
```

### After (MD3)
```tsx
// MD3 motion system
<button className="
  transition-all 
  duration-short-3 
  ease-emphasized 
  hover:scale-105
">
  Button with MD3 motion
</button>

// For complex animations
<div className="
  transition-all 
  duration-medium-2 
  ease-emphasized-decelerate
">
  Animated content
</div>
```

## Complete Component Migration Example

### Before (Legacy)
```tsx
export default function FeatureCard({ title, description, icon }) {
  return (
    <div className="
      bg-white 
      border 
      border-gray-200 
      rounded-lg 
      p-6 
      shadow-md 
      hover:shadow-lg 
      transition-shadow 
      duration-200
    ">
      <div className="flex items-center mb-4">
        <div className="
          bg-blue-500 
          text-white 
          rounded-full 
          p-3 
          mr-4
        ">
          {icon}
        </div>
        <h3 className="text-xl font-semibold text-gray-900">
          {title}
        </h3>
      </div>
      <p className="text-gray-600">
        {description}
      </p>
      <button className="
        mt-4 
        bg-blue-500 
        text-white 
        px-4 
        py-2 
        rounded-md 
        hover:bg-blue-600 
        transition-colors
      ">
        Learn More
      </button>
    </div>
  );
}
```

### After (MD3)
```tsx
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';

export default function FeatureCard({ title, description, icon }) {
  return (
    <Card variant="elevated">
      <CardHeader>
        <div className="flex items-center gap-4">
          <div className="
            bg-primary-container 
            text-on-primary-container 
            rounded-full 
            p-3
          ">
            {icon}
          </div>
          <CardTitle>{title}</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <CardDescription>{description}</CardDescription>
        <Button variant="filled">Learn More</Button>
      </CardContent>
    </Card>
  );
}
```

## Benefits of Migration

### Code Quality
- **Before**: 20+ utility classes with custom values
- **After**: Semantic component variants and design tokens
- **Result**: More readable and maintainable code

### Consistency
- **Before**: Custom colors like `bg-blue-500`, `text-gray-600`
- **After**: Semantic colors like `bg-primary-container`, `text-on-surface-variant`
- **Result**: Consistent design language across the app

### Accessibility
- **Before**: Manual color contrast management
- **After**: Built-in proper contrast ratios in container colors
- **Result**: Better accessibility out of the box

### Theming
- **Before**: Hard-coded color values
- **After**: CSS variables that adapt to light/dark mode
- **Result**: Seamless theme switching

### Maintainability
- **Before**: `transition-all duration-200 ease-in-out`
- **After**: `duration-short-3 ease-emphasized`
- **Result**: Standardized motion system

## Migration Checklist

When migrating a component to MD3:

- [ ] Replace custom button styles with MD3 button variants
- [ ] Replace custom card styles with MD3 card variants
- [ ] Use MD3 typography classes instead of text-{size}
- [ ] Replace custom colors with surface/container colors
- [ ] Use MD3 elevation instead of custom shadows
- [ ] Apply MD3 motion system for transitions
- [ ] Update text colors to use on-surface variants
- [ ] Use semantic spacing from the design system
- [ ] Test component in both light and dark modes
- [ ] Verify accessibility (contrast, focus states)

## Gradual Migration Strategy

1. **Phase 1**: New components use MD3 by default
2. **Phase 2**: Update high-traffic pages (homepage, dashboard)
3. **Phase 3**: Migrate shared components (headers, footers)
4. **Phase 4**: Update remaining pages incrementally
5. **Phase 5**: Remove legacy utility classes

## Need Help?

- See [MD3_DESIGN_SYSTEM.md](MD3_DESIGN_SYSTEM.md) for comprehensive guide
- Visit `/md3-showcase` for interactive examples
- Check [MD3_MIGRATION_SUMMARY.md](../MD3_MIGRATION_SUMMARY.md) for technical details
