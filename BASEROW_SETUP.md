# Baserow Integration Setup

This app is now integrated with Baserow for persistent cloud storage. Follow these steps to complete the setup:

## Step 1: Check Your Baserow Table Columns

The app needs to know the exact column names in your Baserow table. To find them:

1. Go to your Baserow table "MoovingOn 345196"
2. Look at the column headers
3. Note the exact names (case-sensitive, including spaces)

## Step 2: Update Column Mappings

Edit `config/baserow-mapping.ts` and update the `BASEROW_COLUMN_MAPPING` object with your actual column names:

```typescript
export const BASEROW_COLUMN_MAPPING = {
  id: 'id', // Baserow's internal ID (usually 'id')
  title: 'Your Title Column Name', // e.g., 'Title', 'Item Name', 'name'
  description: 'Your Description Column Name', // e.g., 'Description', 'details'
  price: 'Your Price Column Name', // e.g., 'Price', 'price'
  condition: 'Your Condition Column Name', // e.g., 'Condition', 'condition'
  status: 'Your Status Column Name', // e.g., 'Status', 'status'
  images: 'Your Images Column Name', // e.g., 'Images', 'Photos', 'image'
  interestedParties: 'Your Waitlist Column Name', // e.g., 'Interested Parties', 'Waitlist'
  createdAt: 'Your Created Date Column Name', // e.g., 'Created At', 'created_at'
};
```

## Step 3: Column Types

Your Baserow table should have these column types:

- **Title**: Text field
- **Description**: Long text field (supports HTML)
- **Price**: Number field
- **Condition**: Single select or Text field
- **Status**: Single select or Text field (values: AVAILABLE, RESERVED, TAKEN)
- **Images**: Long text field (stores JSON array of image URLs) OR File field (for proper file uploads)
- **Interested Parties**: Long text field (stores JSON array)
- **Created At**: Date field (optional, auto-generated)

## Step 4: Image Storage

Currently, images are stored as JSON arrays of URLs in a text field. This works for:
- External URLs (like Unsplash images)
- Data URLs (from camera captures)

For production, consider:
1. Using Baserow's file field type
2. Uploading images to a cloud storage service (S3, Cloudinary, etc.)
3. Storing only the URLs in Baserow

## Step 5: Test the Integration

1. Start the app: `npm run dev`
2. Try adding a new item
3. Check your Baserow table to see if it appears
4. Verify all fields are mapped correctly

## Troubleshooting

### Items not loading?
- Check browser console for errors
- Verify your Baserow token is correct
- Check that table ID is correct (345196)
- Ensure column names match exactly

### Items not saving?
- Check browser console for API errors
- Verify column names in `config/baserow-mapping.ts`
- Check Baserow API permissions for your token

### Images not showing?
- Verify the images column stores JSON arrays
- Check that image URLs are accessible
- For blob URLs, they may expire - consider uploading to permanent storage

## API Configuration

The Baserow API is configured in `services/baserow.ts`:
- **API URL**: `https://api.baserow.io/api/database/rows/table`
- **Token**: `laIQcMIWcsVRPguGkFaP2kG6nCsGRIob`
- **Table ID**: `345196`

## Next Steps

1. ✅ Baserow integration complete
2. ⏳ Update column mappings based on your table
3. ⏳ Test CRUD operations
4. ⏳ Consider image upload improvements (optional)

