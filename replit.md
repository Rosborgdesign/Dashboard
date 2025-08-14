# InfoScreen Dashboard (MVP)

## Overview

This is a passive dashboard web application designed for wall/secondary screen displays. It presents four simultaneous modules: a rotating moodboard (70% height), a clock overlay, a Google Calendar grid, and Stockholm public transport departures (30% height). The system uses a cloud backend with Raspberry Pi/PC display clients and includes a password-protected admin panel for configuration.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

The application follows a full-stack architecture with clear separation between client and server:

- **Frontend**: React with TypeScript, using Vite as the build tool
- **Backend**: Express.js server with TypeScript
- **Database**: PostgreSQL with Drizzle ORM
- **UI Framework**: shadcn/ui components with Tailwind CSS
- **State Management**: TanStack Query for server state
- **Routing**: Wouter for client-side routing

## Key Components

### Frontend Architecture
- **Component Structure**: Modular React components for each dashboard module (Moodboard, Clock, Calendar, Transport)
- **Styling**: Tailwind CSS with custom CSS variables for theming
- **UI Components**: Complete shadcn/ui component library for consistent design
- **State Management**: React Query for API data fetching and caching
- **Responsive Design**: Optimized for full-screen display with overlay positioning

### Backend Architecture
- **API Routes**: RESTful endpoints for authentication and configuration management
- **Storage Layer**: Abstract storage interface with in-memory implementation (ready for database integration)
- **Authentication**: bcrypt-based password hashing for admin access
- **Data Models**: Structured schemas for users, dashboard config, and image frequency tracking

### Database Schema
- **Users Table**: Authentication data (id, username, password)
- **Dashboard Config**: JSON-based configuration storage for all modules
- **Image Frequency**: Tracking system for moodboard image display limits

## Data Flow

1. **Dashboard Display**: Client fetches configuration and data from multiple endpoints
2. **Real-time Updates**: Automatic refresh intervals for each module (2-20 minutes)
3. **Admin Panel**: Secure configuration updates with real-time dashboard refresh
4. **Image Rotation**: Algorithm handles frequency limits and random selection

### Refresh Intervals
- **Moodboard**: 10 minutes for image list
- **Transport**: 2 minutes (120 seconds) for real-time data
- **Calendar**: 20 minutes for event updates
- **Configuration**: 5 minutes for settings changes

## External Dependencies

### Third-party Services
- **Google Drive API**: Moodboard image source integration
- **Google Calendar API**: OAuth-based calendar data access
- **SL RealTime 4 API**: Stockholm public transport data (Trafiklab)
- **Neon Database**: PostgreSQL hosting service

### Key Libraries
- **Database**: Drizzle ORM with PostgreSQL driver
- **UI**: Radix UI primitives via shadcn/ui
- **Authentication**: bcrypt for password security
- **HTTP Client**: Native fetch with TanStack Query wrapper
- **Development**: Vite with React plugin and Replit integration

## Deployment Strategy

The application is designed for cloud deployment with the following considerations:

1. **Production Build**: 
   - Frontend builds to static files via Vite
   - Backend bundles with esbuild for Node.js execution
   - Environment-specific configuration via `.env` files

2. **Database Setup**:
   - Drizzle migrations handle schema updates
   - PostgreSQL connection via DATABASE_URL environment variable
   - Ready for Neon or other PostgreSQL providers

3. **Display Client Setup**:
   - Raspberry Pi/PC loads hosted site in full-screen mode
   - Admin access via Ctrl+Alt+A keyboard shortcut
   - Optimized for passive display with minimal interaction

4. **Configuration Management**:
   - All settings stored in database for persistence
   - Default values ensure system works out-of-the-box
   - Hot-reloading of configuration changes

The architecture supports both development and production environments with appropriate build processes and serves as a foundation for the complete InfoScreen Dashboard implementation.

## Recent Changes: Latest modifications with dates

### July 22, 2025
- ✅ **iCal Integration Complete**: Successfully implemented full iCal file upload and parsing functionality
- ✅ **Calendar Events Working**: Real calendar events now display correctly from uploaded .ics files  
- ✅ **Date Synchronization Fixed**: Resolved date matching issues between calendar view and iCal events
- ✅ **ICAL.js Library**: Fully integrated ICAL.js for robust calendar file parsing
- ✅ **Admin Panel Enhancement**: iCal file upload replaces Google Calendar API dependency

### July 23, 2025
- ✅ **Database Migration**: Migrated from in-memory storage to PostgreSQL for persistent data
- ✅ **Calendar Persistence**: Calendar configurations now persist across page reloads and server restarts
- ✅ **Month Display Fix**: Fixed JavaScript month indexing issue causing events to appear in wrong month
- ✅ **Compact Calendar**: Removed empty month cells and unnecessary whitespace for cleaner display
- ✅ **UI Refinements**: Removed refresh button, optimized calendar size to 400px width