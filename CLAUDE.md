# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

ShipAny Template One is a full-stack AI SaaS boilerplate built with Next.js 15, featuring AI capabilities including video generation through Kling AI and icon generation, user authentication, subscription management, and multi-language support. This is a production-ready template for building AI startups quickly.

## Core Technologies & Architecture

- **Frontend**: Next.js 15 with React 19, TypeScript, Tailwind CSS
- **Database**: PostgreSQL with Drizzle ORM
- **Authentication**: NextAuth.js v5 with Google/GitHub OAuth and Google One Tap
- **AI Integration**: Custom AI SDK wrapper in `src/aisdk/` with Kling provider for video generation, supports multiple AI providers (OpenAI, Replicate, DeepSeek)
- **Payments**: Stripe integration with subscription management
- **Internationalization**: next-intl with English/Chinese support
- **UI Components**: Radix UI + shadcn/ui components
- **Styling**: Tailwind CSS with theme customization
- **Caching**: Redis for icon generation caching and performance optimization

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

# Open Drizzle Studio (database GUI)
pnpm db:studio

# Push schema changes directly (dev only)
pnpm db:push
```

### Icon Generation Commands
```bash
# The icon generation system uses async processing with webhooks
# No direct CLI commands, but API endpoints are available:
# POST /api/icon/generate - Start icon generation
# GET /api/icon/status/:uuid - Check generation status
# GET /api/icon/download/:uuid - Download generated icon
# GET /api/icon/history - Get user's generation history
# GET /api/icon/batch-status - Batch check generation status
# DELETE /api/icon/delete/:uuid - Delete generated icon
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
- Main entities: users, orders, credits, apikeys, posts, affiliates, feedbacks, icon_generations
- Schema located in `src/db/schema.ts`
- Migrations in `src/db/migrations/`
- Each table uses auto-incrementing integer IDs with UUID fields for external references

### Authentication System
- NextAuth.js v5 configuration in `src/auth/config.ts`
- Supports multiple providers (Google, GitHub, Google One Tap)
- Custom user handling in `src/auth/handler.ts`
- Session management integrated with database user records

### AI SDK Integration
- Custom AI SDK wrapper in `src/aisdk/` with extensible provider pattern
- Kling AI provider for video generation in `src/aisdk/kling/`
- Support for multiple AI providers (OpenAI, Replicate, DeepSeek) via @ai-sdk packages
- Video generation API endpoints in `src/app/api/demo/`
- Icon generation system integrated with Freepik API via `/api/icon/` endpoints
- Third-party API key rotation system in `src/services/third-party-api-key.ts`

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

### Caching System
- Redis integration for performance optimization in `src/lib/redis.ts`
- Icon generation caching service in `src/services/cache.ts`
- Supports graceful degradation when Redis is unavailable
- Configurable TTL based on icon generation status
- Batch operations for better performance

### Payment & Credits System
- Stripe integration for subscriptions and one-time payments
- Credit-based usage tracking in `credits` table
- Order management with subscription support
- Affiliate program integration

## Environment Configuration

Environment variables are defined in `.env.example`. Key categories:
- **Web configuration**: NEXT_PUBLIC_WEB_URL, NEXT_PUBLIC_PROJECT_NAME
- **Database**: DATABASE_URL (PostgreSQL connection string)
- **NextAuth**: AUTH_SECRET, AUTH_URL, provider keys (Google/GitHub)
- **Analytics**: Google Analytics, OpenPanel, Plausible tracking IDs
- **Payments**: Stripe public/private keys and webhook secrets
- **Storage**: AWS S3 compatible storage (endpoint, region, keys, bucket)
- **AI providers**: API keys for OpenAI, Replicate, DeepSeek, etc.
- **Admin**: ADMIN_EMAILS for admin access control
- **Freepik Integration**: API keys for Freepik icon generation service
- **Theme**: NEXT_PUBLIC_DEFAULT_THEME for default UI theme
- **Redis**: REDIS_URL, REDIS_HOST, REDIS_PORT, REDIS_PASSWORD for caching

For development, copy `.env.example` to `.env.development` and configure required variables.
The Drizzle config loads environment variables from multiple files: `.env`, `.env.development`, `.env.local`.

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
- Separate business logic into `src/services/` layer
- Use proper type definitions in `src/types/` mirroring file structure

## Important File Patterns

- Environment files: Use `.env.development` for local development
- Page translations: Organized by page in `src/i18n/pages/[page]/`
- API routes: Follow REST conventions in `src/app/api/`
- Custom hooks: Place in `src/hooks/`, use `use` prefix
- Type definitions: Mirror file structure in `src/types/`
- Business logic: Separate into `src/services/` layer
- Database models: Interface definitions in `src/models/`
- UI blocks: Large reusable sections in `src/components/blocks/`

## Icon Generator Feature

The project includes an AI-powered icon generator (see `AI_ICON_GENERATOR_PLAN.md` for detailed development plan):
- Database schema includes `icon_generations` table for tracking generation history
- API endpoints in `/api/icon/` for generation, status checking, and downloads
- Integration with existing credit system and third-party API key rotation
- Support for multiple AI providers and output formats (PNG, SVG, ICO)
- Frontend components in `src/components/icon-generator/`

## Freepik API Integration

The project integrates with Freepik's AI icon generation API:
- API documentation available in `freepikapi文档` file
- Supports text-to-icon generation with different styles (solid, outline, color, flat, sticker)  
- Supports multiple formats (PNG, SVG)
- Uses webhook-based async processing
- Requires Freepik API key authentication
- API endpoint: `/v1/ai/text-to-icon`

## Cursor Rules Integration

The project includes `.cursorrules` file with specific development guidelines:
- Emphasizes TypeScript and React functional components
- Mandates Tailwind CSS and shadcn/ui usage
- Defines clear file structure conventions
- Specifies component naming (CamelCase) and modular design patterns
- Integrates with next-auth, next-intl, and Stripe

## Important Considerations

- Always run `pnpm lint` before committing changes
- Use existing patterns and components when possible rather than creating new ones
- Follow the established folder structure and naming conventions
- Test database changes with `pnpm db:studio` before pushing migrations
- Ensure proper TypeScript typing for all new components and functions
- Maintain responsive design principles across all UI components
- Follow the .cursorrules conventions for consistent code style
- Use the Freepik API for icon generation features following the documented parameters
- Redis caching is designed with graceful degradation - the system continues to work when Redis is unavailable

## Recent Updates

- Added Redis caching system for icon generation performance optimization
- Implemented batch operations for icon status checking and deletion
- Enhanced icon generation system with improved error handling and caching
- Added comprehensive cache management with configurable TTL based on generation status