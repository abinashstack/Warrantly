import { createClient } from "@supabase/supabase-js";
import express from "express";
import { requireAuth } from "../auth/requireAuth.js";
import { onboardDealer, onboardUser } from "../services/onboardingUser.js";
import { getUserSupabaseClient } from "../supabaseClient.js";

const router = express.Router();

const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
);

router.post("/user", requireAuth, async (req, res) => {
  console.log("Onboarding request body:", req.body);
  const token = req.headers.authorization.replace("Bearer ", "");
  const supabase = getUserSupabaseClient(token);
  const userId = req.user.sub;

  try {
    const result = await onboardUser(supabase, userId, req.body);
    return res.status(201).json(result);
  } catch (err) {
    console.error("Onboarding error:", err.message);
    return res.status(400).json({ error: err.message });
  }
});

router.post("/dealer", requireAuth, async (req, res) => {
  console.log("Onboarding request body:", req.body);
  const userId = req.user.sub;
  try {
    const result = await onboardDealer(supabaseAdmin, userId, req.body);
    return res.status(201).json(result);
  } catch (err) {
    console.error("Onboarding error:", err.message);
    return res.status(400).json({ error: err.message });
  }
});

export default router;
