# Altere os componentes de UI para utilizar o Base UI com Tailwind CSS (respeitando as regras do MD3)

Passe por todos os componentes de UI e substitua os componentes existentes pelos componentes equivalentes do Base UI, garantindo que todos os estilos estejam alinhados com o Material Design 3 (MD3) e utilizando Tailwind CSS para estilização.
Caso não tenha componente equivalente no Base UI, crie um novo componente seguindo as diretrizes do MD3.

---

## Material Design 3

### Foundations

- Overview: <https://m3.material.io/foundations>
- Accessibility:
  - Overview:
    - Principles: <https://m3.material.io/foundations/overview/principles>
    - Assistive technology: <https://m3.material.io/foundations/overview/assistive-technology>
  - Designing:
    - Overview: <https://m3.material.io/foundations/designing/overview>
    - Color contrast: <https://m3.material.io/foundations/designing/color-contrast>
    - Structure: <https://m3.material.io/foundations/designing/structure>
    - Flow: <https://m3.material.io/foundations/designing/flow>
    - Elements: <https://m3.material.io/foundations/designing/elements>
  - Writing and text:
    - Best practices: <https://m3.material.io/foundations/writing/best-practices>
    - Text truncation: <https://m3.material.io/foundations/writing/text-truncation>
    - Text resizing: <https://m3.material.io/foundations/writing/text-resizing>
- Adaptative design: <https://m3.material.io/foundations/adaptive-design>
- Building for all:
  - User needs: <https://m3.material.io/foundations/building-for-all/user-needs>
  - Co-design: <https://m3.material.io/foundations/building-for-all/co-design>
- Content design:
  - Overview: <https://m3.material.io/foundations/content-design/overview>
  - Alt text: <https://m3.material.io/foundations/content-design/alt-text>
  - Global writing:
    - Overview: <https://m3.material.io/foundations/content-design/global-writing/overview>
    - Word choice: <https://m3.material.io/foundations/content-design/global-writing/word-choice>
  - Notifications: <https://m3.material.io/foundations/content-design/notifications>
  - Style guide:
    - UX writing best practices: <https://m3.material.io/foundations/content-design/style-guide/ux-writing-best-practices>
    - Word choice: <https://m3.material.io/foundations/content-design/style-guide/word-choice>
    - Grammar and punctuation: <https://m3.material.io/foundations/content-design/style-guide/grammar-and-punctuation>
- Customizing Material: <https://m3.material.io/foundations/customization>
- Design Tokens:
  - Overview: <https://m3.material.io/foundations/design-tokens/overview>
  - How to use tokens: <https://m3.material.io/foundations/design-tokens/how-to-use-tokens>
- Interaction:
  - Gestures: <https://m3.material.io/foundations/interaction/gestures>
  - Inputs: <https://m3.material.io/foundations/interaction/inputs>
  - Selection: <https://m3.material.io/foundations/interaction/selection>
  - States:
    - Overview: <https://m3.material.io/foundations/interaction/states/overview>
    - State layers: <https://m3.material.io/foundations/interaction/states/state-layers>
    - Applying states: <https://m3.material.io/foundations/interaction/states/applying-states>
- Layout:
  - Basics:
    - Overview: <https://m3.material.io/foundations/layout/understanding-layout/overview>
    - Spacing: <https://m3.material.io/foundations/layout/understanding-layout/spacing>
    - Parts of layout: <https://m3.material.io/foundations/layout/understanding-layout/parts-of-layout>
    - Density: <https://m3.material.io/foundations/layout/understanding-layout/density>
    - Hardware considerations: <https://m3.material.io/foundations/layout/understanding-layout/hardware-considerations>
    - Bidirectionality & RTL: <https://m3.material.io/foundations/layout/understanding-layout/bidirectionality-rtl>
  - Applying layout:
    - Pane layouts: <https://m3.material.io/foundations/layout/applying-layout/pane-layouts>
    - Window size classes: <https://m3.material.io/foundations/layout/applying-layout/window-size-classes>
    - Compact: <https://m3.material.io/foundations/layout/applying-layout/compact>
    - Medium: <https://m3.material.io/foundations/layout/applying-layout/medium>
    - Expanded: <https://m3.material.io/foundations/layout/applying-layout/expanded>
    - Large & extra-large: <https://m3.material.io/foundations/layout/applying-layout/large-extra-large>
  - Canonical layouts:
    - Overview: <https://m3.material.io/foundations/layout/canonical-layouts/overview>
    - List-detail: <https://m3.material.io/foundations/layout/canonical-layouts/list-detail>
    - Supporting pane: <https://m3.material.io/foundations/layout/canonical-layouts/supporting-pane>
    - Feed: <https://m3.material.io/foundations/layout/canonical-layouts/feed>
