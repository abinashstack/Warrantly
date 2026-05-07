import { createClient } from "@supabase/supabase-js";
import express from "express";
import { requireAuth } from "../auth/requireAuth.js";
import { findCustomerByProfileId } from "../services/customer.js";
import { getDealerByProfileId } from "../services/dealer.js";
import { createUserProduct, createUserProductByDealer, getUserProductDetails, getUserProductsByCustomer } from "../services/user-product.js";

const router = express.Router();

/* ---------- Helper ---------- */
const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);


router.post("/", requireAuth, async (req, res) => {
    //When the customer uploads an invoice and product details manually, we will need to create a user product
    try {
        console.log("Post endpoint for creating user product triggered with: ", req.body);

        const token = req.headers.authorization.replace("Bearer ", "");
        const supabase = getUserSupabaseClient(token);
        const userId = req.user.sub;

        const userProduct = await createUserProduct(supabase, req.body, userId);

        if (!userProduct) {
            return res.status(400).json({ error: "Failed to create user product" });
        }

        console.log("User product created successfully:", userProduct);

        res.status(201).json({ userProduct });
    } catch (err) {
        console.error("Create user product failed:", err);
        res.status(500).json({ error: "Failed to create user product" });
    }
});

router.get('/', requireAuth, async (req, res) => {
    //Fetch all user products for a given customer
    try {
        console.log('Get endpoint for fetching user products triggered: ', req.body);
        const userId = req.user.sub;

        const customer = await findCustomerByProfileId(supabaseAdmin, userId);
        if (!customer) {
            return res.status(404).json({ error: 'Customer not found' });
        }

        console.log('Resolved customer ID:', customer.customer_id);

        const userProducts = await getUserProductsByCustomer(supabaseAdmin, customer.customer_id);

        console.log('Fetched user products:', userProducts);

        if (!userProducts) {
            return res.status(404).json({ error: 'No user products found' });
        }

        return res.status(200).json({ userProducts });
    } catch (err) {
        console.error('Fetch user products failed:', err);
        res.status(500).json({ error: 'Failed to fetch user products' });
    }
});

router.get("/:id", requireAuth, async (req, res) => {
    try {
        const token = req.headers.authorization.replace("Bearer ", "");
        const supabase = getUserSupabaseClient(token);

        const data = await getUserProductDetails(
            supabase,
            req.params.id
        );
        if (!data) return res.status(404).json({ error: "Not found" });

        console.log("Fetched product details:", data);

        res.json(data);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to fetch product" });
    }
});

router.post("/dealer-upload", requireAuth, async (req, res) => {
    try {
        console.log("Post endpoint for user product dealer upload triggered: ", req.body);
        const userId = req.user.sub;
        console.log("Authenticated user ID:", userId);
        /* --------------------------------
           Resolve dealer
        --------------------------------- */
        const dealerUser = await getDealerByProfileId(supabaseAdmin, userId);
        if (!dealerUser) {
            console.log("Dealer user not found for profile ID:", userId);
            return res.status(403).json({
                error: "Only dealers can upload products via this endpoint",
            });
        }
        console.log("Resolved dealer user:", dealerUser);

        /* --------------------------------
           2️⃣ Generate user product
        --------------------------------- */
        const result = await createUserProductByDealer(
            supabaseAdmin,
            dealerUser.dealer_id,
            req.body
        );

        /* --------------------------------
           3️⃣ Success
        --------------------------------- */
        return res.status(201).json({
            success: true,
            user_product: result.user_product,
            warranties: result.warranties,
        });

    } catch (err) {
        console.error("Dealer upload failed:", err);
        return res.status(400).json({
            error: err.message || "Failed to upload product",
        });
    }
});

export default router;
