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
 * GET /api/categories
 * Fetch all product categories
 */
router.get('/', requireAuth, async (req, res) => {
    const token = req.headers.authorization.replace('Bearer ', '');
    const supabase = getUserSupabaseClient(token);

    const { data, error } = await supabase
        .from('categories')
        .select('category_id, category_name')
        .order('category_name', { ascending: true });

    if (error) {
        console.error('Categories fetch error:', error);
        return res.status(400).json({ error: error.message });
    }

    res.json(data);
});

export default router;
