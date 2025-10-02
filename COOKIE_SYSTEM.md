# Cookie Consent System

This system manages user cookie preferences and gates features based on consent.

## Cookie Categories

### Essential Cookies (Always Required)

-   **Session cookies**: User authentication and session management
-   **Security cookies**: CSRF protection and security features
-   **Functional cookies**: Core application functionality

These cookies cannot be disabled as they are required for the platform to function.

### Optional Cookies

#### Analytics Cookies

-   **Usage tracking**: Track how users interact with the platform
-   **Performance monitoring**: Monitor application performance
-   **Feature usage**: Understand which features are used most

When disabled:

-   Vercel Analytics will not track user behavior
-   SpeedInsights will be disabled
-   No usage statistics will be collected

#### Preference Cookies

-   **UI preferences**: Save user's theme, language, and layout preferences
-   **Saved filters**: Remember selected filters and sorting options
-   **Custom settings**: Store personalized settings

When disabled:

-   User preferences will not persist across sessions
-   Settings will reset on each login
-   Custom configurations will be lost

#### Marketing Cookies

-   **Targeted ads**: (Currently not used)
-   **Campaign tracking**: (Currently not used)
-   **Third-party marketing**: (Currently not used)

Currently, the platform does not use marketing cookies, but this category is reserved for future use.

## Database Schema

Cookie preferences are stored in the `profiles.allowed_cookies` column as JSONB:

```json
{
    "essential": true, // Always true
    "analytics": false,
    "preferences": false,
    "marketing": false
}
```

## Implementation

### Cookie Banner Component

Location: `/components/CookieBanner.tsx`

The banner appears on first visit and allows users to:

1. Accept all cookies
2. Reject all (only essential)
3. Customize individual cookie types

### Feature Gating

Use the cookie preferences to conditionally enable/disable features:

```typescript
import { createClient } from "@/lib/supabase/client";

async function checkCookiePreference(type: "analytics" | "preferences" | "marketing") {
    const supabase = createClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        // Check localStorage for non-logged in users
        const consent = localStorage.getItem("cookie_consent");
        if (!consent) return false;
        const preferences = JSON.parse(consent);
        return preferences[type] === true;
    }

    // Check database for logged-in users
    const { data } = await supabase.from("profiles").select("allowed_cookies").eq("user_id", user.id).single();

    if (!data || !data.allowed_cookies) return false;
    return data.allowed_cookies[type] === true;
}
```

### Example: Gating Analytics

In `/app/layout.tsx`:

```typescript
"use client";

import { useEffect, useState } from "react";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";

export function ConditionalAnalytics() {
    const [analyticsEnabled, setAnalyticsEnabled] = useState(false);

    useEffect(() => {
        checkCookiePreference("analytics").then(setAnalyticsEnabled);
    }, []);

    if (!analyticsEnabled) return null;

    return (
        <>
            <Analytics />
            <SpeedInsights />
        </>
    );
}
```

## User Flow

### First Visit (Non-Authenticated)

1. User visits landing page
2. Cookie banner appears
3. User must accept at least essential cookies to proceed
4. Preferences saved in localStorage
5. If user tries to login without accepting cookies, they are blocked

### Authenticated Users

1. Cookie preferences migrate from localStorage to database on login
2. Banner shows if no preferences set in database
3. User can change preferences in Profile Settings
4. Preferences persist across devices

### Changing Preferences

Users can update cookie preferences at any time in their profile settings:

-   Navigate to `/profile`
-   Find "Cookie Preferences" section
-   Toggle individual cookie types
-   Changes take effect immediately

## RLS Policies

Cookie preferences are protected by Row Level Security:

-   Users can only view/edit their own cookie preferences
-   Admins have no special access to cookie preferences (privacy by design)

## Compliance

This system helps comply with:

-   **LGPD** (Lei Geral de Proteção de Dados - Brazil)
-   **GDPR** (if expanding to Europe)
-   **CCPA** (if expanding to California)

Key compliance features:

-   ✅ Clear cookie descriptions
-   ✅ Granular control (per category)
-   ✅ Easy opt-out mechanism
-   ✅ No tracking without consent
-   ✅ Preference persistence
-   ✅ Links to Privacy Policy and Cookie Policy

## Testing

To test the cookie system:

1. **Test Banner Appearance**:

    - Clear localStorage and database entry
    - Visit site
    - Verify banner appears

2. **Test Essential-Only**:

    - Select "Apenas Essenciais"
    - Verify analytics disabled
    - Verify login still works

3. **Test Reject All (Non-Authenticated)**:

    - Click "Rejeitar Todos" without logging in
    - Verify alert message
    - Verify banner remains visible

4. **Test Customization**:

    - Click "Personalizar"
    - Toggle individual preferences
    - Save and verify persistence

5. **Test Feature Gating**:
    - Disable analytics cookies
    - Verify Vercel Analytics not loaded
    - Enable analytics cookies
    - Verify Analytics loads

## Future Enhancements

1. **Profile Settings Page**: Add UI to change cookie preferences after initial consent
2. **Cookie Audit Log**: Track when users change preferences (for compliance)
3. **Third-Party Script Management**: Automatically enable/disable third-party scripts based on consent
4. **Consent Expiry**: Re-prompt users after 12 months
5. **Geolocation-Based Prompts**: Show different prompts based on user location (GDPR vs LGPD)
