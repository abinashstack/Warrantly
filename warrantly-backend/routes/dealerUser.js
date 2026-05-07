import { createClient } from '@supabase/supabase-js';
import express from 'express';
import { requireAuth } from '../auth/requireAuth.js';
import { findDealerUserByPhone } from '../services/dealer-user.js';
import { getDealerApprovalStatus } from '../services/dealer.js';

const router = express.Router();

const supabaseAdmin = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

router.get('/', requireAuth, async (req, res) => {
    console.log('Checking dealer phone existence for:', req.query);
    const { phone } = req.query;
    let dealerStatus = null;
    if (!phone) {
        return res.status(400).json({ error: 'phone_number is required' });
    }

    try {
        const dealer = await findDealerUserByPhone(supabaseAdmin, phone);
        if (dealer) {
            dealerStatus = await getDealerApprovalStatus(supabaseAdmin, dealer.dealer_id);
        }

        return res.status(200).json({ dealer: dealer, approvalStatus: dealerStatus });
    } catch (err) {
        console.error('Error checking dealer phone existence:', err.message);
        res.status(500).json({ error: err.message });
    }
});

export default router;