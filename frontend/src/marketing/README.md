# BEA Marketing — AI-Powered Social Media Content System

A multi-agent AI marketing module built into Lab Bee React, enabling automated social media content generation, trending topic research, and (planned) direct publishing to social platforms.

---

## Current Status

| Area | Status |
|---|---|
| Backend agents (LinkedIn, X, Facebook, Instagram, Blog) | Done |
| Agent orchestrator | Done |
| Trending topics agent (with web search) | Done |
| API endpoints (postTopic, findTrendingTopic) | Done |
| Dashboard shell with tabs (Create Content, History) | In Progress |
| Trending topics UI chips | In Progress |
| Platform content cards (per platform) | In Progress |
| Content History tab | Pending |
| Direct publishing to platforms | Planned |

---

## Architecture

```
frontend/src/marketing/
├── smc_dashboard.jsx          # Main dashboard shell — header + top-level tabs
│                               # Tab 1: Create Content, Tab 2: Content History
├── createContentTab.jsx        # Topic input, Generate/Clear, platform result tabs
├── trendingTopics.jsx          # Trending topics chip list (AI researched daily)
├── contentHistoryTab.jsx       # Table of previously saved/approved content
└── platforms/
    ├── PlatformCard.jsx        # Reusable card component for all platforms
    ├── linkedIn.jsx            # LinkedIn content card
    ├── facebook.jsx            # Facebook content card
    ├── instagram.jsx           # Instagram content card
    ├── x.jsx                   # X/Twitter content card
    └── websiteBlog.jsx         # Website blog content card

Backend/BEA_Marketing/
├── agentOrchestrator.mjs       # Routes tasks to agents, exports generateAllContent + findTrendingTopics
├── beaMarketingContentsAPI.js  # Express routes: POST /api/postTopic, POST /api/findTrendingTopic
└── agents/
    ├── linkedInAgent.mjs       # LinkedIn professional content writer agent
    ├── xAgent.mjs              # X/Twitter short-form content agent
    ├── facebookAgent.mjs       # Facebook community content agent
    ├── instagramAgent.mjs      # Instagram visual content agent
    ├── websiteBlogAgent.mjs    # Website blog long-form content agent
    └── trendingTopicsAgent.mjs # Web-search agent — finds daily trending topics
```

---

## API Endpoints

### `POST /api/postTopic`
Generates content for all 5 platforms based on a given topic.

**Request:**
```json
{ "data": "topic string" }
```

**Response:**
```json
{
  "linkedin": "...",
  "x": "...",
  "facebook": "...",
  "instagram": "...",
  "websiteBlog": "..."
}
```

### `POST /api/findTrendingTopic`
Triggers the trending topics agent to research and return today's trending topics across key industries.

**Response:**
```json
[
  { "topic": "EV Battery Degradation Standards", "industry": "Automotive" },
  { "topic": "AI in Predictive Maintenance", "industry": "Reliability Engineering" }
]
```

---

## Environment Variables

Add these to `Backend/.env.development` and `Backend/.env.production`:

```env
# OpenAI API Key — required for all AI agents
OPENAI_API_KEY='your-openai-api-key-here'
```

---

## Agent Details

| Agent | File | Model SDK | Purpose |
|---|---|---|---|
| LinkedIn Writer | `linkedInAgent.mjs` | `@openai/agents` | SEO-friendly professional posts (~250 chars) |
| X Writer | `xAgent.mjs` | `@openai/agents` | Short punchy tweets |
| Facebook Writer | `facebookAgent.mjs` | `@openai/agents` | Community-engaging posts (~300 chars) |
| Instagram Writer | `instagramAgent.mjs` | `@openai/agents` | Visual-first captions with hashtags |
| Website Blog Writer | `websiteBlogAgent.mjs` | `@openai/agents` | Long-form SEO blog articles |
| Trending Topics | `trendingTopicsAgent.mjs` | `@openai/agents` + `webSearchTool` | Daily web research across industries |

**Industries tracked by Trending Topics Agent:**
Reliability Engineering, Railway, Aerospace, Defense, Automotive, EV, Consumer Electronics, Oil & Gas, Robotics

---

## Frontend Flow

```
smc_dashboard.jsx
 ├── Header: "BE Analytic Social Media Content Dashboard" + AI Powered badge
 └── Top-level Tabs
      ├── Tab 1: Create Content (createContentTab.jsx)
      │    ├── TrendingTopicsList — chip list, click to auto-fill topic
      │    ├── Topic input + Generate + Clear buttons
      │    ├── "Generated Content" header + "5 Platforms" badge
      │    └── Platform Tabs: LinkedIn | Facebook | Instagram | X/Twitter | Website Blog
      │         └── PlatformCard — shows generated content per platform
      │
      └── Tab 2: Content History (contentHistoryTab.jsx) [Pending]
           └── Table: Topic | Platform | Date | Status | Actions
```

---

## Roadmap

### Phase 1 — Content Generation (Current)
- [x] AI agents for all 5 platforms
- [x] Trending topics research agent
- [x] Dashboard shell with platform tabs
- [ ] Save/Approve button on each platform card
- [ ] Content History tab with DB storage

### Phase 2 — Content History & Awareness
- [ ] MySQL table: `bea_marketing_content` (topic, platform, content, status, created_at)
- [ ] GET endpoint to fetch history
- [ ] Pass history context to agents (avoid repeating topics)
- [ ] Filter/search in history table

### Phase 3 — Direct Publishing
- [ ] LinkedIn Pages API integration
- [ ] Facebook Graph API integration
- [ ] Instagram Graph API (via Facebook)
- [ ] X API v2 integration (note: paid tier required)
- [ ] OAuth 2.0 flow — "Connect Account" settings page
- [ ] Store access tokens per user in DB
- [ ] "Publish Now" button on each platform card
- [ ] "Schedule" button with datetime picker

### Phase 4 — Advanced Agents (inspired by full AI marketing team concept)
- [ ] Market Research Agent — deep competitor and industry analysis
- [ ] Campaign Strategist Agent — plans multi-week content calendars
- [ ] Data Analysis Agent — engagement metrics and insights dashboard
- [ ] Creative Designer Agent — generates visuals via image APIs (Canva MCP / DALL-E)
- [ ] Agent-to-agent communication — research feeds into content generation

### Phase 5 — Microservice Architecture (Future)
- Extract BEA Marketing into a **separate repository** (`bea-marketing-service`)
- Runs as an independent Node.js service on a dedicated port
- Lab Bee React calls it via HTTP — clean separation of concerns
- Reusable across other BE Analytic products

---

## Notes

- `trendingTopicsAgent.mjs` uses `webSearchTool` — requires the `tools` property to be an **array**: `tools: [webSearchTool()]`
- Agent responses may include markdown fences (` ```json ``` `) — the orchestrator strips these before parsing
- `activeTab` in `createContentTab.jsx` must be initialized to `0` (not `""`) for the first platform tab to show by default
- All `.env` files are gitignored — never commit API keys

---

## Key Files Outside This Folder

| File | Purpose |
|---|---|
| `Backend/BEA_Marketing/` | All backend agent and API files |
| `Backend/.env.development` | Local environment variables incl. `OPENAI_API_KEY` |
| `frontend/src/App.js` | Marketing route: `/marketing` → `smc_dashboard.jsx` |
| `frontend/src/components/sidenavbar.js` | Marketing nav link |