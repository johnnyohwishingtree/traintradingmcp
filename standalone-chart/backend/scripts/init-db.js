const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const path = require('path');

// Create database directory if it doesn't exist
const dbDir = path.join(__dirname, '..', 'database');
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const dbPath = path.join(dbDir, 'chart_data.db');
const schemaPath = path.join(dbDir, 'schema.sql');

console.log('🗃️  Initializing database...');
console.log('Database path:', dbPath);

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('❌ Error opening database:', err);
    process.exit(1);
  }
  console.log('✅ Connected to SQLite database');
});

// Read and execute schema sequentially
const schema = fs.readFileSync(schemaPath, 'utf8');
const statements = schema.split(';').filter(stmt => stmt.trim().length > 0);

console.log(`Executing ${statements.length} SQL statements...`);

// Execute statements sequentially to maintain order
let currentIndex = 0;

function executeNext() {
  if (currentIndex >= statements.length) {
    console.log('🎉 Database initialized successfully!');
    console.log('📊 Seeded with popular symbols for caching');
    db.close();
    return;
  }
  
  const statement = statements[currentIndex].trim();
  if (statement.length === 0) {
    currentIndex++;
    executeNext();
    return;
  }
  
  db.run(statement, (err) => {
    if (err) {
      console.error(`❌ Error executing statement ${currentIndex + 1}:`, err);
    } else {
      console.log(`✅ Executed statement ${currentIndex + 1}/${statements.length}`);
    }
    
    currentIndex++;
    executeNext();
  });
}

executeNext();

// Handle cleanup
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down database initialization...');
  db.close();
  process.exit(0);
});