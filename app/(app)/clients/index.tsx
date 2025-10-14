import { useEffect, useState } from "react";
import {
    View,
    Text,
    FlatList,
    Pressable,
    ActivityIndicator,
    RefreshControl,
    TextInput,
} from "react-native";
import { Stack, useRouter } from "expo-router";
import { Plus, User, Mail, Phone, Search, X } from "lucide-react-native";
import { supabase } from "@/lib/supabase";
import { useStore } from "@/store";
import { Client } from "@/lib/types";
import React from "react";
import EmptyState from "@/components/EmptyState";

export default function ClientsListScreen() {
    const router = useRouter();
    const { company, clients, setClients } = useStore();
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");

    useEffect(() => {
        loadClients();
    }, []);

    const loadClients = async () => {
        if (!company) return;

        try {
            const { data, error } = await supabase
                .from("clients")
                .select("*")
                .eq("company_id", company.id)
                .order("created_at", { ascending: false });

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

    // filter clients based on search query
    const filteredClients = clients.filter((client) => {
        if (!searchQuery.trim()) return true;

        const query = searchQuery.toLowerCase();
        const name = client.name?.toLowerCase() || "";
        const email = client.email?.toLowerCase() || "";
        const phone = client.phone?.toLowerCase() || "";

        return (
            name.includes(query) ||
            email.includes(query) ||
            phone.includes(query)
        );
    });

    const clearSearch = () => {
        setSearchQuery("");
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
                    title: "Clients",
                    headerStyle: { backgroundColor: "#2563EB" },
                    headerTintColor: "white",
                    headerRight: () => (
                        <Pressable
                            onPress={() => router.push("/clients/new")}
                            className="mr-4"
                        >
                            <Plus size={24} color="white" />
                        </Pressable>
                    ),
                }}
            />

            {/* Search Bar */}
            <View className="bg-white border-b border-gray-200 px-4 py-3">
                <View className="flex-row items-center bg-gray-100 rounded-lg px-3 py-2">
                    <Search size={20} color="#6B7280" />
                    <TextInput
                        className="flex-1 ml-2 text-base text-gray-900"
                        placeholder="Search clients by name, email, or phone"
                        placeholderTextColor="#9CA3AF"
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                        autoCapitalize="none"
                        autoCorrect={false}
                    />
                    {searchQuery.length > 0 && (
                        <Pressable onPress={clearSearch} className="ml-2">
                            <X size={20} color="#6B7280" />
                        </Pressable>
                    )}
                </View>
                {searchQuery.length > 0 && (
                    <Text className="text-sm text-gray-600 mt-2">
                        {filteredClients.length}{" "}
                        {filteredClients.length === 1 ? "client" : "clients"}{" "}
                        found
                    </Text>
                )}
            </View>

            {clients.length === 0 ? (
                <EmptyState
                    icon={User}
                    title="Add your first client"
                    description="Keep track of your clients and quickly create estimates for them"
                    buttonText="Add First Client"
                    buttonIcon={Plus}
                    onButtonPress={() => router.push("/clients/new")}
                />
            ) : filteredClients.length === 0 ? (
                <EmptyState
                    icon={Search}
                    iconColor="#9CA3AF"
                    title="No clients found"
                    description={`We couldn't find any clients matching "${searchQuery}"`}
                    buttonText="Clear Search"
                    onButtonPress={clearSearch}
                />
            ) : (
                <FlatList
                    data={filteredClients}
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
                onPress={() => router.push("/clients/new")}
            >
                <Plus size={28} color="white" />
            </Pressable>
        </View>
    );
}
