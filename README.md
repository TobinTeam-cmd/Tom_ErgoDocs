# Tom ErgoDocs

PDV (Physical Demand Validation) collection and ergonomic evaluation web application. Built for on-site job analysis with support for photo documentation, push/pull force measurements, physical activity frequency tracking, and environmental requirements.

## Tech Stack

- **Framework**: Next.js 16 / React 19
- **Language**: TypeScript (strict mode)
- **Styling**: Tailwind CSS 4
- **Icons**: Lucide React
- **Deployment**: Railway (standalone mode)

## Getting Started

```bash
cd ergo-app
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the app.

## Project Structure

```
Tom_ErgoDocs/
├── docs/                    # Reference documents (FJD templates, PDV sheets)
└── ergo-app/                # Next.js application
    ├── src/
    │   ├── app/             # Next.js app router (layout, page, styles)
    │   ├── components/      # React components
    │   └── lib/             # Utility functions
    ├── public/              # Static assets
    ├── railway.toml         # Railway deployment config
    └── package.json
```

## Deployment

Deployed on Railway with standalone output mode. Build and deploy are configured in `railway.toml`.

```bash
cd ergo-app
npm run build
```

## Reference Documents

The `docs/` folder contains reference templates used for ergonomic evaluations:
- FJD (Functional Job Description) template
- PDV Collection Sheets
- Equipment Support samples
