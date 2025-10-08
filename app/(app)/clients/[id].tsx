import { useEffect, useState } from 'react';
import {
    View,
    Text,
    TextInput,
    Pressable,
    ScrollView,
    Alert,
    ActivityIndicator,
} from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { Trash2, Save } from 'lucide-react-native';
import { supabase } from '@/lib/supabase';
import { useStore } from '@/store';
import React from 'react';

export default function ClientDetailScreen() {
    const params = useLocalSearchParams();
    const router = useRouter();
    const { company, updateClient, deleteClient, addClient } = useStore();

    const id = Array.isArray(params.id) ? params.id[0] : params.id;

    const [loading, setLoading] = useState(id !== 'new');
    const [saving, setSaving] = useState(false);
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [address, setAddress] = useState('');

    const isNewClient = id === 'new';

    useEffect(() => {
        if (!isNewClient) {
            loadClient();
        }
    }, [id]);

    const loadClient = async () => {
        try {
            const { data, error } = await supabase
                .from('clients')
                .select('*')
                .eq('id', id)
                .single();

            if (error) throw error;

            setName(data.name);
            setEmail(data.email || '');
            setPhone(data.phone || '');
            setAddress(data.address || '');
        } catch (error: any) {
            alert(error.message);
            router.back();
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        if (!company || !name.trim()) {
            alert('Please enter a client name');
            return;
        }

        setSaving(true);

        try {
            if (isNewClient) {
                const { data, error } = await supabase
                    .from('clients')
                    .insert({
                        company_id: company.id,
                        name: name.trim(),
                        email: email.trim() || null,
                        phone: phone.trim() || null,
                        address: address.trim() || null,
                    })
                    .select()
                    .single();

                if (error) throw error;
                addClient(data);
            } else {
                const { data, error } = await supabase
                    .from('clients')
                    .update({
                        name: name.trim(),
                        email: email.trim() || null,
                        phone: phone.trim() || null,
                        address: address.trim() || null,
                    })
                    .eq('id', id)
                    .select()
                    .single();

                if (error) throw error;
                updateClient(id, data);
            }

            router.back();
        } catch (error: any) {
            alert(error.message);
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = () => {
        Alert.alert(
            'Delete Client',
            'Are you sure you want to delete this client?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            const { error } = await supabase
                                .from('clients')
                                .delete()
                                .eq('id', id);

                            if (error) throw error;
                            deleteClient(id);
                            router.back();
                        } catch (error: any) {
                            alert(error.message);
                        }
                    },
                },
            ]
        );
    };

    if (loading) {
        return (
            <View className="flex-1 justify-center items-center">
                <ActivityIndicator size="large" color="#2563EB" />
            </View>
        );
    }

    return (
        <View className="flex-1 bg-gray-50">
            <Stack.Screen
                options={{
                    title: isNewClient ? 'New Client' : 'Edit Client',
                    headerStyle: { backgroundColor: '#2563EB' },
                    headerTintColor: 'white',
                    headerRight: () =>
                        !isNewClient ? (
                            <Pressable onPress={handleDelete} className="mr-4">
                                <Trash2 size={22} color="white" />
                            </Pressable>
                        ) : null,
                }}
            />

            <ScrollView className="flex-1">
                <View className="p-4">
                    <View className="mb-5">
                        <Text className="text-sm font-semibold text-gray-700 mb-2">
                            Name *
                        </Text>
                        <TextInput
                            className="bg-white border border-gray-300 rounded-lg px-4 py-3 text-base text-gray-900"
                            value={name}
                            onChangeText={setName}
                            placeholder="Client name"
                            autoFocus={isNewClient}
                            placeholderTextColor="#9CA3AF"
                        />
                    </View>

                    <View className="mb-5">
                        <Text className="text-sm font-semibold text-gray-700 mb-2">
                            Email
                        </Text>
                        <TextInput
                            className="bg-white border border-gray-300 rounded-lg px-4 py-3 text-base text-gray-900"
                            value={email}
                            onChangeText={setEmail}
                            placeholder="client@example.com"
                            keyboardType="email-address"
                            autoCapitalize="none"
                            placeholderTextColor="#9CA3AF"
                        />
                    </View>

                    <View className="mb-5">
                        <Text className="text-sm font-semibold text-gray-700 mb-2">
                            Phone
                        </Text>
                        <TextInput
                            className="bg-white border border-gray-300 rounded-lg px-4 py-3 text-base text-gray-900"
                            value={phone}
                            onChangeText={setPhone}
                            placeholder="(555) 123-4567"
                            keyboardType="phone-pad"
                            placeholderTextColor="#9CA3AF"
                        />
                    </View>

                    <View className="mb-5">
                        <Text className="text-sm font-semibold text-gray-700 mb-2">
                            Address
                        </Text>
                        <TextInput
                            className="bg-white border border-gray-300 rounded-lg px-4 py-3 text-base text-gray-900 min-h-[80px]"
                            value={address}
                            onChangeText={setAddress}
                            placeholder="Street address, city, state, ZIP"
                            multiline
                            numberOfLines={3}
                            textAlignVertical="top"
                            placeholderTextColor="#9CA3AF"
                        />
                    </View>
                </View>
            </ScrollView>

            <View className="p-4 bg-white border-t border-gray-200">
                <Pressable
                    className={`bg-blue-600 rounded-lg py-4 flex-row items-center justify-center ${
                        saving ? 'opacity-60' : 'active:opacity-80'
                    }`}
                    onPress={handleSave}
                    disabled={saving}
                >
                    {saving ? (
                        <ActivityIndicator color="white" />
                    ) : (
                        <>
                            <Save size={20} color="white" />
                            <Text className="text-white text-base font-semibold ml-2">
                                {isNewClient ? 'Create Client' : 'Save Changes'}
                            </Text>
                        </>
                    )}
                </Pressable>
            </View>
        </View>
    );
}
