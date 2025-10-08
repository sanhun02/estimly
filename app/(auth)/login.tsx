import { useState } from 'react';
import { View, TextInput, Pressable, Text } from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '@/lib/supabase';

export default function Login() {
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);

    const handleLogin = async () => {
        setLoading(true);

        const { error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });

        if (error) alert(error.message);

        setLoading(false);
    };

    return (
        <View>
            <Text>Login</Text>

            <TextInput
                placeholder="Email"
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
            />

            <TextInput
                placeholder="Password"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
            />

            <Pressable onPress={handleLogin} disabled={loading}>
                <Text>{loading ? 'Loading...' : 'Sign In'}</Text>
            </Pressable>

            <Pressable onPress={() => router.push('/(auth)/signup')}>
                <Text>Don't have an account? Sign up</Text>
            </Pressable>
        </View>
    );
}
