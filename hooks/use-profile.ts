import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase";
import { useAuth } from "@/contexts/auth-context";
import type { Database } from "@/lib/supabase";

type Profile = Database["public"]["Tables"]["profiles"]["Row"];

export function useProfile() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();
  const supabase = createClient();

  useEffect(() => {
    if (!user) {
      setProfile(null);
      setLoading(false);
      return;
    }

    const fetchProfile = async () => {
      try {
        setLoading(true);
        setError(null);

        const { data, error } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .single();

        if (error) {
          // If profile doesn't exist, create it
          if (error.code === "PGRST116") {
            const { data: newProfile, error: createError } = await supabase
              .from("profiles")
              .insert({
                id: user.id,
                email: user.email,
                updated_at: new Date().toISOString(),
              })
              .select()
              .single();

            if (createError) {
              console.error("Error creating profile:", createError);
              setError("Failed to create profile");
            } else {
              setProfile(newProfile);
            }
          } else {
            console.error("Error fetching profile:", error);
            setError("Failed to fetch profile");
          }
        } else {
          setProfile(data);
        }
      } catch (err) {
        console.error("Error in fetchProfile:", err);
        setError("An unexpected error occurred");
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [user, supabase]);

  const updateProfile = (updatedProfile: Profile) => {
    setProfile(updatedProfile);
  };

  return {
    profile,
    loading,
    error,
    updateProfile,
  };
}
