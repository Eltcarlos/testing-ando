# Quick Start - Contenido Editorial

## IMPORTANT: You must seed the database before using the app!

The error you're seeing (`Cannot read properties of undefined (reading 'slug')`) happens because there's no admin user in the database yet.

## Setup Steps

### 1. Start MongoDB

Make sure MongoDB is running:

**Option A: Local MongoDB**
```bash
# macOS with Homebrew
brew services start mongodb-community

# Or if not using Homebrew, start manually
mongod --config /usr/local/etc/mongod.conf
```

**Option B: MongoDB Atlas**
- Use the connection string in `.env.local`
- No need to start anything locally

### 2. Start the Development Server

```bash
pnpm dev
```

The server will start at `http://localhost:3000`

### 3. Seed an Admin User

**Option A: Using the seed script (Recommended)**

```bash
pnpm seed
```

Or with custom email/name:
```bash
pnpm seed --email your@email.com --name "Your Name"
```

**Option B: Using curl**

```bash
curl -X POST http://localhost:3000/api/admin/seed \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@coparmex.com", "name": "Admin Coparmex"}'
```

You should see a success message with:
- Admin ID
- Email
- Name
- Number of categories created (8)
- Total topics created (64)

### 4. Login to the App

1. Go to `http://localhost:3000/login`
2. Enter the email you used in the seed: `admin@coparmex.com`
3. Use the demo OTP: `123456`
4. You'll be redirected to the dashboard

### 5. Use Contenido Editorial

1. Click on "Contenido Editorial" in the sidebar
2. You should now see 8 default categories
3. Select a category, topic, format and generate content!

## Troubleshooting

### Error: "Cannot connect to MongoDB"
- Check if MongoDB is running
- Verify `MONGODB_URI` in `.env.local` is correct

### Error: "Cannot read properties of undefined (reading 'slug')"
- You haven't seeded the admin user yet
- Run the seed command above
- Refresh the page

### Error: "OpenAI API error"
- Check if `OPENAI_API_KEY` in `.env.local` is valid
- Verify you have credits in your OpenAI account
- Check if you have access to GPT-4o

### No categories showing up
- Make sure you logged in with the same email you used in the seed
- Check localStorage in browser dev tools for `admin_email`
- Try clearing localStorage and logging in again

## Using a Different Email

If you want to use a different email, just run the seed command again with a new email:

```bash
pnpm seed --email your@email.com --name "Your Name"
```

Or with curl:
```bash
curl -X POST http://localhost:3000/api/admin/seed \
  -H "Content-Type: application/json" \
  -d '{"email": "your@email.com", "name": "Your Name"}'
```

Then login with that email.

---

**Need more details?** See `CONTENIDO_EDITORIAL_SETUP.md` for the full documentation.
