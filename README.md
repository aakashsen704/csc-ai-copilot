# CSC AI Co-Pilot
### Intelligent Assistant for Common Service Centre Operators
**District: Rajnandgaon, Chhattisgarh** · GovTech · AI for Citizen Services

---

## Overview

CSC AI Co-Pilot is a full-stack intelligent assistant that helps frontline CSC operators reduce form rejections and cut per-application handling time. It monitors government form filling in real-time, validates fields before submission, and provides bilingual (Hindi + English) guidance powered by Claude AI.

**Problem solved:** CSC operators in Rajnandgaon process 70–90 applications/day on slow portals with no guidance. Every rejection bounces back to their desk. This tool catches errors before they become rejections.

---

## Architecture

```
┌─────────────────┐     ┌─────────────────────┐     ┌──────────────┐
│  React Frontend │────▶│  Express.js Backend  │────▶│  Claude API  │
│  (Port 3000)    │     │  (Port 5000)         │     │  (Anthropic) │
│                 │     │                      │     └──────────────┘
│  • Form UI      │     │  • AI Chat Route     │
│  • Live Valid.  │     │  • Validation Route  │     ┌──────────────┐
│  • AI Chat      │     │  • Applications DB   │────▶│  SQLite DB   │
│  • Offline mode │     │  • Analytics         │     │  (local)     │
└─────────────────┘     └─────────────────────┘     └──────────────┘
```

---

## Key Features

### 🔍 Real-time Field Validation (Online + Offline)
- **Aadhaar**: 12-digit format, no leading 0/1, Verhoeff checksum
- **IFSC**: `[A-Z]{4}0[A-Z0-9]{6}` pattern, bank identification
- **Mobile**: 10-digit, starts with 6–9
- **Age**: Pension eligibility (≥60), auto-calculated from DOB
- **Pincode**: Rajnandgaon district validation (491xxx range)

### 🤖 Claude AI Integration
- Bilingual responses (English + हिंदी Devanagari)
- District-specific rejection pattern knowledge
- Context-aware (knows current form, field values, service type)
- <100 word responses for time-pressed operators

### 📊 Rejection Pattern Intelligence
Pre-loaded with Rajnandgaon district data:
| Service | Top Cause | Rate |
|---------|-----------|------|
| Old Age Pension | Age proof missing | 43% |
| Old Age Pension | Wrong IFSC | 28% |
| Birth Certificate | Hospital cert missing | 55% |
| Caste Certificate | Wrong form | 38% |
| Income Certificate | Income source proof | 45% |

### ⚡ Offline / Edge Mode
All core validators work without internet:
- Aadhaar format check
- IFSC pattern validation  
- Mobile number check
- Age eligibility inference
- Pincode district check
- Cached AI responses for common queries

### 🌐 6 Government Services
Old Age Pension · Birth Certificate · Caste Certificate · Domicile Certificate · Income Certificate · Land Record (B1)

---

## Quick Start

### Prerequisites
- Node.js 18+
- An Anthropic API key (get one at https://console.anthropic.com)

### 1. Clone & Configure
```bash
# Copy and fill in your API key
cp .env.example .env
# Edit .env and set ANTHROPIC_API_KEY=sk-ant-...
```

### 2. Install & Run Backend
```bash
cd backend
npm install
cp .env.example .env
# Edit .env with your ANTHROPIC_API_KEY
npm start
# API running at http://localhost:5000
```

### 3. Install & Run Frontend
```bash
cd frontend
npm install
npm start
# App running at http://localhost:3000
```

### Using Docker Compose (recommended)
```bash
# From project root, with .env file containing ANTHROPIC_API_KEY
docker-compose up --build
# App at http://localhost:3000
# API at http://localhost:5000
```

---

## API Reference

### POST /api/ai/chat
```json
{ "message": "What documents for age proof?", "serviceType": "pension", "formData": {...} }
→ { "reply": "Age proof alternatives: Birth certificate, School TC..." }
```

### POST /api/validate/aadhaar
```json
{ "value": "1234 5678 9012" }
→ { "valid": true, "formatted": "1234 5678 9012", "message": "Valid Aadhaar format" }
```

### POST /api/validate/ifsc
```json
{ "value": "SBIN0001234" }
→ { "valid": true, "bank": "State Bank of India" }
```

### POST /api/applications
```json
{ "serviceType": "pension", "formData": {...} }
→ { "id": "uuid-..." }
```

### GET /api/analytics/rejection-patterns?serviceType=pension
```json
{ "pension": [{ "reason": "Age proof missing", "percentage": 43 }, ...] }
```

### GET /api/analytics/dashboard
```json
{ "todayApplications": 47, "acceptanceRate": 91, "errorsCaughtToday": 4 }
```

---

## Project Structure

```
csc-copilot/
├── backend/
│   ├── server.js              # Express entry point
│   ├── routes/
│   │   ├── ai.js              # Claude AI chat + analysis
│   │   ├── validate.js        # Field validators (Aadhaar, IFSC, etc.)
│   │   ├── applications.js    # CRUD for applications
│   │   ├── analytics.js       # Rejection patterns, dashboard
│   │   └── services.js        # Service definitions & rules
│   ├── db/
│   │   └── database.js        # SQLite init + seeding
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── App.js             # Root component + state
│   │   ├── components/
│   │   │   ├── Header.js      # Top bar + network status
│   │   │   ├── Sidebar.js     # Service selector + stats
│   │   │   ├── FormPanel.js   # Main form with tabs
│   │   │   ├── AIPanel.js     # AI chat + risk meter
│   │   │   └── tabs/
│   │   │       ├── PersonalTab.js    # Applicant + bank details
│   │   │       ├── AddressTab.js     # Address + pincode
│   │   │       ├── DocumentsTab.js   # Document upload checklist
│   │   │       └── EligibilityTab.js # Eligibility + rejection patterns
│   │   ├── hooks/
│   │   │   ├── useNetworkStatus.js   # Online/offline detection
│   │   │   └── useValidation.js      # Field validation hook
│   │   └── utils/
│   │       ├── api.js                # Axios API client
│   │       └── validators.js         # Offline validators + risk calc
│   └── package.json
├── docker-compose.yml
├── .env.example
└── README.md
```

---

## Field Constraints (District-Specific)

| Field | Rule | Source |
|-------|------|--------|
| Aadhaar | 12 digits, not starting 0 or 1 | UIDAI spec |
| IFSC | `[A-Z]{4}0[A-Z0-9]{6}` | RBI standard |
| Mobile | 10 digits, starts 6–9 | TRAI |
| Pincode | 491441–491559 for Rajnandgaon | India Post |
| Age (pension) | ≥ 60 years | CG Pension Scheme |
| Residency | ≥ 15 years in CG | Domicile Rules 2000 |
| Income (pension) | < ₹1,00,000/year | NSAP guidelines |

---

## Evaluation Criteria Addressed

| Criterion | Implementation |
|-----------|----------------|
| **Impact** | Pre-submission block at >65% risk; real rejection pattern data |
| **Intelligence Depth** | Claude AI with district context; Verhoeff checksum; cross-doc DOB match |
| **Field Realism** | Full offline mode; all validators work on 2G/no internet |
| **UX / Zero learning curve** | Hindi+English everywhere; color-coded fields; risk meter; quick-question chips |

---

## License
Built for PS 01 · AI Co-Pilot for CSC Operators · GovTech Hackathon
