# Security Setup Guide

## ⚠️ IMPORTANT: Environment Variables Setup

This project uses environment variables to store sensitive configuration like API keys. **Never commit `.env` files to git.**

## First Time Setup

### 1. Create Your Local Environment Files

```bash
# Copy the example file for each environment
cp .env.example .env
cp .env.example .env.development
cp .env.example .env.production
```

### 2. Get Your MapTiler API Key

1. Go to [MapTiler Cloud](https://www.maptiler.com/cloud/)
2. Sign up for a free account
3. Go to Account → API Keys
4. Create a new API key or copy your existing one

### 3. Update Your `.env` Files

Edit each `.env` file and replace `your_key_here` with your actual API key:

```bash
# .env
MAPTILER_API_KEY=your_actual_api_key_here
```

Do the same for `.env.development` and `.env.production`.

## Security Best Practices

### ✅ DO:
- Keep your API keys private and never share them
- Use different API keys for development and production
- Rotate your API keys regularly
- Add API key restrictions in MapTiler dashboard (e.g., domain restrictions)
- Keep `.env` files in `.gitignore`

### ❌ DON'T:
- Never commit `.env` files to git
- Never hardcode API keys in source code
- Never share `.env` files in chat, email, or screenshots
- Never push `.env` files to public repositories

## If Your API Key is Exposed

If you accidentally commit an API key:

1. **Immediately revoke the exposed key** at https://cloud.maptiler.com/account/keys/
2. **Generate a new API key**
3. **Remove the key from git history**:
   ```bash
   git rm --cached .env .env.development .env.production
   git commit -m "security: remove exposed environment files"
   ```
4. **Update your local `.env` files** with the new key
5. **Consider using git-secrets** to prevent future leaks:
   ```bash
   brew install git-secrets
   git secrets --install
   git secrets --register-aws
   ```

## Logging Security

This project uses a centralized logger (`src/utils/logger.ts`) that:
- Only outputs logs in development mode (`__DEV__`)
- Never logs sensitive information like full API keys
- Uses appropriate log levels (debug, info, warn, error)

### Usage:

```typescript
import { logger } from './utils/logger';

// Development only - won't show in production
logger.debug('Debugging info');
logger.info('General information');

// Shows in both dev and production
logger.warn('Warning message');
logger.error('Error message', error);
```

## Environment Variables Reference

| Variable | Description | Example |
|----------|-------------|---------|
| `MAPTILER_API_KEY` | Your MapTiler API key | `abc123...` |
| `API_URL` | Digitraffic API endpoint | `https://meri.digitraffic.fi/api/v1` |
| `MAPLIBRE_STYLE_URL` | Fallback map style URL | `https://demotiles.maplibre.org/style.json` |
| `ENV` | Environment name | `development` / `production` |
| `DEBUG` | Enable debug logging | `true` / `false` |
| `LOG_LEVEL` | Logging level | `debug` / `info` / `warn` / `error` |

## Questions?

If you have questions about security setup, please:
1. Check the [MapTiler documentation](https://docs.maptiler.com/)
2. Review [React Native security best practices](https://reactnative.dev/docs/security)
3. Contact the project maintainers

---

**Remember**: Security is everyone's responsibility. When in doubt, ask before committing!