- Usability:
  - Overview: <https://m3.material.io/foundations/usability/overview>
  - Applying M3 Expressive: <https://m3.material.io/foundations/usability/applying-m-3-expressive>
- Material A-Z: <https://m3.material.io/foundations/glossary>

### Design System Overview

- Overview: <https://m3.material.io/styles>

#### Color System

- Overview: <https://m3.material.io/styles/color/system/overview>
- How the system works: <https://m3.material.io/styles/color/system/how-the-system-works>
- Color roles: <https://m3.material.io/styles/color/roles/>
- Color schemes:
  - Choosing a scheme: <https://m3.material.io/styles/color/choosing-a-scheme>
  - Static: <https://m3.material.io/styles/color/static/baseline>
  - Dynamic: <https://m3.material.io/styles/color/dynamic/choosing-a-source>
- Advanced:
  - Overview: <https://m3.material.io/styles/color/advanced/overview>
  - Apply colors: <https://m3.material.io/styles/color/advanced/apply-colors>
  - Define new colors: <https://m3.material.io/styles/color/advanced/define-new-colors>
  - Adjust existing colors: <https://m3.material.io/styles/color/advanced/adjust-existing-colors>

#### Elevation

- Overview: <https://m3.material.io/styles/elevation/overview>
- Applying elevation: <https://m3.material.io/styles/elevation/applying-elevation>
- Tokens: <https://m3.material.io/styles/elevation/tokens>

#### Icons

- Overview: <https://m3.material.io/styles/icons/overview>
- Designing icons: <https://m3.material.io/styles/icons/designing-icons>
- Applying icons: <https://m3.material.io/styles/icons/applying-icons>

#### Motion

- Physics system:
  - How it works: <https://m3.material.io/styles/motion/overview/how-it-works>
  - Specs: <https://m3.material.io/styles/motion/overview/specs>
- Easing and duration:
  - Applying: <https://m3.material.io/styles/motion/easing-and-duration/applying-easing-and-duration>
  - Tokens & specs: <https://m3.material.io/styles/motion/easing-and-duration/tokens-specs>
- Transitions:
  - Patterns: <https://m3.material.io/styles/motion/transitions/transition-patterns>
  - Applying: <https://m3.material.io/styles/motion/transitions/applying-transitions>

#### Shape

- Overview & principles: <https://m3.material.io/styles/shape/overview-principles>
- Corner radius scale: <https://m3.material.io/styles/shape/corner-radius-scale>
- Shape morph: <https://m3.material.io/styles/shape/shape-morph>

#### Typography

- Overview: <https://m3.material.io/styles/typography/overview>
- Fonts: <https://m3.material.io/styles/typography/fonts>
- Type scale & tokens: <https://m3.material.io/styles/typography/type-scale-tokens>
- Applying type: <https://m3.material.io/styles/typography/applying-typography>
- Editorial treatments: <https://m3.material.io/styles/typography/editorial-treatments>

### Base UI React - Guia de Referência Rápida

#### Overview

- Quickstart: <https://base-ui.com/react/overview/quick-start>

```bash
pnpm i @base-ui-components/react@latest
```

- Accessibility: <https://base-ui.com/react/overview/accessibility>

#### Handbook

