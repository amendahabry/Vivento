# Visit Tracking System

This project now includes a comprehensive, automatic visit tracking system that monitors user behavior across all pages.

## How It Works

### Automatic Tracking (Recommended)
The `RouteTrackingService` automatically tracks all page visits without any additional code needed:

1. **Injected in AppComponent** - Automatically starts tracking when the app loads
2. **Router Event Monitoring** - Listens to all route changes and tracks page visits
3. **Session Management** - Maintains device ID and session ID across page navigations
4. **Duration Tracking** - Updates visit duration every 30 seconds

### Manual Custom Tracking (Optional)
If you need to track specific events or add custom data, you can use the service directly:

```typescript
import { RouteTrackingService } from '../../core/services/route-tracking.service';

export class YourComponent {
  constructor(private routeTrackingService: RouteTrackingService) {}

  trackCustomEvent() {
    this.routeTrackingService.trackCustomPageVisit('Custom Event', {
      eventType: 'button_click',
      buttonName: 'submit_form',
      additionalData: 'any custom data'
    });
  }
}
```

## What Gets Tracked

### Basic Visit Data
- Device ID (fingerprint-based)
- User Agent
- Language
- Screen Resolution
- Timezone
- Referrer
- Page URL
- Session ID

### Enhanced Page Data
- Page Name (friendly name)
- Page Path (clean URL)
- Previous Page
- Navigation Type (navigate/reload/back_forward)

### Session Management
- Visit duration (updated every 30 seconds)
- Cross-page session continuity
- Device persistence across visits

## Backend Integration

The system sends data to these endpoints:
- `POST /visits/track` - Basic visit tracking
- `POST /visits/track-page` - Enhanced page visit tracking
- `PUT /visits/duration` - Duration updates

## Configuration

### Excluded IPs/Devices
Certain device IDs are excluded from tracking (as per your original implementation):
- `4120798b`
- `3903319c`
- `46fa0ecc`

### Page Name Mapping
The service automatically maps URLs to friendly names:
- `/home` → "Home"
- `/contact` → "Contact"
- `/user-dashboard` → "User Dashboard"
- `/event/:id` → "Event RSVP"
- `/upload-photos/:id` → "Photo Upload"

## Benefits

1. **Zero Maintenance** - Works automatically across all pages
2. **Comprehensive Coverage** - Tracks every page visit
3. **Performance Optimized** - Minimal overhead, efficient tracking
4. **Extensible** - Easy to add custom tracking when needed
5. **Session Aware** - Maintains context across page navigations
6. **Clean Data** - Structured, consistent visit data

## Migration from Old System

The old manual tracking in individual components has been removed. The new system:
- Automatically handles all the functionality
- Provides better data consistency
- Reduces code duplication
- Improves maintainability

No changes needed in existing components - they automatically get tracked! 