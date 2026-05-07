import { attachProfileToCustomer, createCustomer, findCustomerByPhone } from './customer.js';
import { createDealerUser } from './dealer-user.js';
import { createDealer } from './dealer.js';
import { createProfile } from './profile.js';

/**
 * Onboard a user based on role
 * - Creates profile (person)
 * - Creates role-specific entities
 *
 * role = 'consumer'
 *   → profile + customer
 *
 * role = 'dealer'
 *   → profile + dealer_user (OWNER)
 */
export async function onboardUser(
    supabase,
    userId,
    payload
) {
    const {
        role,
        phoneNumber,
        firstName,
        lastName,
        address,
        emailAddress,
        dealerId, // required for dealer user creation
    } = payload;

    console.log('Onboarding user with payload:', payload);

    if (!role) {
        throw new Error('role is required');
    }

    if (!phoneNumber) {
        throw new Error('phoneNumber is required');
    }

    /* -----------------------------
       1️⃣ Create / update PROFILE
    ------------------------------ */
    const profile = await createProfile(supabase, {
        profileId: userId,
        firstName,
        lastName,
        emailAddress,
        address,
        role: [role],
        createdBy: userId,
    });

    console.log('Created profile:', profile);
    // 🧑 CONSUMER
    if (role === 'consumer') {
        //Check if consumer user already exists, based on that we either 
        // create a new customer or update the existing one with profileId

        const existingCustomer = await findCustomerByPhone(supabase, phoneNumber);
        console.log('existingCustomer:', existingCustomer);
        if (existingCustomer !== null) {
            console.log('Attaching profile to existing customer:', existingCustomer.customer_id, userId);
            const customer = await attachProfileToCustomer(supabase, existingCustomer.customer_id,
                userId, true, userId);
            return {
                profile,
                customer,
            };
        } else {
            console.log('Creating new customer for phoneNumber:', phoneNumber, userId);
            const customer = await createCustomer(supabase, {
                phoneNumber,
                profileId: userId,
                is_active: true,
                createdBy: userId,
            });
            return {
                profile,
                customer,
            };
        }
    }

    // 🧑‍💼 DEALER USER (OWNER)
    if (role === 'dealer-owner') {
        if (!dealerId) {
            throw new Error('dealerId is required for dealer user onboarding');
        }

        console.log('Creating dealer user for dealerId:', dealerId, userId, phoneNumber);

        const dealerUser = await createDealerUser(supabase, {
            dealerId,
            profileId: userId,
            phoneNumber,
            role: 'OWNER',
            createdBy: userId,
        });

        return {
            profile,
            dealerUser,
        };
    }

    throw new Error(`Unsupported role: ${role}`);
}

export async function onboardDealer(
    supabase,
    userId,
    payload
) {
    const {
        phone,
        businessName,
        ownerName,
        email,
        address,
        city,
        gst
    } = payload;

    console.log('Onboarding dealer with payload:', payload);

    const profile = await createProfile(supabase, {
        profileId: userId,
        firstName: ownerName,
        emailAddress: email,
        address: `${address}, ${city}`,
        role: ['dealer-owner'],
        createdBy: userId,
    });

    const dealer = await createDealer(supabase, {
        dealerName: businessName,
        phoneNumber: phone,
        gstNumber: gst,
        createdBy: userId,
    });

    const dealerUser = await createDealerUser(supabase, {
        dealerId: dealer.dealer_id,
        profileId: profile.profile_id,
        phoneNumber: phone,
        role: 'OWNER',
        createdBy: userId,
    });

    return {
        dealer, dealerUser, profile
    };
}   
