import { useState, useEffect } from "react";
import {
    View,
    Text,
    TextInput,
    Pressable,
    ScrollView,
    Alert,
    ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import { LogOut, Save, Building2, Percent } from "lucide-react-native";
import { supabase } from "@/lib/supabase/supabase";
import { useStore } from "@/store";
import React from "react";
import { showToast } from "@/lib/toast";

export default function Settings() {
    const router = useRouter();
    const { user, company, setCompany, reset } = useStore();

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [phone, setPhone] = useState("");
    const [address, setAddress] = useState("");
    const [taxRate, setTaxRate] = useState("");
    const [depositPercent, setDepositPercent] = useState("");

    useEffect(() => {
        loadCompanyData();
    }, []);

    const loadCompanyData = async () => {
        if (!user) return;

        try {
            const { data, error } = await supabase
                .from("users")
                .select("company_id, companies(*)")
                .eq("id", user.id)
                .single();

            if (error) throw error;

            if (data?.companies) {
                const comp = data.companies as any;
                setName(comp.name || "");
                setEmail(comp.email || "");
                setPhone(comp.phone || "");
                setAddress(comp.address || "");
                setTaxRate(comp.default_tax_rate?.toString() || "0");
                setDepositPercent(
                    comp.default_deposit_percent?.toString() || "50"
                );
                setCompany(comp);
            }
        } catch (error: any) {
            showToast.error("Failed to load settings", error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        if (!company) return;

        if (!name.trim()) {
            showToast.error("Name Required", "Company name cannot be empty");
            return;
        }

        setSaving(true);

        try {
            const { data, error } = await supabase
                .from("companies")
                .update({
                    name: name.trim(),
                    email: email.trim() || null,
                    phone: phone.trim() || null,
                    address: address.trim() || null,
                    default_tax_rate: parseFloat(taxRate) || 0,
                    default_deposit_percent: parseFloat(depositPercent) || 50,
                })
                .eq("id", company.id)
                .select()
                .single();

            if (error) throw error;

            setCompany(data);
            showToast.success("Settings Saved", "Your changes have been saved");
        } catch (error: any) {
            showToast.error("Failed to save settings", error.message);
        } finally {
            setSaving(false);
        }
    };

    const handleLogout = () => {
        Alert.alert("Logout", "Are you sure you want to logout?", [
            { text: "Cancel", style: "cancel" },
            {
                text: "Logout",
                style: "destructive",
                onPress: async () => {
                    await supabase.auth.signOut();
                    reset();
                    router.replace("/(auth)/login");
                },
            },
        ]);
    };

    if (loading) {
        return (
            <View className="flex-1 justify-center items-center bg-gray-50">
                <ActivityIndicator size="large" color="#2563EB" />
            </View>
        );
    }

    return (
        <View className="flex-1 bg-gray-50">
            <ScrollView className="flex-1">
                <View className="p-4">
                    {/* Account Info */}
                    <View className="bg-white rounded-xl p-4 mb-4 border border-gray-200">
                        <View className="flex-row items-center mb-3">
                            <View className="w-10 h-10 rounded-full bg-blue-100 items-center justify-center mr-3">
                                <Text className="text-blue-600 font-bold text-lg">
                                    {user?.email?.charAt(0).toUpperCase()}
                                </Text>
                            </View>
                            <View className="flex-1">
                                <Text className="text-sm text-gray-500">
                                    Logged in as
                                </Text>
                                <Text className="text-base font-semibold text-gray-900">
                                    {user?.email}
                                </Text>
                            </View>
                        </View>
                    </View>

                    {/* Company Information */}
                    <View className="bg-white rounded-xl p-4 mb-4 border border-gray-200">
                        <View className="flex-row items-center mb-4">
                            <Building2 size={20} color="#2563EB" />
                            <Text className="text-lg font-bold text-gray-900 ml-2">
                                Company Information
                            </Text>
                        </View>

                        <View className="mb-4">
                            <Text className="text-sm font-semibold text-gray-700 mb-2">
                                Company Name *
                            </Text>
                            <TextInput
                                className="bg-gray-50 border border-gray-300 rounded-lg px-4 py-3 text-base text-gray-900"
                                value={name}
                                onChangeText={setName}
                                placeholder="Your Company LLC"
                                placeholderTextColor="#9CA3AF"
                            />
                        </View>

                        <View className="mb-4">
                            <Text className="text-sm font-semibold text-gray-700 mb-2">
                                Email
                            </Text>
                            <TextInput
                                className="bg-gray-50 border border-gray-300 rounded-lg px-4 py-3 text-base text-gray-900"
                                value={email}
                                onChangeText={setEmail}
                                placeholder="company@example.com"
                                keyboardType="email-address"
                                autoCapitalize="none"
                                placeholderTextColor="#9CA3AF"
                            />
                        </View>

                        <View className="mb-4">
                            <Text className="text-sm font-semibold text-gray-700 mb-2">
                                Phone
                            </Text>
                            <TextInput
                                className="bg-gray-50 border border-gray-300 rounded-lg px-4 py-3 text-base text-gray-900"
                                value={phone}
                                onChangeText={setPhone}
                                placeholder="(555) 123-4567"
                                keyboardType="phone-pad"
                                placeholderTextColor="#9CA3AF"
                            />
                        </View>

                        <View className="mb-4">
                            <Text className="text-sm font-semibold text-gray-700 mb-2">
                                Address
                            </Text>
                            <TextInput
                                className="bg-gray-50 border border-gray-300 rounded-lg px-4 py-3 text-base text-gray-900 min-h-[80px]"
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

                    {/* Estimate Defaults */}
                    <View className="bg-white rounded-xl p-4 mb-4 border border-gray-200">
                        <View className="flex-row items-center mb-4">
                            <Percent size={20} color="#2563EB" />
                            <Text className="text-lg font-bold text-gray-900 ml-2">
                                Estimate Defaults
                            </Text>
                        </View>

                        <View className="mb-4">
                            <Text className="text-sm font-semibold text-gray-700 mb-2">
                                Default Tax Rate (%)
                            </Text>
                            <TextInput
                                className="bg-gray-50 border border-gray-300 rounded-lg px-4 py-3 text-base text-gray-900"
                                value={taxRate}
                                onChangeText={setTaxRate}
                                placeholder="0"
                                keyboardType="decimal-pad"
                                placeholderTextColor="#9CA3AF"
                            />
                            <Text className="text-xs text-gray-500 mt-1">
                                Applied to all new estimates (e.g., 8.5 for
                                8.5%)
                            </Text>
                        </View>

                        <View className="mb-4">
                            <Text className="text-sm font-semibold text-gray-700 mb-2">
                                Default Deposit (%)
                            </Text>
                            <TextInput
                                className="bg-gray-50 border border-gray-300 rounded-lg px-4 py-3 text-base text-gray-900"
                                value={depositPercent}
                                onChangeText={setDepositPercent}
                                placeholder="50"
                                keyboardType="decimal-pad"
                                placeholderTextColor="#9CA3AF"
                            />
                            <Text className="text-xs text-gray-500 mt-1">
                                Default deposit percentage for new estimates
                            </Text>
                        </View>
                    </View>

                    {/* Save Button */}
                    <Pressable
                        className={`bg-blue-600 rounded-lg py-4 flex-row items-center justify-center mb-4 ${
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
                                    Save Changes
                                </Text>
                            </>
                        )}
                    </Pressable>

                    {/* Logout Button */}
                    <Pressable
                        className="bg-red-600 rounded-lg py-4 flex-row items-center justify-center active:opacity-80"
                        onPress={handleLogout}
                    >
                        <LogOut size={20} color="white" />
                        <Text className="text-white text-base font-semibold ml-2">
                            Logout
                        </Text>
                    </Pressable>

                    {/* App Version */}
                    <Text className="text-center text-sm text-gray-500 mt-6">
                        Estimly v1.0.0
                    </Text>
                </View>
            </ScrollView>
        </View>
    );
}
