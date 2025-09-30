# School Attendance & Dismissal System

## Overview
This is a school attendance and dismissal queue management system built with:
- **Frontend**: React + TypeScript + Vite + Tailwind CSS
- **Backend**: Encore.dev framework + TypeScript
- **Database**: Supabase (PostgreSQL)
- **Package Manager**: Bun

## Current State
The project has been set up in the Replit environment with:
- ✅ Bun 1.2 installed
- ✅ Encore CLI v1.50.0 installed
- ✅ All dependencies installed
- ✅ Frontend configured to run on port 5000
- ✅ Frontend workflow configured

## Architecture

### Frontend (Port 5000)
- Located in `/frontend` directory
- React app with Vite dev server
- Configured to bind to 0.0.0.0:5000 for Replit proxy
- Uses generated Encore client to communicate with backend API

### Backend (Port 4000 - Not Currently Running)
- Located in `/backend` directory
- Built with Encore.dev framework
- Requires Supabase configuration to run
- API endpoints for:
  - User authentication and management
  - Parent management
  - Student management
  - Queue management (attendance/dismissal)
  - Grade management

## Backend Setup Requirements

The backend requires the following Supabase secrets to be configured:
- `SupabaseUrl`: Your Supabase project URL
- `SupabaseKey`: Your Supabase anon/service key

To run the backend:
1. Set up secrets in Replit (Tools > Secrets)
2. Add `SupabaseUrl` and `SupabaseKey`
3. Run: `cd backend && /home/runner/.encore/bin/encore run --listen=0.0.0.0:4000`

## Project Structure
```
.
├── backend/              # Encore backend services
│   ├── frontend/        # Static frontend serving config
│   ├── user/           # User service
│   ├── parent/         # Parent management
│   ├── student/        # Student management
│   ├── queue/          # Queue management
│   └── grades/         # Grade information
├── frontend/            # React frontend app
│   ├── components/     # React components
│   ├── lib/           # Utilities
│   └── client.ts      # Generated Encore client
└── package.json        # Root workspace config
```

## Development Workflow

### Frontend Development (Current Setup)
The frontend is configured to run independently:
```bash
cd frontend && bun run vite dev
```
This is the active workflow and runs on port 5000.

### Full Stack Development (Requires Supabase)
Once Supabase is configured:
1. Start backend: `cd backend && /home/runner/.encore/bin/encore run --listen=0.0.0.0:4000`
2. Frontend will automatically connect to backend at http://localhost:4000

### Building for Production
```bash
cd backend && bun run build
```
This builds the frontend and places it in `backend/frontend/dist` for serving through Encore.

## User Roles
The system supports multiple user roles:
- **Admin**: Full system access, queue setup, parent/student management
- **Teacher**: Attendance tracking, dismissal management by grade
- **Dispatch**: QR code scanning, dismissal coordination
- **Parent**: View own student information and dismissal status

## Key Features
- User authentication
- Student attendance tracking
- Dismissal queue management
- QR code generation and scanning
- Role-based dashboards
- Real-time status updates

## Notes
- Frontend uses environment variable `VITE_CLIENT_TARGET` to configure backend URL
- Default backend URL: `http://localhost:4000`
- Encore CLI installed at: `/home/runner/.encore/bin/encore`
- The project is a monorepo with workspace support via Bun

## Recent Changes (2025-09-30)
- Initial Replit environment setup
- Installed Bun 1.2 package manager
- Installed Encore CLI v1.50.0
- Configured Vite to bind to 0.0.0.0:5000
- Set up frontend development workflow
- Updated .gitignore for Bun and build artifacts
