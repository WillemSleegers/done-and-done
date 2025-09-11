# Done and Done

A simple project and todo management app built with Next.js and Supabase.

## Getting Started

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Set up environment variables**
   
   Create a `.env.local` file:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

3. **Run the development server**
   ```bash
   npm run dev
   ```

## Deployment on Vercel

1. Connect your repository to Vercel
2. Add environment variables in Vercel dashboard:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
3. Deploy!

## Tech Stack

- Next.js 15 with TypeScript
- Supabase (database + auth)
- Tailwind CSS v4
- Shadcn/ui components
