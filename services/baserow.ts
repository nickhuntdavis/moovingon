import { Item, Interest, Condition, ItemStatus } from '../types';
import { BASEROW_COLUMN_MAPPING, STATUS_MAPPING, CONDITION_MAPPING } from '../config/baserow-mapping';

const BASEROW_API_URL = 'https://api.baserow.io/api/database/rows/table';
// Use environment variables with fallback for development
const BASEROW_TOKEN = import.meta.env.VITE_BASEROW_TOKEN || 'laIQcMIWcsVRPguGkFaP2kG6nCsGRIob';
const TABLE_ID = import.meta.env.VITE_BASEROW_TABLE_ID || '786250'; // Table: MoovingOn 345196

/**
 * Convert a Baserow S3 image URL to a proxy URL to avoid CORS issues
 * In production (Netlify), use the proxy function. In development, try direct URL first.
 */
function getProxiedImageUrl(url: string): string {
  if (!url) return url;
  
  // Check if URL is from Baserow's S3 bucket (needs proxy)
  const isS3Url = url.includes('baserow-backend') || url.includes('s3.amazonaws.com');
  
  if (isS3Url) {
    // Check if we're in a browser environment
    const isBrowser = typeof window !== 'undefined';
    const isProduction = isBrowser && (window.location.hostname.includes('netlify.app') || window.location.hostname.includes('netlify.com'));
    
    // Use Netlify function proxy in production
    if (isProduction) {
      return `/.netlify/functions/proxy-image?url=${encodeURIComponent(url)}`;
    }
    
    // In development, try direct URL (might work if CORS is configured)
    // If it fails, the browser will show an error, but we can't catch it here
    return url;
  }
  
  // For non-S3 URLs (data URLs, local URLs), return as-is
  return url;
}

interface BaserowRow {
  id: number;
  [key: string]: any; // Dynamic column fields (field_XXXXX format)
}

interface BaserowResponse {
  results: BaserowRow[];
  count: number;
  next?: string;
  previous?: string;
}

interface BaserowField {
  id: number;
  name: string;
  type: string;
  [key: string]: any;
}

class BaserowService {
  private baseUrl: string;
  private token: string;
  private tableId: string;
  private fieldCache: Map<string, BaserowField> | null = null; // Cache: field name -> field definition
  private fieldIdCache: Map<number, BaserowField> | null = null; // Cache: field ID -> field definition

