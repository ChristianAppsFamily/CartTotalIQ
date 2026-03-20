# CartTotalIQ — "Know before you go." Shopping Price Scanner

## Features

- **Scan price tags** — Point your camera at any price tag and the app uses AI vision to read the price automatically
- **Auto-identify items** — Optionally take a second photo of the item itself; the AI names it, categorizes it, and assigns an emoji (e.g. "🕯️ Vanilla Candle · Home Décor")
- **Running total with tax** — See a large, always-visible running total at the top of the screen, with tax calculated in real time
- **Tax by ZIP code** — On first launch, enter your ZIP code to set your local sales tax rate (cached locally). Update it anytime in settings
- **Budget ceiling** — Set a spending limit; a progress bar fills from pink → purple → hot pink as you approach your budget
- **Budget ceiling Alert**- Phone will vibrate or chime when user hits or goes over the limit. 
- **"Can I Afford It?" mode** — The total accent shifts to bright violet at 70% spent, and hot pink at 90%, giving you a visual urgency signal
- **Swipe to remove** — Swipe left on any item card to delete it from your list
- **No account required** — All data stored locally on your device
- **Manual price entry** — Fallback option to type a price and item name manually
- Manual Shopping list entry - User can pre-add each item they want and when the scan app will try and match it and auto check it off the list.
- Manual Add Store name-User can and see a list of stores they visited by adding the store name in the very beginning to go back to that store shopping experience by date 

## Design

- **Background:** Soft lavender-white (#F8F5FF) for a clean, premium feel
- **Primary brand color:** Deep royal purple (#3B1F78) for headers and key elements
- **Accent:** Warm pink (#F9A8D4) for the running total and highlights
- **Cards:** Pure white with lavender-tinted borders (#DDD0F5), subtle shadows
- **Item icons:** Alternating soft purple (#F0E8FF) and soft pink (#FDE8F4) emoji backgrounds
- **Secondary text:** Muted violet-mauve (#8B6BB5) for labels and categories
- **Budget bar:** Animated gradient transitioning pink → purple → hot pink (#E879A0) as spending increases
- **Typography:** Clean, modern sans-serif with bold totals and lightweight labels
- **Micro-interactions:** Button press animations, smooth list transitions, haptic feedback on scan success

## Screens

1. **Welcome / ZIP Code Setup** — First-launch screen with the app logo, tagline "Know before you go," and a ZIP code input to set your local tax rate. Warm, inviting purple gradient header
2. **Main Shopping List** — The core screen showing:
  - Store Name
  - Large running total (price + tax) at the top
  - Budget progress bar below the total (appears when a budget is set)
  - Scrollable list of scanned items, each card showing emoji, AI name, category, base price, and tax-included price
  - Floating "Scan" button at the bottom to add items
  - Pre-added shopping list if available. Ask if they want to add or use. 
3. **Camera / Scan Screen** — Full-screen camera view with a "Scan Price Tag" prompt. After scanning a price, option to take a second photo of the item for AI identification. Also includes a manual entry fallback
4. **Settings** — Update ZIP code / tax rate, set or adjust budget ceiling, clear all items

## App Icon

- Deep royal purple background with a shopping cart icon and a subtle price tag element, accented with warm pink highlights — clean and recognizable

