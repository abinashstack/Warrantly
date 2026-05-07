import { createClient } from '@supabase/supabase-js';
import express from 'express';
import { requireAuth } from '../auth/requireAuth.js';

const router = express.Router();

const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

router.post('/', requireAuth, async (req, res) => {
    console.log('Dealer product model post endpoint triggered');
    const userId = req.user.sub;

    const {
        dealer_product_id,
        model_number,
        model_name,
        mrp,
    } = req.body;

    if (!dealer_product_id || !model_number || !mrp) {
        return res.status(400).json({
            error: 'dealer_product_id, model_number and mrp are required',
        });
    }

    try {
        /* ---------- Insert model ---------- */
        const { data, error } = await supabaseAdmin
            .from('dealer_product_model')
            .insert({
                dealer_product_id,
                model_number,
                model_name: model_name || null,
                mrp,
            });

        if (error) {
            console.error('Dealer model insert error:', error);
            return res.status(400).json({ error: error.message });
        }

        res.status(201).json({ data });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to add product model' });
    }
});

router.get('/', requireAuth, async (req, res) => {
    console.log('Dealer product model GET endpoint triggered');
    const userId = req.user.sub;

    const { dealer_product_id } = req.query;

    if (!dealer_product_id) {
        return res.status(400).json({
            error: 'dealer_product_id is required',
        });
    }

    try {
        /* ---------- Resolve dealer ---------- */
        const { data: dealerUser, error: duErr } = await supabaseAdmin
            .from('dealer_user')
            .select('dealer_id')
            .eq('profile_id', userId)
            .single();

        if (duErr || !dealerUser) {
            return res.status(403).json({ error: 'Dealer not found for user' });
        }

        /* ---------- Fetch models ---------- */
        const { data, error } = await supabaseAdmin
            .from('dealer_product_model')
            .select(`
                dealer_product_model_id,
                dealer_product_id,
                model_number,
                model_name,
                mrp,
                created_at
            `)
            .eq('dealer_product_id', dealer_product_id)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Dealer model fetch error:', error);
            return res.status(400).json({ error: error.message });
        }

        res.status(200).json({
            items: data,
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to fetch product models' });
    }
});

export default router;
