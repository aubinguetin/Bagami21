# Translation File Structure

This document explains the organization of translation files in the Bagami application.

## File Locations

- **English Translations**: `/src/locales/en.json`
- **French Translations**: `/src/locales/fr.json`

## Structure Overview

Both files are organized by **namespace/page**. Each major section is clearly commented to indicate which page or component it corresponds to.

## Namespaces and Their Pages

### 1. `common` - Used across all pages
**Files using this**: All pages and components

Contains:
- App name and tagline
- Navigation menu items
- Common action buttons (save, cancel, delete, etc.)
- Status labels (pending, completed, etc.)
- Time-related labels
- Common UI elements

### 2. `auth` - Authentication Pages
**Pages**: 
- `/login` - Login page
- `/signup` - Sign up page
- `/verification` - OTP verification
- `/forgot-password` - Password reset
- `/new-password` - Set new password

Contains:
- Form labels and placeholders
- OAuth buttons
- Error messages
- Navigation links

### 3. `validation` - Global Form Validation
**Files using this**: All forms across the application

Contains:
- Required field messages
- Email validation
- Phone validation
- Password validation
- Terms acceptance validation

### 4. `settings` - Settings Page
**Page**: `/settings`

Contains:
- Account settings section
- ID verification modal
- My Information section (with phone/email verification)
- Change password modal
- Preferences (language, currency)

### 5. `profile` - Profile Page
**Page**: `/profile`

Contains:
- Wallet balance
- Navigation links (My Deliveries, Alerts, Messages, etc.)
- Logout modal
- Delete account modal

### 6. `myDeliveries` - My Deliveries Page
**Page**: `/my-deliveries`

Contains:
- Search and filters
- Stats (total, requests, offers)
- Delivery cards
- Empty states

### 7. `newRequest` - Create Delivery Request
**Page**: `/deliveries/new-request`

Contains:
- Item details section (type, weight, description)
- Route section (from/to country/city)
- Timeline & reward section
- Notes section
- Action buttons

### 8. `newOffer` - Create Space Offer
**Page**: `/deliveries/new-offer`

Contains:
- Travel route section
- Travel details (date, available weight)
- Pricing section
- Notes section
- Action buttons

### 9. `deliveries` - Browse Deliveries
**Page**: `/deliveries`

Contains:
- Search bar with country filters
- Post type tabs (All, Requests, Offers)
- Filters panel
- Stats display
- Delivery cards
- Empty states

### 10. `alertModal` - Alert Creation Modal
**Component**: `AlertModal`
**Used on**: `/deliveries` page

Contains:
- Route selection (from/to country/city)
- Alert type selection
- Success modal
- Error messages

### 11. `postTypeModal` - Post Type Selection Modal
**Component**: `PostTypeSelectionModal`
**Used on**: Main navigation, floating action button

Contains:
- Modal title and subtitle
- Delivery request option
- Travel offer option

### 12. `editRequest` - Edit Delivery Request
**Page**: `/deliveries/edit-request/[id]`

Contains:
- Page title and loading state
- Item details section (type, weight, description)
- Route section (from/to country/city)
- Timeline & reward section
- Additional notes
- Deletion warning
- Action buttons (delete, save)
- Success/error messages

### 13. `editOffer` - Edit Space Offer
**Page**: `/deliveries/edit-offer/[id]`

Contains:
- Page title and loading state
- Travel route section
- Travel details (departure date, available space, price)
- Additional notes
- Deletion warning
- Action buttons (delete, save)
- Success/error messages

### 14. `deliveryDetail` - Delivery Detail Page
**Page**: `/deliveries/[id]`

Contains:
- Loading and error states
- Route display
- Delivery information (weight, price, dates)
- Security notices
- Sender card
- Profile modal
- Action buttons
- Confirmation modal
- Status badges

## Translation Keys Structure

Each namespace uses a hierarchical structure with dot notation:

```json
{
  "namespaceName": {
    "section": {
      "subsection": {
        "key": "Translation value"
      }
    }
  }
}
```

### Example:
```json
{
  "deliveries": {
    "search": {
      "placeholder": "Search deliveries, cities, items..."
    },
    "filters": {
      "postType": "Post Type"
    }
  }
}
```