- Stylling with Tailwind CSS: <https://base-ui.com/react/handbook/styling#tailwind-css>
- Animation: <https://base-ui.com/react/handbook/animation>
- Coposition: <https://base-ui.com/react/handbook/composition>
- Customization: <https://base-ui.com/react/handbook/customization>
- TypeScript: <https://base-ui.com/react/handbook/typescript>

#### Components Replaced/Added Base UI (with md3 guidelines)

- Accordion component (replace accordion.tsx)
  - Base UI: <https://base-ui.com/react/components/accordion>

- Alert Dialog component (replace alert-dialog.tsx)
  - Base UI: <https://base-ui.com/react/components/alert-dialog>

- Autocomplete component (new autocomplete.tsx)
  - Base UI: <https://base-ui.com/react/components/autocomplete>

- Avatar component (replace avatar.tsx)
  - Base UI: <https://base-ui.com/react/components/avatar>

- Checkbox component (replace checkbox.tsx)
  - Base UI: <https://base-ui.com/react/components/checkbox>
  - MD3:
    - Overview: <https://m3.material.io/components/carousel/overview>
    - Specs: <https://m3.material.io/components/carousel/specs>
    - Guidelines: <https://m3.material.io/components/carousel/guidelines>
    - Accessibility: <https://m3.material.io/components/carousel/accessibility>

- Checkbox Group component (new checkbox-group.tsx)
  - Base UI: <https://base-ui.com/react/components/checkbox-group>

- Collapsible component (replace collapsible.tsx)
  - Base UI: <https://base-ui.com/react/components/collapsible>

- Combobox component (new combobox.tsx)
  - Base UI: <https://base-ui.com/react/components/combobox>

- Context Menu component (replace context-menu.tsx)
  - Base UI: <https://base-ui.com/react/components/context-menu>

- Dialog component (replace dialog.tsx)
  - Base UI: <https://base-ui.com/react/components/dialog>
  - MD3:
    - Overview: <https://m3.material.io/components/dialogs/overview>
    - Specs: <https://m3.material.io/components/dialogs/specs>
    - Guidelines: <https://m3.material.io/components/dialogs/guidelines>
    - Accessibility: <https://m3.material.io/components/dialogs/accessibility>

- Field component (new field.tsx)
  - Base UI: <https://base-ui.com/react/components/field>

- Fieldset component (new fieldset.tsx)
  - Base UI: <https://base-ui.com/react/components/fieldset>

- Form component (replace form.tsx)
  - Base UI: <https://base-ui.com/react/components/form>

- Input component (replace input.tsx)
  - Base UI: <https://base-ui.com/react/components/input>

- Menu component (new menu.tsx)
  - Base UI: <https://base-ui.com/react/components/menu>
  - MD3:
    - Overview: <https://m3.material.io/components/menus/overview>
    - Specs: <https://m3.material.io/components/menus/specs>
    - Guidelines: <https://m3.material.io/components/menus/guidelines>
    - Accessibility: <https://m3.material.io/components/menus/accessibility>

- Meter component (new meter.tsx)
  - Base UI: <https://base-ui.com/react/components/meter>

- Navigation Menu component (replace navigation-menu.tsx)
  - Base UI: <https://base-ui.com/react/components/navigation-menu>

- Number Field component (new number-field.tsx)
  - Base UI: <https://base-ui.com/react/components/number-field>

- Popover component (replace popover.tsx)
  - Base UI: <https://base-ui.com/react/components/popover>

- Preview Card component (new preview-card.tsx)
  - Base UI: <https://base-ui.com/react/components/preview-card>

- Progress component (replace progress.tsx)
  - Base UI: <https://base-ui.com/react/components/progress>
  - MD3:
    - Overview: <https://m3.material.io/components/progress-indicators/overview>
    - Specs: <https://m3.material.io/components/progress-indicators/specs>
    - Guidelines: <https://m3.material.io/components/progress-indicators/guidelines>
    - Accessibility: <https://m3.material.io/components/progress-indicators/accessibility>

