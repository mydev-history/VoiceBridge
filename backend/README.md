# VoiceBridge Backend

This is the Node.js backend for the VoiceBridge application, powered by Express, Supabase, Twilio, and Stripe.

## Milestone 1: Foundation Setup

This milestone includes the initial setup for the database, API structure, and webhook integrations.

---

## Environment Setup

Follow these steps to get your local development environment set up and running.

### 1. Clone the Repository

```bash
git clone <your-repository-url>
cd voicebridge-mvp/backend
```

### 2. Install Dependencies

Install the required Node.js packages.

```bash
npm install
```

### 3. Set Up Supabase

1.  Sign up for a free account at [supabase.com](https://supabase.com).
2.  Create a new project.
3.  In your project dashboard, find your Project URL, `anon` key, and `service_role` key in `Project Settings > API`.
4.  Install the Supabase CLI: `npm install -g supabase`.
5.  Login to the CLI: `supabase login`.
6.  Link your local project to your Supabase project: `supabase link --project-ref <your-project-ref>`.
7.  Push the database migrations to apply the schema: `supabase db push`.

### 4. Configure Environment Variables

Create a `.env` file in the root of the `backend` directory. Copy the contents of the `.env.example` file into it.

**.env.example:**
```
# REQUIRED: Twilio Configuration
TWILIO_ACCOUNT_SID=ACXXXXXXXXxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your_twilio_auth_token
TWILIO_PHONE_NUMBER=+1234567890
TWILIO_WEBHOOK_URL=https://api.yourdomain.com/v1/webhooks/call-hook

# REQUIRED: OpenAI Configuration
OPENAI_API_KEY=sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
WHISPER_MODEL=whisper-1
GPT_MODEL_SILVER=gpt-3.5-turbo
GPT_MODEL_GOLD=gpt-4

# REQUIRED: Supabase Configuration
SUPABASE_URL=https://your-project-ref.supabase.co
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_KEY=your_supabase_service_role_key

# REQUIRED: Stripe Configuration
STRIPE_SECRET_KEY=sk_test_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
SILVER_PLAN_LINK=https://buy.stripe.com/your_silver_plan_link
GOLD_PLAN_LINK=https://buy.stripe.com/your_gold_plan_link

# Application Settings
NODE_ENV=development
PORT=3000
LOG_LEVEL=info
```

Fill in the required values for Supabase, Twilio, and Stripe.

### 5. Run the Application

Start the development server.

```bash
npm start
```

The server should now be running on the port specified in your `.env` file (default is 3000).

## Running Database Migrations with Supabase

To apply the database schema (migrations) to your Supabase project, follow these steps:

1. **Install the Supabase CLI** (if you haven't already):
   ```bash
   npm install -g supabase
   ```

2. **Log in to Supabase:**
   ```bash
   npx supabase login
   ```
   This will open a browser window for authentication.

3. **Find your Project Ref:**
   - Go to [app.supabase.com](https://app.supabase.com) and select your project.
   - Click the ⚙️ **Project Settings** in the left sidebar.
   - Under the **General** tab, copy the **Reference ID** (Project Ref).

4. **Link your local project to Supabase:**
   ```bash
   npx supabase link --project-ref <your-project-ref>
   ```
   Replace `<your-project-ref>` with the value you copied.

5. **Run the migration:**
   ```bash
   npx supabase db push
   ```
   This will apply all migration files in the `supabase/migrations` directory to your remote Supabase database.

After running these steps, your database will be set up with all tables, functions, and RLS policies defined in your migration files.

### Providing Your Database Password

If your Supabase database requires a password, you can provide it using the `SUPABASE_DB_PASSWORD` environment variable. This is useful for non-interactive use or to avoid being prompted for the password each time.

#### On Windows (Command Prompt or PowerShell):
```cmd
set SUPABASE_DB_PASSWORD=your_password_here
npx supabase db push
```

#### On Windows (Git Bash) or Mac/Linux:
```bash
export SUPABASE_DB_PASSWORD=your_password_here
npx supabase db push
```

Or, you can prepend the variable to the command (works in Bash shells):
```bash
SUPABASE_DB_PASSWORD=your_password_here npx supabase db push
```

Replace `your_password_here` with your actual database password. 