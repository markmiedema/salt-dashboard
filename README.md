# Tax Agency Dashboard

A comprehensive, production-ready dashboard for tax agencies to track revenue streams, manage clients, monitor project pipelines, and generate detailed reports. Built with React, TypeScript, Tailwind CSS, and integrated with Supabase for backend services and Microsoft Teams for seamless workflow integration.

## 🚀 Features

### Core Functionality

- **Revenue Tracking**: Real-time monitoring of tax returns, project-based, and consulting revenue
- **Client Management**: Complete client profiles with contact information, status tracking, and project history
- **Project Pipeline**: Visual project management with status tracking, progress monitoring, and deadline alerts
- **Comprehensive Reports**: Interactive charts, monthly breakdowns, and client performance analytics
- **Microsoft Teams Integration**: Native Teams app support for seamless workflow integration

### Technical Features

- **Modern React Architecture**: Built with React 18, TypeScript, and modern hooks
- **Responsive Design**: Mobile-first design that works perfectly on all devices
- **Real-time Data**: Supabase integration for live updates and synchronization
- **Professional UI**: Clean, modern interface with subtle animations and micro-interactions
- **Production Ready**: Optimized for performance with proper error handling and loading states

## 🛠 Technology Stack

- **Frontend**: React 18, TypeScript, Tailwind CSS
- **Backend**: Supabase (PostgreSQL, Real-time subscriptions, Authentication)
- **Charts**: Recharts for interactive data visualizations
- **Icons**: Lucide React for consistent iconography
- **Teams Integration**: Microsoft Teams JavaScript SDK
- **Build Tool**: Vite for fast development and optimized builds

## 🏗 Project Structure

```
src/
├── components/           # Reusable UI components
│   ├── common/          # Shared components (Header, Loading, etc.)
│   └── dashboard/       # Dashboard-specific components
├── pages/               # Main application pages
├── hooks/               # Custom React hooks for data management
├── services/            # External service integrations
├── types/               # TypeScript type definitions
└── utils/               # Utility functions and constants
```

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- Supabase account (optional - app works with mock data)
- Microsoft Teams account (optional - for Teams integration)

### Installation

1. **Clone and install dependencies**:

   ```bash
   npm install
   ```

2. **Environment Setup**:

   ```bash
   cp .env.example .env.local
   # Edit .env.local with your Supabase credentials
   ```

3. **Run the development server**:

   ```bash
   npm run dev
   ```

4. **Access the application**:
   - Web: http://localhost:3000
   - Teams: Upload teams-app/manifest.json to Teams Developer Portal

### Database Setup (Optional)

The application works with mock data by default. To use real data:

1. Create a Supabase project at https://supabase.com
2. Run the SQL schema from the setup documentation
3. Update your .env.local file with Supabase credentials
4. The app will automatically switch to live data

## 📊 Features Overview

### Dashboard

- **Revenue Summary**: Current month, YTD, and target tracking with growth indicators
- **Interactive Charts**: Monthly revenue trends with service type breakdowns
- **Client Overview**: Active clients, prospects, and recent additions
- **Project Pipeline**: Active projects with progress tracking and deadline monitoring

### Client Management

- **Comprehensive Profiles**: Contact information, entity types, and status tracking
- **Advanced Filtering**: Search by name, email, status, or entity type
- **Status Management**: Active, prospect, and inactive client categorization
- **Project Integration**: Direct links to client projects and history

### Project Management

- **Project Types**: Nexus analysis, VDA, tax preparation, bookkeeping, and advisory
- **Status Tracking**: Pending, in progress, completed, and on-hold projects
- **Progress Monitoring**: Hour tracking with visual progress indicators
- **Deadline Management**: Due date tracking with overdue alerts

### Reports & Analytics

- **Revenue Analytics**: Monthly trends, year-over-year comparisons
- **Service Breakdown**: Revenue distribution by service type
- **Client Performance**: Top clients by revenue and project volume
- **Export Functionality**: PDF and Excel export capabilities

## 🔧 Configuration

### Environment Variables

```env
# Supabase Configuration
VITE_SUPABASE_URL=https://xvrcmyfserdmcsbrbutf.supabase.co
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key

# Microsoft Teams (Optional)
VITE_AZURE_CLIENT_ID=your-azure-client-id
VITE_TEAMS_APP_ID=your-teams-app-id
```

### Database Schema

The application uses a PostgreSQL database with the following main tables:

- `clients`: Client information and contact details
- `projects`: Project tracking with status and progress
- `revenue_entries`: Revenue tracking by type and time period

## 🚀 Deployment

### Web Deployment

```bash
npm run build
# Deploy the dist/ folder to your hosting provider
```

### Teams App Deployment

1. Update manifest.json with your production URLs
2. Create app package: zip manifest.json, color.png, outline.png
3. Upload to Teams Admin Center or distribute directly

## 🤝 Contributing

This is a production-ready application template. To customize for your agency:

1. Update branding and colors in Tailwind config
2. Modify database schema for your specific needs
3. Add custom report types and metrics
4. Integrate with your existing tools and services

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For support and questions:

- Check the documentation in the `/docs` folder
- Review the inline code comments for implementation details
- Supabase documentation: https://supabase.com/docs
- Microsoft Teams development: https://docs.microsoft.com/en-us/microsoftteams/

---

Built with ❤️ for tax professionals who need powerful, reliable tools to manage their practice.
