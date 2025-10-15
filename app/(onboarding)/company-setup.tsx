import { useState, useEffect } from "react";
import { View, TextInput, Pressable, Text } from "react-native";
import { useRouter } from "expo-router";
import { supabase, supabaseAdmin } from "@/lib/supabase/supabase";
import { useStore } from "@/store";
import React from "react";
import { showToast } from "@/lib/toast";

export default function CompanySetup() {
    const router = useRouter();
    const { session, setCompany, setSession, setUser } = useStore();
    const [name, setName] = useState("");
    const [loading, setLoading] = useState(false);

    // Check if session is valid on mount
    useEffect(() => {
        const checkSession = async () => {
            const {
                data: { session: currentSession },
            } = await supabase.auth.getSession();

            if (!currentSession) {
                // No valid session, clear store and go to login
                setSession(null);
                setUser(null);
                setCompany(null);
                router.replace("/(auth)/login");
            }
        };

        checkSession();
    }, []);

    const handleSave = async () => {
        if (!session?.user || !name.trim()) {
            showToast.error("Missing Info", "Please enter a company name");
            return;
        }

        setLoading(true);

        try {
            // Debug: Check current auth status
            const {
                data: { session: currentSession },
            } = await supabase.auth.getSession();
            console.log("✅ Current session:", currentSession?.user?.email);
            console.log("✅ Session role:", currentSession?.user?.role);

            // Step 1: Create company directly
            console.log("📝 Creating company...");
            const { data: company, error: companyError } = await supabaseAdmin
                .from("companies")
                .insert({ name: name.trim() })
                .select()
                .single();

            if (companyError) {
                console.error("❌ Company creation error:", companyError);
                throw companyError;
            }

            console.log("✅ Company created:", company.id);

            // Step 2: Create/update user record with company_id
            console.log("🔗 Linking user to company...");
            const { error: userError } = await supabase.from("users").upsert({
                id: session.user.id,
                email: session.user.email!,
                company_id: company.id,
            });

            if (userError) {
                console.error("❌ User linking error:", userError);
                throw userError;
            }

            console.log("✅ User linked successfully");

            setCompany(company);
            showToast.success("Success!", "Company setup complete");
            router.replace("/(app)");
        } catch (error: any) {
            console.error("❌ Setup error:", error);
            showToast.error(
                "Setup Failed",
                error.message || "Please try again"
            );
        } finally {
            setLoading(false);
        }
    };

    const handleSignOut = async () => {
        await supabase.auth.signOut();
        setSession(null);
        setUser(null);
        setCompany(null);
        router.replace("/(auth)/login");
    };

    return (
        <View className="flex-1 justify-center px-6 bg-white">
            <Text className="text-3xl font-bold mb-2 text-gray-900">
                Welcome!
            </Text>
            <Text className="text-base text-gray-600 mb-8">
                Let's set up your company
            </Text>

            <TextInput
                className="border border-gray-300 rounded-lg px-4 py-3 mb-6 text-base"
                placeholder="Company Name"
                value={name}
                onChangeText={setName}
                autoFocus
                editable={!loading}
            />

            <Pressable
                className={`bg-blue-600 rounded-lg py-4 mb-4 ${
                    loading || !name.trim() ? "opacity-60" : "active:opacity-80"
                }`}
                onPress={handleSave}
                disabled={loading || !name.trim()}
            >
                <Text className="text-white text-center font-semibold text-base">
                    {loading ? "Saving..." : "Continue"}
                </Text>
            </Pressable>

            {/* Temporary sign out button */}
            <Pressable
                className="border border-gray-300 rounded-lg py-3"
                onPress={handleSignOut}
            >
                <Text className="text-gray-600 text-center text-sm">
                    Sign Out
                </Text>
            </Pressable>
        </View>
    );
}
