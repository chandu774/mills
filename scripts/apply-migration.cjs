const fs = require('fs');
const path = require('path');
const { Client } = require('pg');

async function main() {
  const dbPassword = process.argv[2] || process.env.SUPABASE_DB_PASSWORD;

  if (!dbPassword) {
    console.error('Usage: node scripts/apply-migration.cjs <DATABASE_PASSWORD>');
    console.error('Or set SUPABASE_DB_PASSWORD environment variable.');
    process.exit(1);
  }

  const migrationFile = path.resolve(__dirname, '../supabase/migrations/20260908183000_fix_username_setup_rpcs.sql');
  const sql = fs.readFileSync(migrationFile, 'utf8');

  console.log('Connecting to Supabase PostgreSQL at aws-0-ap-northeast-1.pooler.supabase.com:5432 ...');

  const client = new Client({
    host: 'aws-0-ap-northeast-1.pooler.supabase.com',
    port: 5432,
    user: 'postgres.zacnqnodiljmxrxfonnh',
    password: dbPassword,
    database: 'postgres',
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 10000,
  });

  try {
    await client.connect();
    console.log('Connected successfully! Applying migration 20260908183000_fix_username_setup_rpcs.sql ...');
    
    await client.query(sql);
    console.log('Migration successfully applied to Supabase database!');

    // Verify RPC functions exist
    const res = await client.query(`
      SELECT routine_name 
      FROM information_schema.routines 
      WHERE routine_schema = 'public' 
        AND routine_name IN ('check_username_available', 'set_user_username');
    `);

    console.log('Verified RPC functions in Supabase:');
    res.rows.forEach(r => console.log('  - ' + r.routine_name));

  } catch (err) {
    console.error('Failed to apply migration:', err.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

main();