- Radio component (new, remove radio-group.tsx)
  - Base UI: <https://base-ui.com/react/components/radio>
  - MD3:
    - Overview: <https://m3.material.io/components/radio-button/overview>
    - Specs: <https://m3.material.io/components/radio-button/specs>
    - Guidelines: <https://m3.material.io/components/radio-button/guidelines>
    - Accessibility: <https://m3.material.io/components/radio-button/accessibility>

- Scroll Area component (replace scroll-area.tsx)
  - Base UI: <https://base-ui.com/react/components/scroll-area>

- Select component (replace select.tsx)
  - Base UI: <https://base-ui.com/react/components/select>

- Separator component (replace separator.tsx)
  - Base UI: <https://base-ui.com/react/components/separator>

- Slide component (new slide.tsx)
  - Base UI: <https://base-ui.com/react/components/slide>
  - MD3:
    - Overview: <https://m3.material.io/components/sliders/overview>
    - Specs: <https://m3.material.io/components/sliders/specs>
    - Guidelines: <https://m3.material.io/components/sliders/guidelines>
    - Accessibility: <https://m3.material.io/components/sliders/accessibility>

- Switch component (replace switch.tsx)
  - Base UI: <https://base-ui.com/react/components/switch>
  - MD3:
    - Overview: <https://m3.material.io/components/switch/overview>
    - Specs: <https://m3.material.io/components/switch/specs>
    - Guidelines: <https://m3.material.io/components/switch/guidelines>
    - Accessibility: <https://m3.material.io/components/switch/accessibility>

- Tabs component (replace tabs.tsx)
  - Base UI: <https://base-ui.com/react/components/tabs>
  - MD3:
    - Overview: <https://m3.material.io/components/tabs/overview>
    - Specs: <https://m3.material.io/components/tabs/specs>
    - Guidelines: <https://m3.material.io/components/tabs/guidelines>
    - Accessibility: <https://m3.material.io/components/tabs/accessibility>

- Toast component (replace toast.tsx)
  - Base UI: <https://base-ui.com/react/components/toast>

- Toggle component (replace toggle.tsx)
  - Base UI: <https://base-ui.com/react/components/toggle>

- Toggle Group component (replace toggle-group.tsx)
  - Base UI: <https://base-ui.com/react/components/toggle-group>

- Toolbar component (new toolbar.tsx)
  - Base UI: <https://base-ui.com/react/components/toolbar>
  - MD3:
    - Overview: <https://m3.material.io/components/toolbars/overview>
    - Specs: <https://m3.material.io/components/toolbars/specs>
    - Guidelines: <https://m3.material.io/components/toolbars/guidelines>
    - Accessibility: <https://m3.material.io/components/toolbars/accessibility>

- Tooltip component (replace tooltip.tsx)
  - Base UI: <https://base-ui.com/react/components/tooltip>
  - MD3:
    - Overview: <https://m3.material.io/components/tooltips/overview>
    - Specs: <https://m3.material.io/components/tooltips/specs>
    - Guidelines: <https://m3.material.io/components/tooltips/guidelines>
    - Accessibility: <https://m3.material.io/components/tooltips/accessibility>

### MD3 - Guia de Referência Rápida

#### Components Replaced/Added MD3

- App Bar component (new app-bar.tsx)
  - Overview: <https://m3.material.io/components/app-bars/overview>
  - Specs: <https://m3.material.io/components/app-bars/specs>
  - Guidelines: <https://m3.material.io/components/app-bars/guidelines>
  - Accessibility: <https://m3.material.io/components/app-bars/accessibility>

- Badge component (replace badge.tsx)
  - Overview: <https://m3.material.io/components/badges/overview>
  - Specs: <https://m3.material.io/components/badges/specs>
  - Guidelines: <https://m3.material.io/components/badges/guidelines>
  - Accessibility: <https://m3.material.io/components/badges/accessibility>

