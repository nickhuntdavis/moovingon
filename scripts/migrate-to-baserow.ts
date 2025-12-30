/**
 * Migration script to upload local data to Baserow
 * Run with: npx tsx scripts/migrate-to-baserow.ts
 */

import baserowService from '../services/baserow';
import { INITIAL_ITEMS } from '../constants';
import { Item } from '../types';

async function migrateToBaserow() {
  console.log('🚀 Starting migration to Baserow...\n');

  // Get local data from localStorage (if available in Node, we'll use INITIAL_ITEMS)
  // In browser, this would read from localStorage
  const localItems: Item[] = INITIAL_ITEMS;

  console.log(`Found ${localItems.length} items to migrate\n`);

  const results = {
    success: 0,
    failed: 0,
    errors: [] as string[],
  };

  for (let i = 0; i < localItems.length; i++) {
    const item = localItems[i];
    console.log(`[${i + 1}/${localItems.length}] Migrating: "${item.title}"...`);

    try {
      // Create item in Baserow (without id and createdAt, Baserow will generate)
      const { id, createdAt, interestedParties, ...itemData } = item;
      const created = await baserowService.createItem({
        ...itemData,
        interestedParties: interestedParties || [],
      });

      console.log(`  ✅ Success! Created with ID: ${created.id}`);
      results.success++;
    } catch (error: any) {
      const errorMsg = error.message || String(error);
      console.error(`  ❌ Failed: ${errorMsg}`);
      results.failed++;
      results.errors.push(`${item.title}: ${errorMsg}`);
    }

    // Small delay to avoid rate limiting
    if (i < localItems.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }

  console.log('\n' + '='.repeat(50));
  console.log('📊 Migration Summary:');
  console.log(`  ✅ Successfully migrated: ${results.success}`);
  console.log(`  ❌ Failed: ${results.failed}`);
  
  if (results.errors.length > 0) {
    console.log('\nErrors:');
    results.errors.forEach(err => console.log(`  - ${err}`));
  }
  console.log('='.repeat(50));
}

// Run migration
migrateToBaserow().catch(console.error);

