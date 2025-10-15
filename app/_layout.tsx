// @ts-ignore
import "../global.css";
import { useEffect, useState } from "react";
import { Slot, useRouter, useSegments } from "expo-router";
import { supabase } from "@/lib/supabase/supabase";
import { useStore } from "@/store";
import { View, ActivityIndicator } from "react-native";
import React from "react";
import Toast, { BaseToast, ErrorToast } from "react-native-toast-message";

export default function RootLayout() {
    const router = useRouter();
    const segments = useSegments();
    const { session, company, setSession, setUser, setCompany } = useStore();
    const [loading, setLoading] = useState(true);
    const [checkingCompany, setCheckingCompany] = useState(false);

    useEffect(() => {
        // check initial session
        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session);
            setUser(session?.user ?? null);
            setLoading(false);
        });

        // listen for auth changes
        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange((_event, session) => {
            setSession(session);
            setUser(session?.user ?? null);
        });

        return () => subscription.unsubscribe();
    }, []);

    useEffect(() => {
        if (session?.user?.email_confirmed_at) {
            checkCompanySetup();
        }
    }, [session]);

    const checkCompanySetup = async () => {
        if (!session?.user) return;

        setCheckingCompany(true);

        try {
            const { data: userData } = await supabase
                .from("users")
                .select("company_id, companies(*)")
                .eq("id", session.user.id)
                .single();

            if (userData?.companies) {
                setCompany(userData.companies as any);
            } else {
                setCompany(null);
            }
        } catch (error) {
            console.error("Error checking company:", error);
        } finally {
            setCheckingCompany(false);
        }
    };

    useEffect(() => {
        // Wait for both loading states
        if (loading || checkingCompany) return;

        const inAuthGroup = segments[0] === "(auth)";
        const inOnboardingGroup = segments[0] === "(onboarding)";
        const inAppGroup = segments[0] === "(app)";

        // No session - redirect to login
        if (!session) {
            if (!inAuthGroup) {
                router.replace("/(auth)/login");
            }
            return;
        }

        // Has session - check email verification
        if (session) {
            // Check if email is verified
            if (!session.user.email_confirmed_at) {
                const currentPath = segments.join("/");
                if (currentPath !== "(auth)/verify-email") {
                    router.replace("/(auth)/verify-email");
                }
                return;
            }

            // Email is verified - check company setup
            if (company) {
                // Has company - should be in app
                if (inAuthGroup || inOnboardingGroup) {
                    router.replace("/(app)");
                }
            } else {
                // No company - should be in onboarding
                if (!inOnboardingGroup) {
                    router.replace("/(onboarding)/company-setup");
                }
            }
        }
    }, [session, company, segments, loading, checkingCompany]);

    if (loading || checkingCompany) {
        return (
            <View className="flex-1 justify-center items-center">
                <ActivityIndicator size="large" color="#2563EB" />
            </View>
        );
    }

    return (
        <>
            <Slot />
            <Toast config={toastConfig} />
        </>
    );
}

const toastConfig = {
    success: (props: any) => (
        <BaseToast
            {...props}
            style={{ borderLeftColor: "#10B981", borderLeftWidth: 6 }}
            contentContainerStyle={{ paddingHorizontal: 15 }}
            text1Style={{
                fontSize: 16,
                fontWeight: "600",
            }}
            text2Style={{
                fontSize: 14,
                color: "#6B7280",
            }}
        />
    ),
    error: (props: any) => (
        <ErrorToast
            {...props}
            style={{ borderLeftColor: "#EF4444", borderLeftWidth: 6 }}
            contentContainerStyle={{ paddingHorizontal: 15 }}
            text1Style={{
                fontSize: 16,
                fontWeight: "600",
            }}
            text2Style={{
                fontSize: 14,
                color: "#6B7280",
            }}
        />
    ),
};
