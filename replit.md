# Alpha Source - Resource Sharing Platform

## Overview

Alpha Source is a community-driven platform for discovering and sharing free promotional codes, Discord bots, Minecraft addons, server advertisements, and more. The platform features a modern pink/purple themed interface with user submissions, admin moderation, account settings, and category-based browsing.

## User Preferences

Preferred communication style: Simple, everyday language.

## Recent Changes

- Rebranded from FreeCodeHub to Alpha Source
- Implemented pink/purple gradient theme across the application
- Added new categories: Discord Bots, Minecraft Addons, Server Advertisements
- Added account settings page with profile, notifications, and appearance tabs
- Restricted admin page access to users with admin privileges only
- Enhanced code cards with advanced view UI including detail modal
- Updated submit modal with new resource types
- **November 2025: Major feature update**
  - Separated login and signup into dedicated pages (/login and /signup)
  - Added advertisements/listings system with full CRUD operations
  - Created advanced submit page with dual submission types (codes vs listings)
  - Implemented user tags system for profile badges (admin, verified, contributor, etc.)
  - Extended admin dashboard to manage both codes and advertisements
  - Added user profile viewing page (/user/:id)
  - Added "No codes found" and "No listings found" empty states throughout the app

## System Architecture

### Frontend Architecture

**Technology Stack**
- React with TypeScript for type-safe component development
- Vite as the build tool and development server for fast hot module replacement
- Wouter for lightweight client-side routing (alternative to React Router)
- TailwindCSS for utility-first styling with custom design tokens
- Shadcn UI component library (Radix UI primitives) for accessible, pre-built components

**Design System**
- Pink/purple gradient theme with modern aesthetic
- Custom Tailwind configuration with HSL-based color tokens for light/dark theme support
- Typography: Inter font for UI, JetBrains Mono for code display
- Gradient accents on primary buttons and branding elements
- Focus on clarity and functionality

**State Management**
- TanStack Query (React Query) for server state management, caching, and data fetching
- React hooks (useState, useContext) for local component state
- Custom theme provider for light/dark mode persistence via localStorage

**Key UI Components**
- Navigation bar with category links, search, user menu with settings link, and submit CTA
- Hero section with statistics and gradient primary actions
- Category grid (responsive) with icons and code counts
- Advanced code display cards with copy functionality, detail view modal, and metadata
- Search and filter bar with category/status dropdowns and sorting
- Modal dialogs for code submission with form validation
- Account settings page with profile, notifications, and appearance tabs
- Admin panel for code moderation (approve/reject/delete) - restricted to admin users

**Pages**
- Home: Hero section, category grid, latest codes
- Browse: All approved codes with search and filtering
- Category: Codes filtered by category
- Login: Dedicated login page with Google OAuth and email/password options
- Signup: Dedicated signup page with email/password registration
- Submit: Advanced submission page with code/advertisement type selection
- Profile: User's submitted codes and stats
- User Profile: View other users' profiles with their tags
- Favorites: User's saved codes
- Settings: Account settings with profile, notifications, appearance
- Admin: Code and advertisement moderation dashboard (admin-only)

### Backend Architecture

**Technology Stack**
- Express.js as the HTTP server framework
- Node.js runtime with ES modules
- HTTP server created via Node's `http` module for WebSocket compatibility

**API Design**
- RESTful API endpoints under `/api` prefix
- JSON request/response format
- Middleware for request logging with timestamps and duration tracking
- Static file serving for production build

**Key API Endpoints**
- `GET /api/codes` - Fetch all approved codes with category counts
- `GET /api/codes/:id` - Fetch single code by ID
- `GET /api/codes/category/:category` - Fetch codes filtered by category
- `POST /api/codes/submit` - Submit new code for moderation
- `POST /api/codes/:id/copy` - Increment copy counter
- `GET /api/advertisements` - Fetch all approved advertisements
- `GET /api/advertisements/:id` - Fetch single advertisement by ID
- `POST /api/advertisements/submit` - Submit new listing for moderation
- `POST /api/advertisements/:id/view` - Increment view counter
- Admin endpoints: approve, reject, verify, delete codes (under `/api/admin/codes`)
- Admin endpoints: approve, reject, verify, delete ads (under `/api/admin/advertisements`)
- Admin endpoints: update user tags (under `/api/admin/users/:id/tags`)
- User endpoints: favorites, user codes, user advertisements (under `/api/user/`)

**Data Validation**
- Zod schema validation for all incoming data
- Type-safe schema definitions shared between client and server
- Custom submit schema with field length limits and format validation

### Data Storage

**Database**
- PostgreSQL as the primary database (configured via Drizzle ORM)
- Neon serverless PostgreSQL driver for connection pooling
- Schema defined in TypeScript using Drizzle's table builders

**Schema Design**
- `codes` table with fields: id, title, code, description, category, status, isVerified, copyCount, submitterId, submitterName, submitterEmail, createdAt
- `users` table with fields: id, email, firstName, lastName, profileImageUrl, bio, isAdmin, tags (array), createdAt, updatedAt
- `advertisements` table with fields: id, title, description, category, inviteLink, imageUrl, status, isVerified, viewCount, submitterId, submitterName, submitterEmail, createdAt
- `favorites` table for user saved codes
- `ratings` table for code upvotes/downvotes
- `reports` table for flagging problematic codes
- User tags: admin, moderator, verified, vip, contributor, developer (with color coding)
- Status values: "pending", "approved", "rejected"
- Category validation against predefined category list (13 categories for codes, separate advertising categories)
- UUID-based primary keys for distributed scalability

**Categories**
- Discord, Discord Bots, Minecraft, Minecraft Addons, Server Ads, Websites, Gaming, Software, Shopping, Education, Tools, Streaming, Crypto

**Storage Abstraction**
- `IStorage` interface defining data access methods
- `DatabaseStorage` implementation for PostgreSQL
- Methods: CRUD operations for codes, category counting, copy count incrementing, favorites, ratings, reports

### External Dependencies

**UI Component Libraries**
- Radix UI primitives (dialogs, dropdowns, tooltips, tabs, etc.) for accessible headless components
- Embla Carousel for touch-friendly carousels
- Lucide React for consistent icon set
- CMDK for command palette functionality

**Form Management**
- React Hook Form for performant form state management
- Hookform Resolvers for integrating Zod validation schemas

**Utility Libraries**
- Class Variance Authority (CVA) for component variant management
- clsx and tailwind-merge for conditional className composition
- date-fns for date formatting and manipulation

**Development Tools**
- Drizzle Kit for database migrations and schema management
- ESBuild for server-side bundling in production
- TypeScript for type checking across the entire stack
- Replit-specific plugins for development experience (error overlay, cartographer, dev banner)

**Database & Session**
- @neondatabase/serverless for PostgreSQL connections
- connect-pg-simple for PostgreSQL session storage
- drizzle-zod for generating Zod schemas from Drizzle tables

**Build Strategy**
- Client built with Vite to `dist/public`
- Server bundled with ESBuild to `dist/index.cjs`
- Allowlist of dependencies bundled into server for reduced cold start times
- Static file serving in production from built client assets