- Button component
  - All buttons: <https://m3.material.io/components/all-buttons>
    - Button Groups: (new button-groups.tsx)
      - Overview: <https://m3.material.io/components/button-groups/overview>
      - Specs: <https://m3.material.io/components/button-groups/specs>
      - Guidelines: <https://m3.material.io/components/button-groups/guidelines>
      - Accessibility: <https://m3.material.io/components/button-groups/accessibility>
    - Button: (replace button.tsx)
      - Overview: <https://m3.material.io/components/buttons/overview>
      - Specs: <https://m3.material.io/components/buttons/specs>
      - Guidelines: <https://m3.material.io/components/buttons/guidelines>
      - Accessibility: <https://m3.material.io/components/buttons/accessibility>
    - Extended FAB: (new extended-fab.tsx)
      - Overview: <https://m3.material.io/components/extended-fab/overview>
      - Specs: <https://m3.material.io/components/extended-fab/specs>
      - Guidelines: <https://m3.material.io/components/extended-fab/guidelines>
      - Accessibility: <https://m3.material.io/components/extended-fab/accessibility>
    - FAB Menu: (new fab-menu.tsx)
      - Overview: <https://m3.material.io/components/fab-menu/overview>
      - Specs: <https://m3.material.io/components/fab-menu/specs>
      - Guidelines: <https://m3.material.io/components/fab-menu/guidelines>
      - Accessibility: <https://m3.material.io/components/fab-menu/accessibility>
    - Fabs: (new fab.tsx)
      - Overview: <https://m3.material.io/components/floating-action-button/overview>
      - Specs: <https://m3.material.io/components/floating-action-button/specs>
      - Guidelines: <https://m3.material.io/components/floating-action-button/guidelines>
      - Accessibility: <https://m3.material.io/components/floating-action-button/accessibility>
    - Icon Button: (new icon-button.tsx)
      - Overview: <https://m3.material.io/components/icon-buttons/overview>
      - Specs: <https://m3.material.io/components/icon-buttons/specs>
      - Guidelines: <https://m3.material.io/components/icon-buttons/guidelines>
      - Accessibility: <https://m3.material.io/components/icon-buttons/accessibility>
    - Segmented Button: (new segmented-button.tsx)
      - Overview: <https://m3.material.io/components/segmented-buttons/overview>
      - Specs: <https://m3.material.io/components/segmented-buttons/specs>
      - Guidelines: <https://m3.material.io/components/segmented-buttons/guidelines>
      - Accessibility: <https://m3.material.io/components/segmented-buttons/accessibility>
    - Split Button: (new split-button.tsx)
      - Overview: <https://m3.material.io/components/split-button/overview>
      - Specs: <https://m3.material.io/components/split-button/specs>
      - Guidelines: <https://m3.material.io/components/split-button/guidelines>
      - Accessibility: <https://m3.material.io/components/split-button/accessibility>

- Card component (replace card.tsx)
  - Overview: <https://m3.material.io/components/cards/overview>
  - Specs: <https://m3.material.io/components/cards/specs>
  - Guidelines: <https://m3.material.io/components/cards/guidelines>
  - Accessibility: <https://m3.material.io/components/cards/accessibility>

- Carousel component (new carousel.tsx)
  - Overview: <https://m3.material.io/components/carousel/overview>
  - Specs: <https://m3.material.io/components/carousel/specs>
  - Guidelines: <https://m3.material.io/components/carousel/guidelines>
  - Accessibility: <https://m3.material.io/components/carousel/accessibility>

- Chip component (new chip.tsx)
  - Overview: <https://m3.material.io/components/chips/overview>
  - Specs: <https://m3.material.io/components/chips/specs>
  - Guidelines: <https://m3.material.io/components/chips/guidelines>
  - Accessibility: <https://m3.material.io/components/chips/accessibility>

- Date Time Picker component (new date-time-picker.tsx)
  - Overview: <https://m3.material.io/components/date-pickers/overview>
  - Specs: <https://m3.material.io/components/date-pickers/specs>
  - Guidelines: <https://m3.material.io/components/date-pickers/guidelines>
  - Accessibility: <https://m3.material.io/components/date-pickers/accessibility>

- Time Picker component (new time-picker.tsx)
  - Overview: <https://m3.material.io/components/time-pickers/overview>
  - Specs: <https://m3.material.io/components/time-pickers/specs>
  - Guidelines: <https://m3.material.io/components/time-pickers/guidelines>
  - Accessibility: <https://m3.material.io/components/time-pickers/accessibility>

