"use client";

import type React from "react";
import { createContext, useContext, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase";
import { useAuth } from "@/contexts/auth-context";
import type { Database } from "@/lib/supabase";

type Profile = Database["public"]["Tables"]["profiles"]["Row"];

interface ProfileContextType {
  profile: Profile | null;
  loading: boolean;
  error: string | null;
  updateProfile: (updatedProfile: Profile) => void;
  refreshProfile: () => Promise<void>;
}

const ProfileContext = createContext<ProfileContextType>({
  profile: null,
  loading: true,
  error: null,
  updateProfile: () => {},
  refreshProfile: async () => {},
});

export const useProfile = () => {
  const context = useContext(ProfileContext);
  if (!context) {
    throw new Error("useProfile must be used within a ProfileProvider");
  }
  return context;
};

export function ProfileProvider({ children }: { children: React.ReactNode }) {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();
  const supabase = createClient();

  const fetchProfile = async (userId: string) => {
    try {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .single();

      if (error) {
        // If profile doesn't exist, create it
        if (error.code === "PGRST116") {
          const { data: newProfile, error: createError } = await supabase
            .from("profiles")
            .insert({
              id: userId,
              email: user?.email,
              updated_at: new Date().toISOString(),
            })
            .select()
            .single();

          if (createError) {
            console.error("Error creating profile:", createError);
            setError("Failed to create profile");
            setProfile(null);
          } else {
            setProfile(newProfile);
          }
        } else {
          console.error("Error fetching profile:", error);
          setError("Failed to fetch profile");
          setProfile(null);
        }
      } else {
        setProfile(data);
      }
    } catch (err) {
      console.error("Error in fetchProfile:", err);
      setError("An unexpected error occurred");
      setProfile(null);
    } finally {
      setLoading(false);
    }
  };

  const refreshProfile = async () => {
    if (user?.id) {
      await fetchProfile(user.id);
    }
  };

  const updateProfile = (updatedProfile: Profile) => {
    setProfile(updatedProfile);
  };

  useEffect(() => {
    if (user?.id) {
      fetchProfile(user.id);
    } else {
      setProfile(null);
      setLoading(false);
      setError(null);
    }
  }, [user?.id]);

  return (
    <ProfileContext.Provider
      value={{
        profile,
        loading,
        error,
        updateProfile,
        refreshProfile,
      }}
    >
      {children}
    </ProfileContext.Provider>
  );
}
