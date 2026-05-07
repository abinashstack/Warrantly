import { createClient } from '@supabase/supabase-js';
import express from 'express';
import { requireAuth } from '../auth/requireAuth.js';

const router = express.Router();

function getUserSupabaseClient(token) {
    return createClient(
        process.env.SUPABASE_URL,
        process.env.SUPABASE_ANON_KEY,
        {
            global: {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            },
        }
    );
}

/**
 * GET /api/products
 * Optional query params:
 *  - item_id
 *  - category_id
 */
router.get('/', requireAuth, async (req, res) => {
    const token = req.headers.authorization.replace('Bearer ', '');
    const supabase = getUserSupabaseClient(token);

    let query = supabase
        .from('product')
        .select(`
      product_id,
      product_name,
      brand_id,
      item_id,
      brands (
        brand_name
      )
    `)
        .order('product_name', { ascending: true });

    if (req.query.item_id) {
        query = query.eq('item_id', req.query.item_id);
    }

    const { data, error } = await query;

    if (error) {
        console.error('Products fetch error:', error);
        return res.status(400).json({ error: error.message });
    }

    // Flatten brand name for frontend convenience
    const result = data.map((p) => ({
        product_id: p.product_id,
        product_name: p.product_name,
        brand_name: p.brands?.brand_name ?? null,
        item_id: p.item_id,
        category_id: p.category_id,
    }));

    res.json(result);
});

export default router;
