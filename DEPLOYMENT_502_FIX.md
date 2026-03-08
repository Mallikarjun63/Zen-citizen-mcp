# MCP Server Deployment Troubleshooting Guide

## 502 Bad Gateway Error - Root Cause Analysis

### Problem
The deployed MCP server at `https://70qwsysdwu49.deploy.mcp-use.com/` returns a **502 Bad Gateway** error.

### Root Causes Identified & Fixed

#### 1. ✅ BaseURL Mismatch (FIXED - Commit 2d1e3ab)
- **Issue**: Server was configured to use `http://localhost:3000` instead of the deployed domain
- **Fix**: Updated [index.ts](./index.ts#L10) to use `https://70qwsysdwu49.deploy.mcp-use.com`
- **Status**: ✅ PUSHED to `origin/main`

#### 2. ✅ ESM Module Resolution Issues (FIXED - Commit abc83ec)
- **Issue**: Production build failed due to Node.js ESM requiring explicit `.js` extensions in relative imports
- **Fixes Applied**:
  - Changed [tsconfig.json](./tsconfig.json) to use `"module": "Node16"` and `"moduleResolution": "node16"`
  - Added explicit `.js` extensions to all relative imports in:
    - [index.ts](./index.ts)
    - [api.ts](./api.ts)  
    - [resources/research-agent/orchestrator.ts](./resources/research-agent/orchestrator.ts)
    - [resources/research-agent/classifier.ts](./resources/research-agent/classifier.ts)
    - [resources/research-agent/services-db.ts](./resources/research-agent/services-db.ts)
    - All React component files in [resources/product-search-result/](./resources/product-search-result/)
    - All widget files in [resources/api-results/](./resources/api-results/)
- **Status**: ⏳ NOT YET PUSHED to `origin/main` (local only)
- **Local Verification**: ✅ `npm run start` succeeds locally

#### 3. ⚠️ Missing Environment Variables
- **Issue**: Deployed server may not have API keys configured
- **Solution**: Set these environment variables in your deployment platform:
  ```
  YOUTUBE_API_KEY=AIzaSyC5WjG8-dZpJqlKkGZFT4PQhR06Sav6HJA
  TWITTER_BEARER_TOKEN=AAAAAAAAAAAAAAAAAAAAAKPt7gEAAAAASSnBnzKtim%2BAEJSYkFyilILDfLA%3Dd47jFpBCu1LqiXvDvcbg5jt7WimZs9AFh0cuc9CcnoMcTprh1p
  MCP_URL=https://70qwsysdwu49.deploy.mcp-use.com
  ```

### Deployment Architecture

```
Local Development                 Production Deployment
┌─────────────────────┐          ┌────────────────────────────┐
│ npm run dev         │          │ 70qwsysdwu49.deploy.mcp-use.com
│ - HMR enabled       │          │ - Built from GitHub main   │
│ - Port 3000         │          │ - Environment variables    │
│ - All tools work    │          │ - Scaled infrastructure    │
└─────────────────────┘          └────────────────────────────┘
        │                                    │
        │ Commit & Push                      │
        └──────────────────────────────────> GitHub
                                             │
                                             │ npm run deploy
                                             │ (automatic redeploy)
```

## Verification Steps

### 1. Local Production Build (✅ Working)
```bash
npm run build
npm run start
# Server runs successfully on http://localhost:3000
# All 6 tools available
# MCP endpoint responds at http://localhost:3000/mcp
```

### 2. Deployment Status (❌ 502 Error - Fix Required)
```bash
# Currently timing out - fixes need to be deployed
curl https://70qwsysdwu49.deploy.mcp-use.com/
# Expected: 200 OK HTML response or 502 error during initialization
```

## Next Steps to Fix

### Option 1: Push ESM Fixes via SSH (Requires SSH passphrase)
```bash
cd /Users/mohan/Documents/4GoodAi/Zen_citizen/MCP_server/Zen-Citizen

# Add your SSH key to the agent
ssh-add ~/.ssh/id_ed25519_itismohan08
# Enter passphrase when prompted

# Push the fixes
git push origin main

# Then redeploy
npm run deploy
```

### Option 2: Deploy with Environment Variables (Current Approach)
```bash
npm run deploy -- \
  --env YOUTUBE_API_KEY="AIzaSyC5WjG8-dZpJqlKkGZFT4PQhR06Sav6HJA" \
  --env "TWITTER_BEARER_TOKEN=AAAAAAAAAAAAAAAAAAAAAKPt7gEAAAAASSnBnzKtim%2BAEJSYkFyilILDfLA%3Dd47jFpBCu1LqiXvDvcbg5jt7WimZs9AFh0cuc9CcnoMcTprh1p"
```

### Option 3: Manual GitHub Web Push
1. Go to https://github.com/itismohan08/Zen-Citizen-mcp-server
2. Upload the changes manually through GitHub's web interface
3. Wait for automatic redeployment

## Key Changes Made

### TypeScript Configuration
```jsonc
{
  "compilerOptions": {
    "module": "Node16",  // Changed from ESNext
    "moduleResolution": "node16"  // Changed from bundler
  },
  "include": ["index.ts", "api.ts", ...]  // Added api.ts
}
```

### Import Statements (Before → After)
```typescript
// BEFORE (fails in production)
import { researchGovernmentQuery } from "./api";

// AFTER (works in production)
import { researchGovernmentQuery } from "./api.js";
```

## Testing Commands

```bash
# Local development
npm run dev
# Visit http://localhost:3000/inspector

# Production build locally
npm run build
npm run start
# Visit http://localhost:3000

# Check production build
curl http://localhost:3000/mcp

# Test specific tool
curl -X POST http://localhost:3000/mcp \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc": "2.0", "id": 1, "method": "tools/list"}'
```

## Common Issues

### Issue: 502 Bad Gateway
**Cause**: Deployment hasn't applied the ESM module resolution fixes
**Solution**: Push the abc83ec commit to GitHub and redeploy

### Issue: MCP Initialization Timeout  
**Cause**: Missing YOUTUBE_API_KEY or TWITTER_BEARER_TOKEN environment variables
**Solution**: Set environment variables during deployment or in `.env` file

### Issue: Module Not Found Errors
**Cause**: Missing `.js` extensions in relative imports for Node.js ESM
**Solution**: Ensure all TypeScript files use explicit `.js` extensions (already fixed in abc83ec commit)

## Git Status

```
Current: abc83ec (local main)
├── Fix ESM module resolution... (NOT PUSHED)
├── Update deployment documentation... (NOT PUSHED)
└── a74ccb0 (origin/main @ 2d1e3ab - baseUrl fix PUSHED)
```

## Next Deployment

Once commits are pushed to `origin/main`:
```bash
npm run deploy -- --env YOUTUBE_API_KEY="..." --env TWITTER_BEARER_TOKEN="..."
```

The platform will:
1. Fetch latest code from GitHub
2. Build the project
3. Run TypeScript compilation with node16 resolution
4. Start the server with environment variables
5. Deploy to https://70qwsysdwu49.deploy.mcp-use.com