- Divider component (new divider.tsx)
  - Overview: <https://m3.material.io/components/divider/overview>
  - Specs: <https://m3.material.io/components/divider/specs>
  - Guidelines: <https://m3.material.io/components/divider/guidelines>
  - Accessibility: <https://m3.material.io/components/divider/accessibility>

- Lists component (new lists.tsx)
  - Overview: <https://m3.material.io/components/lists/overview>
  - Specs: <https://m3.material.io/components/lists/specs>
  - Guidelines: <https://m3.material.io/components/lists/guidelines>
  - Accessibility: <https://m3.material.io/components/lists/accessibility>

- Loading component (replace loading.tsx)
  - Overview: <https://m3.material.io/components/loading-indicator/overview>
  - Specs: <https://m3.material.io/components/loading-indicator/specs>
  - Guidelines: <https://m3.material.io/components/loading-indicator/guidelines>
  - Accessibility: <https://m3.material.io/components/loading-indicator/accessibility>

- Navigation Bar component (new navigation-bar.tsx)
  - Overview: <https://m3.material.io/components/navigation-bar/overview>
  - Specs: <https://m3.material.io/components/navigation-bar/specs>
  - Guidelines: <https://m3.material.io/components/navigation-bar/guidelines>
  - Accessibility: <https://m3.material.io/components/navigation-bar/accessibility>

- Navigation Drawer component (replace drawer.tsx with navigation-drawer.tsx)
  - Overview: <https://m3.material.io/components/navigation-drawer/overview>
  - Specs: <https://m3.material.io/components/navigation-drawer/specs>
  - Guidelines: <https://m3.material.io/components/navigation-drawer/guidelines>
  - Accessibility: <https://m3.material.io/components/navigation-drawer/accessibility>

- Navigation Rail component (new navigation-rail.tsx)
  - Overview: <https://m3.material.io/components/navigation-rail/overview>
  - Specs: <https://m3.material.io/components/navigation-rail/specs>
  - Guidelines: <https://m3.material.io/components/navigation-rail/guidelines>
  - Accessibility: <https://m3.material.io/components/navigation-rail/accessibility>

- Search component (new search.tsx)
  - Overview: <https://m3.material.io/components/search/overview>
  - Specs: <https://m3.material.io/components/search/specs>
  - Guidelines: <https://m3.material.io/components/search/guidelines>
  - Accessibility: <https://m3.material.io/components/search/accessibility>

- Sheets component
  - Bottom Sheet: (new bottom-sheet.tsx)
    - Overview: <https://m3.material.io/components/bottom-sheets/overview>
    - Specs: <https://m3.material.io/components/bottom-sheets/specs>
    - Guidelines: <https://m3.material.io/components/bottom-sheets/guidelines>
    - Accessibility: <https://m3.material.io/components/bottom-sheets/accessibility>
  - Side Sheet: (new side-sheet.tsx)
    - Overview: <https://m3.material.io/components/side-sheets/overview>
    - Specs: <https://m3.material.io/components/side-sheets/specs>
    - Guidelines: <https://m3.material.io/components/side-sheets/guidelines>
    - Accessibility: <https://m3.material.io/components/side-sheets/accessibility>

- Snackbar component (replace snackbar.tsx)
  - Overview: <https://m3.material.io/components/snackbar/overview>
  - Specs: <https://m3.material.io/components/snackbar/specs>
  - Guidelines: <https://m3.material.io/components/snackbar/guidelines>
  - Accessibility: <https://m3.material.io/components/snackbar/accessibility>

- Text Field component (replace text-area.tsx with text-field.tsx)
  - Overview: <https://m3.material.io/components/text-fields/overview>
  - Specs: <https://m3.material.io/components/text-fields/specs>
  - Guidelines: <https://m3.material.io/components/text-fields/guidelines>
  - Accessibility: <https://m3.material.io/components/text-fields/accessibility>
