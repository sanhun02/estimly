// @ts-ignore
import '../global.css';
import { useEffect, useState } from 'react';
import { Slot, useRouter, useSegments } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { useStore } from '@/store';
import { View, ActivityIndicator } from 'react-native';

export default function RootLayout() {
    const router = useRouter();
    const segments = useSegments();
    const { session, setSession, setUser, reset } = useStore();
    const [loading, setLoading] = useState(true);

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
        const inAuthGroup = segments[0] === '(auth)';
        const inOnboardingGroup = segments[0] === '(onboarding)';
        const inAppGroup = segments[0] === '(app)';

        if (!session && !inAuthGroup) {
            setTimeout(() => router.replace('/(auth)/login'), 0);
        } else if (session && inAuthGroup) {
            checkCompanySetup();
        }
    }, [session, segments, loading]);

    const checkCompanySetup = async () => {
        if (!session?.user) return;

        const { data: userData } = await supabase
            .from('users')
            .select('company_id, companies(*)')
            .eq('id', session.user.id)
            .single();

        if (!userData?.company_id) {
            router.replace('/(onboarding)/company-setup');
        } else {
            useStore.getState().setCompany(userData.companies);
            router.replace('/(app)');
        }
    };

    if (loading) {
        return (
            <View className="flex-1 justify-center items-center">
                <ActivityIndicator size="large" />
            </View>
        );
    }

    return <Slot />;
}
