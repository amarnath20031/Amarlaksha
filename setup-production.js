import { execSync } from 'child_process';
import { Pool } from '@neondatabase/serverless';

async function setupProduction() {
  console.log('Setting up production environment...');
  
  try {
    // Ensure database schema is up to date
    console.log('Updating database schema...');
    execSync('npm run db:push', { stdio: 'inherit' });
    
    // Create sessions table if it doesn't exist
    if (process.env.DATABASE_URL) {
      const pool = new Pool({ connectionString: process.env.DATABASE_URL });
      
      console.log('Creating sessions table...');
      await pool.query(`
        CREATE TABLE IF NOT EXISTS sessions (
          sid VARCHAR PRIMARY KEY,
          sess JSONB NOT NULL,
          expire TIMESTAMP NOT NULL
        );
        CREATE INDEX IF NOT EXISTS "IDX_session_expire" ON sessions (expire);
      `);
      
      // Insert default categories
      console.log('Setting up default categories...');
      await pool.query(`
        INSERT INTO categories (name, icon, color, is_default) VALUES 
        ('Food & Dining', 'fas fa-utensils', 'red', true),
        ('Transport', 'fas fa-car', 'blue', true),
        ('Groceries', 'fas fa-shopping-cart', 'green', true),
        ('Entertainment', 'fas fa-film', 'purple', true),
        ('Health', 'fas fa-heartbeat', 'pink', true),
        ('Shopping', 'fas fa-shopping-bag', 'orange', true),
        ('Petrol', 'fas fa-gas-pump', 'yellow', true),
        ('Mobile Recharge', 'fas fa-mobile-alt', 'indigo', true)
        ON CONFLICT (name) DO NOTHING;
      `);
      
      await pool.end();
      console.log('Database setup completed successfully');
    }
  } catch (error) {
    console.error('Production setup failed:', error);
    process.exit(1);
  }
}

setupProduction();