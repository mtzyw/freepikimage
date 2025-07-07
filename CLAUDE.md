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

# Bundle analysis
pnpm analyze

# Docker build
pnpm docker:build
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
# POST /api/icon/generate - Start icon generation (requires prompt, style, format)
# GET /api/icon/status/:uuid - Check generation status with caching
# GET /api/icon/download/:uuid - Download generated icon (dual format support)
# GET /api/icon/download - Bulk download endpoint
# GET /api/icon/history - Get user's generation history with pagination
# GET /api/icon/batch-status - Batch check generation status (performance optimized)
# DELETE /api/icon/delete/:uuid - Delete generated icon and clean up storage
# DELETE /api/icon/batch-delete - Batch delete multiple icons
# POST /api/icon/webhook - Freepik webhook handler for status updates
```

### Testing Commands
```bash
# No testing framework is currently configured
# To add testing, consider Jest, Vitest, or React Testing Library
```

## Key Architecture Patterns

### Database Schema
- Uses Drizzle ORM with PostgreSQL
- Main entities: users, orders, credits, apikeys, posts, affiliates, feedbacks, icon_generations, third_party_api_keys
- Schema located in `src/db/schema.ts`
- Migrations in `src/db/migrations/`
- Drizzle configuration in `src/db/config.ts` with multi-environment support
- Each table uses auto-incrementing integer IDs with UUID fields for external references
- Icon generations support dual format storage (PNG/SVG) with separate R2 URLs and file sizes

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
- Redis integration with singleton pattern in `src/lib/redis.ts`
- Icon generation caching service in `src/services/cache.ts` with intelligent TTL management
- Supports graceful degradation when Redis is unavailable (automatic fallback to database)
- Status-based TTL: pending (30s), generating (60s), completed (1h), failed (5min)
- Connection timeout handling (5s) with error recovery
- Batch operations and health checks for better performance
- Environment variable support: REDIS_URL or REDIS_HOST/PORT/PASSWORD

### Payment & Credits System
- Stripe integration for subscriptions and one-time payments
- Credit-based usage tracking in `credits` table
- Order management with subscription support
- Affiliate program integration

## Environment Configuration

Environment variables are defined in `.env.example`. Key categories:
- **Web configuration**: NEXT_PUBLIC_WEB_URL, NEXT_PUBLIC_PROJECT_NAME
- **Database**: DATABASE_URL (PostgreSQL connection string)
- **NextAuth**: AUTH_SECRET, AUTH_URL, AUTH_TRUST_HOST, provider keys (Google/GitHub)
- **Analytics**: Google Analytics (NEXT_PUBLIC_GOOGLE_ANALYTICS_ID), OpenPanel (NEXT_PUBLIC_OPENPANEL_CLIENT_ID), Plausible (NEXT_PUBLIC_PLAUSIBLE_DOMAIN, NEXT_PUBLIC_PLAUSIBLE_SCRIPT_URL)
- **Payments**: Stripe keys (STRIPE_PUBLIC_KEY, STRIPE_PRIVATE_KEY, STRIPE_WEBHOOK_SECRET) and payment URLs
- **Storage**: AWS S3 compatible storage (STORAGE_ENDPOINT, STORAGE_REGION, STORAGE_ACCESS_KEY, STORAGE_SECRET_KEY, STORAGE_BUCKET, STORAGE_DOMAIN)
- **Admin**: ADMIN_EMAILS for admin access control
- **Theme**: NEXT_PUBLIC_DEFAULT_THEME for default UI theme
- **Redis**: REDIS_URL for caching (optional - system falls back to database if not configured, or use REDIS_HOST/REDIS_PORT/REDIS_PASSWORD for individual settings)
- **Google AdSense**: NEXT_PUBLIC_GOOGLE_ADCODE for advertisement
- **Locale**: NEXT_PUBLIC_LOCALE_DETECTION for automatic locale detection
- **AI Providers**: Third-party API keys stored in `third_party_api_keys` table for Freepik, OpenAI, Replicate, etc.

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

- Use `pnpm lint` to check code quality before committing
- TypeScript strict mode enabled with path mapping (`@/*` -> `./src/*`)
- ESLint configuration with Next.js rules
- No testing framework currently configured - consider adding Jest, Vitest, or React Testing Library for new features
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

The project includes a fully-implemented AI-powered icon generator:
- Database schema with `icon_generations` table supporting dual-format storage (PNG/SVG)
- Complete API suite in `/api/icon/` with webhook integration, caching, and batch operations
- Integration with credit system and third-party API key rotation (`third_party_api_keys` table)
- Support for multiple AI providers (Freepik as primary, extensible to OpenAI, Replicate, etc.)
- Comprehensive frontend components in `src/components/icon-generator/` including form, grid, history, and detail views
- Advanced features: generation history, batch operations, error handling, and progress tracking

## Freepik API Integration

The project integrates with Freepik's AI icon generation API:
- API documentation available in `freepikapi文档` file  
- Supports text-to-icon generation with styles: solid, outline, color, flat, sticker
- Dual format support: PNG and SVG with independent storage and URLs
- Webhook-based async processing with 120-second timeout handling
- API key rotation system via `third_party_api_keys` table for high availability
- Advanced parameters: num_inference_steps (10-50), guidance_scale (0-10)
- Full lifecycle tracking: pending → generating → completed/failed with timestamps

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
- Always use the third-party API key rotation system for external service integrations
- Icon generation supports dual formats - handle both PNG and SVG URLs appropriately
- Credit consumption tracking is automatic but verify costs in business logic

## Technical Configuration

### Build System
- **Next.js 15**: App Router with standalone output, MDX support enabled
- **Bundle Analysis**: Available via `pnpm analyze` using @next/bundle-analyzer
- **Internationalization**: next-intl plugin with locale-based routing
- **Images**: Remote pattern support for all HTTPS domains
- **Development**: Turbopack for fast development builds
- **React Strict Mode**: Disabled for compatibility with certain libraries

### Type System
- **TypeScript 5.7**: Strict mode enabled with path mapping (`@/*` -> `./src/*`)
- **Drizzle ORM**: Fully typed database schema with PostgreSQL support
- **Form Handling**: React Hook Form with Zod validation and Hookform resolvers

## Development Workflow

1. **Setup**: Copy `.env.example` to `.env.development` and configure required variables
2. **Development**: Run `pnpm dev` to start development server with Turbopack
3. **Database**: Use `pnpm db:studio` to inspect database, `pnpm db:generate` for schema changes
4. **Quality**: Always run `pnpm lint` before committing
5. **Icon Generation**: Test via `/icon-generator` page or API endpoints in `/api/icon/`
6. **API Keys**: Configure third-party API keys in database via `third_party_api_keys` table

## Pricing System

The project includes a comprehensive pricing system for icon generation:
- Pricing plans defined in `src/data/pricing-plans.ts` with Basic, Standard, and Pro tiers
- Chinese localization with CNY currency support
- Feature-based pricing with icon quotas, formats, and commercial use permissions
- Integration with Stripe for payment processing
- Icon pricing page at `/icon-pricing` with detailed feature comparison

## Recent Updates

- Added comprehensive pricing system with three tiers (Basic, Standard, Pro) in `src/data/pricing-plans.ts`
- Created dedicated icon pricing page at `/icon-pricing` with feature comparison
- Enhanced icon generation system with improved error handling and caching
- Added Redis caching system for icon generation performance optimization
- Implemented batch operations for icon status checking and deletion
- Added comprehensive cache management with configurable TTL based on generation status
- Updated environment variable documentation to match current `.env.example`