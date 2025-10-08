import { useEffect, useState } from 'react';
import {
    View,
    Text,
    FlatList,
    Pressable,
    ActivityIndicator,
    RefreshControl,
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Plus, User, Mail, Phone } from 'lucide-react-native';
import { supabase } from '@/lib/supabase';
import { useStore } from '@/store';
import { Client } from '@/lib/types';
import React from 'react';

export default function ClientsListScreen() {
    const router = useRouter();
    const { company, clients, setClients } = useStore();
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    useEffect(() => {
        loadClients();
    }, []);

    const loadClients = async () => {
        if (!company) return;

        try {
            const { data, error } = await supabase
                .from('clients')
                .select('*')
                .eq('company_id', company.id)
                .order('created_at', { ascending: false });

            if (error) throw error;
            setClients(data || []);
        } catch (error: any) {
            alert(error.message);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const onRefresh = () => {
        setRefreshing(true);
        loadClients();
    };

    const renderClient = ({ item }: { item: Client }) => (
        <Pressable
            className="bg-white rounded-xl p-4 mb-3 border border-gray-200 active:opacity-80"
            onPress={() => router.push(`/clients/${item.id}`)}
        >
            <View className="flex-row items-center">
                <View className="w-12 h-12 rounded-full bg-blue-100 items-center justify-center mr-3">
                    <User size={24} color="#2563EB" />
                </View>
                <View className="flex-1">
                    <Text className="text-lg font-semibold text-gray-900 mb-1">
                        {item.name}
                    </Text>
                    {item.email && (
                        <View className="flex-row items-center mt-1">
                            <Mail size={14} color="#6B7280" />
                            <Text className="text-sm text-gray-600 ml-2">
                                {item.email}
                            </Text>
                        </View>
                    )}
                    {item.phone && (
                        <View className="flex-row items-center mt-1">
                            <Phone size={14} color="#6B7280" />
                            <Text className="text-sm text-gray-600 ml-2">
                                {item.phone}
                            </Text>
                        </View>
                    )}
                </View>
            </View>
        </Pressable>
    );

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
                    title: 'Clients',
                    headerStyle: { backgroundColor: '#2563EB' },
                    headerTintColor: 'white',
                    headerRight: () => (
                        <Pressable
                            onPress={() => router.push('/clients/new')}
                            className="mr-4"
                        >
                            <Plus size={24} color="white" />
                        </Pressable>
                    ),
                }}
            />

            {clients.length === 0 ? (
                <View className="flex-1 justify-center items-center px-6">
                    <User size={64} color="#D1D5DB" />
                    <Text className="text-xl font-semibold text-gray-900 mt-4 mb-2">
                        No clients yet
                    </Text>
                    <Text className="text-sm text-gray-600 text-center">
                        Tap the + button to add your first client
                    </Text>
                </View>
            ) : (
                <FlatList
                    data={clients}
                    renderItem={renderClient}
                    keyExtractor={(item) => item.id}
                    contentContainerClassName="p-4"
                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={onRefresh}
                        />
                    }
                />
            )}

            <Pressable
                className="absolute right-5 bottom-5 w-14 h-14 rounded-full bg-blue-600 items-center justify-center shadow-lg active:opacity-80"
                onPress={() => router.push('/clients/new')}
            >
                <Plus size={28} color="white" />
            </Pressable>
        </View>
    );
}
