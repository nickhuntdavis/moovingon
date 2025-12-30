// Quick script to fetch Baserow columns
// Run with: node scripts/fetch-columns.js

const BASEROW_TOKEN = 'laIQcMIWcsVRPguGkFaP2kG6nCsGRIob';
const TABLE_ID = '786250';

async function fetchColumns() {
  try {
    const response = await fetch(
      `https://api.baserow.io/api/database/fields/table/${TABLE_ID}/`,
      {
        headers: {
          'Authorization': `Token ${BASEROW_TOKEN}`,
        },
      }
    );

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`HTTP ${response.status}: ${error}`);
    }

    const fields = await response.json();
    
    console.log('\n📋 BASEROW TABLE COLUMNS\n');
    console.log('='.repeat(60));
    console.log(`Found ${fields.length} column(s):\n`);
    
    fields.forEach((field, index) => {
      console.log(`${index + 1}. ${field.name}`);
      console.log(`   ID: ${field.id}`);
      console.log(`   Type: ${field.type}`);
      
      if (field.type === 'single_select' || field.type === 'multiple_select') {
        console.log(`   Options: ${JSON.stringify(field.select_options || [])}`);
      }
      if (field.type === 'file') {
        console.log(`   File Type: ${field.file_type || 'N/A'}`);
      }
      console.log('');
    });
    
    console.log('='.repeat(60));
    console.log('\n📝 SUGGESTED MAPPING:\n');
    console.log('export const BASEROW_COLUMN_MAPPING = {');
    console.log("  id: 'id',");
    
    // Try to match fields
    const mappings = {
      title: ['title', 'name', 'item name'],
      description: ['description', 'desc', 'details'],
      price: ['price', 'cost'],
      condition: ['condition', 'state'],
      status: ['status', 'state'],
      images: ['images', 'image', 'photos'],
      interestedParties: ['interested parties', 'waitlist'],
      createdAt: ['created_at', 'created at']
    };
    
    Object.entries(mappings).forEach(([key, possibleNames]) => {
      const found = fields.find(f => 
        possibleNames.some(name => 
          f.name.toLowerCase().replace(/\s+/g, '') === name.toLowerCase().replace(/\s+/g, '')
        )
      );
      if (found) {
        console.log(`  ${key}: '${found.name}', // ${found.type}`);
      } else {
        console.log(`  ${key}: '???', // NOT FOUND`);
      }
    });
    
    console.log('};');
    
  } catch (error) {
    console.error('Error:', error.message);
  }
}

fetchColumns();

