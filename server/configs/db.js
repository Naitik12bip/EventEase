/**
 * Supabase Configuration
 * Replaces MongoDB connection with Supabase client
 * 
 * Usage:
 * import { supabase } from './db.js';
 * 
 * Example:
 * const { data, error } = await supabase
 *   .from('movies')
 *   .select('*')
 *   .eq('id', movieId);
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error(
    'Missing Supabase credentials. Please set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env'
  );
}

/**
 * Create Supabase client with service role key
 * Use this for server-side operations (backend)
 */
export const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    persistSession: false
  }
});

/**
 * Alternative: Create client with anon key (for frontend)
 * Not typically used in backend, but available if needed
 */
export const supabasePublic = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

/**
 * Initialize Database Connection
 * Call this on server startup
 */
export const initializeDatabase = async () => {
  try {
    // Test connection by attempting a simple query (commented out to avoid table dependency)
    // const { error, data } = await supabase
    //   .from('profiles')
    //   .select('count(*)', { count: 'exact', head: true });

    // if (error) {
    //   console.error('❌ Database connection failed:', error);
    //   console.error('Error message:', error.message);
    //   console.error('Error code:', error.code);
    //   console.error('Error details:', error.details);
    //   process.exit(1);
    // }

    console.log('✅ Database client initialized successfully');
    return true;
  } catch (error) {
    console.error('❌ Error initializing database:', error.message);
    process.exit(1);
  }
};

/**
 * Common Database Operations Examples
 * 
 * SELECT all:
 * const { data } = await supabase.from('movies').select('*');
 * 
 * SELECT with filter:
 * const { data } = await supabase.from('movies').select('*').eq('id', movieId);
 * 
 * INSERT:
 * const { data } = await supabase.from('movies').insert([{ title: 'Test' }]);
 * 
 * UPDATE:
 * const { data } = await supabase.from('movies').update({ title: 'New' }).eq('id', movieId);
 * 
 * DELETE:
 * const { error } = await supabase.from('movies').delete().eq('id', movieId);
 * 
 * JOIN:
 * const { data } = await supabase.from('shows').select(`
 *   id,
 *   show_date_time,
 *   movies (id, title, poster_path)
 * `);
 * 
 * PAGINATION:
 * const { data } = await supabase.from('movies')
 *   .select('*')
 *   .range(0, 19); // Get first 20 records
 * 
 * ORDER:
 * const { data } = await supabase.from('movies')
 *   .select('*')
 *   .order('vote_average', { ascending: false });
 * 
 * AGGREGATE COUNT:
 * const { count } = await supabase.from('movies')
 *   .select('*', { count: 'exact', head: true });
 */

const connectDB = async () => initializeDatabase();

export default connectDB;