  constructor() {
    this.baseUrl = BASEROW_API_URL;
    this.token = BASEROW_TOKEN;
    this.tableId = TABLE_ID;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}/${this.tableId}${endpoint}`;
    const response = await fetch(url, {
      ...options,
      headers: {
        'Authorization': `Token ${this.token}`,
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      let errorMessage = `Baserow API error: ${response.status} - ${errorText}`;
      
      // Provide helpful error messages for common issues
      if (response.status === 400 && errorText.includes('ERROR_USER_NOT_IN_GROUP')) {
        errorMessage += '\n\n⚠️ Token Permission Issue:\n';
        errorMessage += 'Your token does not have access to the workspace containing this table.\n';
        errorMessage += 'To fix this:\n';
        errorMessage += '1. Go to your Baserow workspace settings\n';
        errorMessage += '2. Add your token to the workspace, OR\n';
        errorMessage += '3. Create a new token with workspace access\n';
        errorMessage += '4. Update the token in services/baserow.ts\n';
        errorMessage += '\nUse the diagnostic tool: /scripts/diagnose-baserow-access.html';
      }
      
      throw new Error(errorMessage);
    }

    return response.json();
  }

  /**
   * Fetch and cache field definitions from Baserow
   * This maps field IDs (field_XXXXX) to field names
   */
  private async fetchFields(): Promise<Map<string, BaserowField>> {
    if (this.fieldCache) {
      console.log('📋 Using cached field definitions');
      return this.fieldCache;
    }

    try {
      console.log('📋 Fetching field definitions from Baserow...');
      const response = await fetch(
        `https://api.baserow.io/api/database/fields/table/${this.tableId}/`,
        {
          headers: {
            'Authorization': `Token ${this.token}`,
          },
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`❌ Failed to fetch fields: ${response.status} - ${errorText}`);
        throw new Error(`Failed to fetch fields: ${response.status} - ${errorText}`);
      }

      const fields: BaserowField[] = await response.json();
      console.log(`✅ Fetched ${fields.length} field definitions`);
      
      // Create caches
      this.fieldCache = new Map();
      this.fieldIdCache = new Map();
      
      fields.forEach(field => {
        // Map by name (normalized)
        const normalized = field.name.toLowerCase().replace(/\s+/g, '');
        this.fieldCache!.set(normalized, field);
        this.fieldCache!.set(field.name, field); // Also store exact name
        
        // Map by ID
        this.fieldIdCache!.set(field.id, field);
        console.log(`  - ${field.name} (ID: ${field.id}, Type: ${field.type})`);
      });

      console.log('✅ Loaded', fields.length, 'field definitions from Baserow');
      return this.fieldCache;
    } catch (error) {
      console.error('❌ Error fetching field definitions:', error);
      throw error;
    }
  }

  /**
   * Get field ID from field name
   */
  private async getFieldId(fieldName: string): Promise<number | null> {
    await this.fetchFields();
    const normalized = fieldName.toLowerCase().replace(/\s+/g, '');
    const field = this.fieldCache?.get(normalized) || this.fieldCache?.get(fieldName);
    return field ? field.id : null;
  }

  /**
   * Get field name from field ID (field_XXXXX)
   */
  private async getFieldName(fieldId: number): Promise<string | null> {
    await this.fetchFields();
    const field = this.fieldIdCache?.get(fieldId);
    return field ? field.name : null;
  }

  /**
   * Check if a field is a file field
   */
  private async isFileField(fieldName: string): Promise<boolean> {
    await this.fetchFields();
    const normalized = fieldName.toLowerCase().replace(/\s+/g, '');
    const field = this.fieldCache?.get(fieldName) || this.fieldCache?.get(normalized);
    return field?.type === 'file';
  }

  /**
   * Convert field ID key (field_XXXXX) to field name
   */
  private async convertRowFieldIdsToNames(row: BaserowRow): Promise<Record<string, any>> {
    await this.fetchFields();
    const converted: Record<string, any> = { id: row.id };
    
    for (const [key, value] of Object.entries(row)) {
      if (key.startsWith('field_')) {
        const fieldId = parseInt(key.replace('field_', ''));
        const fieldName = await this.getFieldName(fieldId);
        if (fieldName) {
          converted[fieldName] = value;
        } else {
          console.warn(`⚠️ Field ID ${fieldId} not found in cache, keeping as ${key}`);
          converted[key] = value; // Keep original if not found
        }
      } else {
        converted[key] = value; // Keep non-field keys as-is
      }
    }
    
    return converted;
  }

  /**
   * Upload a file to Baserow
   * Returns the file reference that can be used in file fields
   */
  async uploadFile(file: File): Promise<any> {
    try {
      console.log(`📤 Uploading file: ${file.name} (${(file.size / 1024).toFixed(2)} KB)`);
      
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch(
        'https://api.baserow.io/api/user-files/upload-file/',
        {
          method: 'POST',
          headers: {
            'Authorization': `Token ${this.token}`,
            // Don't set Content-Type - let browser set it with boundary for FormData
          },
          body: formData,
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`File upload failed: ${response.status} - ${errorText}`);
      }

      const result = await response.json();
      console.log(`✅ File uploaded: ${result.name || file.name}`);
      return result;
    } catch (error) {
      console.error('Error uploading file:', error);
      throw error;
    }
  }

  /**
   * Convert data URL to File object
   */
  private dataURLtoFile(dataUrl: string, filename: string = 'image.jpg'): File {
    const arr = dataUrl.split(',');
    const mime = arr[0].match(/:(.*?);/)?.[1] || 'image/jpeg';
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    return new File([u8arr], filename, { type: mime });
  }

  /**
   * Get table fields/columns to understand the schema
   */
  async getTableFields(): Promise<BaserowField[]> {
    await this.fetchFields();
    return Array.from(this.fieldIdCache!.values());
  }

  /**
   * Fetch all items from Baserow
   */
  async getAllItems(): Promise<Item[]> {
    try {
      console.log('📥 Fetching items from Baserow...');
      const data = await this.request<BaserowResponse>('/?size=200');
      console.log(`✅ Fetched ${data.results.length} rows from Baserow`);
      
      // Ensure fields are loaded first
      await this.fetchFields();
      
      // Convert field IDs to names, then map to Item
      const items = await Promise.all(
        data.results.map(async (row, index) => {
          try {
            const convertedRow = await this.convertRowFieldIdsToNames(row);
            const item = this.mapRowToItem(convertedRow);
            console.log(`✅ Mapped row ${index + 1}: ${item.title || 'Untitled'}`);
            return item;
          } catch (err) {
            console.error(`❌ Error mapping row ${index + 1}:`, err);
            // Return a minimal item to prevent complete failure
            return {
              id: row.id.toString(),
              title: `Error loading item ${row.id}`,
              description: '',
              price: 0,
              condition: 'Good as new' as Condition,
              status: 'AVAILABLE' as ItemStatus,
              images: [],
              interestedParties: [],
              createdAt: Date.now(),
            };
          }
        })
      );
      
      console.log(`✅ Successfully loaded ${items.length} items`);
      return items;
    } catch (error) {
      console.error('❌ Error fetching items from Baserow:', error);
      throw error;
    }
  }

  /**
   * Create a new item in Baserow
   */
  async createItem(item: Omit<Item, 'id' | 'createdAt' | 'interestedParties'> & { interestedParties?: Interest[] }): Promise<Item> {
    try {
      const itemWithDefaults: Item = {
        ...item,
        id: 'temp', // Will be replaced by Baserow
        interestedParties: item.interestedParties || [],
        createdAt: Date.now(),
      };
      const rowData = await this.mapItemToRow(itemWithDefaults);
      // Remove id from rowData since Baserow will generate it
      delete rowData.id;
      const created = await this.request<BaserowRow>('/', {
        method: 'POST',
        body: JSON.stringify(rowData),
      });
      const convertedRow = await this.convertRowFieldIdsToNames(created);
      return this.mapRowToItem(convertedRow);
    } catch (error) {
      console.error('Error creating item in Baserow:', error);
      throw error;
    }
  }

  /**
   * Update an existing item in Baserow
   */
  async updateItem(item: Item): Promise<Item> {
    try {
      const rowData = await this.mapItemToRow(item);
      // Don't include id in update
      delete rowData.id;
      const updated = await this.request<BaserowRow>(`/${item.id}/`, {
        method: 'PATCH',
        body: JSON.stringify(rowData),
      });
      const convertedRow = await this.convertRowFieldIdsToNames(updated);
      return this.mapRowToItem(convertedRow);
    } catch (error) {
      console.error('Error updating item in Baserow:', error);
      throw error;
    }
  }

  /**
   * Delete an item from Baserow
   */
  async deleteItem(id: string): Promise<void> {
    try {
      await this.request(`/${id}/`, {
        method: 'DELETE',
      });
    } catch (error) {
      console.error('Error deleting item from Baserow:', error);
      throw error;
    }
  }

  /**
   * Map Baserow row to Item interface
   * Handles multiple image fields and taker fields
   */
  private mapRowToItem(row: BaserowRow | Record<string, any>): Item {
    const getField = (fieldName: string, defaultValue: any = '') => {
      if (row[fieldName] !== undefined && row[fieldName] !== null && row[fieldName] !== '') {
        return row[fieldName];
      }
      return defaultValue;
    };

    // Collect images from multiple image fields
    const images: string[] = [];
    for (let i = 1; i <= 4; i++) {
      const imageField = getField(`image_${i}`);
      if (imageField) {
        // Baserow file fields return an array of file objects
        if (Array.isArray(imageField) && imageField.length > 0) {
          imageField.forEach((file: any) => {
            if (file.url) {
              // Use proxy URL to avoid CORS issues with S3
              images.push(getProxiedImageUrl(file.url));
            } else if (typeof file === 'string') {
              images.push(getProxiedImageUrl(file));
            }
          });
        } else if (typeof imageField === 'string') {
          images.push(getProxiedImageUrl(imageField));
        }
      }
    }

    // Collect interested parties from taker fields
    // Parse format: "Name, Taker" or "Name, Interested"
    const interestedParties: Interest[] = [];
    
    // Helper to parse name and extract type and question
    const parseTakerName = (formattedName: string): { name: string; type: 'TAKE' | 'INTEREST'; question?: string } => {
      if (!formattedName) return { name: '', type: 'TAKE' };
      
      // Check if it contains ", Taker" or ", Interested"
      if (formattedName.includes(', Taker')) {
        const name = formattedName.replace(', Taker', '').trim();
        return { name, type: 'TAKE' };
      } else if (formattedName.includes(', Interested')) {
        // Check if there's a question (format: "Name, Interested - Question")
        if (formattedName.includes(' - ')) {
          const parts = formattedName.split(' - ');
          const namePart = parts[0].replace(', Interested', '').trim();
          const question = parts.slice(1).join(' - ').trim(); // Join in case question contains " - "
          return { name: namePart, type: 'INTEREST', question };
        } else {
          const name = formattedName.replace(', Interested', '').trim();
          return { name, type: 'INTEREST' };
        }
      }
      
      // Fallback: if no label, assume it's a taker (for backward compatibility)
      return { name: formattedName.trim(), type: 'TAKE' };
    };
    
    // Collect interested parties from numbered taker fields (taker_1_name, taker_2_name, etc.)
    for (let i = 1; i <= 4; i++) {
      const nameField = getField(`taker_${i}_name`);
      const timeField = getField(`taker_${i}_time`);
      if (nameField) {
        const { name, type, question } = parseTakerName(nameField);
        if (name) {
          interestedParties.push({
            name,
            timestamp: timeField ? new Date(timeField).getTime() : Date.now(),
            type,
            question,
          });
        }
      }
    }

    // Map status value
    // Baserow single_select fields return objects: {id, value, color}
    const statusField = getField(BASEROW_COLUMN_MAPPING.status, 'Available');
    const statusValue = typeof statusField === 'object' && statusField?.value 
      ? statusField.value 
      : (typeof statusField === 'string' ? statusField : 'Available');
    const status = STATUS_MAPPING[statusValue] || 'AVAILABLE';

    // Map condition value
    // Baserow single_select fields return objects: {id, value, color}
    const conditionField = getField(BASEROW_COLUMN_MAPPING.condition, 'Good as new');
    const conditionValue = typeof conditionField === 'object' && conditionField?.value 
      ? conditionField.value 
      : (typeof conditionField === 'string' ? conditionField : 'Good as new');
    
    // Handle both "Well loved" (Baserow) and "Well Loved" (app)
    const condition = CONDITION_MAPPING[conditionValue] || 
                      (typeof conditionValue === 'string' && CONDITION_MAPPING[conditionValue.replace('loved', 'Loved')]) || 
                      conditionValue;

    return {
      id: row.id.toString(),
      title: getField(BASEROW_COLUMN_MAPPING.title, ''),
      description: getField(BASEROW_COLUMN_MAPPING.description, ''),
      price: parseFloat(getField(BASEROW_COLUMN_MAPPING.price, 0)),
      condition: condition as Condition,
      status: status,
      images: images,
      interestedParties: interestedParties,
      createdAt: Date.now(), // No createdAt field in Baserow
    };
  }

  /**
   * Map Item interface to Baserow row format
   * Converts field names to field IDs and handles multiple image/taker fields
   */
  private async mapItemToRow(item: Item): Promise<Record<string, any>> {
    await this.fetchFields();
    const row: Record<string, any> = {};
    
    // Helper to set field by name
    const setField = async (fieldName: string, value: any) => {
      const fieldId = await this.getFieldId(fieldName);
      if (fieldId) {
        // Check if it's a file field
        const isFile = await this.isFileField(fieldName);
        if (isFile) {
          // For file fields, only accept arrays of file objects (from upload)
          // Skip URL strings - they should have been uploaded already
          if (typeof value === 'string' && (value.startsWith('http') || value.startsWith('data:'))) {
            console.warn(`⚠️ Skipping file field "${fieldName}" - URLs must be uploaded first.`);
            return; // Don't set the field
          }
          // File fields expect array format
          if (Array.isArray(value)) {
            row[`field_${fieldId}`] = value;
          } else if (value) {
            // Single file object - wrap in array
            row[`field_${fieldId}`] = [value];
          }
        } else {
          // Non-file field - set directly
          row[`field_${fieldId}`] = value;
        }
      } else {
        console.warn(`Field "${fieldName}" not found in Baserow table.`);
      }
    };

    // Basic fields
    await setField(BASEROW_COLUMN_MAPPING.title, item.title);
    await setField(BASEROW_COLUMN_MAPPING.description, item.description || '');
    await setField(BASEROW_COLUMN_MAPPING.price, item.price);
    
    // Map condition value (reverse mapping: App -> Baserow)
    // App uses "Well Loved" (capital L), Baserow uses "Well loved" (lowercase l)
    let conditionValue: string;
    if (item.condition === 'Well Loved') {
      conditionValue = 'Well loved'; // Convert to Baserow format
    } else {
      // For "Good as new" and "Fair", they match exactly
      conditionValue = item.condition;
    }
    await setField(BASEROW_COLUMN_MAPPING.condition, conditionValue);
    
    // Map status value (reverse mapping)
    const statusValue = Object.entries(STATUS_MAPPING).find(([_, v]) => v === item.status)?.[0] || 'Available';
    await setField(BASEROW_COLUMN_MAPPING.status, statusValue);

    // Handle images - upload files to Baserow first, then reference them
    // Images can be: File objects, data URLs (from camera), or URLs (external)
    const uploadedImageRefs: any[] = [];
    
    for (let i = 0; i < Math.min(item.images.length, 4); i++) {
      const imageValue = item.images[i];
      if (!imageValue) continue;
      
      try {
        let fileRef: any = null;
        
        if (typeof imageValue === 'string') {
          if (imageValue.startsWith('data:')) {
            // Data URL from camera - convert to File and upload
            console.log(`📸 Converting data URL to file for image_${i + 1}...`);
            const file = this.dataURLtoFile(imageValue, `image_${i + 1}.jpg`);
            fileRef = await this.uploadFile(file);
          } else if (imageValue.startsWith('http://') || imageValue.startsWith('https://')) {
            // External URL - fetch, convert to File, and upload
            console.log(`🌐 Fetching external image: ${imageValue}...`);
            try {
              const response = await fetch(imageValue);
              const blob = await response.blob();
              const file = new File([blob], `image_${i + 1}.jpg`, { type: blob.type || 'image/jpeg' });
              fileRef = await this.uploadFile(file);
            } catch (err) {
              console.warn(`⚠️ Could not fetch external image ${imageValue}, skipping:`, err);
              // Skip this image
            }
          }
        } else if (imageValue && typeof imageValue === 'object' && 'size' in imageValue && 'name' in imageValue) {
          // Already a File object - upload directly
          fileRef = await this.uploadFile(imageValue as File);
        } else if (imageValue && typeof imageValue === 'object') {
          // Already a Baserow file reference - use as-is
          fileRef = imageValue;
        }
        
        if (fileRef) {
          // Baserow file upload returns a file object with specific structure
          // Use the uploaded file reference directly
          uploadedImageRefs.push(fileRef);
        }
      } catch (err) {
        console.error(`❌ Error processing image ${i + 1}:`, err);
        // Continue with other images
      }
    }
    
    // Set uploaded file references to image fields
    for (let i = 1; i <= 4; i++) {
      const imageField = `image_${i}`;
      const fileRef = uploadedImageRefs[i - 1];
      
      if (fileRef) {
        // Baserow expects array format for file fields
        await setField(imageField, [fileRef]);
      } else {
        // Don't set null - preserve existing images when editing
        // Only clear if explicitly needed
      }
    }

    // Split interested parties into taker fields
    // Format: "Name, Taker" or "Name, Interested" (or "Name, Interested - Question" if question exists)
    // Store in sequence: taker_1_name (first), then taker_2_name, taker_3_name, etc.
    
    if (item.interestedParties.length > 0) {
      // Store all interested parties in numbered fields starting from taker_1_name
      for (let i = 1; i <= 4; i++) {
        const party = item.interestedParties[i - 1]; // i-1 because array is 0-indexed
        if (party) {
          const label = party.type === 'TAKE' ? 'Taker' : 'Interested';
          // Include question if it exists and type is INTEREST
          const nameFormatted = party.question && party.type === 'INTEREST'
            ? `${party.name}, ${label} - ${party.question}`
            : `${party.name}, ${label}`;
          await setField(`taker_${i}_name`, nameFormatted);
          await setField(`taker_${i}_time`, new Date(party.timestamp).toISOString().split('T')[0]);
        } else {
          // Clear unused taker fields
          await setField(`taker_${i}_name`, null);
          await setField(`taker_${i}_time`, null);
        }
      }
    } else {
      // No interested parties - clear all taker fields
      for (let i = 1; i <= 4; i++) {
        await setField(`taker_${i}_name`, null);
        await setField(`taker_${i}_time`, null);
      }
    }

    return row;
  }

  /**
   * Parse images from Baserow format (could be JSON string, array, or file field)
   */
  private parseImages(images: any): string[] {
    if (!images) return [];
    if (typeof images === 'string') {
      try {
        const parsed = JSON.parse(images);
        return Array.isArray(parsed) ? parsed : [parsed];
      } catch {
        return [images];
      }
    }
    if (Array.isArray(images)) {
      return images.map(img => {
        if (typeof img === 'string') return img;
        if (img.url) return img.url;
        return String(img);
      });
    }
    return [];
  }

  /**
   * Serialize images for Baserow
   * Currently stores as JSON string (for URL-based images)
   * For file uploads, this would need to upload files first and return file IDs
   */
  private serializeImages(images: string[]): string {
    if (images.length === 0) return '';
    // Store as JSON string for now
    // TODO: If using Baserow file field, upload files and return file references
    return JSON.stringify(images);
  }

  /**
   * Parse interested parties from Baserow format
   */
  private parseInterestedParties(parties: any): Interest[] {
    if (!parties) return [];
    if (typeof parties === 'string') {
      try {
        return JSON.parse(parties);
      } catch {
        return [];
      }
    }
    if (Array.isArray(parties)) {
      return parties;
    }
    return [];
  }
}

export const baserowService = new BaserowService();
export default baserowService;

