# Zelosify — Vendor–Hiring Manager Contract Management Module

> Production-Grade Multi-Tenant AI-Assisted Hiring Platform

## Overview
A full-stack hiring platform supporting two personas (IT Vendor and Hiring Manager) with an LLM-powered recommendation agent, strict RBAC, tenant isolation, and deterministic scoring.

## Architecture
- **Backend**: Node.js + Express + Prisma + PostgreSQL + Keycloak
- **Frontend**: Next.js 15 + Redux Toolkit + Tailwind CSS
- **AI Agent**: Groq Llama3 with tool-calling (Resume Parsing → Skill Normalization → Deterministic Scoring)
- **Storage**: AWS S3 with presigned URLs
- **Auth**: Keycloak (RS256 JWT, realm roles)

## Key Features
### IT Vendor
- View paginated, tenant-filtered contract openings
- Upload candidate profiles (PDF/PPTX) via presigned S3 URLs
- Soft delete profiles
- Automatic AI recommendation triggered on submission

### Hiring Manager
- View own openings with profile counts
- See AI recommendation per profile (score, confidence, reason, latency)
- Shortlist or reject candidates with full audit trail

### AI Recommendation Agent
- Real LLM tool-calling agent (not a simple LLM wrapper)
- Tools: Resume Parser → Skill Normalizer → Deterministic Scoring Engine
- Final Score = 0.5×skill + 0.3×experience + 0.2×location
- Decision: ≥0.75 Recommended, 0.5–0.74 Borderline, <0.5 Not Recommended
- Retry logic, token usage logging, prompt injection mitigation
- Async non-blocking execution, latency stored in DB

## Setup Instructions
### Prerequisites
- Node.js v22+
- Docker Desktop

### Backend
\`\`\`bash
cd Server
cp .env.example .env  # fill in values
docker compose up -d
npm install
npm run prisma:migrate
npm run prisma:generate
npx tsx src/scripts/seedOpenings.ts
npm run dev
\`\`\`

### Frontend
\`\`\`bash
cd Frontend
cp .env.example .env.local  # fill in values
npm install
npm run dev
\`\`\`

### Keycloak Setup
1. Go to http://localhost:8080
2. Create realm: `Zelosify`
3. Create client: `dynamic-client` (confidential, direct access grants)
4. Create roles: `IT_VENDOR`, `HIRING_MANAGER`, `BUSINESS_USER`, `VENDOR_MANAGER`
5. Set token lifespan: 6 hours

## API Endpoints
### IT Vendor
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/v1/vendor/openings | List openings (paginated) |
| GET | /api/v1/vendor/openings/:id | Opening details |
| POST | /api/v1/vendor/openings/:id/profiles/presign | Get S3 upload URLs |
| POST | /api/v1/vendor/openings/:id/profiles/upload | Submit profiles |
| DELETE | /api/v1/vendor/profiles/:id | Soft delete profile |

### Hiring Manager
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/v1/hiring-manager/openings | Own openings |
| GET | /api/v1/hiring-manager/openings/:id/profiles | Profiles with AI data |
| POST | /api/v1/hiring-manager/profiles/:id/shortlist | Shortlist |
| POST | /api/v1/hiring-manager/profiles/:id/reject | Reject |

## Testing
\`\`\`bash
npm test  # 32 tests passing
\`\`\`
- Scoring engine boundary tests
- RBAC & tenant isolation tests  
- Integration pipeline tests (Extract → Normalize → Score → Recommend)

## Security
- API-level RBAC (no bypassable endpoints)
- Tenant-based query filtering
- Prompt injection mitigation on resume content
- No direct S3 access from frontend
- RS256 JWT verification via JWKS

## Performance
- Max processing time per profile: ~3000ms
- Async non-blocking recommendation
- User-facing APIs < 200ms
- Latency stored per recommendation in DB
