/**
 * Profile Service
 * ---------------

/* ---------------- CREATE ---------------- */

/**
 * Create profile
 * Called from CompleteProfile flow
 */
export async function createProfile(supabase, payload) {
    console.log('createProfile invoked with: ', payload);
    const {
        profileId, // auth.uid()
        firstName,
        emailAddress,
        address,
        profileImage = null,
        role, // REQUIRED: array of roles
        notificationPreference = null,
        timezone = null,
        createdBy,
    } = payload;

    if (!profileId) throw new Error('profileId is required');
    if (!Array.isArray(role) || role.length === 0) {
        throw new Error('role must be a non-empty array');
    }

    const { data, error } = await supabase
        .from('profile')
        .upsert({
            profile_id: profileId,
            first_name: firstName,
            email_address: emailAddress,
            address,
            profile_image: profileImage,
            role,
            notification_preference: notificationPreference,
            timezone,
            created_by: createdBy,
        })
        .select()
        .single();

    if (error) {
        console.error('Error creating profile:', error.message);
        throw new Error(error.message);
    }

    console.log('exiting createProfile with: ', data);
    return data;
}

/**
 * Get profile by profileId (auth.uid)
 */
export async function getProfileById(supabase, profileId) {
  console.log('getProfileById invoked with: ', profileId);
  if (!profileId) throw new Error('profileId is required');

  const { data, error } = await supabase
    .from('profile')
    .select(`
      profile_id,
      first_name,
      last_name,
      email_address,
      address,
      profile_image,
      role,
      notification_preference,
      timezone,
      created_at
    `)
    .eq('profile_id', profileId)
    .single();

  if (error) {
    throw new Error(error.message);
  }

  console.log('exiting getProfileById with: ', data);
  return data;
}

