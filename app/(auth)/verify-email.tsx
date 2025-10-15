import { View, Text, Pressable, TextInput } from "react-native";
import { supabase } from "@/lib/supabase/supabase";
import { useStore } from "@/store";
import { useState, useEffect } from "react";
import { showToast } from "@/lib/toast";
import { useLocalSearchParams, useRouter } from "expo-router";
import React from "react";

export default function VerifyEmail() {
    const router = useRouter();
    const params = useLocalSearchParams();
    const email = params.email as string;

    const [code, setCode] = useState("");
    const [loading, setLoading] = useState(false);
    const [resending, setResending] = useState(false);

    const verifyCode = async () => {
        if (!email) {
            showToast.error(
                "Error",
                "Email not found. Please try signing up again."
            );
            router.replace("/(auth)/signup");
            return;
        }

        if (!code.trim()) {
            showToast.error(
                "Missing code",
                "Please enter the verification code"
            );
            return;
        }

        if (code.trim().length !== 6) {
            showToast.error("Invalid code", "Code must be 6 digits");
            return;
        }

        setLoading(true);
        try {
            const { error } = await supabase.auth.verifyOtp({
                email: email,
                token: code.trim(),
                type: "email",
            });

            if (error) {
                console.error("OTP verification error:", error);
                throw error;
            }

            showToast.success("Email verified!", "Setting up your account...");

            // Force refresh session to get updated email_confirmed_at
            await supabase.auth.refreshSession();

            // The auth listener in _layout will handle redirect to company setup
        } catch (error: any) {
            console.error("Verification error:", error);
            showToast.error(
                "Invalid code",
                error.message || "Please check the code and try again"
            );
            setCode(""); // Clear the code field
        } finally {
            setLoading(false);
        }
    };

    const resendCode = async () => {
        if (!email) {
            showToast.error("Error", "Email not found");
            return;
        }

        setResending(true);
        try {
            const { error } = await supabase.auth.resend({
                type: "signup",
                email: email,
            });

            if (error) throw error;
            showToast.success("Code sent!", "Check your email inbox");
            setCode(""); // Clear any previously entered code
        } catch (error: any) {
            showToast.error("Failed to resend", error.message);
        } finally {
            setResending(false);
        }
    };

    const handleSignOut = async () => {
        await supabase.auth.signOut();
        router.replace("/(auth)/login");
    };

    // Show loading if email isn't loaded yet
    if (!email) {
        return (
            <View className="flex-1 justify-center items-center px-6 bg-white">
                <Text className="text-gray-600 text-center mb-4">
                    No email found. Redirecting to signup...
                </Text>
                <Pressable
                    className="bg-blue-600 rounded-lg py-3 px-6"
                    onPress={() => router.replace("/(auth)/signup")}
                >
                    <Text className="text-white font-semibold">
                        Go to Sign Up
                    </Text>
                </Pressable>
            </View>
        );
    }

    return (
        <View className="flex-1 justify-center px-6 bg-white">
            <View className="items-center mb-8">
                <View className="w-20 h-20 bg-blue-100 rounded-full items-center justify-center mb-4">
                    <Text className="text-4xl">🔐</Text>
                </View>
                <Text className="text-3xl font-bold mb-2 text-gray-900 text-center">
                    Enter Verification Code
                </Text>
                <Text className="text-base text-gray-600 text-center mb-1">
                    We sent a 6-digit code to
                </Text>
                <Text className="text-base font-semibold text-gray-900">
                    {email}
                </Text>
            </View>

            <View className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <Text className="text-sm text-blue-900 mb-2 font-semibold">
                    📌 Check your email:
                </Text>
                <Text className="text-sm text-blue-800 mb-1">
                    • Look for an email from Estimly
                </Text>
                <Text className="text-sm text-blue-800 mb-1">
                    • Check your spam folder if you don't see it
                </Text>
                <Text className="text-sm text-blue-800">
                    • The code expires in 60 minutes
                </Text>
            </View>

            <TextInput
                className="border-2 border-gray-300 rounded-lg px-4 py-4 mb-4 text-2xl text-center font-bold tracking-widest"
                placeholder="000000"
                value={code}
                onChangeText={(text) => setCode(text.replace(/[^0-9]/g, ""))}
                keyboardType="number-pad"
                maxLength={6}
                autoFocus
                editable={!loading}
            />

            <Pressable
                className={`bg-blue-600 rounded-lg py-4 mb-3 ${
                    loading || !code.trim() || code.length !== 6
                        ? "opacity-60"
                        : "active:opacity-80"
                }`}
                onPress={verifyCode}
                disabled={loading || !code.trim() || code.length !== 6}
            >
                <Text className="text-white text-center font-semibold text-base">
                    {loading ? "Verifying..." : "Verify Email"}
                </Text>
            </Pressable>

            <Pressable
                className={`border border-gray-300 rounded-lg py-4 mb-6 ${
                    resending ? "opacity-60" : "active:opacity-80"
                }`}
                onPress={resendCode}
                disabled={resending}
            >
                <Text className="text-gray-700 text-center font-semibold text-base">
                    {resending ? "Sending..." : "Resend Code"}
                </Text>
            </Pressable>

            <Pressable className="py-2" onPress={handleSignOut}>
                <Text className="text-gray-500 text-center text-sm">
                    Sign out and use a different email
                </Text>
            </Pressable>
        </View>
    );
}
