export async function createCustomer(supabase, payload) {
    console.log("Creating customer with payload:", payload);
    const {
        phoneNumber,
        profileId = null,
        isActive,
        createdBy,
    } = payload;

    if (!phoneNumber) {
        throw new Error('phoneNumber is required');
    }

    const { data, error } = await supabase
        .from('customer')
        .insert({
            phone_number: phoneNumber,
            profile_id: profileId,
            is_active: isActive,
            created_by: createdBy,
        })
        .select()
        .single();

    if (error) {
        console.error("Error creating customer:", error.message);
        throw new Error(error.message);
    }

    console.log("Created customer:", data);
    return data;
}

export async function findCustomerByPhone(supabase, phoneNumber) {
    console.log("Finding customer by phone number:", phoneNumber);
    if (!phoneNumber) {
        throw new Error('phoneNumber is required');
    }

    const { data, error } = await supabase
        .from('customer')
        .select(`
      customer_id,
      phone_number,
      profile_id,
      is_active,
      created_at
    `)
        .eq('phone_number', phoneNumber)
        .maybeSingle();

    if (error) {
        console.error("Error finding customer by phone number:", error.message);
        throw new Error(error.message);
    }

    console.log("Found customer data:", data);

    return data; // null if not found
}

export async function findCustomerByProfileId(supabase, profileId) {
    console.log("Finding customer by profile ID:", profileId);
    if (!profileId) {
        throw new Error('profileId is required');
    }

    const { data, error } = await supabase
        .from('customer')
        .select('customer_id')
        .eq('profile_id', profileId)
        .single();

    if (error) {
        console.error("Error finding customer by profile ID:", error.message);
        throw new Error(error.message);
    }

    console.log("Found customer data:", data);

    return data;
}

export async function findCustomerById(supabase, customerId) {
    console.log("Finding customer by ID:", customerId);
    if (!customerId) {
        throw new Error('customerId is required');
    }

    const { data, error } = await supabase
        .from('customer')
        .select('*')
        .eq('customer_id', customerId)
        .single();

    if (error) {
        console.error("Error finding customer by ID:", error.message);
        throw new Error(error.message);
    }

    console.log("Found customer data:", data);

    return data;
}

export async function listCustomers(supabase, options = {}) {
    console.log("Listing customers with options:", options);
    const { limit = 50, offset = 0 } = options;

    const { data, error } = await supabase
        .from('customer')
        .select('*')
        .range(offset, offset + limit - 1)
        .order('created_at', { ascending: false });

    if (error) {
        console.error("Error listing customers:", error.message);
        throw new Error(error.message);
    }

    console.log(`Listed ${data.length} customers.`);

    return data;
}

export async function attachProfileToCustomer(
    supabase,
    customerId,
    profileId,
    is_active,
    changedBy
) {
    const { data, error } = await supabase
        .from('customer')
        .update({
            profile_id: profileId,
            is_active: is_active,
            changed_by: changedBy,
            changed_at: new Date().toISOString(),
        })
        .eq('customer_id', customerId)
        .select()
        .single();

    if (error) {
        console.error("Error attaching profile to customer:", error.message);
        throw new Error(error.message);
    }

    console.log("Updated customer data:", data);

    return data;
}

export async function updateCustomerStatus(
    supabase,
    customerId,
    isActive,
    changedBy
) {
    console.log("Updating customer status:", { customerId, isActive });
    const { data, error } = await supabase
        .from('customer')
        .update({
            is_active: isActive,
            changed_by: changedBy,
            changed_at: new Date().toISOString(),
        })
        .eq('customer_id', customerId)
        .select()
        .single();

    if (error) {
        console.error("Error updating customer status:", error.message);
        throw new Error(error.message);
    }

    console.log("Updated customer data:", data);

    return data;
}

export async function deleteCustomer(supabase, customerId) {
    console.log("Deleting customer with ID:", customerId);
    const { error } = await supabase
        .from('customer')
        .delete()
        .eq('customer_id', customerId);

    if (error) {
        console.error("Error deleting customer:", error.message);
        throw new Error(error.message);
    }

    return true;
}