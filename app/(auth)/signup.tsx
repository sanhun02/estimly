import { useState } from 'react';
import { View, TextInput, Pressable, Text } from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '@/lib/supabase';
import React from 'react';

export default function Signup() {
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSignup = async () => {
        setLoading(true);

        const { error } = await supabase.auth.signUp({
            email,
            password,
        });

        if (error) {
            alert(error.message);
        } else {
            alert('Check your email for confirmation!');
        }

        setLoading(false);
    };

    return (
        <View className="flex-1 justify-center px-6 bg-white">
            <Text className="text-3xl font-bold mb-8 text-gray-900">
                Sign Up
            </Text>

            <TextInput
                className="border border-gray-300 rounded-lg px-4 py-3 mb-4 text-base"
                placeholder="Email"
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
            />

            <TextInput
                className="border border-gray-300 rounded-lg px-4 py-3 mb-6 text-base"
                placeholder="Password"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
            />

            <Pressable
                className="bg-blue-600 rounded-lg py-4 mb-4 active:opacity-80"
                onPress={handleSignup}
                disabled={loading}
            >
                <Text className="text-white text-center font-semibold text-base">
                    {loading ? 'Loading...' : 'Create Account'}
                </Text>
            </Pressable>

            <Pressable onPress={() => router.back()}>
                <Text className="text-center text-blue-600 text-sm">
                    Already have an account? Login
                </Text>
            </Pressable>
        </View>
    );
}
