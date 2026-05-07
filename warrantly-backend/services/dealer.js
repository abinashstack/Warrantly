export async function findDealerByPhone(supabase, phoneNumber) {
    console.log('findDealerByPhone invoked with: ', phoneNumber);

    if (!phoneNumber) {
        console.error('[dealerPhoneExists] phoneNumber is required');
        throw new Error('phoneNumber is required');
    }

    const { data, error } = await supabase
        .from('dealer')
        .select('dealer_id')
        .eq('phone_number', phoneNumber)
        .maybeSingle();

    if (error) {
        console.error('[dealerPhoneExists] error:', error.message);
        throw new Error(error.message);
    }

    console.log('exiting findDealerByPhone with: ', data);
    return data;
}

export async function getDealerByProfileId(supabase, profileId) {
    console.log('getDealerByProfileId invoked with: ', profileId);
    if (!profileId) {
        console.error('[getDealerByProfileId] profileId is required');
        throw new Error('profileId is required');
    }

    const { data, error } = await supabase
        .from('dealer_user')
        .select('dealer_id')
        .eq('profile_id', profileId)
        .single();

    if (error) {
        console.error('Error fetching dealer for the given user', error.message);
        throw new Error(error.message);
    }

    console.log('exiting getDealerByProfileId with: ', data);
    return data;
}

export async function createDealer(supabase, payload) {
    console.log('createDealer invoked with: ', payload);
    const {
        dealerName,
        phoneNumber,
        gstNumber = null,
        createdBy,
    } = payload;

    if (!dealerName) {
        throw new Error('dealerName is required');
    }

    if (!phoneNumber) {
        throw new Error('phoneNumber is required');
    }

    if (!createdBy) {
        throw new Error('createdBy is required');
    }

    const { data, error } = await supabase
        .from('dealer')
        .insert({
            dealer_name: dealerName,
            phone_number: phoneNumber,
            gst_number: gstNumber,
            created_by: createdBy,
        })
        .select()
        .single();

    if (error) {
        console.error('[createDealer] error:', error.message);
        throw new Error(error.message);
    }

    console.log('exiting createDealer with: ', data);

    return data;
}

export async function getDealerApprovalStatus(supabase, dealerId) {
    console.log('getDealerApprovalStatus invoked with dealerId:', dealerId);
    if (!dealerId) {
        throw new Error('Dealer ID is required');
    }

    const { data, error } = await supabase
        .from('dealer')
        .select('approval_status')
        .eq('dealer_id', dealerId)
        .single();

    if (error) {
        throw new Error(`Failed to fetch dealer status: ${error.message}`);
    }

    return data.approval_status;
}

