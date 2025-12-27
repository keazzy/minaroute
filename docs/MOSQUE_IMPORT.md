# Mosque Import from Google Places API

This guide explains how to populate your Supabase database with mosque data from Google Places API **once**, then serve it from your own database afterward.

## Why This Approach?

- **Cost control**: Google Places API charges per request. Querying on every app open = spiraling costs
- **Speed**: Local DB queries are faster than external API calls
- **Reliability**: No dependency on Google's uptime for core app functionality
- **Control**: You own the data and can enrich/curate it

## Prerequisites

### 1. Google Cloud Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable the **Places API (New)** from APIs & Services > Library
4. Create an API key from APIs & Services > Credentials
5. (Recommended) Restrict the key to Places API only

### 2. Supabase Service Key

1. Go to your [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Go to **Settings > API**
4. Copy the `service_role` key (NOT the anon key)

> ⚠️ The service_role key bypasses RLS. Never expose it in client code.

## Database Schema

The script uses the existing `places` table with an added `google_place_id` column:

| Column | Type | Description |
|--------|------|-------------|
| `id` | uuid | Primary key |
| `name` | text | Mosque name |
| `category` | text | Always "Mosque" |
| `address` | text | Full formatted address |
| `city` | text | Parsed city |
| `state` | text | Parsed state (2-letter code) |
| `latitude` | float | Latitude |
| `longitude` | float | Longitude |
| `google_place_id` | text | Google's unique place ID (for dedup) |
| `source` | text | "google_places" |
| `verified` | bool | false by default |
| `tags` | text[] | Empty array |

## Running the Import

### 1. Install Dependencies

```bash
npm install -D ts-node
```

### 2. Set Environment Variables

```bash
export GOOGLE_PLACES_API_KEY=your_google_api_key_here
export SUPABASE_SERVICE_KEY=your_service_role_key_here
```

Or create a `.env.local` file (don't commit this!):

```env
GOOGLE_PLACES_API_KEY=AIza...
SUPABASE_SERVICE_KEY=eyJhbGci...
```

### 3. Customize Search Locations

Edit `scripts/import-mosques.ts` and modify the `SEARCH_LOCATIONS` array:

```typescript
const SEARCH_LOCATIONS = [
  { name: 'New York, NY', lat: 40.7128, lng: -74.006, radiusMeters: 50000 },
  { name: 'Your City', lat: XX.XXXX, lng: -XX.XXXX, radiusMeters: 50000 },
  // Add more cities...
];
```

**Tips**:
- `radiusMeters`: Max 50000 (50km). Use smaller for dense areas
- For large cities, add multiple points to cover more area
- The script does both nearby search + text search for better coverage

### 4. Run the Script

```bash
npx ts-node scripts/import-mosques.ts
```

Or with env file:

```bash
# Using dotenv
npx ts-node -r dotenv/config scripts/import-mosques.ts dotenv_config_path=.env.local
```

### 5. Expected Output

```
🕌 Mosque Import Script
========================

📋 Fetching existing mosques from database...
   Found 0 existing places with Google Place IDs

🔍 Searching: New York, NY...
   Found 40 results, 38 unique new mosques so far
🔍 Searching: Los Angeles, CA...
   Found 35 results, 72 unique new mosques so far
...

📊 Total new mosques to insert: 250

   ✅ Inserted batch 1: 50 mosques
   ✅ Inserted batch 2: 50 mosques
   ...

========================
✅ Import complete!
   - Inserted: 250 mosques
   - Errors: 0
   - Skipped (duplicates): 0 existing
```

## Re-running the Import

The script is **idempotent**:
- Uses `google_place_id` to detect existing mosques
- Skips duplicates automatically
- Safe to run multiple times

To add more cities later, just add them to `SEARCH_LOCATIONS` and re-run.

## Cost Estimation

Google Places API (New) pricing (as of 2024):
- **Nearby Search**: $32 per 1000 requests
- **Text Search**: $32 per 1000 requests

For this script with 10 cities:
- ~20 API calls = ~$0.64

One-time cost is minimal compared to per-user queries.

## After Import

Your app already fetches from Supabase. No changes needed! The new mosques will appear automatically.

To verify:
```sql
SELECT COUNT(*) FROM places WHERE source = 'google_places';
```

## Troubleshooting

### "GOOGLE_PLACES_API_KEY environment variable is required"
Set the env var: `export GOOGLE_PLACES_API_KEY=your_key`

### "REQUEST_DENIED" from Google
- Check API key is valid
- Ensure Places API (New) is enabled
- Check API key restrictions

### "permission denied for table places"
You're using the anon key. Use the `service_role` key instead.

### Duplicate key violation
The script already handles this, but if you see errors, the `google_place_id` unique constraint is working correctly.

## Manual Curation

After import, you can:
1. Use the admin panel (`/admin/places`) to review/edit
2. Mark mosques as `verified = true` after confirmation
3. Add photos, tags, and descriptions
4. Delete incorrect entries

## Future Enhancements

Consider adding:
- [ ] Fetch additional details (hours, phone, website) via Place Details API
- [ ] Periodic refresh script to catch new mosques
- [ ] Photo fetching from Google
- [ ] User-submitted corrections workflow
