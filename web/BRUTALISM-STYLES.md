# Neo‑Brutalism Style Guide

This project uses a restrained Neo‑Brutalism design style. All styles are extracted into `src/styles/globals.css` as reusable CSS classes.

## Core Characteristics

- Bold black borders: all elements use 2px black borders
- Hard shadows: non‑blurred offset shadows resembling solid blocks
- Zero border radius: squared shapes
- Restrained color palette: primarily white background with selective accent colors

## Available CSS Classes

### Border styles

```css
.brutalism-border          /* 2px black border */
.brutalism-border-thick    /* 4px black border (for emphasis) */
```

### Shadow styles

```css
.brutalism-shadow-sm       /* 2x2 hard shadow */
.brutalism-shadow          /* 3x3 hard shadow (default) */
.brutalism-shadow-md       /* 4x4 hard shadow */
.brutalism-shadow-lg       /* 5x5 hard shadow */
.brutalism-shadow-xl       /* 8x8 hard shadow (for dialogs, etc.) */
```

### Interaction effects

```css
.brutalism-hover           /* base hover transform */
.brutalism-hover-sm        /* on hover, shadow becomes 3x3 */
.brutalism-hover           /* on hover, shadow becomes 4x4 */
.brutalism-hover-md        /* on hover, shadow becomes 5x5 */
.brutalism-hover-lg        /* on hover, shadow becomes 6x6 */
.brutalism-active          /* remove shadow when pressed (active state) */
```

### Composite component styles

#### Card

```css
.brutalism-card            /* white background + border + shadow + hover effect */
```

Usage example:

```tsx
<div className="brutalism-card p-4">{/* card content */}</div>
```

#### Button

```css
.brutalism-button          /* base button style */
.brutalism-button-primary  /* emerald green button (primary action) */
.brutalism-button-secondary /* sky blue button (secondary action) */
.brutalism-button-neutral  /* white button (neutral action) */
.brutalism-button-inverse  /* black background, white text, inverted on hover */
```

Usage example:

```tsx
<button className="brutalism-button-primary px-4 py-2">
  Submit
</button>

<button className="brutalism-button-inverse w-full px-4 py-2">
  Cancel
</button>
```

#### Input

```css
.brutalism-input           /* input style, shadow intensifies on focus */
```

Usage example:

```tsx
<input type="text" className="brutalism-input w-full px-3 py-2" placeholder="Enter text..." />
```

#### Tag / Filter

```css
.brutalism-tag             /* base tag style */
.brutalism-tag-active      /* active state (emerald green background) */
```

Usage example:

```tsx
<button className={isActive ? "brutalism-tag-active" : "brutalism-tag"}>Tag Name</button>
```

#### Panel / Container

```css
.brutalism-panel           /* white panel with border and shadow */
.brutalism-banner          /* amber banner */
.brutalism-banner-accent   /* yellow accent banner (thick border, large shadow) */
```

Usage example:

```tsx
<div className="brutalism-panel p-4">
  <h3 className="brutalism-heading mb-3">Panel Title</h3>
  {/* panel content */}
</div>

<div className="brutalism-banner p-5 mb-6">
  <h1>Page Title</h1>
</div>
```

### Typography

```css
.brutalism-title           /* XL title (bold, uppercase) */
.brutalism-heading         /* L heading (bold) */
.brutalism-text-bold       /* bold text */
```

Usage example:

```tsx
<h1 className="brutalism-title">Main Title</h1>
<h2 className="brutalism-heading">Section Heading</h2>
<p className="brutalism-text-bold">Important text</p>
```

## Design Principles

### 1. Keep it restrained

Avoid overusing thick borders and large shadows; apply them where they provide hierarchy.

### 2. Consistent palette

- Main: white background
- Accents:
  - Emerald (`emerald-300/400`) — primary actions
  - Sky (`sky-300`) — secondary actions
  - Amber (`amber-100`) — informational banners
  - Yellow (`yellow-300`) — important banners

### 3. Clear interaction feedback

- Hover: element shifts 1px up-left, shadow increases
- Active (pressed): shadow removed to simulate press
- Disabled: opacity reduced to 40%

## Practical Examples

### Recipe Card

```tsx
<div className="brutalism-card overflow-hidden">
  <Link href={`/recipes/${id}`} className="p-4">
    <div className="brutalism-border aspect-video overflow-hidden">
      <Image src={imageUrl} alt={name} fill />
    </div>
    <h3 className="brutalism-text-bold mt-3">{name}</h3>
  </Link>
  <div className="brutalism-border border-x-0 border-b-0 p-4">
    <button className="brutalism-button-inverse w-full px-4 py-2">Add to Calendar</button>
  </div>
</div>
```

### Search Bar

```tsx
<div className="flex gap-3">
  <input className="brutalism-input flex-1 px-3 py-2" placeholder="Search..." />
  <button className="brutalism-button-primary px-5 py-2">Search</button>
</div>
```

### Filter Panel

```tsx
<div className="brutalism-panel p-4">
  <h3 className="brutalism-heading mb-3">Filters</h3>
  <div className="flex flex-wrap gap-2">
    {items.map((item) => (
      <button key={item.id} className={isActive(item) ? "brutalism-tag-active" : "brutalism-tag"}>
        {item.name}
      </button>
    ))}
  </div>
</div>
```

## FullCalendar Neo‑Brutalism Styling

### Automatic application

FullCalendar used in the project is styled via CSS overrides; import the stylesheet in the page:

```tsx
import "@/styles/fullcalendar-brutalism.css";
```

### Style characteristics

FullCalendar Neo‑Brutalism includes:

- Bold black borders on all calendar elements (tables, buttons, events)
- Hard, non‑blurred shadows for buttons and event cards
- Zero border radius to keep squared shapes
- Interaction feedback: hover moves elements up-left and increases shadow; click removes shadow
- Accent colors:
  - Today's date: yellow background (yellow-100/300)
  - Event buttons: emerald green (emerald-300/400)
  - Hover state: amber (amber-100)

### Overridden components

The stylesheet `fullcalendar-brutalism.css` targets these FullCalendar classes:

- `.fc-toolbar`: toolbar container
- `.fc-button`: all buttons (prev/next, view switches, etc.)
- `.fc-daygrid-day`: day cells
- `.fc-daygrid-event`: event cards
- `.fc-popover`: more-events popover
- `.fc-timegrid-*`: time grid view elements
- `.fc-list-*`: list view elements

### Example

```tsx
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import "@/styles/fullcalendar-brutalism.css";

export default function Calendar() {
  return (
    <FullCalendar
      plugins={[dayGridPlugin]}
      initialView="dayGridMonth"
      events={[
        { title: "Event 1", date: "2025-01-21" },
        { title: "Event 2", date: "2025-01-22" },
      ]}
    />
  );
}
```

Styles are applied automatically; no extra configuration needed.

## Notes

1. Composition: these classes can be combined with Tailwind utility classes (e.g., `p-4`, `mb-3`).
2. Specificity: add more specific selectors later if you need overrides.
3. Consistency: prefer predefined classes over inline styles.
4. Maintainability: update definitions in `globals.css` to change the design system.
5. FullCalendar: calendar styles are implemented via CSS overrides and are applied when `fullcalendar-brutalism.css` is imported.

## Changelog

- 2025-01-21: Initial version — defined full Neo‑Brutalism design system
- 2025-01-21: Added FullCalendar Neo‑Brutalism support
