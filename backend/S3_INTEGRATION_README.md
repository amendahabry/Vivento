# S3 Integration with Signed URLs

This project has been updated to use Amazon S3 for photo storage with signed URLs for secure access.

## Overview

The photo management system now:
- Stores photos in S3 instead of Google Drive
- Uses presigned URLs for secure, time-limited access
- Implements proper S3 service abstraction
- Provides consistent API endpoints for photo management

## Key Changes

### 1. S3 Service (`services/s3Service.js`)
- Added `getPhotoPresignedUrl()` method for generating secure URLs
- Added `uploadPhoto()` method specifically for photo uploads
- Added `deletePhoto()` method for photo deletion
- All methods include proper error handling and logging

### 2. Photo Controller (`controllers/photoController.js`)
- Updated to use S3 service methods
- Photos are now stored with S3 keys instead of direct URLs
- All photo retrieval endpoints now return presigned URLs
- Presigned URLs expire after 5 minutes (300 seconds) for security

### 3. Invitation Image Controller (`controllers/invitationImageController.js`)
- Updated to use S3 service methods
- Invitation images now use presigned URLs
- Presigned URLs expire after 5 minutes for regular access, 30 seconds for WhatsApp

### 4. Database Schema
- Added `status` column to photos table for soft deletion
- `file_id` now stores S3 keys instead of Google Drive file IDs
- Maintained backward compatibility with existing fields

## API Endpoints

### Photo Management
- `POST /api/photos/upload` - Upload photo (returns S3 key)
- `GET /api/photos/event/:eventId` - Get event photos (returns presigned URLs)
- `GET /api/photos/user/:eventId/:deviceId` - Get user photos (returns presigned URLs)
- `GET /api/photos/:photoId/presigned` - Get presigned URL for specific photo
- `GET /api/photos/event/:eventId/stats` - Get event album statistics and sync status
- `DELETE /api/photos/:photoId` - Delete photo

### Invitation Images
- `POST /api/events/:eventId/invitation-image` - Upload invitation image
- `GET /api/events/:eventId/invitation-image` - Get invitation image (returns presigned URL)
- `DELETE /api/events/:eventId/invitation-image` - Delete invitation image

## Presigned URL Security

- **Regular photos**: 5 minutes (300 seconds) expiration
- **Invitation photos**: 30 seconds expiration for WhatsApp sharing
- URLs are generated on-demand and cannot be reused after expiration
- Each request generates a new, unique URL

## Album Management and Monitoring

### Album Statistics
The system provides comprehensive monitoring of event albums:

- **Photo counts**: Track total photos in S3 vs. database
- **Storage usage**: Monitor total and average file sizes
- **Sync status**: Verify database and S3 are in sync
- **Performance metrics**: Track upload patterns and storage growth

### Album Organization Benefits
- **Event isolation**: Each event has its own album folder
- **Easy cleanup**: Delete entire events by removing S3 folders
- **Backup management**: Selective backup of specific events
- **Cost tracking**: Monitor storage costs per event
- **Performance**: Efficient S3 operations within event prefixes

## Environment Variables

Ensure these are set in your `.env` file:

```env
S3_ACCESS_KEY_ID=your_access_key
S3_SECRET_ACCESS_KEY=your_secret_key
S3_REGION=your_region
S3_BUCKET=your_bucket_name
```

## Testing

Run the S3 service test:

```bash
cd backend
node test-s3.js
```

## Migration Notes

1. Existing photos will continue to work but will need to be re-uploaded to S3
2. The system gracefully handles missing S3 objects
3. Database schema changes are backward compatible

## Benefits

- **Security**: Photos are not publicly accessible
- **Performance**: S3 provides fast, reliable storage
- **Scalability**: S3 can handle large numbers of photos
- **Cost**: Pay only for storage and bandwidth used
- **Compliance**: Better control over data access and retention

## Troubleshooting

### Common Issues

1. **S3 credentials error**: Check your `.env` file and AWS credentials
2. **Presigned URL generation fails**: Verify S3 bucket permissions
3. **Photos not displaying**: Check if S3 objects exist and are accessible

### Debug Mode

Enable debug logging by setting:
```env
DEBUG=s3:*
```

## Future Enhancements

- Add image resizing and optimization
- Implement CDN integration for better performance
- Add photo metadata and tagging
- Implement photo versioning and rollback 

## S3 Folder Organization

The S3 bucket is organized with the following structure:

```
vivento-event-photos/
├── events/
│   ├── {eventId1}/
│   │   ├── album/
│   │   │   ├── {timestamp}_{random}.jpg
│   │   │   ├── {timestamp}_{random}.png
│   │   │   └── ...
│   │   └── invitation_image/
│   │       └── {timestamp}_{random}.jpg
│   ├── {eventId2}/
│   │   ├── album/
│   │   │   └── ...
│   │   └── invitation_image/
│   │       └── ...
│   └── ...
```

### Folder Structure Details:

- **`events/{eventId}/album/`**: Contains all photos uploaded by guests for a specific event
- **`events/{eventId}/invitation_image/`**: Contains the invitation image for a specific event
- **File naming**: `{timestamp}_{random}.{extension}` ensures unique names and chronological ordering

### Benefits of This Structure:

- **Organization**: Photos are clearly separated by event
- **Scalability**: Each event has its own folder, preventing conflicts
- **Management**: Easy to manage, backup, or delete entire events
- **Performance**: S3 can efficiently handle requests within specific prefixes 