# Prompt: Docker Deployment for PWA App

## When
Mid-project, during US-17 deployment planning

## Context
The team needed to deploy both the Spring Boot backend and Vue 3 frontend. We wanted the simplest solution that works and allows anyone to run the app with one command.

## Prompt (paraphrased)
"We're building a Vue 3 + Spring Boot PWA shopping list app. What's the easiest way to deploy it? We want to run it locally and eventually on a server. Docker seems like the right tool but we're not sure how to structure it."

## Result
- docker-compose.yml with PostgreSQL service
- Frontend built with Vite, served via nginx
- Backend in separate Docker container or run directly
- Environment variables for database connection
- nginx.conf for proper SPA routing and PWA headers

## What We Learned
Docker Compose is great for the database. For the full app, we kept it simple: backend runs with Maven, frontend with npm/Vite. This is easier to develop with and Dockerizing both adds complexity without much benefit for a school project.

## Key Takeaways
- Always use `.env` for secrets, never commit them
- nginx needs special headers for PWA service workers (no cache)
- CORS must be configured to allow frontend origin
