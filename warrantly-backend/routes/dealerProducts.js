import { createClient } from '@supabase/supabase-js';
import express from 'express';
import { requireAuth } from '../auth/requireAuth.js';
import { getDealerByProfileId } from "../services/dealer.js";

const router = express.Router();

const supabaseAdmin = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

router.post('/', requireAuth, async (req, res) => {
    console.log('Dealer product post endpoint triggered');
    const { product_id } = req.body;
    const userId = req.user.sub;

    console.log('userId:', userId);

    if (!product_id) {
        return res.status(400).json({ error: 'product_id is required' });
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

        /* ---------- Insert dealer product ---------- */
        const { data, error } = await supabaseAdmin
            .from('dealer_product')
            .insert({
                dealer_id: dealerUser.dealer_id,
                product_id,
            })
            .select('dealer_product_id')
            .single();

        if (error) {
            console.error('Dealer product insert error:', error);
            return res.status(400).json({ error: error.message });
        }

        res.status(201).json({
            dealer_product_id: data.dealer_product_id,
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to add dealer product' });
    }
});

router.get('/', requireAuth, async (req, res) => {
    console.log('Dealer product GET endpoint triggered');

    const userId = req.user.sub;

    try {
        /* ---------- Resolve dealer ---------- */
        const dealerUser = await getDealerByProfileId(supabaseAdmin, userId);

        if (!dealerUser) {
            console.log("Dealer user not found for profile ID:", userId);
            return res.status(403).json({
                error: "Only dealers can upload products via this endpoint",
            });
        }
        console.log("Resolved dealer user:", dealerUser);

        /* ---------- Fetch dealer products + product name ---------- */
        const { data, error } = await supabaseAdmin
            .from('dealer_product')
            .select(`
    dealer_product_id,
    product_id,
    created_at,
    product (
      product_name
    ),
    dealer_product_model (
      dealer_product_model_id
    )
  `)
            .eq('dealer_id', dealerUser.dealer_id)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Dealer product fetch error:', error);
            return res.status(400).json({ error: error.message });
        }

        console.log('Fetched dealer products:', data);

        /* ---------- Flatten response for frontend ---------- */
        const items = data.map((row) => ({
            dealer_product_id: row.dealer_product_id,
            product_id: row.product_id,
            product_name: row.product?.product_name ?? null,
            model_count: row.dealer_product_model
                ? row.dealer_product_model.length
                : 0,
            created_at: row.created_at,
        }));


        res.status(200).json({ items });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to fetch dealer products' });
    }
});

router.get(
    '/:dealerProductId',
    requireAuth,
    async (req, res) => {
        try {
            console.log('Dealer product models GET endpoint triggered');
            const userId = req.user.sub;
            const { dealerProductId } = req.params;

            /* ===============================
               1️⃣ Resolve dealer
            =============================== */
            const dealerUser = await getDealerByProfileId(
                supabaseAdmin,
                userId
            );

            if (!dealerUser) {
                return res.status(403).json({
                    error: 'Unauthorized dealer',
                });
            }

            /* ===============================
               2️⃣ Validate product belongs to dealer
            =============================== */
            const { data: dealerProduct, error: dpError } =
                await supabaseAdmin
                    .from('dealer_product')
                    .select(`
            dealer_product_id,
            product (
              product_name
            )
          `)
                    .eq('dealer_product_id', dealerProductId)
                    .eq('dealer_id', dealerUser.dealer_id)
                    .single();

            if (dpError || !dealerProduct) {
                return res.status(404).json({
                    error: 'Dealer product not found',
                });
            }

            /* ===============================
               3️⃣ Fetch models
            =============================== */
            const { data: models, error: modelError } =
                await supabaseAdmin
                    .from('dealer_product_model')
                    .select(`
            dealer_product_model_id,
            model_number,
            model_name,
            created_at
          `)
                    .eq('dealer_product_id', dealerProductId)
                    .order('created_at', { ascending: false });

            if (modelError) {
                return res.status(400).json({
                    error: modelError.message,
                });
            }

            /* ===============================
               4️⃣ Return structured response
            =============================== */
            return res.status(200).json({
                dealer_product_id: dealerProductId,
                product_name: dealerProduct.product?.product_name ?? null,
                models: models || [],
            });
        } catch (err) {
            console.error(err);
            return res.status(500).json({
                error: 'Failed to fetch models',
            });
        }
    }
);


export default router;