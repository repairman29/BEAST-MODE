# BEAST MODE IDE - Complete Design Specification
## Jony Ive Design System

**Date:** January 11, 2025

---

## 🎨 Design Tokens

### Colors
```css
--primary: #007AFF;        /* iOS Blue */
--background: #F5F5F7;      /* Light Gray */
--surface: #FFFFFF;         /* Pure White */
--text-primary: #1D1D1F;    /* Deep Black */
--text-secondary: #86868B;  /* Gray */
--accent: #34C759;          /* Green */
--warning: #FF9500;         /* Orange */
--error: #FF3B30;           /* Red */
--border: #D1D1D6;          /* Light Border */
```

### Typography
```css
--font-primary: -apple-system, BlinkMacSystemFont, 'SF Pro Display', sans-serif;
--font-code: 'SF Mono', 'JetBrains Mono', monospace;
--font-size-xs: 11px;
--font-size-sm: 13px;
--font-size-base: 15px;
--font-size-lg: 17px;
--font-size-xl: 20px;
--font-size-2xl: 24px;
--font-size-3xl: 34px;
--line-height: 1.47;
```

### Spacing
```css
--space-1: 4px;
--space-2: 8px;
--space-3: 12px;
--space-4: 16px;
--space-5: 20px;
--space-6: 24px;
--space-8: 32px;
--space-10: 40px;
--space-12: 48px;
--space-16: 64px;
```

### Shadows
```css
--shadow-sm: 0 1px 2px rgba(0,0,0,0.05);
--shadow-md: 0 4px 6px rgba(0,0,0,0.1);
--shadow-lg: 0 10px 15px rgba(0,0,0,0.1);
--shadow-xl: 0 20px 25px rgba(0,0,0,0.1);
```

### Border Radius
```css
--radius-sm: 6px;
--radius-md: 8px;
--radius-lg: 12px;
--radius-xl: 16px;
--radius-full: 9999px;
```

---

## 📐 Layout Specifications

### Window Dimensions
- **Default:** 1400x900px
- **Minimum:** 1000x700px
- **Maximum:** Full screen
- **Aspect Ratio:** 16:10 preferred

### Editor Area
- **Width:** Flexible (fills available space)
- **Height:** Flexible (fills available space)
- **Padding:** 24px
- **Line Height:** 1.6
- **Font Size:** 14px
- **Tab Size:** 2 spaces

### Panels
- **Width:** 320px (collapsed: 0px)
- **Animation:** 300ms ease-out
- **Background:** #FFFFFF
- **Border:** 1px solid #D1D1D6 (left side)
- **Shadow:** --shadow-md

### Status Bar
- **Height:** 22px
- **Background:** #F5F5F7
- **Font Size:** 11px
- **Auto-hide:** After 3 seconds of inactivity

---

## 🎭 Component Specifications

### Button
```css
/* Primary */
background: #007AFF;
color: #FFFFFF;
border-radius: 8px;
padding: 8px 16px;
font-size: 15px;
font-weight: 500;
transition: all 0.2s;

/* Hover */
background: #0051D5;
transform: scale(1.02);

/* Active */
transform: scale(0.98);
```

### Input
```css
background: #FFFFFF;
border: 1px solid #D1D1D6;
border-radius: 8px;
padding: 8px 12px;
font-size: 15px;
transition: all 0.2s;

/* Focus */
border-color: #007AFF;
box-shadow: 0 0 0 3px rgba(0,122,255,0.1);
```

### Card
```css
background: #FFFFFF;
border-radius: 12px;
padding: 16px;
box-shadow: --shadow-sm;
border: 1px solid #D1D1D6;
```

### Panel
```css
background: #FFFFFF;
width: 320px;
height: 100%;
border-left: 1px solid #D1D1D6;
box-shadow: --shadow-lg;
transition: transform 0.3s ease-out;
```

---

## 🎬 Animation Specifications

### Transitions
- **Default:** 0.2s ease-out
- **Panel Slide:** 0.3s ease-out
- **Fade:** 0.15s ease-in-out
- **Scale:** 0.2s ease-out

### Micro-interactions
- **Button Press:** Scale 0.98
- **Button Hover:** Scale 1.02
- **Panel Open:** Slide from right
- **Notification:** Slide from top, fade in

---

## 📱 Responsive Breakpoints

- **Desktop:** > 1200px (Full features)
- **Tablet:** 768px - 1200px (Adapted layout)
- **Mobile:** < 768px (Simplified)

---

## ♿ Accessibility

- **Contrast Ratio:** Minimum 4.5:1
- **Focus Indicators:** Clear, visible
- **Keyboard Navigation:** Full support
- **Screen Readers:** ARIA labels
- **High Contrast:** Supported

---

**Last Updated:** January 11, 2025
