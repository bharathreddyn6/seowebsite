# Overview

RankPro Analytics is a comprehensive SEO and brand rankings analytics dashboard that provides real-time insights into website performance across multiple metrics. The application combines backend analysis capabilities with a modern React frontend to deliver professional-grade analytics for SEO rankings, brand positioning, social media performance, and technical website metrics. It features interactive data visualization, trend analysis, and export capabilities to help users make informed decisions about their digital presence.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture
The application uses a modern React-based architecture with TypeScript for type safety. The frontend follows a component-driven design using shadcn/ui components built on top of Radix UI primitives. The architecture emphasizes reusability and maintainability through:

- **Component Structure**: Organized into layout components (Header, Sidebar, Footer), dashboard-specific components, and reusable UI components
- **State Management**: React Query for server state management with built-in caching and synchronization
- **Styling**: Tailwind CSS with CSS custom properties for theming, supporting both light and dark modes
- **Animation**: Framer Motion integration for smooth transitions and micro-interactions
- **Form Handling**: React Hook Form with Zod validation for type-safe form management

## Backend Architecture
The server uses Express.js with TypeScript in a RESTful API design pattern. Key architectural decisions include:

- **Storage Abstraction**: Interface-based storage layer allowing for easy switching between in-memory storage (development) and database implementations
- **Route Organization**: Centralized route registration with clean separation of concerns
- **Error Handling**: Comprehensive error middleware with proper HTTP status codes and sanitized error responses
- **Development Integration**: Vite middleware integration for seamless development experience

## Data Layer
The application uses Drizzle ORM with PostgreSQL for production data persistence:

- **Schema Design**: Three main entities (users, website analyses, ranking history) with proper relationships and constraints
- **Migration Strategy**: Drizzle Kit for schema migrations and database version control
- **Type Safety**: Generated TypeScript types from database schema using Drizzle Zod integration
- **Connection Management**: Neon serverless PostgreSQL for scalable database hosting

## Security Measures
Security is implemented at multiple layers:

- **Input Sanitization**: DOMPurify for client-side HTML sanitization and Zod validation for data integrity
- **Security Headers**: Comprehensive HTTP security headers including CSP, HSTS, and XSS protection
- **HTTPS Enforcement**: URL validation ensures only secure protocols are processed
- **Session Management**: PostgreSQL-backed session storage with connect-pg-simple

## Development Environment
The development setup emphasizes developer experience:

- **Hot Module Replacement**: Vite integration with Express for instant feedback during development
- **Type Checking**: Comprehensive TypeScript configuration covering client, server, and shared code
- **Code Quality**: Structured project organization with clear separation between client, server, and shared modules

# External Dependencies

## Core Framework Dependencies
- **React 18**: Frontend framework with modern hooks and concurrent features
- **Express.js**: Web application framework for the backend API
- **TypeScript**: Type safety across the entire application stack
- **Vite**: Build tool and development server with fast HMR

## Database & ORM
- **Neon Database**: Serverless PostgreSQL hosting (@neondatabase/serverless)
- **Drizzle ORM**: Type-safe database toolkit with migration support (drizzle-orm, drizzle-kit)
- **PostgreSQL**: Relational database for persistent data storage

## UI & Styling
- **Tailwind CSS**: Utility-first CSS framework for responsive design
- **Radix UI**: Headless UI primitives for accessible component foundation
- **shadcn/ui**: Pre-built component library built on Radix UI
- **Framer Motion**: Animation library for smooth transitions and interactions
- **Recharts**: Data visualization library for charts and analytics displays

## Form & Data Management
- **React Hook Form**: Performant form library with minimal re-renders
- **React Query (@tanstack/react-query)**: Server state management with caching
- **Zod**: Schema validation for runtime type checking
- **DOMPurify**: HTML sanitization for security

## Development & Build Tools
- **Vite Plugins**: Runtime error overlay and development banner integration
- **PostCSS**: CSS processing with Tailwind CSS and Autoprefixer
- **ESBuild**: Fast JavaScript bundler for production builds
- **tsx**: TypeScript execution for development server

## Security & Utilities
- **Helmet**: Security headers middleware for Express
- **connect-pg-simple**: PostgreSQL session store
- **class-variance-authority**: Utility for creating component variants
- **clsx**: Conditional className utility
- **date-fns**: Date manipulation and formatting library