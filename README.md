# Valentine's Day Countdown 2026

A beautiful Valentine's Day countdown app with password protection, animated flip clock, and love counter.

## Features

- ✔ Animated flip clock countdown timer
- ✔ Password-protected access with hint system
- ✔ Animated love counter ($0 → $5000 → $9999 → ∞)
- ✔ Full-page animated loading grid background
- ✔ Responsive design (mobile & desktop)
- ✔ Dark mode support
- ✔ Dev tools overlay (press 'D' 3x)
- ✔ URL query parameters for testing

## Quick Start

### Development

```bash
# Install dependencies
bun install

# Start dev server
bun run dev

# Build for production
bun run build

# Preview production build
bun run preview
```

### Deployment

```bash
# Deploy to GitHub Pages
bun run deploy

# Or use GitHub Actions (already configured)
git push origin main
```

See [DEPLOYMENT.md](DEPLOYMENT.md) for detailed deployment instructions.

## Project Structure

```
src/
├── components/
│   ├── landing-page.tsx          # Main countdown page
│   ├── password-prompt.tsx       # Password entry screen
│   ├── love-counter.tsx          # Animated counter
│   └── ui/                       # shadcn/ui components
│       ├── badge.tsx
│       ├── button.tsx
│       └── card.tsx
├── config/
│   ├── content.ts                # All text content
│   └── landing-config.ts         # Configuration (date, password)
├── assets/
│   └── dog.png                   # Password hint image
├── App.tsx
└── main.tsx
```

## Configuration

Edit `src/config/landing-config.ts`:

```typescript
export const landingConfig = {
  targetDate: '2026-02-14T00:00:00',  // Valentine's Day 2026
  password: 'Anh thương em',          // Password to access
  // ...
};
```

Edit `src/config/content.ts` to change any text in the app.

## Testing States

Use URL query parameters to test different views:

- `?view=countdown` - Countdown screen (before date)
- `?view=ready` - Ready screen (date reached, button enabled)
- `?view=counter` or `?counter` - Skip directly to love counter
- `?landing-countdown` - Force countdown view
- `?landing-ready` - Force ready view

## Dev Tools

Press `D` key 3 times quickly to toggle the developer overlay showing:
- Target date
- Current time
- Days remaining
- Button status

## Technologies

- **React 19** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool
- **Bun** - Package manager & runtime
- **Tailwind CSS 4** - Styling
- **shadcn/ui** - UI components
- **flipclock** - Countdown timer

## Features Explained

### 1. Password Protection
- First screen requires password entry
- 3 attempts before hint appears
- Cute dog image as visual hint
- Password: "Anh thương em" (Vietnamese: "I love you")

### 2. Countdown Timer
- Animated flip clock showing days, hours, minutes, seconds
- Red rose theme
- Pixelated heart animation when countdown completes
- Button enabled only when date is reached
- Playful button evasion when date is reached

### 3. Love Counter
- Animated digital counter display
- Starts at $0000
- Counts to $5000 (pauses with message)
- Rapidly counts to $9999
- Replaces 9's with ∞ symbol
- Final message: "Can't put a number on it"

### 4. Loading Grid Background
- 40×30 grid (1,200 blocks)
- Fills one block every 0.5 seconds
- Red blocks for filled, black for empty
- Continuous loop (resets at 100%)
- Behind all content (doesn't block interaction)

## Customization

### Change Target Date
Edit `src/config/landing-config.ts`:
```typescript
targetDate: '2027-02-14T00:00:00'
```

### Change Password
Edit `src/config/landing-config.ts`:
```typescript
password: 'your-password-here'
```

### Update Text Content
All text is in `src/config/content.ts` - edit any string to change the app text.

### Modify Colors
The app uses Tailwind CSS with a rose/red theme:
- Primary: `bg-rose-600`, `text-rose-600`
- Accents: `border-rose-200`, `bg-rose-100`
- Dark mode variants automatically applied

## Build Output

Production build is optimized and includes:
- CSS: ~40KB (9.6KB gzipped)
- JavaScript: ~239KB (75KB gzipped)
- Fonts: JetBrains Mono Variable (~75KB)
- Total: ~354KB initial load

## Browser Support

- Modern browsers (Chrome, Firefox, Safari, Edge)
- Mobile browsers (iOS Safari, Chrome Mobile)
- Requires JavaScript enabled
- CSS Grid and Flexbox support required

## License

MIT

---

Built with ❤️ for Valentine's Day 2026
