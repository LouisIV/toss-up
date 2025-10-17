# Die Tossing Tournament Manager

## Overview

A tournament bracket management system for die tossing competitions with a bold retro digital aesthetic. The application enables users to register teams (two players per team), generate tournament brackets, and track match progression through a visually distinctive duotone interface inspired by arcade tournaments.

The system combines practical tournament management functionality with a playful, high-energy design system featuring thick borders, oversized typography, and retro digital visual elements.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Framework & Build System**
- React 18 with TypeScript for type-safe component development
- Vite as the build tool and development server with hot module replacement
- Wouter for lightweight client-side routing (single-page application)
- Path aliases configured (`@/`, `@shared/`, `@assets/`) for clean imports

**State Management & Data Fetching**
- TanStack Query (React Query) for server state management with infinite stale time
- Custom query client configuration with error handling for unauthorized requests
- Form state managed via React Hook Form with Zod schema validation
- Local component state for UI interactions (dialogs, theme toggle)

### Backend Architecture

**Server Framework**
- Express.js with TypeScript for API endpoints
- ESM module system throughout the codebase
- Custom middleware for request logging and JSON response capture
- Error handling middleware with status code normalization

**API Design**
- RESTful endpoints under `/api` prefix:
  - `GET /api/teams` - Retrieve all teams
  - `POST /api/teams` - Create new team with validation
  - `PUT /api/teams/:id` - Update existing team with validation
  - `DELETE /api/teams/:id` - Remove team by ID
- Request/response validation using Zod schemas
- Standardized error responses with appropriate HTTP status codes
- 404 response for update operations on non-existent teams

**Data Layer Strategy**
- In-memory storage implementation (`MemStorage` class) for development
- Interface-based storage pattern (`IStorage`) enabling future database swap
- UUID generation for team identifiers
- Type-safe data models defined in shared schema

**Development Environment**
- Vite middleware integration for seamless frontend-backend development
- Replit-specific plugins for error overlay and development banners
- Conditional Cartographer integration for Replit environment
- HTML template transformation for server-side rendering setup

### External Dependencies

**Core UI Libraries**
- `@radix-ui/*` - Headless UI primitives (20+ components) for accessible interactions
- `tailwindcss` - Utility-first CSS framework with extensive customization
- `class-variance-authority` - Type-safe variant management for components
- `clsx` & `tailwind-merge` - Conditional className utilities

**Data & Validation**
- `zod` - Runtime type validation and schema definition
- `drizzle-zod` - Integration between Drizzle ORM and Zod schemas
- `@hookform/resolvers` - Zod resolver for React Hook Form

**State & Query Management**
- `@tanstack/react-query` - Asynchronous state management
- `react-hook-form` - Performant form state management

**Database (Configured but Not Active)**
- `drizzle-orm` - Type-safe ORM with PostgreSQL dialect configured
- `@neondatabase/serverless` - Serverless Postgres driver
- `connect-pg-simple` - PostgreSQL session store
- Database schema defined in `shared/schema.ts` with teams table structure
- Drizzle Kit configured for migrations (output to `./migrations`)

**Utility Libraries**
- `date-fns` - Date manipulation and formatting
- `embla-carousel-react` - Carousel/slider functionality
- `nanoid` - Unique ID generation
- `cmdk` - Command menu component
- `lucide-react` - Icon library
- `vaul` - Drawer component

**Development Tools**
- `tsx` - TypeScript execution for development server
- `esbuild` - Fast bundler for production server build
- `@replit/vite-plugin-*` - Replit-specific development enhancements

### Architectural Decisions

**Monorepo Structure with Shared Code**
- Client, server, and shared code colocated in single repository
- Shared schema definitions prevent type drift between frontend/backend
- Path aliases reduce coupling and improve maintainability

**Storage Abstraction Pattern**
- `IStorage` interface allows swapping implementations without changing business logic
- Database schema already defined for future PostgreSQL migration via Drizzle ORM
- Decision rationale: Enables rapid prototyping while maintaining upgrade path

**Component-Driven Development**
- Reusable UI primitives
- Props-based customization for flexibility
- Form component reuse: AddTeamForm serves both create and edit flows via initialValues prop
- Test IDs embedded for automation support (including dynamic IDs for edit/delete buttons)

**Theme System Implementation**
- CSS custom properties for runtime theme switching (light/dark modes)
- LocalStorage persistence for user preference
- Duotone color strategy with distinct palettes per mode
- Manual theme toggle (no system preference detection)

**Tournament Logic Placement**
- Bracket generation happens client-side in Home component
- Match state stored in component state (not persisted)
- Server only handles team CRUD operations
- Trade-off: Simplicity over multi-user real-time collaboration
