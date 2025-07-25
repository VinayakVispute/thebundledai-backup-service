# TheBundledAI Backup Service

A comprehensive MongoDB backup and restore service with real-time monitoring, automated scheduling, and Google Drive integration.

## Overview

This application provides automated and manual backup solutions for MongoDB databases with a modern web dashboard for monitoring and management. It features scheduled backups, real-time logging, analytics, and secure authentication.

## Features

### Core Functionality
- **Automated Scheduled Backups** - Daily cron jobs for production and development databases
- **Manual Backup Triggers** - On-demand backup execution through web interface
- **Database Restoration** - Restore from local files or Google Drive backups
- **Real-time Monitoring** - Live logs and status updates via WebSocket connections
- **Analytics Dashboard** - Backup history, success rates, and performance metrics

### Storage & Integration
- **Google Drive Integration** - Automatic upload and organized folder structure
- **Local File Management** - Temporary backup storage with automatic cleanup
- **Database Support** - MongoDB backup and restore operations
- **Redis Logging** - Structured logging with stream-based real-time updates

### Security & Authentication
- **Clerk Authentication** - Secure user authentication and session management
- **API Protection** - Protected routes with authentication middleware
- **Environment Isolation** - Separate production and development configurations

## Tech Stack

### Backend (Server)
- **Runtime**: Node.js with TypeScript
- **Framework**: Express.js
- **Database**: MongoDB (via mongodump/mongorestore)
- **ORM**: Prisma
- **Authentication**: Clerk Express
- **Real-time**: Socket.io
- **Scheduling**: node-cron
- **Storage**: Google Drive API
- **Logging**: Winston with Redis streams
- **File Processing**: Archiver, Unzipper

### Frontend (Client)
- **Framework**: Next.js 15 with React 19
- **Styling**: Tailwind CSS
- **UI Components**: Radix UI primitives
- **Charts**: Recharts
- **Authentication**: Clerk Next.js
- **HTTP Client**: Axios
- **Real-time**: Socket.io Client
- **Theming**: next-themes

### Development Tools
- **Package Manager**: pnpm
- **Build Tools**: TypeScript, tsc-watch
- **Linting**: ESLint
- **Database**: Prisma migrations

## Project Structure

```
thebundledai-backup-service/
├── client/                    # Next.js frontend application
│   ├── app/                  # App router pages and API routes
│   ├── components/           # React components and UI elements
│   │   └── ui/              # Reusable UI components
│   ├── hooks/               # Custom React hooks
│   ├── lib/                 # Utility functions and configurations
│   ├── prisma/              # Client-side Prisma schema
│   └── public/              # Static assets
├── server/                   # Express.js backend service
│   ├── src/
│   │   ├── controller/      # API controllers
│   │   ├── env/             # Environment configuration
│   │   ├── prisma/          # Database schema and migrations
│   │   ├── routes/          # Express routes
│   │   ├── services/        # Database and external service connections
│   │   └── utils/           # Backup, restore, and utility functions
│   ├── config.json          # Google Drive service account config
│   ├── dist/                # Compiled TypeScript output
│   └── logs/                # Application log files
└── README.md
```

## Getting Started

### Prerequisites
- Node.js 18+
- pnpm package manager
- MongoDB instance
- Google Drive API credentials
- Redis server
- Clerk authentication setup

### Installation

1. Clone the repository
2. Install dependencies for both client and server:
   ```bash
   cd client && pnpm install
   cd ../server && pnpm install
   ```

3. Configure environment variables for both applications
4. Set up Prisma database:
   ```bash
   cd server && pnpm run prebuild
   ```

### Development

Start both applications in development mode:

**Server:**
```bash
cd server && pnpm run dev
```

**Client:**
```bash
cd client && pnpm run dev
```

### Production Build

**Server:**
```bash
cd server && pnpm run build && pnpm start
```

**Client:**
```bash
cd client && pnpm run build && pnpm start
```

## Configuration

The application requires environment variables for:
- MongoDB connection strings (production/development)
- Google Drive API credentials
- Clerk authentication keys
- Redis connection details
- Backup service configuration

