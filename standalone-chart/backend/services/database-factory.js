const SQLiteDatabase = require('./database');
const PostgresDatabase = require('./database-postgres');

class DatabaseFactory {
  static create(type = null) {
    // Determine database type from environment or parameter
    const dbType = type || process.env.DB_TYPE || 'sqlite';
    
    console.log(`🏭 Database Factory: Creating ${dbType.toUpperCase()} database connection`);
    
    switch (dbType.toLowerCase()) {
      case 'postgres':
      case 'postgresql':
        return new PostgresDatabase();
        
      case 'sqlite':
      case 'sqlite3':
        return new SQLiteDatabase();
        
      default:
        console.warn(`⚠️ Unknown database type: ${dbType}, falling back to SQLite`);
        return new SQLiteDatabase();
    }
  }
  
  // Convenience methods
  static createSQLite() {
    return new SQLiteDatabase();
  }
  
  static createPostgreSQL(config = null) {
    return new PostgresDatabase(config);
  }
  
  // Get recommended database type based on environment
  static getRecommendedType() {
    const nodeEnv = process.env.NODE_ENV || 'development';
    
    switch (nodeEnv) {
      case 'production':
        return 'postgres'; // Always use PostgreSQL in production
        
      case 'test':
        return 'sqlite'; // Use SQLite for fast tests
        
      case 'development':
      default:
        return process.env.DB_TYPE || 'postgres'; // Default to PostgreSQL for development
    }
  }
  
  // Health check for current database
  static async healthCheck(db) {
    try {
      if (db.testConnection) {
        await db.testConnection();
        return { healthy: true, type: db.constructor.name };
      } else {
        // For SQLite or other databases without testConnection
        await db.getAllSymbols();
        return { healthy: true, type: db.constructor.name };
      }
    } catch (error) {
      return { 
        healthy: false, 
        type: db.constructor.name,
        error: error.message 
      };
    }
  }
}

module.exports = DatabaseFactory;