# Rel8r

Turn unstructured notes into stakeholder-ready briefing cards.

## Features

- Paste messy notes and generate 4–10 scannable briefing cards with AI
- Swipeable story view on mobile, arrow navigation on desktop
- Card types: Status, Progress, Key Insight, Decision Required, Risk, Action Item, Next Steps, Recommendation
- Shareable URLs (`/brief/[id]`)
- Presentation mode for clean fullscreen viewing

## Getting Started

1. Copy the environment file and add your OpenAI API key:

```bash
cp .env.example .env.local
```

2. Install dependencies:

```bash
npm install --legacy-peer-deps
```

3. Run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to use Rel8r.

## Tech Stack

- **Next.js 15** — App Router
- **Vercel AI SDK** — Structured output with `generateObject`
- **Ant Design** — UI components
- **Framer Motion** — Swipe gestures and card transitions

## Shareable URLs

After generating a briefing, you'll be redirected to `/brief/[id]`. Copy the link to share. Briefings are stored in memory and reset when the server restarts — use a database for production persistence.
