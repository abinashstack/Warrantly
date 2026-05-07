export async function createUserProduct(supabase, payload, userId) {
    console.log('createUserProduct invoked with payload: ', payload);
    const {
        product_id,
        owner_id,
        user_product_name,
        serial_number,
        warranty_start_date,
        warranty_end_date,
        extended_warranty_end_date,
        is_warranty_activated
    } = req.body;

    if (!product_id) {
        console.log("product_id is required");
        return res.status(400).json({ error: "product_id is required" });
    }

    if (!owner_id) {
        console.log("owner_id is required");
        return res.status(400).json({ error: "owner_id is required" });
    }

    const { data: userProduct, error: upErr } = await supabase
        .from("user_products")
        .insert({
            user_product_name,
            product_id,
            serial_number,
            warranty_start_date,
            warranty_end_date,
            extended_warranty_end_date,
            is_warranty_activated,
            created_by: userId,
        })
        .select()
        .single();

    if (upErr) {
        console.error("Error creating user product:", upErr);
        throw upErr;
    }

    console.log("exiting createUserProduct with: ", userProduct);
    return userProduct;
}

export async function getUserProductsByCustomer(supabase, customerId) {
    console.log('getUserProductsByCustomer invoked with: ', customerId);

    const { data, error } = await supabase
        .from('user_products')
        .select(`
      user_product_id,
      user_product_name,
      warranty_start_date,
      warranty_end_date,
      extended_warranty_end_date,
      is_warranty_activated
    `)
        .eq('owner_id', customerId)
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching user products:', error);
        throw error;
    }

    console.log('exiting getUserProductsByCustomer with: ', data);
    return data;
}

export async function createUserProductByDealer(supabase, dealerId, payload) {
    const {
        owner_id,
        dealer_product_id,
        dealer_product_model_id,
        purchase_date,
        purchase_price,
        serial_number
    } = payload;

    if (!owner_id) throw new Error('owner_id is required');
    if (!dealer_product_id) throw new Error('dealer_product_id is required');
    if (!purchase_date) throw new Error('purchase_date is required');

    console.log('Payload received:', payload);

    /* --------------------------------
       1️⃣ Resolve dealer product
    --------------------------------- */
    const { data: dealerProduct, error: dpErr } = await supabase
        .from('dealer_product')
        .select(`
      dealer_product_id,
      dealer_id,
      product_id,
      product (
        brand_id,
        item_id,
        product_name
      )
    `)
        .eq('dealer_product_id', dealer_product_id)
        .single();

    console.log('Resolved dealer product:', dealerProduct);

    if (dpErr || !dealerProduct) {
        throw new Error('Invalid dealer product');
    }

    if (dealerProduct.dealer_id !== dealerId) {
        throw new Error('Dealer does not own this product');
    }

    const { brand_id, item_id, product_name } = dealerProduct.product;

    /* --------------------------------
       2️⃣ Fetch warranty configs
    --------------------------------- */
    const { data: warranties, error: wErr } = await supabase
        .from('warranties')
        .select('*')
        .eq('brand_id', brand_id)
        .eq('item_id', item_id);

    if (wErr || !warranties?.length) {
        throw new Error('No warranty configuration found');
    }

    console.log('Fetched warranties:', warranties);

    /* --------------------------------
       3️⃣ Helper: calculate warranty end
    --------------------------------- */
    const calculateWarrantyEndDate = (startDate, months) => {
        const start = new Date(startDate);
        const end = new Date(start);
        end.setMonth(end.getMonth() + months);
        end.setDate(end.getDate() - 1);
        return end.toISOString().split('T')[0];
    };

    /* --------------------------------
       4️⃣ Identify primary (product) warranty
    --------------------------------- */
    const productWarranty = warranties.find(
        w => w.warranty_type === 'product'
    );

    console.log('Identified product warranty:', productWarranty);

    if (!productWarranty) {
        throw new Error('Product warranty not defined');
    }

    const warranty_start_date = purchase_date;
    const warranty_end_date = calculateWarrantyEndDate(
        purchase_date,
        productWarranty.base_warranty_duration
    );

    /* --------------------------------
       5️⃣ Create USER_PRODUCT
    --------------------------------- */
    const { data: userProduct, error: upErr } = await supabase
        .from('user_products')
        .insert({
            product_id: dealerProduct.product_id,
            owner_id: owner_id,
            user_product_name: product_name,
            serial_number,
            warranty_start_date,
            warranty_end_date,
            created_by: dealerId,
        })
        .select()
        .single();

    if (upErr) {
        throw new Error(upErr.message);
    }

    // /* --------------------------------
    //    6️⃣ Create USER_PRODUCT_WARRANTIES
    // --------------------------------- */
    // const warrantyRows = warranties.map(w => ({
    //     user_product_id: userProduct.user_product_id,
    //     warranty_type: w.warranty_type,
    //     duration_months: w.base_warranty_duration,
    //     warranty_start_date: purchase_date,
    //     warranty_end_date: calculateWarrantyEndDate(
    //         purchase_date,
    //         w.base_warranty_duration
    //     ),
    //     terms_and_conditions: w.terms_and_conditions,
    // }));

    // const { error: upwErr } = await supabase
    //     .from('user_product_warranties')
    //     .insert(warrantyRows);

    // if (upwErr) {
    //     throw new Error(upwErr.message);
    // }

    /* --------------------------------
       7️⃣ Done
    --------------------------------- */
    return {
        user_product: userProduct
        // warranties: warrantyRows,
    };
}

export async function getUserProductDetails(supabase, userProductId) {
    console.log('getUserProductDetails invoked with: ', userProductId);
    const { data: userProduct, error } = await supabase
        .from('user_products')
        .select(`
            user_product_id,
            product_id,
            user_product_name,
            warranty_start_date,
            warranty_end_date,
            serial_number,
            created_by,
            product (
                brand_id,
                item_id,
                product_name,
                registration_required,
                brands ( brand_name ),
                items ( item_name )
                );
        `)
        .eq('user_product_id', userProductId)
        .single();

    if (error) {
        console.error('Supabase error:', error);
        throw error;
    }

    console.log('exiting getUserProductDetails with: ', userProduct);
    return userProduct;
}