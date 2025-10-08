import { useState } from 'react';
import { View, TextInput, Pressable, Text } from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { useStore } from '@/store';
import React from 'react';

export default function CompanySetup() {
    const router = useRouter();
    const { user, setCompany } = useStore();
    const [name, setName] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSave = async () => {
        if (!user || !name.trim()) {
            alert('Please enter a company name');
            return;
        }

        setLoading(true);

        try {
            // Create company
            const { data: company, error: companyError } = await supabase
                .from('companies')
                .insert({ name: name.trim() })
                .select()
                .single();

            if (companyError) throw companyError;

            // Link user to company
            const { error: userError } = await supabase.from('users').upsert({
                id: user.id,
                email: user.email!,
                company_id: company.id,
            });

            if (userError) throw userError;

            setCompany(company);
            router.replace('/(app)');
        } catch (error: any) {
            alert(error.message);
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
            />

            <Pressable
                className={`bg-blue-600 rounded-lg py-4 ${loading || !name ? 'opacity-60' : 'active:opacity-80'}`}
                onPress={handleSave}
                disabled={loading || !name}
            >
                <Text className="text-white text-center font-semibold text-base">
                    {loading ? 'Saving...' : 'Continue'}
                </Text>
            </Pressable>
        </View>
    );
}
