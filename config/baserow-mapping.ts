/**
 * Baserow column mapping configuration
 * Update these field names to match your actual Baserow table columns
 * 
 * To find your column names:
 * 1. Go to your Baserow table
 * 2. Check the column names (they may have spaces or different casing)
 * 3. Update the mappings below
 */

export const BASEROW_COLUMN_MAPPING = {
  // Item identification
  id: 'id',
  
  // Basic item fields
  title: 'Name',
  description: 'description',
  price: 'price',
  condition: 'condition',
  status: 'status',
  
  // Media fields - multiple image fields (file fields)
  image_1: 'image_1',
  image_2: 'image_2',
  image_3: 'image_3',
  image_4: 'image_4',
  
  // Interested parties - primary taker (first person who expressed interest)
  taker_name: 'taker_name',
  taker_time: 'taker_time',
  
  // Additional interested parties - stored as separate numbered taker fields
  taker_1_name: 'taker_1_name',
  taker_1_time: 'taker_1_time',
  taker_2_name: 'taker_2_name',
  taker_2_time: 'taker_2_time',
  taker_3_name: 'taker_3_name',
  taker_3_time: 'taker_3_time',
  taker_4_name: 'taker_4_name',
  taker_4_time: 'taker_4_time',
};

/**
 * Status value mapping: Baserow values -> App values
 */
export const STATUS_MAPPING: Record<string, 'AVAILABLE' | 'RESERVED' | 'TAKEN'> = {
  'Available': 'AVAILABLE',
  'Reserved': 'RESERVED',
  'Taken': 'TAKEN',
};

/**
 * Condition value mapping: Baserow values -> App Condition enum
 * Note: Baserow has "Well loved" (lowercase 'l'), app uses "Well Loved" (capital 'L')
 */
export const CONDITION_MAPPING: Record<string, string> = {
  'Good as new': 'Good as new',
  'Fair': 'Fair',
  'Well loved': 'Well Loved', // Baserow value -> App value
  'Well Loved': 'Well Loved', // Also handle if already capitalized
};

/**
 * Field type hints for Baserow columns
 * This helps with proper serialization/deserialization
 */
export const FIELD_TYPES = {
  [BASEROW_COLUMN_MAPPING.title]: 'text',
  [BASEROW_COLUMN_MAPPING.description]: 'long_text',
  [BASEROW_COLUMN_MAPPING.price]: 'number',
  [BASEROW_COLUMN_MAPPING.condition]: 'single_select', // or 'text'
  [BASEROW_COLUMN_MAPPING.status]: 'single_select', // or 'text'
  [BASEROW_COLUMN_MAPPING.images]: 'file', // Multiple files
  [BASEROW_COLUMN_MAPPING.interestedParties]: 'long_text', // JSON stored as text
  [BASEROW_COLUMN_MAPPING.createdAt]: 'date',
};

