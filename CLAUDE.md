# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

ShipAny Template One is a full-stack AI SaaS boilerplate built with Next.js 15, featuring AI icon generation capabilities through Freepik API, user authentication, subscription management, and multi-language support. This is a production-ready template for building AI startups quickly.

## Core Technologies & Architecture

- **Frontend**: Next.js 15 with React 19, TypeScript, Tailwind CSS
- **Database**: PostgreSQL with Drizzle ORM
- **Authentication**: NextAuth.js v5 with Google/GitHub OAuth and Google One Tap
- **AI Integration**: Custom AI SDK wrapper for Kling video generation, supports multiple AI providers
- **Payments**: Stripe integration with subscription management
- **Internationalization**: next-intl with English/Chinese support
- **UI Components**: Radix UI + shadcn/ui components
- **Styling**: Tailwind CSS with theme customization

## Development Commands

### Essential Commands
```bash
# Install dependencies
pnpm install

# Development server with Turbopack
pnpm dev

# Production build
pnpm build

# Start production server
pnpm start

# Linting
pnpm lint
```

### Database Commands
```bash
# Generate migration files
pnpm db:generate

# Run migrations
pnpm db:migrate

# Open Drizzle Studio
pnpm db:studio

# Push schema changes directly (dev only)
pnpm db:push
```

### Other Commands
```bash
# Bundle analysis
pnpm analyze

# Docker build
pnpm docker:build
```

## Key Architecture Patterns

### Database Schema
- Uses Drizzle ORM with PostgreSQL
- Main entities: users, orders, credits, apikeys, posts, affiliates, feedbacks
- Schema located in `src/db/schema.ts`
- Migrations in `src/db/migrations/`

### Authentication System
- NextAuth.js v5 configuration in `src/auth/config.ts`
- Supports multiple providers (Google, GitHub, Google One Tap)
- Custom user handling in `src/auth/handler.ts`
- Session management integrated with database user records

### AI SDK Integration
- Custom AI SDK wrapper in `src/aisdk/`
- Kling AI provider for video generation in `src/aisdk/kling/`
- Extensible provider pattern for adding new AI services
- Video generation API endpoints in `src/app/api/demo/`

### Internationalization
- Configured with next-intl
- Locale files in `src/i18n/messages/`
- Page-specific translations in `src/i18n/pages/`
- Route handling in `src/i18n/routing.ts`

### Component Structure
- Blocks: Large UI sections in `src/components/blocks/`
- UI: Reusable components in `src/components/ui/` (shadcn/ui)
- Dashboard/Console: Admin and user panel components
- Theme: Dark/light mode toggle support

### Payment & Credits System
- Stripe integration for subscriptions and one-time payments
- Credit-based usage tracking in `credits` table
- Order management with subscription support
- Affiliate program integration

## Environment Configuration

Environment variables are defined in `.env.example`. Key categories:
- Web configuration (URL, project name)
- Database (DATABASE_URL)
- NextAuth (AUTH_SECRET, provider keys)
- Analytics (Google Analytics, OpenPanel, Plausible)
- Payments (Stripe keys)
- Storage (AWS S3 compatible)
- AI providers (configured per provider)

## File Structure Conventions

- `src/app/` - Next.js App Router with locale-based routing
- `src/components/` - Reusable React components
- `src/lib/` - Utility functions and helpers
- `src/services/` - Business logic and data access layer
- `src/types/` - TypeScript type definitions
- `src/hooks/` - Custom React hooks
- `src/models/` - Database model interfaces

## Testing & Quality

- Use `pnpm lint` to check code quality
- TypeScript strict mode enabled
- ESLint configuration with Next.js rules
- Always run linting before committing changes

## Deployment

- Primary deployment target: Vercel
- Alternative: Cloudflare (use `cloudflare` branch)
- Docker support available
- Standalone build output configured

## Development Conventions

- Use TypeScript for all new code with strict type safety
- Follow React best practices, prefer functional components
- Component names use PascalCase, file names use kebab-case
- Use Tailwind CSS for styling, avoid custom CSS when possible
- Use shadcn/ui components over custom implementations
- Implement responsive design patterns
- Use sonner for toast notifications
- Use React Context for state management (avoid prop drilling)
- Keep components modular and reusable

## Important File Patterns

- Environment files: Use `.env.development` for local development
- Page translations: Organized by page in `src/i18n/pages/[page]/`
- API routes: Follow REST conventions in `src/app/api/`
- Custom hooks: Place in `src/hooks/`, use `use` prefix
- Type definitions: Mirror file structure in `src/types/`
- Business logic: Separate into `src/services/` layer