# 🐾 PetCare Pro - Next-Gen Pet Care & AI Diagnostics 

[![Live Demo](https://img.shields.io/badge/Live-Demo-brightgreen)](https://petcare-pro.pages.dev)
[![Stack](https://img.shields.io/badge/Stack-Next.js%2015%20|%20Turso%20|%20Cloudflare-blue)](https://petcare-pro.pages.dev)
[![AI](https://img.shields.io/badge/AI-Llama%203.1%20|%20Workers%20AI-orange)](https://petcare-pro.pages.dev)

PetCare Pro is a high-performance, production-ready pet management ecosystem that combines professional veterinary tools with state-of-the-art **Generative AI**. Built on the Cloudflare Edge network and powered by Turso, it offers zero-latency performance and specialized medical inference.

---

## 🌟 Major Highlights

### 🤖 AI Disease Predictor (New!)

A clinical-grade diagnostic assistant trained on the **Animal Disease Prediction (Kaggle)** dataset.

- **Pattern Recognition:** Analyzes 22 clinical parameters across 8 animal species.
- **Neural Inference:** Uses Cloudflare Workers AI (Llama 3.1) to analyze symptoms, body temperature, and heart rate.
- **Smart Reports:** Generates structured diagnostic summaries with confidence scores and medical recommendations.

### 💬 Intelligent AI Chatbot

Not just a generic bot—a specialized Veterinary Guide.

- **Clinical Knowledge:** Injected with specialized knowledge for livestock and domestic pets.
- **Site Navigator:** Understands the entire PetCare Pro platform; can guide users to "My Pets", "Vaccinations", or "Appointments".
- **Token Optimized:** Specially tuned prompt engineering to stay within Cloudflare's free-tier AI Neuron limits (10,000/day) while providing professional, concise answers.

---

## ✨ Core Features

✅ **Health Dashboard** - Real-time statistics and quick actions for your pets.  
✅ **Pet Management** - Deep profile tracking for multiple animals.  
✅ **Vet Appointments** - Full-cycle booking and management system.  
✅ **Veterinarian Profiles** - Comprehensive doctor profiles with integrated Google Maps.  
✅ **Interactive Clinic Maps** - Embedded Google Maps with directions and location sharing.  
✅ **Vaccination Log** - History tracking and future reminder system.  
✅ **Social Community** - Post updates, share tips, and connect with other pet owners.  
✅ **Multi-Role RBAC** - Optimized interfaces for Users, Veterinarians, and Admins.  
✅ **Premium Dark Mode** - Stunning, responsive UI designed for maximum readability.

---

### 🗺️ Veterinarian Profile System (New!)

A comprehensive doctor management system with integrated mapping capabilities.

- **Professional Profiles**: Detailed veterinarian information including qualifications, experience, and specialties.
- **Interactive Maps**: Embedded Google Maps showing clinic locations with no API key required.
- **Smart Geocoding**: Admins can enter addresses and automatically get coordinates using OpenStreetMap.
- **Navigation Integration**: One-click directions to clinics via Google Maps.
- **Mobile Responsive**: Optimized map viewing on all devices.

---

## 🛠️ Tech Stack

| Layer              | Technology                        | Status         |
| ------------------ | --------------------------------- | -------------- |
| **Meta-Framework** | Next.js 15 (App Router)           | Active         |
| **Logic**          | TypeScript & React 19             | Active         |
| **Database**       | Turso (libSQL)                    | Edge-Optimized |
| **AI Engine**      | Cloudflare Workers AI (Llama 3.1) | Production     |
| **Styling**        | TailwindCSS & Shadcn/UI           | Responsive     |
| **Edge Runtime**   | Cloudflare Pages (Edge)           | Deployed       |

---

## 🚀 Quick Start (Local Setup)

### 1. Prerequisites

- Node.js 18+
- Turso CLI (Optional for cloud mode)
- SQLite3 (for local database)

### 2. Installation

```bash
git clone https://github.com/Istiaqul-Islam/petcare-pro.git
cd petcare-pro-main
npm install
```

### 3. Environment Config

Create a `.env.local` file:

```env
DATABASE_MODE=local
LOCAL_DB_PATH=./petcare_local.db
NODE_ENV=development
IMGBB_API_KEY=your_key_here
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 4. Database Setup & Launch

```bash
# First time setup - creates and seeds the database
npm run db:init   # Initialize & Seed Local SQLite

# Or manual setup (if npm script fails):
sqlite3 petcare_local.db < schema.sql
sqlite3 petcare_local.db < seed.sql

# Start development server
npm run dev
```

### 5. Add Veterinarians (First Time Setup)

Since veterinarians are no longer included in seed data:

1. Navigate to `/admin` (login with admin@petcare.com / admin123)
2. Go to **Veterinarians** section
3. Click **Add Veterinarian** to add doctors manually
4. Enter clinic addresses and use **Get from Address** to auto-fill coordinates
5. All veterinarian data is managed through the admin portal

---

## 🗄️ Database Setup & Updates

This section covers both initial database setup and updating existing databases.

### 📋 Database Files

- `schema.sql` - Complete database structure with all tables and indexes
- `seed.sql` - Initial admin user data

### 🆕 New Database Setup

#### Local Database

```bash
# Create local database file
sqlite3 petcare_local.db < schema.sql
sqlite3 petcare_local.db < seed.sql

# Verify setup
sqlite3 petcare_local.db "SELECT name FROM sqlite_master WHERE type='table' ORDER BY name;"
sqlite3 petcare_local.db "SELECT COUNT(*) as user_count FROM users;"
```

#### Cloud Database (Turso)

```bash
# Install Turso CLI (if not installed)
curl -sSfL https://get.tur.so/install.sh | bash
source ~/.zshrc  # or source ~/.bashrc

# Login to Turso
turso auth login

# Apply schema and seed data
turso db shell petcaredb --location aws-ap-northeast-1 < schema.sql
turso db shell petcaredb --location aws-ap-northeast-1 < seed.sql

# Verify setup
turso db shell petcaredb --location aws-ap-northeast-1 "SELECT name FROM sqlite_master WHERE type='table' ORDER BY name;"
turso db shell petcaredb --location aws-ap-northeast-1 "SELECT COUNT(*) as user_count FROM users;"
```

### 🔄 Updating Existing Database

#### Check Current Database Status

```bash
# Local database
sqlite3 petcare_local.db "SELECT name FROM sqlite_master WHERE type='table' ORDER BY name;"

# Cloud database
turso db shell petcaredb --location aws-ap-northeast-1 "SELECT name FROM sqlite_master WHERE type='table' ORDER BY name;"
```

#### Apply Schema Updates

```bash
# Local database - safe to run multiple times (uses IF NOT EXISTS)
sqlite3 petcare_local.db < schema.sql

# Cloud database
turso db shell petcaredb --location aws-ap-northeast-1 < schema.sql
```

#### Apply/Update Seed Data

```bash
# Local database (uses INSERT OR IGNORE to prevent duplicates)
sqlite3 petcare_local.db < seed.sql

# Cloud database
turso db shell petcaredb --location aws-ap-northeast-1 < seed.sql
```

### 🔧 Database Migration Commands

For existing installations needing updates:

```bash
# Update local database with latest schema
sqlite3 petcare_local.db < schema.sql

# Update cloud database with latest schema
turso db shell petcaredb --location aws-ap-northeast-1 < schema.sql

# Re-seed admin user if needed
sqlite3 petcare_local.db < seed.sql
turso db shell petcaredb --location aws-ap-northeast-1 < seed.sql
```

### 📊 Database Schema Overview

The database includes 11 tables:

- `users` - User accounts and profiles
- `pets` - Pet information and records
- `veterinarians` - Vet directory with location data
- `appointments` - Appointment scheduling
- `vaccinations` - Vaccine tracking and reminders
- `posts` - Social media posts
- `comments` - Post comments system
- `reactions` - Like/reaction system
- `feedbacks` - User feedback and support
- `notifications` - Notification system
- `receptionist_doctors` - Staff mapping

### ⚠️ Important Notes

- The schema uses `IF NOT EXISTS` and `INSERT OR IGNORE` for safe re-application
- Always backup your database before major updates
- The admin user credentials are: admin@petcare.com / admin123
- Local database file: `petcare_local.db`
- Cloud database name: `petcaredb`

---

## ☁️ Cloud Deployment (Cloudflare + Turso)

This project is built for the **Edge**. Follow these steps for production deployment:

### 🗄️ Database Setup (Turso)

1. Create a DB: `turso db create petcare-pro`
2. Get URL: `turso db show petcare-pro --url`
3. Get Token: `turso db tokens create petcare-pro`
4. Update `.env.local` with `DATABASE_MODE=cloud` and your credentials.
5. Push schema: `npm run turso:push`

### ⚡ AI Setup (Cloudflare Workers AI)

1. In `wrangler.toml`, ensure the AI binding is present:
   ```toml
   [ai]
   binding = "AI"
   ```
2. On Cloudflare Dashboard, go to **Settings > Functions > Compatibility Flags** and add `nodejs_compat`.

### 🚀 Deploying to Pages

1. Connect your GitHub/GitLab repo to Cloudflare Pages.
2. Set the Environment Variables in the Pages dashboard:
   - `DATABASE_MODE`: `cloud`
   - `TURSO_CONNECTION_URL`: Your Turso URL
   - `TURSO_AUTH_TOKEN`: Your Turso Token
   - `IMGBB_API_KEY`: Your ImageBB key
3. Build Command: `npm run build`
4. Output Directory: `.next`

---

## 📋 Essential Commands

| Command              | Action                                   |
| -------------------- | ---------------------------------------- |
| `npm run dev`        | Start local development                  |
| `npm run db:init`    | Create & Seed local DB (Run this first!) |
| `npm run db:reset`   | Wipe and restart local DB                |
| `npm run turso:push` | Sync local schema to Turso Cloud         |
| `npm run build`      | Compile Edge-compatible production build |

### 🗄️ Database Migration Commands

For existing installations needing location support:

```bash
# Run the location fields migration
sqlite3 data/petcare.db < scripts/add-vet-location-fields.sql

# For Turso cloud deployments
turso db shell petcare-pro < scripts/add-vet-location-fields.sql
```

---

## 🔒 Security & Performance

- **Edge Native:** All API routes run on the Edge Runtime for global low-latency.
- **Secure Auth:** Session management using HttpOnly cookies and bcrypt hashing.
- **Optimized AI:** Prompt engineering restricts responses to save on daily AI neurons.
- **Image handling:** Integrated with ImgBB for high-performance asset serving.
- **Free Mapping Services:** Uses Google Maps embed (no API key) and OpenStreetMap geocoding.
- **Location Privacy:** All location data is stored securely and only used for map functionality.

---

## 📝 License

Built with ❤️ for Pet Lovers. Distributed under the MIT License.
