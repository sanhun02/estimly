import { useState } from 'react';
import { View, TextInput, Pressable, Text } from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { useStore } from '@/store';

export default function CompanySetup() {
    const router = useRouter();
    const { user } = useStore();
    const [name, setName] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSave = async () => {
        if (!user) return;

        setLoading(true);

        // create company
        const { data: company, error: companyError } = await supabase
            .from('companies')
            .insert({ name })
            .select()
            .single();

        if (companyError) {
            alert(companyError.message);
            setLoading(false);
            return;
        }

        // link user to company
        const { error: userError } = await supabase.from('users').insert({
            id: user.id,
            email: user.email!,
            company_id: company.id,
        });

        if (userError && userError.code !== '23505') {
            // ignore duplicate key
            alert(userError.message);
            setLoading(false);
            return;
        }

        useStore.getState().setCompany(company);
        router.replace('/(app)');
    };

    return (
        <View>
            <Text>Welcome!</Text>
            <Text>Let's set up your company</Text>

            <TextInput
                placeholder="Company Name"
                value={name}
                onChangeText={setName}
            />

            <Pressable onPress={handleSave} disabled={loading || !name}>
                <Text>{loading ? 'Saving...' : 'Continue'}</Text>
            </Pressable>
        </View>
    );
}
