import { useState } from "react";
import { View, TextInput, Pressable, Text, ScrollView } from "react-native";
import { useRouter } from "expo-router";
import { supabase } from "@/lib/supabase/supabase";
import React from "react";
import { showToast } from "@/lib/toast";

export default function Signup() {
    const router = useRouter();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);

    const handleSignup = async () => {
        // validation
        if (!email.trim() || !password.trim()) {
            showToast.error(
                "Missing Fields",
                "Please enter email and password"
            );
            return;
        }

        if (password.length < 6) {
            showToast.error(
                "Weak Password",
                "Password must be at least 6 characters"
            );
            return;
        }

        setLoading(true);

        try {
            const { data, error } = await supabase.auth.signUp({
                email: email.trim().toLowerCase(),
                password,
                options: {
                    emailRedirectTo: undefined,
                },
            });

            if (error) throw error;

            if (data.user) {
                showToast.success(
                    "Account Created!",
                    "Check your email for verification code"
                );

                // manual redirect to verification screen
                setTimeout(() => {
                    router.replace({
                        pathname: "/(auth)/verify-email",
                        params: { email: email.trim().toLowerCase() },
                    });
                }, 500);
            }
        } catch (error: any) {
            showToast.error("Signup Failed", error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <ScrollView
            className="flex-1 bg-white"
            contentContainerClassName="flex-1"
            keyboardShouldPersistTaps="handled"
        >
            <View className="flex-1 justify-center px-6">
                <Text className="text-3xl font-bold mb-2 text-gray-900">
                    Create Account
                </Text>
                <Text className="text-base text-gray-600 mb-8">
                    Sign up to get started with Estimly
                </Text>

                <TextInput
                    className="border border-gray-300 rounded-lg px-4 py-3 mb-4 text-base"
                    placeholder="Email"
                    value={email}
                    onChangeText={setEmail}
                    autoCapitalize="none"
                    keyboardType="email-address"
                    autoComplete="email"
                    editable={!loading}
                />

                <TextInput
                    className="border border-gray-300 rounded-lg px-4 py-3 mb-6 text-base"
                    placeholder="Password (min 6 characters)"
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry
                    autoComplete="password"
                    editable={!loading}
                />

                <Pressable
                    className={`bg-blue-600 rounded-lg py-4 mb-4 ${
                        loading || !email.trim() || !password.trim()
                            ? "opacity-60"
                            : "active:opacity-80"
                    }`}
                    onPress={handleSignup}
                    disabled={loading || !email.trim() || !password.trim()}
                >
                    <Text className="text-white text-center font-semibold text-base">
                        {loading ? "Creating Account..." : "Sign Up"}
                    </Text>
                </Pressable>

                <Pressable
                    onPress={() => router.push("/(auth)/login")}
                    disabled={loading}
                >
                    <Text className="text-center text-blue-600 text-sm">
                        Already have an account? Log In
                    </Text>
                </Pressable>
            </View>
        </ScrollView>
    );
}
