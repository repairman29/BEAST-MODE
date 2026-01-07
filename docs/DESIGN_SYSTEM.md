# BEAST MODE Design System
## Consistent UI/UX Guidelines

**Date:** January 2026  
**Status:** ✅ **Documented**

---

## 🎨 **COLOR SYSTEM**

### **Primary Colors:**
- **Cyan (Primary):** `cyan-500`, `cyan-600`, `cyan-700`
- **Gradients:** `from-cyan-500 to-blue-500`, `text-gradient-cyan`

### **Semantic Colors:**
- **Success:** `green-400`, `green-500`
- **Error:** `red-400`, `red-500`
- **Warning:** `yellow-400`, `amber-400`
- **Info:** `cyan-400`, `cyan-500`

### **Neutral Colors:**
- **Background:** `black`, `slate-950`, `slate-900`
- **Surface:** `slate-900/50`, `slate-950/50`
- **Border:** `slate-800`, `slate-900`
- **Text Primary:** `white`
- **Text Secondary:** `slate-300`, `slate-400`
- **Text Tertiary:** `slate-500`, `slate-600`

---

## 📝 **TYPOGRAPHY**

### **Headings:**
- **H1:** `text-6xl md:text-7xl lg:text-8xl font-bold text-white tracking-tight`
- **H2:** `text-5xl md:text-6xl font-bold text-white tracking-tight`
- **H3:** `text-3xl md:text-4xl font-bold text-white`
- **H4:** `text-2xl font-bold text-white`
- **H5:** `text-xl font-semibold text-white`
- **H6:** `text-lg font-semibold text-white`

### **Body Text:**
- **Large:** `text-xl md:text-2xl text-slate-400`
- **Regular:** `text-lg md:text-xl text-slate-400`
- **Small:** `text-sm text-slate-400`
- **Tiny:** `text-xs text-slate-500`

### **Special:**
- **Gradient Text:** `text-gradient-cyan` (custom class)
- **Emphasis:** `font-semibold text-white` or `font-bold text-cyan-400`

---

## 📦 **COMPONENTS**

### **Cards:**
```tsx
<Card className="bg-slate-950/50 border-slate-900 hover:border-slate-800 transition-all">
  <CardHeader>
    <CardTitle className="text-white">Title</CardTitle>
    <CardDescription className="text-slate-400">Description</CardDescription>
  </CardHeader>
  <CardContent>
    {/* Content */}
  </CardContent>
</Card>
```

### **Buttons:**
```tsx
// Primary
<Button className="bg-cyan-600 hover:bg-cyan-700 text-white">Action</Button>

// Secondary
<Button variant="outline" className="border-slate-800 text-slate-300 hover:bg-slate-900">
  Secondary
</Button>

// Sizes
<Button size="sm">Small</Button>
<Button size="default">Default</Button>
<Button size="lg">Large</Button>
```

### **Loading States:**
```tsx
<LoadingSpinner size="md" text="Loading..." />
```

### **Error States:**
```tsx
<ErrorMessage
  title="Error"
  message="Something went wrong"
  onRetry={handleRetry}
  variant="card"
/>
```

---

## 📏 **SPACING**

### **Sections:**
- **Large:** `py-32 px-6` (landing sections)
- **Medium:** `py-20 px-6` (content sections)
- **Small:** `py-12 px-6` (compact sections)

### **Cards:**
- **Padding:** `p-4`, `p-6`, `p-8`
- **Gap:** `gap-4`, `gap-6`, `gap-8`

### **Margins:**
- **Between Sections:** `mb-20`, `mb-24`, `mb-32`
- **Between Elements:** `mb-4`, `mb-6`, `mb-8`, `mb-12`
- **Grid Gaps:** `gap-4`, `gap-6`

---

## 🎯 **PATTERNS**

### **Gradient Cards:**
```tsx
<Card className="bg-gradient-to-br from-cyan-500/10 to-blue-500/10 border-cyan-500/20">
  {/* Content */}
</Card>
```

### **Hover Effects:**
```tsx
className="hover:border-cyan-500/40 transition-all hover:shadow-xl hover:shadow-cyan-500/5"
```

### **Background Patterns:**
```tsx
// Grid overlay
className="bg-[linear-gradient(to_right,rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:64px_64px]"

// Gradient background
className="bg-gradient-to-b from-black via-slate-950 to-black"
```

---

## ✅ **CONSISTENCY CHECKLIST**

### **All Components Should:**
- [x] Use design system colors
- [x] Use consistent typography
- [x] Use consistent spacing
- [x] Have loading states
- [x] Have error states
- [x] Use consistent button styles
- [x] Use consistent card styles
- [x] Follow hover/transition patterns

---

## 📚 **REFERENCE**

### **Component Library:**
- `components/ui/Button.tsx` - Button component
- `components/ui/Card.tsx` - Card components
- `components/ui/LoadingSpinner.tsx` - Loading states
- `components/ui/ErrorMessage.tsx` - Error states
- `components/ui/Badge.tsx` - Badge component

### **Landing Components:**
- `components/landing/HeroSection.tsx` - Hero section
- `components/landing/FeaturesSection.tsx` - Features grid
- `components/landing/ValueSection.tsx` - Value metrics
- `components/landing/StatsSection.tsx` - Statistics

---

**Status:** ✅ **Design System Documented - Use as reference for all components!**

