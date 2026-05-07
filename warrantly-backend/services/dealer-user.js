export async function findDealerUserByPhone(supabase, phone) {
    console.log('findDealerUserByPhone invoked with: ', phone);

    if (!phone) {
        throw new Error('phone is required');
    }

    const { data, error } = await supabase
        .from('dealer_user')
        .select(`
            dealer_user_id,
            dealer_id,
            profile_id,
            role
        `)
        .eq('phone_number', phone)   
        .maybeSingle();

    if (error) {
        console.error('[findDealerUserByPhone] error:', error.message);
        throw new Error(error.message);
    }

    console.log('exiting findDealerUserByPhone with: ', data);
    return data;
}

export async function createDealerUser(supabase, payload) {
    console.log('createDealerUser invoked with:', payload);
    const {
        dealerId,
        phoneNumber,
        role,
        profileId = null,
        createdBy,
    } = payload;

    if (!dealerId) {
        throw new Error('dealerId is required');
    }

    if (!phoneNumber) {
        throw new Error('phoneNumber is required');
    }

    if (!role) {
        throw new Error('role is required');
    }

    if (!createdBy) {
        throw new Error('createdBy is required');
    }

    const { data, error } = await supabase
        .from('dealer_user')
        .insert({
            dealer_id: dealerId,
            phone_number: phoneNumber,
            role,
            profile_id: profileId, // can be null
        })
        .select()
        .single();

    if (error) {
        console.error('[createDealerUser] error:', error.message);
        throw new Error(error.message);
    }

    console.log('exiting findDealerUserByPhone with: ', data);

    return data;
}
