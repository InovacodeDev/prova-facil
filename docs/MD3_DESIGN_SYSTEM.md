# Material Design 3 (MD3) Design System

This document describes the Material Design 3 design tokens integrated into the ProvaFácil AI Tailwind CSS configuration.

## Overview

The design system has been enhanced with Material Design 3 specifications while maintaining backward compatibility with existing components. All MD3 tokens are available through Tailwind utility classes and CSS variables.

## 🎨 Color System

### Surface System
MD3 introduces a comprehensive surface system for better depth and hierarchy:

```tsx
// Available surface colors
bg-surface              // Base surface
bg-surface-dim          // Dimmed surface
bg-surface-bright       // Brighter surface
bg-surface-container-lowest
bg-surface-container-low
bg-surface-container
bg-surface-container-high
bg-surface-container-highest

// On-surface colors for text/icons
text-on-surface
text-on-surface-variant
```

### Container Colors
Each color has container variants for filled states:

```tsx
// Primary
bg-primary-container
text-on-primary-container

// Secondary
bg-secondary-container
text-on-secondary-container

// Accent
bg-accent-container
text-on-accent-container

// Tertiary (new in MD3)
bg-tertiary
bg-tertiary-container
text-on-tertiary-container

// Error
bg-error-container
text-on-error-container
```

### Example Usage

```tsx
// Card with MD3 surface
<div className="bg-surface-container rounded-lg p-6">
  <h2 className="text-on-surface">Title</h2>
  <p className="text-on-surface-variant">Description</p>
</div>

// Button with container
<button className="bg-primary-container text-on-primary-container">
  Click me
</button>
```

## 🏔️ Elevation System

MD3 uses a 6-level elevation system (0-5) for shadows:

```tsx
shadow-elevation-0    // No shadow
shadow-elevation-1    // Minimal elevation
shadow-elevation-2    // Low elevation
shadow-elevation-3    // Medium elevation (cards)
shadow-elevation-4    // High elevation (dialogs)
shadow-elevation-5    // Maximum elevation (modals)
```

### Example Usage

```tsx
// Elevated card
<div className="bg-surface-container shadow-elevation-2 rounded-lg">
  Card content
</div>

// Modal with maximum elevation
<div className="bg-surface shadow-elevation-5 rounded-lg">
  Modal content
</div>
```

## 🔷 Shape System

MD3 provides a comprehensive corner radius scale:

```tsx
rounded-none      // 0rem
rounded-xs        // 0.25rem
rounded-sm        // 0.5rem
rounded           // 0.75rem (default)
rounded-md        // 0.75rem
rounded-lg        // 1rem
rounded-xl        // 1.5rem
rounded-2xl       // 2rem
rounded-full      // 9999px (fully rounded)
```

### Example Usage

```tsx
// Small components (chips, badges)
<span className="rounded-sm">Badge</span>

// Standard components (buttons, cards)
<button className="rounded-lg">Button</button>

// Large components (dialogs)
<div className="rounded-2xl">Dialog</div>

// Circular (avatar, FAB)
<div className="rounded-full">Avatar</div>
```

## ✍️ Typography Scale

MD3 defines a complete typography system with semantic names:

### Display
For large, high-emphasis text:

```tsx
text-display-large    // 57px - Hero sections
text-display-medium   // 45px - Large headers
text-display-small    // 36px - Section headers
```

### Headline
For medium-emphasis headers:

```tsx
text-headline-large   // 32px
text-headline-medium  // 28px
text-headline-small   // 24px
```

### Title
For medium-emphasis, shorter text:

```tsx
text-title-large      // 22px - App bars
text-title-medium     // 16px - List items
text-title-small      // 14px - Dense lists
```

### Body
For main content text:

```tsx
text-body-large       // 16px - Main content
text-body-medium      // 14px - Secondary content
text-body-small       // 12px - Captions
```

### Label
For buttons, tabs, and labels:

```tsx
text-label-large      // 14px - Buttons, tabs
text-label-medium     // 12px - Small buttons
text-label-small      // 11px - Dense UI
```

### Example Usage

```tsx
// Hero section
<h1 className="text-display-large text-on-surface">
  Welcome to ProvaFácil AI
</h1>

// Card title
<h3 className="text-title-large text-on-surface">
  Assessment Title
</h3>

// Body text
<p className="text-body-medium text-on-surface-variant">
  Description goes here...
</p>

// Button label
<button className="text-label-large">
  Create Assessment
</button>
```

## 🎬 Motion System

MD3 provides standardized motion with easing curves and durations.

### Durations

```tsx
// Short (quick UI responses)
duration-short-1      // 50ms
duration-short-2      // 100ms
duration-short-3      // 150ms
duration-short-4      // 200ms

// Medium (standard transitions)
duration-medium-1     // 250ms
duration-medium-2     // 300ms
duration-medium-3     // 350ms
duration-medium-4     // 400ms

// Long (complex animations)
duration-long-1       // 450ms
duration-long-2       // 500ms
duration-long-3       // 550ms
duration-long-4       // 600ms
```

