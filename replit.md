# FreeCodeHub - Promo Code Sharing Platform

## Overview

FreeCodeHub is a community-driven platform for discovering and sharing free promotional codes, discount codes, and freebies across multiple categories including Discord, Minecraft, gaming, software, shopping, and more. The platform features a clean, Material Design-inspired interface with user code submissions, admin moderation, and category-based browsing.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Technology Stack**
- React with TypeScript for type-safe component development
- Vite as the build tool and development server for fast hot module replacement
- Wouter for lightweight client-side routing (alternative to React Router)
- TailwindCSS for utility-first styling with custom design tokens
- Shadcn UI component library (Radix UI primitives) for accessible, pre-built components

**Design System**
- Material Design principles with inspiration from GitHub, Linear, and Discord
- Custom Tailwind configuration with HSL-based color tokens for light/dark theme support
- Typography: Inter font for UI, JetBrains Mono for code display
- Spacing system using Tailwind units (2, 4, 6, 8) for consistent rhythm
- No glowing effects or heavy animations - focus on clarity and functionality

**State Management**
- TanStack Query (React Query) for server state management, caching, and data fetching
- React hooks (useState, useContext) for local component state
- Custom theme provider for light/dark mode persistence via localStorage

**Key UI Components**
- Navigation bar with category links, search, and submit CTA
- Hero section with statistics and primary actions
- Category grid (3-4 columns responsive) with icons and code counts
- Code display cards with copy functionality, verification badges, and metadata
- Search and filter bar with category/status dropdowns and sorting
- Modal dialogs for code submission with form validation
- Admin panel for code moderation (approve/reject/delete)

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
- Admin endpoints: approve, reject, delete codes (under `/api/admin/codes`)

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
- `codes` table with fields: id, title, code, description, category, status, isVerified, copyCount, submitterName, submitterEmail, createdAt
- Status values: "pending", "approved", "rejected"
- Category validation against predefined category list (10 categories)
- UUID-based primary keys for distributed scalability

**Storage Abstraction**
- `IStorage` interface defining data access methods
- `MemStorage` in-memory implementation for development with seed data
- Designed for easy swap to database implementation in production
- Methods: CRUD operations for codes, category counting, copy count incrementing

**Data Seeding**
- Sample codes across all categories pre-loaded for development
- Includes verified codes with realistic copy counts and timestamps

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
- nanoid for unique ID generation

**Development Tools**
- Drizzle Kit for database migrations and schema management
- ESBuild for server-side bundling in production
- TypeScript for type checking across the entire stack
- Replit-specific plugins for development experience (error overlay, cartographer, dev banner)

**Database & Session**
- @neondatabase/serverless for PostgreSQL connections
- connect-pg-simple for PostgreSQL session storage (configured but not actively used)
- drizzle-zod for generating Zod schemas from Drizzle tables

**Build Strategy**
- Client built with Vite to `dist/public`
- Server bundled with ESBuild to `dist/index.cjs`
- Allowlist of dependencies bundled into server for reduced cold start times
- Static file serving in production from built client assets