import { useState } from "react";
import {
    View,
    Text,
    TextInput,
    Pressable,
    ScrollView,
    Alert,
} from "react-native";
import { Stack, useRouter } from "expo-router";
import { Plus, Trash2, GripVertical } from "lucide-react-native";
import { supabase } from "@/lib/supabase/supabase";
import { useStore } from "@/store";
import React from "react";
import { handleError } from "@/lib/errorHandler";
import { showToast } from "@/lib/toast";

interface TemplateItem {
    tempId: string;
    description: string;
    quantity: string;
    unit_price: string;
    labor_hours: string;
    labor_rate: string;
    taxable: boolean;
}

export default function NewTemplateScreen() {
    const router = useRouter();
    const { company, addTemplate } = useStore();
    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [items, setItems] = useState<TemplateItem[]>([
        {
            tempId: Date.now().toString(),
            description: "",
            quantity: "1",
            unit_price: "0",
            labor_hours: "0",
            labor_rate: "0",
            taxable: true,
        },
    ]);
    const [saving, setSaving] = useState(false);

    const addItem = () => {
        setItems([
            ...items,
            {
                tempId: Date.now().toString(),
                description: "",
                quantity: "1",
                unit_price: "0",
                labor_hours: "0",
                labor_rate: "0",
                taxable: true,
            },
        ]);
    };

    const removeItem = (tempId: string) => {
        if (items.length === 1) {
            showToast.error(
                "Cannot Remove",
                "Template must have at least one item"
            );
            return;
        }
        setItems(items.filter((item) => item.tempId !== tempId));
    };

    const updateItem = (
        tempId: string,
        field: keyof TemplateItem,
        value: any
    ) => {
        setItems(
            items.map((item) =>
                item.tempId === tempId ? { ...item, [field]: value } : item
            )
        );
    };

    const handleSave = async () => {
        if (!company) return;

        if (!name.trim()) {
            showToast.error("Missing Name", "Please enter a template name");
            return;
        }

        const validItems = items.filter((item) => item.description.trim());
        if (validItems.length === 0) {
            showToast.error(
                "No Items",
                "Please add at least one item with a description"
            );
            return;
        }

        setSaving(true);

        try {
            // create template
            const { data: template, error: templateError } = await supabase
                .from("estimate_templates")
                .insert({
                    company_id: company.id,
                    name: name.trim(),
                    description: description.trim() || null,
                })
                .select()
                .single();

            if (templateError) throw templateError;

            // create template items
            const templateItems = validItems.map((item, index) => ({
                template_id: template.id,
                description: item.description.trim(),
                quantity: parseFloat(item.quantity) || 1,
                unit_price: parseFloat(item.unit_price) || 0,
                labor_hours: parseFloat(item.labor_hours) || 0,
                labor_rate: parseFloat(item.labor_rate) || 0,
                taxable: item.taxable,
                sort_order: index,
            }));

            const { error: itemsError } = await supabase
                .from("estimate_template_items")
                .insert(templateItems);

            if (itemsError) throw itemsError;

            addTemplate(template);
            showToast.success("Success!", "Template created");
            router.back();
        } catch (error: any) {
            handleError(error, {
                operation: "create template",
                fallbackMessage: "Unable to create template",
            });
        } finally {
            setSaving(false);
        }
    };

    return (
        <View className="flex-1 bg-gray-50">
            <Stack.Screen
                options={{
                    title: "New Template",
                    headerStyle: { backgroundColor: "#2563EB" },
                    headerTintColor: "white",
                }}
            />

            <ScrollView className="flex-1" contentContainerClassName="p-4">
                {/* Template Info */}
                <View className="bg-white rounded-xl p-4 mb-4 border border-gray-200">
                    <Text className="text-lg font-bold text-gray-900 mb-4">
                        Template Details
                    </Text>

                    <Text className="text-sm font-medium text-gray-700 mb-2">
                        Template Name *
                    </Text>
                    <TextInput
                        className="border border-gray-300 rounded-lg px-4 py-3 mb-4 text-base"
                        placeholder="e.g., Kitchen Remodel Standard"
                        value={name}
                        onChangeText={setName}
                        editable={!saving}
                    />

                    <Text className="text-sm font-medium text-gray-700 mb-2">
                        Description (Optional)
                    </Text>
                    <TextInput
                        className="border border-gray-300 rounded-lg px-4 py-3 text-base"
                        placeholder="Brief description of this template"
                        value={description}
                        onChangeText={setDescription}
                        multiline
                        numberOfLines={2}
                        editable={!saving}
                    />
                </View>

                {/* Line Items */}
                <View className="bg-white rounded-xl p-4 mb-4 border border-gray-200">
                    <View className="flex-row items-center justify-between mb-4">
                        <Text className="text-lg font-bold text-gray-900">
                            Line Items
                        </Text>
                        <Pressable
                            onPress={addItem}
                            className="bg-blue-600 rounded-lg px-4 py-2 active:opacity-80"
                            disabled={saving}
                        >
                            <View className="flex-row items-center">
                                <Plus size={16} color="white" />
                                <Text className="text-white font-semibold ml-1">
                                    Add Item
                                </Text>
                            </View>
                        </Pressable>
                    </View>

                    {items.map((item, index) => (
                        <View
                            key={item.tempId}
                            className="mb-4 pb-4 border-b border-gray-200"
                        >
                            <View className="flex-row items-center justify-between mb-2">
                                <View className="flex-row items-center">
                                    <GripVertical size={20} color="#9CA3AF" />
                                    <Text className="text-sm font-semibold text-gray-700 ml-2">
                                        Item {index + 1}
                                    </Text>
                                </View>
                                <Pressable
                                    onPress={() => removeItem(item.tempId)}
                                    disabled={saving}
                                >
                                    <Trash2 size={20} color="#EF4444" />
                                </Pressable>
                            </View>

                            <Text className="text-xs font-medium text-gray-600 mb-1">
                                Description *
                            </Text>
                            <TextInput
                                className="border border-gray-300 rounded-lg px-3 py-2 mb-3 text-sm"
                                placeholder="Item description"
                                value={item.description}
                                onChangeText={(text) =>
                                    updateItem(item.tempId, "description", text)
                                }
                                editable={!saving}
                            />

                            <View className="flex-row gap-2 mb-3">
                                <View className="flex-1">
                                    <Text className="text-xs font-medium text-gray-600 mb-1">
                                        Quantity
                                    </Text>
                                    <TextInput
                                        className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
                                        placeholder="1"
                                        value={item.quantity}
                                        onChangeText={(text) =>
                                            updateItem(
                                                item.tempId,
                                                "quantity",
                                                text
                                            )
                                        }
                                        keyboardType="decimal-pad"
                                        editable={!saving}
                                    />
                                </View>
                                <View className="flex-1">
                                    <Text className="text-xs font-medium text-gray-600 mb-1">
                                        Unit Price
                                    </Text>
                                    <TextInput
                                        className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
                                        placeholder="0.00"
                                        value={item.unit_price}
                                        onChangeText={(text) =>
                                            updateItem(
                                                item.tempId,
                                                "unit_price",
                                                text
                                            )
                                        }
                                        keyboardType="decimal-pad"
                                        editable={!saving}
                                    />
                                </View>
                            </View>

                            <View className="flex-row gap-2">
                                <View className="flex-1">
                                    <Text className="text-xs font-medium text-gray-600 mb-1">
                                        Labor Hours
                                    </Text>
                                    <TextInput
                                        className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
                                        placeholder="0"
                                        value={item.labor_hours}
                                        onChangeText={(text) =>
                                            updateItem(
                                                item.tempId,
                                                "labor_hours",
                                                text
                                            )
                                        }
                                        keyboardType="decimal-pad"
                                        editable={!saving}
                                    />
                                </View>
                                <View className="flex-1">
                                    <Text className="text-xs font-medium text-gray-600 mb-1">
                                        Labor Rate
                                    </Text>
                                    <TextInput
                                        className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
                                        placeholder="0.00"
                                        value={item.labor_rate}
                                        onChangeText={(text) =>
                                            updateItem(
                                                item.tempId,
                                                "labor_rate",
                                                text
                                            )
                                        }
                                        keyboardType="decimal-pad"
                                        editable={!saving}
                                    />
                                </View>
                            </View>
                        </View>
                    ))}
                </View>

                {/* Save Button */}
                <Pressable
                    className={`bg-blue-600 rounded-lg py-4 mb-8 ${
                        saving ? "opacity-60" : "active:opacity-80"
                    }`}
                    onPress={handleSave}
                    disabled={saving}
                >
                    <Text className="text-white text-center font-semibold text-base">
                        {saving ? "Saving..." : "Save Template"}
                    </Text>
                </Pressable>
            </ScrollView>
        </View>
    );
}
