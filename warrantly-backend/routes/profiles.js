import { createClient } from '@supabase/supabase-js';
import express from 'express';
import { requireAuth } from '../auth/requireAuth.js';
import { attachProfileToCustomer } from '../services/customer.js';
import { getProfileById } from '../services/profile.js';

const router = express.Router();

const supabaseAdmin = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

router.get('/', requireAuth, async (req, res) => {

    const profile = await getProfileById(supabaseAdmin, req.user.sub);

    if (!profile) {
        console.log("Error in fetching profile: ", error.message);
        return res.status(404).json({ error: 'Profile not found' });
    }

    res.json(profile);
});

router.post('/', requireAuth, async (req, res) => {
    console.log("Profile creation request body:", req.body);
    try {
        const {
            firstName,
            address,
            phone_number,
            emailAddress,
            roles = ['consumer'],
            notificationPreference = null,
            timezone = 'IST',
            customer_id
        } = req.body;

        const profileId = req.user.sub; // Supabase auth user id

        // Create Profile
        const profile = await createProfile(supabaseAdmin, {
            profileId,
            firstName,
            emailAddress,
            address,
            phone_number, 
            role: roles,
            notificationPreference,
            timezone,
            createdBy: profileId,
        });

        //Attach profile to customer (optional)
        let updatedCustomer = null;

        console.log("Customer ID from request body:", customer_id);

        if (customer_id) {
            console.log(`Attaching profile ${profileId} to existing customer ${customer_id}`);
            updatedCustomer = await attachProfileToCustomer(
                supabaseAdmin,
                customer_id,
                profile.profile_id,
                true,
                profileId
            );
        }

        return res.status(201).json({
            success: true,
            profile,
            customer: updatedCustomer
        });

    } catch (error) {
        console.error("Error in profile creation route:", error.message);
        return res.status(400).json({ error: error.message });
    }
});

// router.put('/', requireAuth, async (req, res) => {
//     const token = req.headers.authorization.replace('Bearer ', '');
//     const supabase = getUserSupabaseClient(token);

//     const {
//         first_name,
//         last_name,
//         email_address,
//         address,
//         timezone,
//     } = req.body;

//     console.log("req.body:", req.body);

//     const updates = {};
//     if (first_name) updates.first_name = first_name;
//     if (last_name) updates.last_name = last_name;
//     if (email_address) updates.email_address = email_address;
//     if (address) updates.address = address;
//     if (timezone) updates.timezone = timezone;

//     console.log(updates);

//     if (Object.keys(updates).length === 0) {
//         return res.status(400).json({ error: 'No fields to update' });
//     }

//     const { error } = await supabase
//         .from('profile')
//         .update(updates)
//         .eq('profile_id', req.user.sub); // 🔑 REQUIRED

//     if (error) {
//         console.error('Supabase update error:', error.message);
//         return res.status(400).json({ error: error.message });
//     }

//     res.json({ success: true });
// });

/**
 * DELETE /api/profile
 * Soft delete profile
 */
// router.delete('/', requireAuth, async (req, res) => {
//     const userId = req.user.sub;

//     const { error } = await supabaseAnon
//         .from('profiles')
//         .update({ is_active: false })
//         .eq('user_id', userId);

//     if (error) {
//         return res.status(400).json({ error: error.message });
//     }

//     res.json({ success: true });
// });

export default router;
