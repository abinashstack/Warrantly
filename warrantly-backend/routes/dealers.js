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

router.post('/', requireAuth, async (req, res) => {
    console.log('Dealer post endpoint triggered');

    const token = req.headers.authorization.replace('Bearer ', '');
    const supabase = getUserSupabaseClient(token);

    const {
        dealer_name,
        phone_number,
        gst_number,
    } = req.body;

    if (!dealer_name) {
        return res.status(400).json({
            error: 'dealer_name is required',
        });
    }

    /* ---------- Create dealer ---------- */
    const { data: dealer, error: dealerError } = await supabase
        .from('dealers')
        .insert({
            dealer_name,
            phone_number,
            gst_number,
            created_by: req.user.sub,
        })
        .select()
        .single();

    if (dealerError) {
        console.error('Dealer create error:', dealerError);
        return res.status(400).json({ error: dealerError.message });
    }

    /* ---------- Link user as dealer owner ---------- */
    const { error: dealerUserError } = await supabase
        .from('dealer_users')
        .insert({
            dealer_id: dealer.dealer_id,
            user_id: req.user.sub,
            role: 'owner',
        });

    if (dealerUserError) {
        console.error('Dealer user create error:', dealerUserError);
        return res.status(400).json({ error: dealerUserError.message });
    }

    res.status(201).json(dealer);
});

router.get('/', requireAuth, async (req, res) => {
    const { phone_number } = req.query;
    if (!phone_number) {
        return res.status(400).json({ error: 'phone_number is required' });
    }

    const token = req.headers.authorization.replace('Bearer ', '');
    const supabase = getUserSupabaseClient(token);

    try {
        const dealer = await dealerPhoneExists(supabase, phone_number);
        return res.status(200).json({
            exists: !!dealer,
            dealer,
        });
    } catch (err) {
        console.error('Error checking dealer phone existence:', err.message);
        res.status(500).json({ error: err.message });
    }
});


export default router;


