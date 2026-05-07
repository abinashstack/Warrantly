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
 * GET /api/items
 * Optional query param: category_id
 */
router.get('/', requireAuth, async (req, res) => {
    const token = req.headers.authorization.replace('Bearer ', '');
    const supabase = getUserSupabaseClient(token);

    let query = supabase
        .from('items')
        .select('item_id, item_name, category_id')
        .order('item_name', { ascending: true });

    if (req.query.category_id) {
        query = query.eq('category_id', req.query.category_id);
    }

    const { data, error } = await query;

    if (error) {
        console.error('Items fetch error:', error);
        return res.status(400).json({ error: error.message });
    }

    res.json(data);
});

export default router;
