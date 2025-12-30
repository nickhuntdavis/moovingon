// Utility script to check Baserow table structure
// Run with: npx tsx scripts/check-baserow-table.ts

const BASEROW_TOKEN = 'laIQcMIWcsVRPguGkFaP2kG6nCsGRIob';
const TABLE_ID = '345196';

async function checkTableStructure() {
  try {
    // Get table info
    const tableResponse = await fetch(
      `https://api.baserow.io/api/database/tables/${TABLE_ID}/`,
      {
        headers: {
          'Authorization': `Token ${BASEROW_TOKEN}`,
        },
      }
    );

    if (!tableResponse.ok) {
      throw new Error(`Failed to fetch table: ${tableResponse.status}`);
    }

    const tableData = await tableResponse.json();
    console.log('\n=== TABLE INFO ===');
    console.log('Table Name:', tableData.name);
    console.log('Table ID:', tableData.id);
    console.log('\n=== COLUMNS ===');
    
    // Get fields/columns
    const fieldsResponse = await fetch(
      `https://api.baserow.io/api/database/fields/table/${TABLE_ID}/`,
      {
        headers: {
          'Authorization': `Token ${BASEROW_TOKEN}`,
        },
      }
    );

    if (!fieldsResponse.ok) {
      throw new Error(`Failed to fetch fields: ${fieldsResponse.status}`);
    }

    const fields = await fieldsResponse.json();
    fields.forEach((field: any, index: number) => {
      console.log(`\n${index + 1}. ${field.name}`);
      console.log(`   Type: ${field.type}`);
      console.log(`   ID: ${field.id}`);
      if (field.type === 'file') {
        console.log(`   File Type: ${field.file_type || 'N/A'}`);
      }
    });

    // Get a sample row to see the data structure
    console.log('\n=== SAMPLE ROWS ===');
    const rowsResponse = await fetch(
      `https://api.baserow.io/api/database/rows/table/${TABLE_ID}/?size=3`,
      {
        headers: {
          'Authorization': `Token ${BASEROW_TOKEN}`,
        },
      }
    );

    if (rowsResponse.ok) {
      const rowsData = await rowsResponse.json();
      if (rowsData.results && rowsData.results.length > 0) {
        console.log('\nSample row structure:');
        console.log(JSON.stringify(rowsData.results[0], null, 2));
      } else {
        console.log('No rows found in table');
      }
    }

  } catch (error) {
    console.error('Error:', error);
  }
}

checkTableStructure();