## Usage in Code

### Import translation hook:
```typescript
import { useT, useLocale } from '@/lib/i18n-helpers';
```

### Use in component:
```typescript
const t = useT();
const locale = useLocale();

// Access translations
<h1>{t.deliveries('title')}</h1>  // "Browse Deliveries" or "Parcourir les livraisons"
<input placeholder={t.deliveries('search.placeholder')} />
```

### For common translations:
```typescript
<button>{t.common('actions.save')}</button>  // "Save" or "Enregistrer"
```

## Comments in JSON Files

Both files include special comment fields:

1. **File Header**: `_comment` and `_structure` at the root level
2. **Namespace Comments**: `_comment` field in each major namespace explaining which page/component it belongs to

### Example:
```json
{
  "_comment": "BAGAMI TRANSLATION FILE - ENGLISH",
  "_structure": "Organized by namespace/page...",
  
  "deliveries": {
    "_comment": "PAGE: /deliveries - Main deliveries browse page...",
    "title": "Browse Deliveries"
  }
}
```

## Adding New Translations

When adding new pages or features:

1. **Choose the right namespace** - Add to existing if it fits, or create new namespace
2. **Add comment** - Include `_comment` field explaining the page/component
3. **Keep structure consistent** - Use hierarchical keys matching UI sections
4. **Translate both files** - Always add to both `en.json` and `fr.json`
5. **Update this document** - Add the new namespace to this README
6. **Add to useT() hook** - Update `/src/lib/i18n-helpers.ts` to include new namespace

## Current Translation Status

### ✅ Completed (100% translated):
1. Common elements
2. Authentication pages (translations exist, pages pending update)
3. Validation messages
4. Settings page + modals
5. Profile page
6. My Deliveries page
7. New Request page
8. New Offer page
9. Deliveries browse page
10. Alert Modal
11. Post Type Modal
12. Change Password Modal
13. Delivery Detail page
14. **Edit Request page** (`/deliveries/edit-request/[id]`) ✨ NEW
15. **Edit Offer page** (`/deliveries/edit-offer/[id]`) ✨ NEW

**Total namespaces**: 15
**Translation keys per language**: ~850+

### ⏳ Pending:
- Messages/Chat pages
- Wallet page
- Notifications page
- Email templates
- Admin/Backoffice pages

## Best Practices

1. **Be specific**: Use descriptive key names (e.g., `fromCountryPlaceholder` not just `placeholder`)
2. **Group logically**: Keep related translations together
3. **Use hierarchy**: Deep nesting is fine if it matches UI structure
4. **Avoid duplication**: Reuse `common` namespace for shared elements
5. **Keep synchronized**: Both language files should have identical structure
6. **Test both languages**: Always verify translations work in both English and French

## Translation Guidelines

### For French translations:
- Maintain formal tone ("vous" not "tu")
- Use proper accents (é, è, à, ç, etc.)
- Follow French typographic rules (space before : ! ? ;)
- Adapt to context, don't translate word-for-word
- Use localized formats (dates, numbers, currency)

### For placeholders:
- Use `{variable}` syntax for dynamic content
- Example: `"message": "Welcome, {name}!"` → `"message": "Bienvenue, {name} !"`

## Country and Date Localization

Special handling for dynamic content:

### Country Names:
Use `getCountriesList(locale)` from `/src/data/locations.ts`:
```typescript
const countries = getCountriesList(locale);
// Returns country names in current language
```

### Date Formatting:
```typescript
new Date(date).toLocaleDateString(locale === 'fr' ? 'fr-FR' : 'en-US', {
  day: 'numeric',
  month: 'short',
  year: 'numeric'
})
```

### Delivery Titles:
Use `translateDeliveryTitle()` from `/src/lib/i18n-helpers.ts`:
```typescript
import { translateDeliveryTitle } from '@/lib/i18n-helpers';

const translatedTitle = translateDeliveryTitle(delivery.title, locale);
```

---

**Last Updated**: November 11, 2025  
**Current Locales**: English (en), French (fr)  
**Total Translation Keys**: ~750+ per language
