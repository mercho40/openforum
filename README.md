# OpenForum 🗣️

A modern, full-featured forum application built with Next.js 15, featuring real-time discussions, admin management, and a beautiful UI. Perfect for communities, organizations, or anyone looking to host their own forum.

## ✨ Features

### 🏠 Core Forum Features
- **Thread Management**: Create, edit, pin, lock, and hide threads
- **Categories**: Organize discussions with customizable categories (colors & icons)
- **Posts & Replies**: Rich text posting with edit capabilities
- **Search & Filtering**: Advanced search with category and author filtering
- **Voting System**: Upvote/downvote posts (like Reddit)
- **Bookmarks**: Save threads for later reading
- **Pagination**: Efficient browsing of large discussions

### 👥 User Management
- **Authentication**: Email/password, Google OAuth, GitHub OAuth
- **User Profiles**: Bio, signature, website, location, reputation system
- **Role System**: Admin, Moderator, User roles with permissions
- **Two-Factor Authentication**: Enhanced security with 2FA
- **Email Verification**: Secure account verification with OTP

### 🛡️ Admin Features
- **Dashboard**: Overview of forum statistics and activity
- **User Management**: Ban users, change roles, view user details
- **Category Management**: Create, edit, delete, and organize categories
- **Thread Moderation**: Pin, lock, hide, or delete threads
- **Reports System**: Handle user reports and moderation
- **Analytics**: Track forum growth and engagement

### 🎨 Modern UI/UX
- **Responsive Design**: Perfect on desktop, tablet, and mobile
- **Dark/Light Mode**: Theme switching with system preference detection
- **Modern Components**: Built with Radix UI and Tailwind CSS
- **Smooth Animations**: Polished interactions and transitions
- **Accessibility**: WCAG compliant with keyboard navigation

### ⚡ Performance
- **Server-Side Rendering**: Fast initial page loads
- **Edge Caching**: Optimized for global CDN delivery
- **Database Optimization**: Efficient queries with Drizzle ORM
- **Progressive Enhancement**: Works without JavaScript

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ 
- PostgreSQL database (local or hosted)
- pnpm (recommended) or npm

### 1. Clone & Install

```bash
# Clone the repository
git clone https://github.com/yourusername/openforum.git
cd openforum

# Install dependencies
pnpm install
```

### 2. Environment Setup

Create a `.env.local` file in the root directory:

```env
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/openforum"

# Authentication Secret (generate a random string)
BETTER_AUTH_SECRET="your-super-secret-key-here"
BETTER_AUTH_URL="http://localhost:3000"

# Email (Resend - for email verification)
AUTH_RESEND_KEY="re_xxxxxxxxxxxxxxxxxxxxx"

# OAuth Providers (optional)
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"
GITHUB_CLIENT_ID="your-github-client-id"
GITHUB_CLIENT_SECRET="your-github-client-secret"

# App Configuration
APP_NAME="Your Forum Name"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

### 3. Database Setup

```bash
# Generate database migrations
pnpm drizzle-kit generate

# Run migrations
pnpm drizzle-kit migrate

