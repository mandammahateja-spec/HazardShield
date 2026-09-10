# HazardShield Backend API

> AI-powered platform for hazard-zone identification, carrying capacity assessment, and relocation planning.

## Tech Stack

- **Runtime:** Node.js (≥18)
- **Framework:** Express.js
- **Database:** MongoDB (Mongoose ODM)
- **Auth:** JWT (jsonwebtoken + bcryptjs)
- **Validation:** Joi
- **Reports:** pdfkit (PDF) + json2csv (CSV)
- **Security:** Helmet, CORS, express-rate-limit

## Quick Start

### Prerequisites

- Node.js ≥ 18
- MongoDB running locally (or a MongoDB Atlas connection string)

### 1. Install Dependencies

```bash
cd backend
npm install
```

### 2. Configure Environment

```bash
cp .env.example .env
```

Edit `.env` with your values:

```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/hazardshield
JWT_SECRET=your_secure_random_secret
JWT_EXPIRES_IN=24h
CORS_ORIGIN=http://localhost:3000
NODE_ENV=development
```

### 3. Seed the Database

```bash
npm run seed
```

This creates:
- **1 admin account:** `admin@hazardshield.com` / `admin123`
- **15 hazard zones** (5 red, 5 yellow, 5 green)
- **8 relocation plans** with urgency scores

### 4. Start the Server

```bash
# Development (with auto-reload)
npm run dev

# Production
npm start
```

The API will be available at `http://localhost:5000`.

## API Endpoints

### Authentication

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/auth/register` | — | Create account |
| POST | `/api/auth/login` | — | Login, get JWT |
| POST | `/api/auth/logout` | Token | Invalidate token |

### Dashboard (Protected)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/dashboard/summary` | Aggregate stats |

### Zones (Protected)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/zones` | List zones (filter: `?hazardType=flood&riskLevel=red`) |
| GET | `/api/zones/:id` | Zone detail (incl. coordinates, risk history) |

### Relocation (Protected)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/relocation-priority` | Ranked by urgency |
| PATCH | `/api/relocation-priority/:id/approve` | Admin-only approval |

### Reports (Protected)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/reports/export?format=csv` | Download CSV |
| GET | `/api/reports/export?format=pdf` | Download PDF |

### Health

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/health` | Server health check |

## Usage Examples

### Login

```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@hazardshield.com", "password": "admin123"}'
```

### Access Protected Route

```bash
curl http://localhost:5000/api/dashboard/summary \
  -H "Authorization: Bearer <your_jwt_token>"
```

### Filter Zones

```bash
curl "http://localhost:5000/api/zones?hazardType=flood&riskLevel=red" \
  -H "Authorization: Bearer <your_jwt_token>"
```

### Approve Relocation (Admin Only)

```bash
curl -X PATCH http://localhost:5000/api/relocation-priority/<plan_id>/approve \
  -H "Authorization: Bearer <your_jwt_token>" \
  -H "Content-Type: application/json" \
  -d '{"status": "approved"}'
```

### Export Report

```bash
curl "http://localhost:5000/api/reports/export?format=pdf" \
  -H "Authorization: Bearer <your_jwt_token>" \
  -o report.pdf
```

## Project Structure

```
backend/
├── config/
│   └── db.js                  # MongoDB connection
├── controllers/
│   ├── authController.js      # Register, login, logout
│   ├── dashboardController.js # Summary stats
│   ├── zoneController.js      # Zone list & detail
│   ├── relocationController.js# Priority & approval
│   └── reportController.js    # CSV/PDF export
├── middleware/
│   ├── auth.js                # JWT verification
│   ├── errorHandler.js        # Centralized errors
│   ├── rateLimiter.js         # Rate limiting
│   └── validation.js          # Joi schemas
├── models/
│   ├── Admin.js
│   ├── Zone.js
│   └── RelocationPlan.js
├── routes/
│   ├── authRoutes.js
│   ├── dashboardRoutes.js
│   ├── zoneRoutes.js
│   ├── relocationRoutes.js
│   └── reportRoutes.js
├── scripts/
│   └── seed.js
├── server.js
├── package.json
├── .env.example
└── README.md
```

## Deploy to Render

1. Push the `backend/` directory to a Git repo
2. Create a new **Web Service** on Render
3. Set **Build Command:** `npm install`
4. Set **Start Command:** `npm start`
5. Add environment variables in the Render dashboard:
   - `MONGO_URI` — your MongoDB Atlas connection string
   - `JWT_SECRET` — a secure random string
   - `CORS_ORIGIN` — your frontend URL
   - `NODE_ENV` — `production`

## Security Features

- 🔐 JWT authentication with token blacklist
- 👮 Role-based access control (admin/official)
- 🛡️ Helmet HTTP security headers
- 🚦 Rate limiting (10 login attempts / 15 min)
- ✅ Joi input validation on all routes
- 🌐 CORS restricted to frontend domain
- 🔒 Passwords hashed with bcrypt (12 rounds)
