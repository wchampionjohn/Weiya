# Weiya

A year-end party lottery application built with Rails, Vite, and React.

## Project Description

This is an interactive lottery system designed for company year-end party events.

## Tech Stack

### Backend

| Technology | Version | Description |
|------------|---------|-------------|
| Ruby | 3.4.1 | Programming Language |
| Rails | 8.0.2.1 | Web Framework |
| PostgreSQL | - | Database |
| Puma | 5.0+ | Web Server |

### Frontend

| Technology | Version | Description |
|------------|---------|-------------|
| React | 19.x | UI Framework |
| Vite | 5.x | Build Tool |
| vite_rails | 3.0.19 | Rails + Vite Integration |
| Node.js | 18.20.0 | JavaScript Runtime |

## Getting Started

### Prerequisites

- Ruby 3.2.0 or higher
- Node.js 18.0 or higher (20+ recommended)
- PostgreSQL 12 or higher
- Bundler 2.0 or higher

### Installation

1. Clone the repository

```bash
git clone <repository-url>
cd Weiya
```

2. Install dependencies

```bash
# Install Ruby gems
bundle install

# Install Node.js packages
npm install
```

3. Setup database

```bash
# Create database
rails db:create

# Run migrations
rails db:migrate
```

4. Start development server

```bash
# Start both Rails and Vite
./bin/dev
```

5. Open browser and visit [http://localhost:3000](http://localhost:3000)

## Development

### Project Structure

```
Weiya/
├── app/
│   ├── frontend/              # Frontend code (Vite)
│   │   ├── entrypoints/       # Vite entry points
│   │   │   └── application.jsx
│   │   └── components/        # React components
│   │       └── App.jsx
│   ├── controllers/           # Rails controllers
│   ├── models/                # Rails models
│   └── views/                 # Rails views
├── config/
│   ├── vite.json              # Vite configuration
│   ├── database.yml           # Database configuration
│   └── routes.rb              # Routes configuration
├── db/
│   ├── migrate/               # Database migrations
│   └── schema.rb              # Database schema
├── vite.config.ts             # Vite config file
└── Procfile.dev               # Development process configuration
```

### Common Commands

```bash
# Start development server (Rails + Vite)
./bin/dev

# Start Rails only
rails server

# Start Vite only
bin/vite dev

# Rails console
rails console

# Run tests
rails test

# View routes
rails routes

# Database operations
rails db:migrate        # Run migrations
rails db:rollback       # Rollback last migration
rails db:reset          # Reset database
```

### Frontend Development

React components are located in `app/frontend/components/`. When you save changes, the browser will automatically update thanks to Vite HMR (Hot Module Replacement).

### Backend Development

```bash
# Generate a new model
rails generate model ModelName field:type

# Generate a new controller
rails generate controller ControllerName action

# Generate a new migration
rails generate migration MigrationName
```

## Testing

```bash
# Run all tests
rails test

# Run specific test file
rails test test/models/model_test.rb

# Run system tests
rails test:system
```

## Deployment

### Production Build

```bash
# Precompile assets
rails assets:precompile

# Run migrations
RAILS_ENV=production rails db:migrate

# Start production server
RAILS_ENV=production rails server
```
