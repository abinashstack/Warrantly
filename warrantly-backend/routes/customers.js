import { createClient } from '@supabase/supabase-js';
import express from 'express';
import { requireAuth } from '../auth/requireAuth.js';

import {
    createCustomer,
    findCustomerByPhone
} from '../services/customer.js';

const router = express.Router();

/* ---------------- SUPABASE CLIENT ---------------- */
const supabaseAdmin = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

/* ---------------- GET: check customer by phone ---------------- */
/**
 * GET /customers?phone=+91XXXXXXXXXX
 */
router.get('/', requireAuth, async (req, res) => {
    const { phone } = req.query;

    if (!phone) {
        return res.status(400).json({ error: 'phone is required' });
    }

    try {
        const customer = await findCustomerByPhone(supabaseAdmin, phone);

        return res.status(200).json({
            exists: !!customer,
            customer,
        });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: err.message });
    }
});

/* ---------------- GET: customer by ID ---------------- */
/**
 * GET /customers/:customerId
 */
// router.get('/:customerId', requireAuth, async (req, res) => {
//     const { customerId } = req.params;

//     try {
//         const customer = await findCustomerById(supabaseAdmin, customerId);
//         return res.status(200).json(customer);
//     } catch (err) {
//         console.error(err);
//         return res.status(404).json({ error: err.message });
//     }
// });

/* ---------------- POST: create customer ---------------- */
/**
 * POST /customers
 * Used after OTP if customer does not exist
 */
router.post('/', requireAuth, async (req, res) => {
    console.log('Creating customer with body:', req.body);

    const userId = req.user.sub;

    const { phoneNumber, isActive } = req.body;

    if (!phoneNumber) {
        return res.status(400).json({ error: 'phoneNumber is required' });
    }

    try {
        const customer = await createCustomer(supabaseAdmin, {
            phoneNumber,
            isActive,
            createdBy: userId,
        });

        return res.status(201).json(customer);
    } catch (err) {
        console.error(err);
        return res.status(400).json({ error: err.message });
    }
});

/* ---------------- PATCH: attach profile ---------------- */
/**
 * PATCH /customers/:customerId/profile
 * Used after CompleteProfile
 */
// router.patch('/:customerId/profile', requireAuth, async (req, res) => {
//     const userId = req.user.sub;

//     const { customerId } = req.params;
//     const { profileId } = req.body;

//     if (!profileId) {
//         return res.status(400).json({ error: 'profileId is required' });
//     }

//     try {
//         const updated = await attachProfileToCustomer(
//             supabaseAdmin,
//             customerId,
//             profileId,
//             userId
//         );

//         return res.status(200).json(updated);
//     } catch (err) {
//         console.error(err);
//         return res.status(400).json({ error: err.message });
//     }
// });

/* ---------------- PATCH: activate / deactivate ---------------- */
/**
 * PATCH /customers/:customerId/status
 */
// router.patch('/:customerId/status', requireAuth, async (req, res) => {

//     const userId = req.user.sub;

//     const { customerId } = req.params;
//     const { isActive } = req.body;

//     if (typeof isActive !== 'boolean') {
//         return res.status(400).json({ error: 'isActive must be boolean' });
//     }

//     try {
//         const updated = await updateCustomerStatus(
//             supabaseAdmin,
//             customerId,
//             isActive,
//             userId
//         );

//         return res.status(200).json(updated);
//     } catch (err) {
//         console.error(err);
//         return res.status(400).json({ error: err.message });
//     }
// });

/* ---------------- DELETE: hard delete ---------------- */
/**
 * DELETE /customers/:customerId
 * Use carefully
 */
// router.delete('/:customerId', requireAuth, async (req, res) => {
//     const { customerId } = req.params;

//     try {
//         await deleteCustomer(supabaseAdmin, customerId);
//         return res.status(204).send();
//     } catch (err) {
//         console.error(err);
//         return res.status(400).json({ error: err.message });
//     }
// });

export default router;
