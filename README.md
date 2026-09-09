# HazardShield - AI-Powered Geospatial Hazard Zone Platform

A complete Next.js frontend for hazard-zone identification, carrying capacity assessment, and relocation planning. Built for the Smart India Hackathon (SIH26191).

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ installed
- npm or yarn package manager

### Installation & Running

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
npm start

# Run linter
npm run lint
```

The application will be available at `http://localhost:3000`

## 📋 Project Structure

```
HazardShield/
├── app/                          # Next.js App Router pages
│   ├── layout.tsx               # Root layout with metadata
│   ├── page.tsx                 # Dashboard/Home page
│   ├── globals.css              # Global styles & animations
│   ├── map/page.tsx             # Interactive Map View page
│   ├── zones/page.tsx           # Risk Zones List page
│   ├── relocation/page.tsx      # Relocation Priority Dashboard
│   └── reports/page.tsx         # Reports & Export page
├── components/                   # Reusable React components
│   ├── Navbar.tsx               # Navigation bar with mobile menu
│   ├── SummaryCard.tsx          # Dashboard metric cards
│   ├── RiskBadge.tsx            # Risk level indicators
│   ├── ZoneCard.tsx             # Zone information card
│   ├── ZoneDetailPanel.tsx      # Detailed zone info sidebar
│   ├── MapView.tsx              # Leaflet interactive map
│   ├── ZonesTable.tsx           # Sortable zones table
│   └── FilterBar.tsx            # Filter by hazard type & risk
├── data/
│   ├── hazardZones.ts           # Mock hazard zone data
│   └── zones.ts                 # Alternative zone schema
├── public/                       # Static assets
├── package.json                 # Dependencies & scripts
├── tailwind.config.ts           # Tailwind CSS configuration
├── tsconfig.json                # TypeScript configuration
├── next.config.js               # Next.js configuration
├── postcss.config.js            # PostCSS configuration
└── README.md                     # This file
```

## 🎨 Design System

