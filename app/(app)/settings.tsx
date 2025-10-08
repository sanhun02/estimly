import { View, Text, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { useStore } from '@/store';
import React from 'react';

export default function Settings() {
    const router = useRouter();
    const { reset } = useStore();

    const handleLogout = async () => {
        await supabase.auth.signOut();
        reset();
        router.replace('/(auth)/login');
    };

    return (
        <View className="flex-1 bg-gray-50 p-4">
            <Pressable
                className="bg-red-600 rounded-lg py-4 active:opacity-80"
                onPress={handleLogout}
            >
                <Text className="text-white text-center font-semibold text-base">
                    Logout
                </Text>
            </Pressable>
        </View>
    );
}