# (Optional) Seed with sample data
pnpm db:seed
```

### 4. Run Development Server

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) to see your forum!

## 🛠️ Tech Stack

### Frontend
- **Next.js 15** - React framework with App Router
- **TypeScript** - Type safety and better DX
- **Tailwind CSS** - Utility-first CSS framework
- **Radix UI** - Accessible component primitives
- **Lucide Icons** - Beautiful, customizable icons

### Backend
- **Next.js API Routes** - Server-side logic
- **Better Auth** - Modern authentication library
- **Drizzle ORM** - Type-safe database queries
- **PostgreSQL** - Reliable, feature-rich database

### Services
- **Resend** - Email delivery service
- **Vercel** - Deployment and hosting platform

## 📦 Deployment

### Deploy to Vercel (Recommended)

1. **Create a Vercel account** at [vercel.com](https://vercel.com)

2. **Create a PostgreSQL database**:
   - Use [Neon](https://neon.tech), [Supabase](https://supabase.com), or [Vercel Postgres](https://vercel.com/docs/storage/vercel-postgres)
   - Get your connection string

3. **Deploy to Vercel**:
   ```bash
   # Install Vercel CLI
   npm i -g vercel
   
   # Deploy
   vercel
   ```

4. **Set Environment Variables** in Vercel dashboard:
   - Go to your project settings
   - Add all environment variables from your `.env.local`
   - Update `BETTER_AUTH_URL` and `NEXT_PUBLIC_APP_URL` to your domain

5. **Run Database Migrations**:
   ```bash
   # From your local machine with production DATABASE_URL
   pnpm drizzle-kit migrate
   ```

### Deploy to Other Platforms

The forum can be deployed to any platform that supports Node.js:

- **Railway**: `railway up`
- **Digital Ocean App Platform**: Connect your GitHub repo
- **AWS/GCP/Azure**: Use their container or serverless services

## ⚙️ Configuration

### Email Setup (Required for user registration)

1. **Create a Resend account** at [resend.com](https://resend.com)
2. **Get your API key** from the dashboard
3. **Add to environment variables**: `AUTH_RESEND_KEY`

### OAuth Setup (Optional)

#### Google OAuth
1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project or select existing
3. Enable Google+ API
4. Create OAuth 2.0 credentials
5. Add authorized redirect URI: `your-domain.com/api/auth/callback/google`

#### GitHub OAuth
1. Go to GitHub Settings > Developer settings > OAuth Apps
2. Create a new OAuth App
3. Set Authorization callback URL: `your-domain.com/api/auth/callback/github`

### Admin Account Setup

1. **Register the first user** through the normal signup process
2. **Access your database** and update the user's role:
   ```sql
   UPDATE "user" SET role = 'admin' WHERE email = 'your-email@example.com';
   ```
3. **Access admin panel** at `/forum/admin`

## 🎨 Customization

### Branding
- Update `APP_NAME` in environment variables
- Replace favicon in `app/favicon.ico`
- Modify the logo component in the header
- Customize colors in `tailwind.config.ts`

### Categories
- Access admin panel at `/forum/admin/categories`
- Create categories with custom colors and icons
- Icons use Lucide icon names (e.g., `MessageSquare`, `Code`, `Book`)

### Themes
- The forum supports light/dark mode out of the box
- Customize themes in `app/globals.css`
- Uses CSS variables for easy theming

## 📊 Database Schema

The forum uses a well-structured PostgreSQL schema with:

- **Users**: Authentication, profiles, roles, reputation
- **Categories**: Forum organization with colors/icons
- **Threads**: Main discussion topics with metadata
- **Posts**: Replies and content with voting
- **Tags**: Thread categorization and search
- **Reports**: User reporting and moderation
- **Sessions**: Authentication and security

## 🔧 Scripts

```bash
# Development
pnpm dev          # Start development server
pnpm build        # Build for production
pnpm start        # Start production server

# Database
pnpm drizzle-kit generate  # Generate migrations
pnpm drizzle-kit migrate   # Run migrations
pnpm drizzle-kit studio    # Open Drizzle Studio (database GUI)

# Code Quality
pnpm lint         # Run ESLint
pnpm type-check   # Run TypeScript checks
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

### Common Issues

**Database connection fails**
- Verify your `DATABASE_URL` is correct
- Ensure PostgreSQL is running
- Check firewall settings for hosted databases

**Email verification not working**
- Verify your `AUTH_RESEND_KEY` is valid
- Check Resend dashboard for sending limits
- Ensure your domain is verified with Resend

**OAuth login fails**
- Double-check client ID and secret
- Verify redirect URLs match exactly
- Check OAuth app settings in provider dashboard

### Getting Help

- 📖 [Documentation](https://github.com/yourusername/openforum/wiki)
- 🐛 [Report a Bug](https://github.com/yourusername/openforum/issues)
- 💡 [Request a Feature](https://github.com/yourusername/openforum/issues)
- 💬 [Discussions](https://github.com/yourusername/openforum/discussions)

## 🚀 Production Checklist

Before going live:

- [ ] Set strong `BETTER_AUTH_SECRET`
- [ ] Configure production database
- [ ] Set up email service (Resend)
- [ ] Configure OAuth providers
- [ ] Set up domain and SSL
- [ ] Create admin account
- [ ] Set up monitoring/analytics
- [ ] Configure backup strategy
- [ ] Test all core features
- [ ] Set up error tracking (Sentry)

---

**Ready to build your community?** 🌟 Star this repo and start your forum today!
