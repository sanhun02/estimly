import { useState, useEffect } from "react";
import { View, TextInput, Pressable, Text } from "react-native";
import { useRouter } from "expo-router";
import { supabase, supabaseAdmin } from "@/lib/supabase/supabase";
import { useStore } from "@/store";
import React from "react";
import { showToast } from "@/lib/toast";
import { handleError } from "@/lib/errorHandler";

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
            // Step 1: Create company directly
            const { data: company, error: companyError } = await supabaseAdmin
                .from("companies")
                .insert({ name: name.trim() })
                .select()
                .single();

            if (companyError) throw companyError;

            // Step 2: Create/update user record with company_id
            const { error: userError } = await supabase.from("users").upsert({
                id: session.user.id,
                email: session.user.email!,
                company_id: company.id,
            });

            if (userError) throw userError;

            setCompany(company);
            showToast.success("Success!", "Company setup complete");
            router.replace("/(app)");
        } catch (error: any) {
            handleError(error, {
                operation: "company setup",
                fallbackMessage: "Unable to complete setup. Please try again.",
            });
        } finally {
            setLoading(false);
        }
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
        </View>
    );
}
