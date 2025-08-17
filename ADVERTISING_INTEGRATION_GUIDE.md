# Advertising Platform Integration Guide

## Overview

The advertising platform is now fully integrated into your application with the following components:

### 1. **AdvertisingPlatform.tsx** (User-facing campaign discovery)

- Location: `src/components/AdvertisingPlatform.tsx`
- Purpose: Main interface where users discover and interact with ad campaigns
- Features: Campaign browsing, filtering, interaction tracking, earnings calculation

### 2. **AdDisplayService.ts** (Core advertising logic)

- Location: `src/services/adDisplayService.ts`
- Purpose: Handles ad targeting, placement, interaction recording, and metrics
- Features: Personalized ad delivery, frequency capping, performance tracking

### 3. **AdWidget.tsx** (Embeddable ad component)

- Location: `src/components/AIWidgets/AdWidget.tsx`
- Purpose: Reusable component that can be embedded anywhere in your app
- Features: Auto-rotation, compact/full layouts, real-time interaction tracking

### 4. **MonetizationDashboard.tsx** (User earnings dashboard)

- Location: `src/components/Dashboard/MonetizationDashboard.tsx`
- Purpose: Shows user earnings, activity breakdown, and withdrawal options
- Features: Real-time earnings tracking, activity analytics, withdrawal management

### 5. **advertising.ts** (Type definitions)

- Location: `src/types/advertising.ts`
- Purpose: TypeScript interfaces for the entire advertising system
- Features: Complete type safety for campaigns, activities, and earnings

## Integration Steps

### Step 1: Add Advertising Platform to Your Router

```tsx
// In your main App.tsx or router configuration
import AdvertisingPlatform from './components/AdvertisingPlatform';
import MonetizationDashboard from './components/Dashboard/MonetizationDashboard';

// Add these routes
<Route path="/advertising" element={<AdvertisingPlatform userId={currentUser.id} />} />
<Route path="/earnings" element={<MonetizationDashboard userId={currentUser.id} />} />
```

### Step 2: Embed Ad Widgets Throughout Your App

```tsx
// Example: In your dashboard sidebar
import AdWidget from './components/AIWidgets/AdWidget';

<AdWidget
  placement="dashboard-sidebar"
  userId={currentUser.id}
  userProfile={userProfile}
  maxAds={1}
  autoRotate={true}
  rotationInterval={30}
  className="mb-6"
/>

// Example: In content areas
<AdWidget
  placement="content-banner"
  userId={currentUser.id}
  userProfile={userProfile}
  maxAds={3}
  className="my-8"
/>
```

### Step 3: Initialize the Ad Display Service

```tsx
// In your main App.tsx or service initialization
import { adDisplayService } from "./services/adDisplayService";

useEffect(() => {
  const initializeAds = async () => {
    // Mock campaigns - replace with your API call
    const campaigns = await fetchActiveCampaigns();
    await adDisplayService.initializeService(campaigns);
  };

  initializeAds();
}, []);
```

### Step 4: Add Navigation Menu Items

```tsx
// In your navigation component
import { DollarSign, Target } from "lucide-react";

const navigationItems = [
  // ... existing items
  {
    name: "Advertising",
    href: "/advertising",
    icon: Target,
  },
  {
    name: "Earnings",
    href: "/earnings",
    icon: DollarSign,
  },
];
```

### Step 5: Connect with Your User System

```tsx
// Example user profile integration
const userProfile = {
  id: currentUser.id,
  location: currentUser.location,
  age: currentUser.age,
  interests: currentUser.interests || [],
  deviceType: "desktop",
  language: currentUser.language || "en",
  timezone: currentUser.timezone || "UTC",
};
```

## Ad Placements Available

### 1. **Homepage Banner** (`homepage-banner`)

- Dimensions: 728x90
- Position: Top of homepage
- Best for: High-visibility campaigns

### 2. **Sidebar Ads** (`sidebar-ad`)

- Dimensions: 300x250
- Position: Right sidebar
- Best for: Targeted content

### 3. **Dashboard Native** (`dashboard-native`)

- Dimensions: 400x300
- Position: Within dashboard feed
- Best for: User-relevant content

### 4. **Task Completion Modal** (`task-completion-modal`)

- Dimensions: 500x400
- Position: Modal after task completion
- Best for: Reward-based campaigns

## Campaign Interaction Types

### 1. **View** (Automatic)

- Triggered when ad becomes visible
- Default reward: $0.05
- No user action required

### 2. **Click** (User clicks CTA button)

- Triggered when user clicks the main button
- Default reward: $0.25
- Drives traffic to advertiser

### 3. **Complete** (User completes requirements)

- Triggered when user fulfills campaign requirements
- Default reward: $1.00
- Highest value interaction

### 4. **Share** (User shares campaign)

- Triggered when user shares via social media
- Default reward: $0.50
- Increases campaign reach

### 5. **Like** (User likes campaign)

- Triggered when user clicks heart icon
- Default reward: $0.10
- Engagement signal

## Monetization Features

### Real-time Earnings Tracking

- Users see earnings update immediately after interactions
- Detailed breakdown by activity type
- Historical earnings data with time-based filtering

### Withdrawal System

- Minimum withdrawal threshold: $5.00
- Pending earnings shown separately
- Easy withdrawal request process

### Performance Analytics

- Campaign performance metrics for advertisers
- User engagement analytics
- Revenue optimization insights

## Integration with Existing Campaign Management

The advertising platform automatically connects with your existing campaign management system:

1. **Campaign Creation** → Campaigns created in `CampaignManagement.tsx` are automatically available
2. **User Targeting** → AI-powered targeting based on user profiles and behavior
3. **Budget Management** → Real-time budget tracking and automatic campaign pausing
4. **Performance Monitoring** → Comprehensive analytics and reporting

## Next Steps

1. **Test the Integration**: Add the components to your app and test with mock data
2. **Connect Your API**: Replace mock data with real campaign and user data
3. **Configure Payments**: Set up payment processing for user withdrawals
4. **Analytics Integration**: Connect with your analytics platform for deeper insights
5. **A/B Testing**: Test different ad placements and formats for optimal performance

## Support

The advertising platform is designed to be:

- **Self-contained**: Minimal dependencies on existing code
- **Scalable**: Handles large numbers of campaigns and users
- **Customizable**: Easy to modify UI and behavior
- **Type-safe**: Full TypeScript support with comprehensive interfaces

For any integration questions or customizations needed, the modular design makes it easy to extend and modify individual components without affecting the entire system.
