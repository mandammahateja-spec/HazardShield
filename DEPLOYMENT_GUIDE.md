# HazardShield Deployment Guide 🚀

HazardShield is composed of three interconnected services:
1. **Frontend**: Next.js 14 App Router (`/`)
2. **Backend REST API**: Node.js & Express (`/backend`)
3. **Risk Engine**: Python FastAPI microservice (`/risk_engine`)
4. **Database**: MongoDB (Atlas M0 Free Tier or self-hosted)

---

## 📋 Pre-Flight Checklist

Before starting, make sure you have free accounts on:
- [GitHub](https://github.com/) (your repo is already at `mandammahateja-spec/hazardshield`)
- [Vercel](https://vercel.com/) (Best for Next.js frontend — free tier)
- [Render](https://render.com/) or [Railway](https://railway.app/) (Best for Node.js + Python microservices — free tier)
- [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) (Free cloud database)

---

## 🗄️ Step 1: Set Up Cloud Database (MongoDB Atlas)

1. Sign in to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas).
2. Click **Create a Database** and select the **M0 Shared (Free)** tier.
3. Choose a provider and region (e.g., AWS / Mumbai `ap-south-1` or Singapore).
4. **Security & User Creation**:
   - Under **Database Access**, create a user (e.g., `hazard_admin`) and secure password.
   - Under **Network Access**, click **Add IP Address** → choose **Allow Access From Anywhere (`0.0.0.0/0`)** so cloud hosts (Render/Vercel) can connect.
5. Click **Connect** → **Drivers** (Node.js) and copy the connection string:
   ```text
   mongodb+srv://hazard_admin:<password>@cluster0.xxxxx.mongodb.net/hazardshield?retryWrites=true&w=majority
   ```
   *(Replace `<password>` with your database user password).*

---

## ⚙️ Step 2: Deploy Backend & Risk Engine on Render

The repository includes a ready-to-use [`render.yaml`](./render.yaml) Blueprint that sets up both the Python FastAPI engine and the Express API in a single coordinated deploy.

### Method A: 1-Click Blueprint (Recommended)
1. Go to your [Render Dashboard](https://dashboard.render.com/).
2. Click **New +** → **Blueprint**.
3. Connect your repository: `mandammahateja-spec/hazardshield`.
4. Render will detect `render.yaml` and configure two services:
   - `hazardshield-risk-engine` (Python 3.10+ / FastAPI)
   - `hazardshield-backend` (Node.js 18+ / Express)
5. Fill in the prompted environment variables:
   - `MONGODB_URI`: Paste your MongoDB Atlas connection string from Step 1.
   - `CORS_ORIGIN`: Put `*` (or your final Vercel URL once created).
6. Click **Apply**.
7. Note down your backend URL (e.g., `https://hazardshield-backend.onrender.com`).

### Method B: Manual Service Creation on Render
If you prefer creating the services manually:

#### 1. Deploy Python Risk Engine:
- **New +** → **Web Service**
- Repository: `mandammahateja-spec/hazardshield`
- **Root Directory**: `risk_engine`
- **Runtime**: `Python 3`
- **Build Command**: `pip install -r requirements.txt`
- **Start Command**: `uvicorn main:app --host 0.0.0.0 --port $PORT`
- Copy the resulting URL: `https://hazardshield-risk-engine.onrender.com`

#### 2. Deploy Node.js Express Backend:
- **New +** → **Web Service**
- Repository: `mandammahateja-spec/hazardshield`
- **Root Directory**: `backend`
- **Runtime**: `Node`
- **Build Command**: `npm install`
- **Start Command**: `npm start`
- **Environment Variables**:
  - `NODE_ENV`: `production`
  - `PORT`: `5000`
  - `MONGODB_URI`: `<Your MongoDB Atlas String>`
  - `JWT_SECRET`: `<Random 32-character secret string>`
  - `JWT_EXPIRES_IN`: `24h`
  - `RISK_ENGINE_URL`: `https://hazardshield-risk-engine.onrender.com`
  - `CORS_ORIGIN`: `*`
- Copy the resulting URL: `https://hazardshield-backend.onrender.com`

---

## 💻 Step 3: Deploy Frontend on Vercel

1. Log in to [Vercel](https://vercel.com).
2. Click **Add New...** → **Project**.
3. Import your GitHub repository: `mandammahateja-spec/hazardshield`.
4. Vercel automatically detects **Next.js**.
5. Configure Project:
   - **Root Directory**: `./` (leave default)
   - **Build Command**: `npm run build`
   - **Output Directory**: `.next`
6. Expand **Environment Variables** and add:
   | Variable Name | Value |
   | :--- | :--- |
   | `NEXT_PUBLIC_API_URL` | `https://hazardshield-backend.onrender.com` |
7. Click **Deploy**.
8. In ~60 seconds, your site will be live at `https://hazardshield.vercel.app` (or custom domain).

---

## 🔄 Step 4: Finalizing & CORS Whitelisting

1. Once your Vercel URL is live (e.g., `https://hazardshield.vercel.app`):
2. Go back to Render → `hazardshield-backend` → **Environment**.
3. Update `CORS_ORIGIN` to your exact Vercel URL:
   ```text
   CORS_ORIGIN=https://hazardshield.vercel.app
   ```
4. Render will automatically redeploy the backend with strict CORS protection.

---

## 🔑 Default Test Accounts

The backend automatically seeds initial test users on first launch:

| Role | Email | Password | Access Level |
| :--- | :--- | :--- | :--- |
| **Citizen (Community)** | `citizen@hazardshield.com` | `citizen123` | Community reporting, localized alerts |
| **District Admin** | `district@hazardshield.com` | `district123` | Report verification, local alert dispatch |
| **State DMA Officer** | `state@hazardshield.com` | `state123` | Red Zone gazetting, relocation approvals |
| **National Admin** | `admin@hazardshield.com` | `admin123` | National governance, multi-state oversight |

---

## 🐳 Optional: Single-Server Deployment with Docker Compose

If you have a single VPS (e.g., AWS EC2, DigitalOcean Droplet, Hetzner, or Linode):

Create `docker-compose.yml`:
```yaml
version: '3.8'

services:
  mongo:
    image: mongo:6.0
    restart: always
    volumes:
      - mongo_data:/data/db
    ports:
      - "27017:27017"

  risk-engine:
    build:
      context: ./risk_engine
      dockerfile: Dockerfile
    restart: always
    ports:
      - "8000:8000"

  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    restart: always
    environment:
      - PORT=5000
      - MONGO_URI=mongodb://mongo:27017/hazardshield
      - RISK_ENGINE_URL=http://risk-engine:8000
      - JWT_SECRET=production_secret_key_12345
      - CORS_ORIGIN=*
    ports:
      - "5000:5000"
    depends_on:
      - mongo
      - risk-engine

  frontend:
    build:
      context: .
      dockerfile: Dockerfile
    restart: always
    environment:
      - NEXT_PUBLIC_API_URL=http://localhost:5000
    ports:
      - "3000:3000"
    depends_on:
      - backend

volumes:
  mongo_data:
```

Run with:
```bash
docker-compose up -d --build
```