### Color Palette
- **Risk Indicators:**
  - `risk-high` (#DC2626) - Red for high-risk zones
  - `risk-medium` (#F59E0B) - Amber for medium-risk zones
  - `risk-low` (#10B981) - Green for low-risk zones
  
- **Primary Colors:**
  - `accent` (#2563EB) - Primary blue for actions & highlights
  - `foreground` (#0F172A) - Dark navy text
  - `muted` (#FCF1F1) - Light background
  - `border` (#FAE4E4) - Light border color

### Typography
- **Primary Font:** Fira Sans (system-ui fallback)
- **Code Font:** Fira Code
- **Base Size:** 16px
- **Line Height:** 1.5

### Spacing & Shadows
- `shadow-soft` - Subtle shadows for cards
- `shadow-card` - Medium shadows for card elevation
- `shadow-hover` - Enhanced shadow on hover

### Animations
- `fade-in` - 0.2s fade entrance
- `slide-up` - 0.3s upward slide entrance
- `pulse-soft` - Gentle 2s pulse animation

## 📄 Pages

### 1. **Dashboard** (`/`)
- Summary cards showing key metrics (total zones, high-risk zones, population at risk, pending relocations)
- Top 3 priority zones for relocation
- Quick statistics and call-to-action buttons
- Clean hero section with navigation

### 2. **Map View** (`/map`)
- Interactive Leaflet map showing all hazard zones
- Color-coded markers (red/yellow/green by risk level)
- Marker size represents population density
- Click markers to view detailed zone information
- Side panel with zone details and urgency scores
- Map legend and quick statistics

### 3. **Risk Zones** (`/zones`)
- Comprehensive table of all zones
- Sortable columns: Name, Hazard Type, Risk Level, Population, Urgency
- Filterable by hazard type and risk level
- Capacity status indicators
- Links to detailed zone information
- Stats summary (total, high-risk, population, overcapacity)

### 4. **Relocation Priority** (`/relocation`)
- Ranked list of zones by urgency score
- Priority levels: Critical (80+), High (60-79), Medium (<60)
- Detailed information per zone including:
  - Zone name and hazard type
  - Risk level
  - Population and carrying capacity
  - Urgency score and reason
  - Capacity status with overage information
- Recommendations for relocation planning

### 5. **Reports & Export** (`/reports`)
- Generate PDF reports (Summary, Detailed, or Relocation Plan)
- Report options: include map, include charts
- Export data as CSV for spreadsheet analysis
- Preview of report contents
- Previous reports history
- Current dashboard statistics

## 🛠️ Tech Stack

- **Framework:** Next.js 14.1.0 with App Router
- **UI Library:** React 18.2.0
- **Styling:** Tailwind CSS 3.4.1 + PostCSS
- **Maps:** Leaflet 1.9.4 + React-Leaflet 4.2.1
- **Data Visualization:** Recharts 2.12.0
- **Icons:** Heroicons 2.1.1
- **Language:** TypeScript 5.3.3

## 📊 Mock Data

The application uses comprehensive mock data for demonstration:
- **8 Hazard Zones** with realistic data
- Zones cover different hazard types: earthquakes, floods, landslides, cyclones
- Real coordinates around Mumbai region (19.0760°N, 72.8777°E)
- Population ranging from 3,200 to 18,000
- Carrying capacity constraints showing overcrowding
- Urgency scores from 28 to 95

See [data/hazardZones.ts](data/hazardZones.ts) for complete mock data structure.

## 🎯 Features

### Core Functionality
✅ Dashboard with real-time metrics
✅ Interactive geospatial map with Leaflet
✅ Comprehensive zone listing and filtering
✅ Relocation priority ranking by urgency
✅ PDF/CSV report generation interface
✅ Responsive mobile-first design
✅ Smooth animations and transitions
✅ Accessible color-coded risk indicators
✅ Real-time capacity status tracking
✅ Sortable and filterable data tables

### UI/UX
✅ Premium, modern design (Stripe/Notion style)
✅ Clean typography and proper spacing
✅ Soft shadows and rounded corners
✅ Smooth hover effects on interactive elements
✅ Color-coded hazard risk levels throughout
✅ Mobile-responsive layout
✅ Accessible form controls and buttons
✅ Clear visual hierarchy

### Performance
✅ Optimized component structure
✅ Efficient data filtering and sorting
✅ Lazy-loaded map visualization
✅ Responsive images and SVG icons
✅ CSS-based animations (GPU accelerated)

## 🔧 Configuration

### Environment Setup
Create a `.env.local` file for environment-specific configuration:

```bash
# Backend API endpoints (when implemented)
NEXT_PUBLIC_API_URL=http://localhost:8000/api

# Map provider settings (if using cloud-based maps)
NEXT_PUBLIC_MAPBOX_TOKEN=your_token_here
```

### Tailwind Customization
Edit `tailwind.config.ts` to customize colors, fonts, spacing, or animations.

### Next.js Configuration
Modify `next.config.js` for optimizations or additional middleware.

## 🔌 Integration Points

The frontend is ready for backend integration:

### Expected API Endpoints
- `GET /api/zones` - Fetch all hazard zones
- `GET /api/zones/:id` - Fetch specific zone details
- `POST /api/zones/filter` - Filter zones by hazard type/risk level
- `POST /api/relocation/priority` - Get prioritized relocation list
- `POST /api/reports/generate` - Generate PDF/CSV reports
- `GET /api/statistics` - Dashboard metrics

### Data Structure Integration
The `HazardZone` interface in [data/hazardZones.ts](data/hazardZones.ts) defines the expected data structure. Update API calls as needed to match your backend schema.

## 📱 Responsive Breakpoints

- **Mobile:** < 640px (default single column)
- **Small Tablet:** 640px - 768px
- **Medium:** 768px - 1024px (md breakpoint)
- **Large:** 1024px - 1280px (lg breakpoint)
- **XL:** > 1280px (xl breakpoint)

## 🎨 Color Accessibility

All color combinations follow WCAG AA standards:
- Text contrast ratios ≥ 4.5:1
- Color-coded information supplemented with icons/text
- Support for reduced motion preferences
- Clear focus states on interactive elements

## 🚀 Production Deployment

### Build Optimization
```bash
npm run build
npm start
```

### Deployment Platforms
- **Vercel** (Recommended for Next.js): `vercel deploy`
- **Netlify**: Connect GitHub repository
- **AWS Amplify**: AWS CLI deployment
- **Docker**: Build containerized deployment

### Environment Variables
Set production environment variables on your hosting platform:
- API endpoints
- Map provider tokens
- Analytics keys
- CDN URLs

## 📝 Future Enhancements

- [ ] Real backend API integration
- [ ] User authentication & authorization
- [ ] Real-time WebSocket updates for zone status
- [ ] Advanced analytics dashboard
- [ ] PDF report generation with charts
- [ ] Multi-language support (i18n)
- [ ] Dark mode theme
- [ ] 3D map visualization
- [ ] Mobile app (React Native)
- [ ] Data export to multiple formats
- [ ] Historical trend analysis
- [ ] Predictive modeling visualization

## 📚 Documentation

### Component Props
Each component file includes JSDoc comments explaining props and usage.

### Type Definitions
TypeScript interfaces defined in data files ensure type safety:
- `HazardZone` - Core zone data structure
- `Zone` - Alternative zone schema (in zones.ts)

## 🐛 Troubleshooting

### Development Issues

**Port 3000 already in use:**
```bash
npm run dev -- -p 3001
```

**Module not found errors:**
```bash
# Clear Next.js cache
rm -rf .next

# Reinstall dependencies
rm -rf node_modules
npm install
```

**TypeScript errors:**
```bash
# Run TypeScript compiler
npx tsc --noEmit
```

### Map Issues
- Ensure Leaflet CSS is properly imported in components
- Check browser console for CORS issues with tile providers
- Verify coordinates are in [latitude, longitude] format

## 📞 Support

For issues or questions:
1. Check the [Next.js documentation](https://nextjs.org/docs)
2. Review component files for usage examples
3. Check Tailwind CSS utilities in configuration
4. Consult Leaflet documentation for map features

## 📄 License

This project is part of Smart India Hackathon 2024-2025. Use and modify as needed for the competition and beyond.

## 🎓 Learning Resources

- [Next.js App Router Documentation](https://nextjs.org/docs/app)
- [React Documentation](https://react.dev)
- [Tailwind CSS Docs](https://tailwindcss.com/docs)
- [Leaflet Documentation](https://leafletjs.com/reference.html)
- [Recharts Documentation](https://recharts.org/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)

---

**Built with ❤️ for HazardShield - Smart India Hackathon 2026**
