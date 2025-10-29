import { useState, useEffect } from "react";
import {
    View,
    Text,
    TextInput,
    Pressable,
    ScrollView,
    ActivityIndicator,
} from "react-native";
import { Stack, useRouter, useLocalSearchParams } from "expo-router";
import { Save } from "lucide-react-native";
import { supabase } from "@/lib/supabase/supabase";
import { useStore } from "@/store";
import React from "react";
import { showToast } from "@/lib/toast";
import { handleError } from "@/lib/errorHandler";

export default function NewClientScreen() {
    const router = useRouter();
    const params = useLocalSearchParams();
    const { company, addClient } = useStore();
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [phone, setPhone] = useState("");
    const [address, setAddress] = useState("");
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        setName("");
        setEmail("");
        setPhone("");
        setAddress("");
    }, [params.t]);

    const handleSave = async () => {
        if (!company || !name.trim()) {
            showToast.error("Name Required", "Please enter a client name");
            return;
        }

        setSaving(true);

        try {
            const { data, error } = await supabase
                .from("clients")
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
            showToast.success("Client Created", `${data.name} has been added`);
            router.push("/clients");
        } catch (error: any) {
            handleError(error, {
                operation: "create client",
                fallbackMessage: "Unable to create client",
            });
        } finally {
            setSaving(false);
        }
    };

    return (
        <View className="flex-1 bg-gray-50">
            <Stack.Screen
                options={{
                    title: "New Client",
                    headerStyle: { backgroundColor: "#2563EB" },
                    headerTintColor: "white",
                }}
            />

            <ScrollView className="flex-1" keyboardShouldPersistTaps="handled">
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
                            autoFocus
                            placeholderTextColor="#9CA3AF"
                            editable={!saving}
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
                            editable={!saving}
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
                            editable={!saving}
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
                            editable={!saving}
                        />
                    </View>
                </View>
            </ScrollView>

            <View className="p-4 bg-white border-t border-gray-200">
                <Pressable
                    className={`bg-blue-600 rounded-lg py-4 flex-row items-center justify-center ${
                        saving ? "opacity-60" : "active:opacity-80"
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
                                Create Client
                            </Text>
                        </>
                    )}
                </Pressable>
            </View>
        </View>
    );
}