### Easing Curves

```tsx
ease-standard                 // Standard easing
ease-emphasized               // Emphasized easing
ease-emphasized-decelerate    // Deceleration
ease-emphasized-accelerate    // Acceleration
```

### Example Usage

```tsx
// Button hover
<button className="
  bg-primary 
  hover:bg-primary-hover 
  transition-all 
  duration-short-3 
  ease-emphasized
">
  Hover me
</button>

// Modal entrance
<div className="
  animate-in 
  slide-in-from-bottom 
  duration-medium-2 
  ease-emphasized-decelerate
">
  Modal content
</div>

// Smooth state change
<div className="
  opacity-0 
  hover:opacity-100 
  transition-opacity 
  duration-medium-1 
  ease-standard
">
  Hover to reveal
</div>
```

## 🎯 State Layers

MD3 emphasizes interactive states. Use these patterns:

```tsx
// Hover state
<button className="
  bg-primary 
  hover:bg-primary-hover 
  transition-colors 
  duration-short-2
">
  Button
</button>

// Focus state
<button className="
  focus-visible:ring-2 
  focus-visible:ring-primary 
  focus-visible:ring-offset-2
">
  Button
</button>

// Active/Pressed state
<button className="
  active:scale-95 
  transition-transform 
  duration-short-1
">
  Button
</button>

// Disabled state
<button className="
  disabled:opacity-38 
  disabled:pointer-events-none
">
  Button
</button>
```

## 🔄 Migration from Legacy

### Backward Compatibility

All legacy design tokens are maintained for backward compatibility:

```tsx
// Legacy (still works)
shadow-sm, shadow-md, shadow-lg, shadow-xl
duration-fast, duration-smooth, duration-slow

// New MD3 equivalents
shadow-elevation-1, shadow-elevation-2, etc.
duration-short-3, duration-medium-1, etc.
```

### Recommended Migration Path

1. **Phase 1**: Start using MD3 colors in new components
   ```tsx
   bg-surface-container → bg-card
   bg-primary-container → bg-primary
   ```

2. **Phase 2**: Adopt MD3 elevation in new cards/surfaces
   ```tsx
   shadow-md → shadow-elevation-2
   shadow-lg → shadow-elevation-3
   ```

3. **Phase 3**: Use MD3 typography for new text
   ```tsx
   text-2xl font-bold → text-headline-large
   text-sm → text-body-medium
   ```

4. **Phase 4**: Apply MD3 motion to transitions
   ```tsx
   duration-200 ease-in-out → duration-short-4 ease-standard
   ```

## 📚 Resources

- [Material Design 3 Guidelines](https://m3.material.io/)
- [MD3 Color System](https://m3.material.io/styles/color/overview)
- [MD3 Typography](https://m3.material.io/styles/typography/overview)
- [MD3 Motion](https://m3.material.io/styles/motion/overview)

## 🎨 CSS Variables Reference

All MD3 tokens are available as CSS variables if needed:

```css
/* Surface System */
var(--surface)
var(--surface-container)
var(--on-surface)

/* Colors */
var(--primary-container)
var(--on-primary-container)

/* Elevation */
var(--elevation-1)
var(--elevation-2)

/* Motion */
var(--duration-medium-1)
var(--easing-emphasized)

/* Shape */
var(--radius-lg)
var(--radius-xl)
```

## 🚀 Quick Start Examples

### MD3 Button

```tsx
<button className="
  bg-primary-container 
  text-on-primary-container 
  text-label-large
  px-6 py-3
  rounded-full
  shadow-elevation-1
  hover:shadow-elevation-2
  transition-all
  duration-short-3
  ease-emphasized
">
  MD3 Button
</button>
```

### MD3 Card

```tsx
<div className="
  bg-surface-container
  rounded-xl
  p-6
  shadow-elevation-2
  hover:shadow-elevation-3
  transition-shadow
  duration-medium-1
  ease-standard
">
  <h3 className="text-title-large text-on-surface mb-2">
    Card Title
  </h3>
  <p className="text-body-medium text-on-surface-variant">
    Card description goes here with proper MD3 styling.
  </p>
</div>
```

### MD3 Dialog

```tsx
<div className="
  fixed inset-0 
  flex items-center justify-center
  bg-black/50
">
  <div className="
    bg-surface
    rounded-2xl
    p-6
    shadow-elevation-5
    max-w-md
    animate-in
    slide-in-from-bottom
    duration-medium-2
    ease-emphasized-decelerate
  ">
    <h2 className="text-headline-small text-on-surface mb-4">
      Dialog Title
    </h2>
    <p className="text-body-medium text-on-surface-variant mb-6">
      Dialog content...
    </p>
    <div className="flex gap-3 justify-end">
      <button className="text-label-large text-primary">
        Cancel
      </button>
      <button className="
        text-label-large 
        text-on-primary 
        bg-primary 
        px-6 py-2 
        rounded-full
      ">
        Confirm
      </button>
    </div>
  </div>
</div>
```
