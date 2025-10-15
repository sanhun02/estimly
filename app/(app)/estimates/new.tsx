import { useState, useEffect } from "react";
import {
    View,
    Text,
    TextInput,
    Pressable,
    ScrollView,
    ActivityIndicator,
} from "react-native";
import { Stack, useRouter } from "expo-router";
import { Plus, Trash2, Save } from "lucide-react-native";
import { supabase } from "@/lib/supabase/supabase";
import { useStore } from "@/store";
import React from "react";
import { showToast } from "@/lib/toast";

interface LineItem {
    id: string;
    description: string;
    quantity: string;
    unit_price: string;
    labor_hours: string;
    labor_rate: string;
    taxable: boolean;
}

export default function NewEstimateScreen() {
    const router = useRouter();
    const { company, clients, setClients, addEstimate } = useStore();

    const [loading, setLoading] = useState(false);
    const [selectedClientId, setSelectedClientId] = useState<string>("");
    const [showClientPicker, setShowClientPicker] = useState(false);
    const [items, setItems] = useState<LineItem[]>([
        {
            id: "1",
            description: "",
            quantity: "1",
            unit_price: "0",
            labor_hours: "0",
            labor_rate: "0",
            taxable: true,
        },
    ]);
    const [notes, setNotes] = useState("");
    const [terms, setTerms] = useState("");
    const [depositPercent, setDepositPercent] = useState(
        company?.default_deposit_percent?.toString() || "50"
    );

    useEffect(() => {
        loadClients();
    }, []);

    const loadClients = async () => {
        if (!company) return;

        const { data, error } = await supabase
            .from("clients")
            .select("*")
            .eq("company_id", company.id)
            .order("name");

        if (error) {
            alert(error.message);
        } else {
            setClients(data || []);
        }
    };

    const calculateLineTotal = (item: LineItem) => {
        const qty = parseFloat(item.quantity) || 0;
        const price = parseFloat(item.unit_price) || 0;
        const hours = parseFloat(item.labor_hours) || 0;
        const rate = parseFloat(item.labor_rate) || 0;
        return qty * price + hours * rate;
    };

    const calculateSubtotal = () => {
        return items.reduce((sum, item) => sum + calculateLineTotal(item), 0);
    };

    const calculateTax = () => {
        const taxRate = (company?.default_deposit_percent || 0) / 100;
        const taxableTotal = items
            .filter((item) => item.taxable)
            .reduce((sum, item) => sum + calculateLineTotal(item), 0);
        return taxableTotal * taxRate;
    };

    const calculateTotal = () => {
        return calculateSubtotal() + calculateTax();
    };

    const calculateDeposit = () => {
        const percent = parseFloat(depositPercent) || 0;
        return (calculateTotal() * percent) / 100;
    };

    const addItem = () => {
        setItems([
            ...items,
            {
                id: Date.now().toString(),
                description: "",
                quantity: "1",
                unit_price: "0",
                labor_hours: "0",
                labor_rate: "0",
                taxable: true,
            },
        ]);
    };

    const removeItem = (id: string) => {
        if (items.length === 1) {
            alert("You must have at least one line item");
            return;
        }
        setItems(items.filter((item) => item.id !== id));
    };

    const updateItem = (id: string, field: keyof LineItem, value: any) => {
        setItems(
            items.map((item) =>
                item.id === id ? { ...item, [field]: value } : item
            )
        );
    };

    const handleSave = async () => {
        if (!company) return;

        if (!selectedClientId) {
            showToast.error("Client Required", "Please select a client");
            return;
        }

        const hasValidItem = items.some(
            (item) =>
                item.description.trim() &&
                (parseFloat(item.unit_price) > 0 ||
                    parseFloat(item.labor_rate) > 0)
        );

        if (!hasValidItem) {
            showToast.error(
                "Invalid Items",
                "Please add at least one item with a price or labor rate"
            );
            return;
        }

        setLoading(true);

        try {
            const subtotal = calculateSubtotal();
            const tax = calculateTax();
            const total = calculateTotal();
            const deposit = calculateDeposit();

            // create estimate
            const { data: estimate, error: estimateError } = await supabase
                .from("estimates")
                .insert({
                    company_id: company.id,
                    client_id: selectedClientId,
                    estimate_number: "",
                    subtotal,
                    tax,
                    total,
                    deposit_percent: parseFloat(depositPercent),
                    deposit_amount: deposit,
                    notes: notes.trim() || null,
                    terms: terms.trim() || null,
                    status: "draft",
                })
                .select()
                .single();

            if (estimateError) throw estimateError;

            // create estimate items
            const itemsToInsert = items
                .filter((item) => item.description.trim())
                .map((item, index) => ({
                    estimate_id: estimate.id,
                    description: item.description.trim(),
                    quantity: parseFloat(item.quantity) || 1,
                    unit_price: parseFloat(item.unit_price) || 0,
                    labor_hours: parseFloat(item.labor_hours) || 0,
                    labor_rate: parseFloat(item.labor_rate) || 0,
                    taxable: item.taxable,
                    sort_order: index,
                }));

            const { error: itemsError } = await supabase
                .from("estimate_items")
                .insert(itemsToInsert);

            if (itemsError) throw itemsError;

            addEstimate(estimate);
            showToast.success(
                "Estimate Created",
                `#${estimate.estimate_number} saved as draft`
            );
            router.back();
        } catch (error: any) {
            showToast.error("Failed to create estimate", error.message);
        } finally {
            setLoading(false);
        }
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat("en-US", {
            style: "currency",
            currency: "USD",
        }).format(amount);
    };

    const selectedClient = clients.find((c) => c.id === selectedClientId);

    return (
        <View className="flex-1 bg-gray-50">
            <Stack.Screen
                options={{
                    title: "New Estimate",
                    headerStyle: { backgroundColor: "#2563EB" },
                    headerTintColor: "white",
                }}
            />

            <ScrollView className="flex-1">
                <View className="p-4">
                    {/* Client Selection */}
                    <View className="mb-6">
                        <Text className="text-sm font-semibold text-gray-700 mb-2">
                            Client *
                        </Text>
                        <Pressable
                            className="bg-white border border-gray-300 rounded-lg px-4 py-3"
                            onPress={() =>
                                setShowClientPicker(!showClientPicker)
                            }
                        >
                            <Text
                                className={
                                    selectedClient
                                        ? "text-gray-900"
                                        : "text-gray-400"
                                }
                            >
                                {selectedClient
                                    ? selectedClient.name
                                    : "Select a client"}
                            </Text>
                        </Pressable>

                        {showClientPicker && (
                            <View className="mt-2 bg-white border border-gray-300 rounded-lg overflow-hidden">
                                {clients.map((client) => (
                                    <Pressable
                                        key={client.id}
                                        className="px-4 py-3 border-b border-gray-100 active:bg-gray-50"
                                        onPress={() => {
                                            setSelectedClientId(client.id);
                                            setShowClientPicker(false);
                                        }}
                                    >
                                        <Text className="text-gray-900">
                                            {client.name}
                                        </Text>
                                        {client.email && (
                                            <Text className="text-sm text-gray-600">
                                                {client.email}
                                            </Text>
                                        )}
                                    </Pressable>
                                ))}
                            </View>
                        )}
                    </View>

                    {/* Line Items */}
                    <View className="mb-6">
                        <View className="flex-row justify-between items-center mb-2">
                            <Text className="text-sm font-semibold text-gray-700">
                                Line Items
                            </Text>
                            <Pressable
                                className="flex-row items-center bg-blue-600 rounded-lg px-3 py-2"
                                onPress={addItem}
                            >
                                <Plus size={16} color="white" />
                                <Text className="text-white font-semibold ml-1">
                                    Add Item
                                </Text>
                            </Pressable>
                        </View>

                        {items.map((item, index) => (
                            <View
                                key={item.id}
                                className="bg-white rounded-lg p-4 mb-3 border border-gray-200"
                            >
                                <View className="flex-row justify-between items-center mb-3">
                                    <Text className="font-semibold text-gray-900">
                                        Item {index + 1}
                                    </Text>
                                    {items.length > 1 && (
                                        <Pressable
                                            onPress={() => removeItem(item.id)}
                                        >
                                            <Trash2 size={18} color="#EF4444" />
                                        </Pressable>
                                    )}
                                </View>

                                <TextInput
                                    className="bg-gray-50 border border-gray-300 rounded-lg px-3 py-2 mb-3"
                                    placeholder="Description"
                                    value={item.description}
                                    onChangeText={(value) =>
                                        updateItem(
                                            item.id,
                                            "description",
                                            value
                                        )
                                    }
                                />

                                <View className="flex-row gap-2 mb-3">
                                    <View className="flex-1">
                                        <Text className="text-xs text-gray-600 mb-1">
                                            Qty
                                        </Text>
                                        <TextInput
                                            className="bg-gray-50 border border-gray-300 rounded-lg px-3 py-2"
                                            placeholder="1"
                                            keyboardType="decimal-pad"
                                            value={item.quantity}
                                            onChangeText={(value) =>
                                                updateItem(
                                                    item.id,
                                                    "quantity",
                                                    value
                                                )
                                            }
                                        />
                                    </View>
                                    <View className="flex-1">
                                        <Text className="text-xs text-gray-600 mb-1">
                                            Unit Price
                                        </Text>
                                        <TextInput
                                            className="bg-gray-50 border border-gray-300 rounded-lg px-3 py-2"
                                            placeholder="0"
                                            keyboardType="decimal-pad"
                                            value={item.unit_price}
                                            onChangeText={(value) =>
                                                updateItem(
                                                    item.id,
                                                    "unit_price",
                                                    value
                                                )
                                            }
                                        />
                                    </View>
                                </View>

                                <View className="flex-row gap-2 mb-3">
                                    <View className="flex-1">
                                        <Text className="text-xs text-gray-600 mb-1">
                                            Labor Hrs
                                        </Text>
                                        <TextInput
                                            className="bg-gray-50 border border-gray-300 rounded-lg px-3 py-2"
                                            placeholder="0"
                                            keyboardType="decimal-pad"
                                            value={item.labor_hours}
                                            onChangeText={(value) =>
                                                updateItem(
                                                    item.id,
                                                    "labor_hours",
                                                    value
                                                )
                                            }
                                        />
                                    </View>
                                    <View className="flex-1">
                                        <Text className="text-xs text-gray-600 mb-1">
                                            Labor Rate
                                        </Text>
                                        <TextInput
                                            className="bg-gray-50 border border-gray-300 rounded-lg px-3 py-2"
                                            placeholder="0"
                                            keyboardType="decimal-pad"
                                            value={item.labor_rate}
                                            onChangeText={(value) =>
                                                updateItem(
                                                    item.id,
                                                    "labor_rate",
                                                    value
                                                )
                                            }
                                        />
                                    </View>
                                </View>

                                <Pressable
                                    className="flex-row items-center"
                                    onPress={() =>
                                        updateItem(
                                            item.id,
                                            "taxable",
                                            !item.taxable
                                        )
                                    }
                                >
                                    <View
                                        className={`w-5 h-5 rounded border-2 ${item.taxable ? "bg-blue-600 border-blue-600" : "border-gray-300"} mr-2`}
                                    />
                                    <Text className="text-sm text-gray-700">
                                        Taxable
                                    </Text>
                                </Pressable>

                                <View className="mt-3 pt-3 border-t border-gray-100">
                                    <Text className="text-right font-semibold text-gray-900">
                                        {formatCurrency(
                                            calculateLineTotal(item)
                                        )}
                                    </Text>
                                </View>
                            </View>
                        ))}
                    </View>

                    {/* Totals */}
                    <View className="bg-white rounded-lg p-4 mb-6 border border-gray-200">
                        <View className="flex-row justify-between mb-2">
                            <Text className="text-gray-700">Subtotal</Text>
                            <Text className="font-semibold text-gray-900">
                                {formatCurrency(calculateSubtotal())}
                            </Text>
                        </View>
                        <View className="flex-row justify-between mb-2">
                            <Text className="text-gray-700">
                                Tax ({company?.default_tax_rate || 0}%)
                            </Text>
                            <Text className="font-semibold text-gray-900">
                                {formatCurrency(calculateTax())}
                            </Text>
                        </View>
                        <View className="flex-row justify-between pt-2 border-t border-gray-200 mb-3">
                            <Text className="text-lg font-bold text-gray-900">
                                Total
                            </Text>
                            <Text className="text-lg font-bold text-blue-600">
                                {formatCurrency(calculateTotal())}
                            </Text>
                        </View>

                        <View className="flex-row items-center justify-between pt-3 border-t border-gray-100">
                            <View className="flex-row items-center">
                                <Text className="text-gray-700 mr-2">
                                    Deposit
                                </Text>
                                <TextInput
                                    className="bg-gray-50 border border-gray-300 rounded-lg px-3 py-2 w-16 text-center"
                                    keyboardType="decimal-pad"
                                    value={depositPercent}
                                    onChangeText={setDepositPercent}
                                />
                                <Text className="text-gray-700 ml-1">%</Text>
                            </View>
                            <Text className="font-semibold text-green-600">
                                {formatCurrency(calculateDeposit())}
                            </Text>
                        </View>
                    </View>

                    {/* Notes */}
                    <View className="mb-6">
                        <Text className="text-sm font-semibold text-gray-700 mb-2">
                            Notes
                        </Text>
                        <TextInput
                            className="bg-white border border-gray-300 rounded-lg px-4 py-3 min-h-[80px]"
                            placeholder="Additional notes for the client..."
                            multiline
                            numberOfLines={3}
                            textAlignVertical="top"
                            value={notes}
                            onChangeText={setNotes}
                        />
                    </View>

                    {/* Terms */}
                    <View className="mb-6">
                        <Text className="text-sm font-semibold text-gray-700 mb-2">
                            Terms & Conditions
                        </Text>
                        <TextInput
                            className="bg-white border border-gray-300 rounded-lg px-4 py-3 min-h-[80px]"
                            placeholder="Payment terms, warranties, etc..."
                            multiline
                            numberOfLines={3}
                            textAlignVertical="top"
                            value={terms}
                            onChangeText={setTerms}
                        />
                    </View>
                </View>
            </ScrollView>

            {/* Save Button */}
            <View className="p-4 bg-white border-t border-gray-200">
                <Pressable
                    className={`bg-blue-600 rounded-lg py-4 flex-row items-center justify-center ${
                        loading ? "opacity-60" : "active:opacity-80"
                    }`}
                    onPress={handleSave}
                    disabled={loading}
                >
                    {loading ? (
                        <ActivityIndicator color="white" />
                    ) : (
                        <>
                            <Save size={20} color="white" />
                            <Text className="text-white text-base font-semibold ml-2">
                                Save Estimate
                            </Text>
                        </>
                    )}
                </Pressable>
            </View>
        </View>
    );
}
