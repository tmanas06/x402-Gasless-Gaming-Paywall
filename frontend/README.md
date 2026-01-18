# Frontend

This is the Next.js frontend application for the X402 gaming DApp.

## Setup

1. Copy `.env.example` to `.env.local`:
   ```bash
   cp .env.example .env.local
   ```

2. Fill in your Privy credentials in `.env.local`:
   - Get `NEXT_PUBLIC_PRIVY_APP_ID` and `NEXT_PUBLIC_PRIVY_CLIENT_ID` from [Privy Dashboard](https://dashboard.privy.io/)
   - Make sure both values are from the same app and are correct

3. Install dependencies:
   ```bash
   npm install
   ```

4. Run the development server:
   ```bash
   npm run dev
   ```

   Or from the project root:
   ```bash
   npm run dev
   ```

## Troubleshooting

### Privy 400 Errors

If you see `POST https://auth.privy.io/api/v1/siwe/init 400 (Bad Request)`:
- Verify your Privy App ID and Client ID are correct in `.env.local`
- Make sure both values are from the same app in the Privy Dashboard
- Check that your Privy app is active (not deleted or suspended)
- Restart the dev server after changing `.env.local`

### Missing Environment Variables

If you see "Missing Privy credentials" error:
- Make sure `.env.local` exists in the `frontend/` folder
- Verify the variable names are exactly `NEXT_PUBLIC_PRIVY_APP_ID` and `NEXT_PUBLIC_PRIVY_CLIENT_ID`
- Restart the dev server after adding/changing environment variables
