import { createClient } from '@supabase/supabase-js';

/**
 * Server-side Netlify Function for transaction operations
 * that require elevated privileges (batch operations, exports).
 * 
 * Most CRUD goes directly through Supabase client-side with RLS.
 * This function handles operations that need the service role key.
 */

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Simple in-memory rate limiter (resets on cold start, fine for serverless)
const rateLimits = new Map();
const RATE_LIMIT = 100; // requests per minute
const RATE_WINDOW = 60_000;

function checkRateLimit(ip) {
  const now = Date.now();
  const record = rateLimits.get(ip);

  if (!record || now - record.start > RATE_WINDOW) {
    rateLimits.set(ip, { start: now, count: 1 });
    return true;
  }

  record.count++;
  return record.count <= RATE_LIMIT;
}

function getAuthToken(headers) {
  const auth = headers.authorization || headers.Authorization;
  if (!auth?.startsWith('Bearer ')) return null;
  return auth.slice(7);
}

async function getUser(token) {
  const { data: { user }, error } = await supabase.auth.getUser(token);
  if (error || !user) return null;
  return user;
}

export async function handler(event) {
  // CORS
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      },
    };
  }

  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
  };

  // Rate limiting
  const ip = event.headers['x-forwarded-for'] || 'unknown';
  if (!checkRateLimit(ip)) {
    return {
      statusCode: 429,
      headers,
      body: JSON.stringify({ error: 'Too many requests' }),
    };
  }

  // Auth
  const token = getAuthToken(event.headers);
  if (!token) {
    return {
      statusCode: 401,
      headers,
      body: JSON.stringify({ error: 'Unauthorized' }),
    };
  }

  const user = await getUser(token);
  if (!user) {
    return {
      statusCode: 401,
      headers,
      body: JSON.stringify({ error: 'Invalid token' }),
    };
  }

  try {
    const path = event.path.replace('/.netlify/functions/transactions', '');

    // POST /transactions/export — CSV export of all transactions
    if (event.httpMethod === 'POST' && path === '/export') {
      const body = JSON.parse(event.body || '{}');

      const { data, error } = await supabase
        .from('transactions')
        .select('*, categories(name)')
        .eq('user_id', user.id)
        .is('deleted_at', null)
        .gte('transaction_date', body.startDate || '2020-01-01')
        .lte('transaction_date', body.endDate || '2099-12-31')
        .order('transaction_date', { ascending: false });

      if (error) throw error;

      // Build CSV
      const csvRows = [
        'Fecha,Tipo,Categoría,Monto,Moneda,Método,Descripción,Item',
        ...data.map((t) =>
          [
            t.transaction_date,
            t.type === 'income' ? 'Ingreso' : 'Gasto',
            t.categories?.name || '',
            (t.amount_cents / 100).toFixed(2),
            t.currency,
            t.payment_method,
            `"${(t.description || '').replace(/"/g, '""')}"`,
            `"${(t.item_name || '').replace(/"/g, '""')}"`,
          ].join(',')
        ),
      ];

      return {
        statusCode: 200,
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': 'attachment; filename=fintrack-export.csv',
          'Access-Control-Allow-Origin': '*',
        },
        body: csvRows.join('\n'),
      };
    }

    // POST /transactions/batch — Batch import
    if (event.httpMethod === 'POST' && path === '/batch') {
      const body = JSON.parse(event.body || '{}');
      const transactions = body.transactions;

      if (!Array.isArray(transactions) || transactions.length === 0) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ error: 'Invalid transactions array' }),
        };
      }

      if (transactions.length > 500) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ error: 'Maximum 500 transactions per batch' }),
        };
      }

      const withUser = transactions.map((t) => ({
        ...t,
        user_id: user.id,
      }));

      const { data, error } = await supabase
        .from('transactions')
        .insert(withUser)
        .select();

      if (error) throw error;

      return {
        statusCode: 201,
        headers,
        body: JSON.stringify({ imported: data.length }),
      };
    }

    return {
      statusCode: 404,
      headers,
      body: JSON.stringify({ error: 'Not found' }),
    };
  } catch (error) {
    console.error('Function error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Internal server error' }),
    };
  }
}
