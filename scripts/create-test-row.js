// Create a test row in Baserow with all fields populated
const BASEROW_API_URL = 'https://api.baserow.io/api/database/rows/table';
const BASEROW_TOKEN = 'laIQcMIWcsVRPguGkFaP2kG6nCsGRIob';
const TABLE_ID = '786250';

// Field IDs from your table structure
const FIELD_IDS = {
  Name: 6697990,
  price: 6697991,
  condition: 6697992,
  description: 6698012,
  image_1: 6698029,
  image_2: 6698030,
  image_3: 6698031,
  image_4: 6698032,
  status: 6698033,
  taker_name: 6698034,
  taker_time: 6698037,
  taker_1_name: 6698040,
  taker_1_time: 6698041,
  taker_2_name: 6698042,
  taker_2_time: 6698043,
  taker_3_name: 6698044,
  taker_3_time: 6698045,
};

async function createTestRow() {
  try {
    console.log('🚀 Creating test row in Baserow...\n');

    // Create test data with all fields
    const testRow = {
      [`field_${FIELD_IDS.Name}`]: 'Test Vintage Chair',
      [`field_${FIELD_IDS.description}`]: '<p>A beautiful <strong>test item</strong> with rich HTML description.</p><ul><li>Great condition</li><li>Ready to go</li><li>Perfect for testing</li></ul>',
      [`field_${FIELD_IDS.price}`]: 45,
      [`field_${FIELD_IDS.condition}`]: 'Good as new',
      [`field_${FIELD_IDS.status}`]: 'Reserved',
      
      // Primary taker (first person who expressed interest)
      [`field_${FIELD_IDS.taker_name}`]: 'Sarah Johnson',
      [`field_${FIELD_IDS.taker_time}`]: new Date().toISOString().split('T')[0], // Today's date
      
      // Additional takers
      [`field_${FIELD_IDS.taker_1_name}`]: 'Mike Smith',
      [`field_${FIELD_IDS.taker_1_time}`]: new Date(Date.now() - 86400000).toISOString().split('T')[0], // Yesterday
      
      [`field_${FIELD_IDS.taker_2_name}`]: 'Emma Davis',
      [`field_${FIELD_IDS.taker_2_time}`]: new Date(Date.now() - 172800000).toISOString().split('T')[0], // 2 days ago
      
      // Clear unused taker fields
      [`field_${FIELD_IDS.taker_3_name}`]: null,
      [`field_${FIELD_IDS.taker_3_time}`]: null,
      [`field_${FIELD_IDS.taker_4_name}`]: null,
      [`field_${FIELD_IDS.taker_4_time}`]: null,
      
      // Image fields - file fields, so we'll leave them empty (null)
      [`field_${FIELD_IDS.image_1}`]: null,
      [`field_${FIELD_IDS.image_2}`]: null,
      [`field_${FIELD_IDS.image_3}`]: null,
      [`field_${FIELD_IDS.image_4}`]: null,
    };

    console.log('📋 Test row data:');
    console.log(JSON.stringify(testRow, null, 2));
    console.log('\n📤 Sending to Baserow...\n');

    const response = await fetch(`${BASEROW_API_URL}/${TABLE_ID}/`, {
      method: 'POST',
      headers: {
        'Authorization': `Token ${BASEROW_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testRow),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }

    const created = await response.json();
    
    console.log('✅ Successfully created test row!\n');
    console.log('Created row:');
    console.log(JSON.stringify(created, null, 2));
    console.log('\n📊 Summary:');
    console.log(`  - ID: ${created.id}`);
    console.log(`  - Name: ${created[`field_${FIELD_IDS.Name}`]}`);
    console.log(`  - Price: €${created[`field_${FIELD_IDS.price}`]}`);
    console.log(`  - Status: ${created[`field_${FIELD_IDS.status}`]}`);
    console.log(`  - Primary Taker: ${created[`field_${FIELD_IDS.taker_name}`]}`);

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

createTestRow();

