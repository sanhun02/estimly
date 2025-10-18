import { useEffect, useState } from "react";
import {
    View,
    Text,
    TextInput,
    Pressable,
    ScrollView,
    ActivityIndicator,
    Alert,
} from "react-native";
import { Stack, useRouter, useLocalSearchParams } from "expo-router";
import { Trash2, GripVertical, Plus } from "lucide-react-native";
import { supabase } from "@/lib/supabase/supabase";
import { useStore } from "@/store";
import { EstimateTemplate, EstimateTemplateItem } from "@/lib/supabase/types";
import React from "react";
import { handleError } from "@/lib/errorHandler";
import { showToast } from "@/lib/toast";

interface EditableItem extends EstimateTemplateItem {
    isNew?: boolean;
}

export default function TemplateDetailScreen() {
    const params = useLocalSearchParams();
    const router = useRouter();
    const id = Array.isArray(params.id) ? params.id[0] : params.id;
    const { company, updateTemplate, deleteTemplate } = useStore();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [template, setTemplate] = useState<EstimateTemplate | null>(null);
    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [items, setItems] = useState<EditableItem[]>([]);

    useEffect(() => {
        loadTemplate();
    }, [id]);

    const loadTemplate = async () => {
        try {
            // load template
            const { data: templateData, error: templateError } = await supabase
                .from("estimate_templates")
                .select("*")
                .eq("id", id)
                .single();

            if (templateError) throw templateError;

            setTemplate(templateData);
            setName(templateData.name);
            setDescription(templateData.description || "");

            // load template items
            const { data: itemsData, error: itemsError } = await supabase
                .from("estimate_template_items")
                .select("*")
                .eq("template_id", id)
                .order("sort_order");

            if (itemsError) throw itemsError;

            setItems(itemsData || []);
        } catch (error: any) {
            handleError(error, {
                operation: "load template",
                fallbackMessage: "Unable to load template",
            });
            router.back();
        } finally {
            setLoading(false);
        }
    };

    const addItem = () => {
        setItems([
            ...items,
            {
                id: `new-${Date.now()}`,
                template_id: id as string,
                description: "",
                quantity: 1,
                unit_price: 0,
                labor_hours: 0,
                labor_rate: 0,
                taxable: true,
                sort_order: items.length,
                created_at: new Date().toISOString(),
                isNew: true,
            },
        ]);
    };

    const removeItem = (itemId: string) => {
        if (items.length === 1) {
            showToast.error(
                "Cannot Remove",
                "Template must have at least one item"
            );
            return;
        }
        setItems(items.filter((item) => item.id !== itemId));
    };

    const updateItem = (
        itemId: string,
        field: keyof EditableItem,
        value: any
    ) => {
        setItems(
            items.map((item) =>
                item.id === itemId ? { ...item, [field]: value } : item
            )
        );
    };

    const handleSave = async () => {
        if (!template || !company) return;

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
            // update template
            const { error: templateError } = await supabase
                .from("estimate_templates")
                .update({
                    name: name.trim(),
                    description: description.trim() || null,
                    updated_at: new Date().toISOString(),
                })
                .eq("id", template.id);

            if (templateError) throw templateError;

            // delete all existing items
            const existingItemIds = items
                .filter((item) => !item.isNew)
                .map((item) => item.id);

            if (existingItemIds.length > 0) {
                const { error: deleteError } = await supabase
                    .from("estimate_template_items")
                    .delete()
                    .in("id", existingItemIds);

                if (deleteError) throw deleteError;
            }

            // insert all items fresh
            const templateItems = validItems.map((item, index) => ({
                template_id: template.id,
                description: item.description.trim(),
                quantity: item.quantity,
                unit_price: item.unit_price,
                labor_hours: item.labor_hours,
                labor_rate: item.labor_rate,
                taxable: item.taxable,
                sort_order: index,
            }));

            const { error: itemsError } = await supabase
                .from("estimate_template_items")
                .insert(templateItems);

            if (itemsError) throw itemsError;

            updateTemplate(template.id, {
                name: name.trim(),
                description: description.trim() || null,
            });

            showToast.success("Success!", "Template updated");
            router.back();
        } catch (error: any) {
            handleError(error, {
                operation: "update template",
                fallbackMessage: "Unable to update template",
            });
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = () => {
        if (!template) return;

        Alert.alert(
            "Delete Template",
            `Delete "${template.name}"? This cannot be undone.`,
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Delete",
                    style: "destructive",
                    onPress: async () => {
                        try {
                            const { error } = await supabase
                                .from("estimate_templates")
                                .delete()
                                .eq("id", template.id);

                            if (error) throw error;

                            deleteTemplate(template.id);
                            showToast.success(
                                "Deleted",
                                "Template deleted successfully"
                            );
                            router.back();
                        } catch (error: any) {
                            handleError(error, {
                                operation: "delete template",
                                fallbackMessage: "Unable to delete template",
                            });
                        }
                    },
                },
            ]
        );
    };

    if (loading) {
        return (
            <View className="flex-1 justify-center items-center bg-gray-50">
                <ActivityIndicator size="large" color="#2563EB" />
            </View>
        );
    }

    if (!template) {
        return null;
    }

    return (
        <View className="flex-1 bg-gray-50">
            <Stack.Screen
                options={{
                    title: "Edit Template",
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
                            key={item.id}
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
                                    onPress={() => removeItem(item.id)}
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
                                    updateItem(item.id, "description", text)
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
                                        value={(item.quantity ?? 1).toString()}
                                        onChangeText={(text) =>
                                            updateItem(
                                                item.id,
                                                "quantity",
                                                parseFloat(text) || 1
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
                                        value={(
                                            item.unit_price ?? 0
                                        ).toString()}
                                        onChangeText={(text) =>
                                            updateItem(
                                                item.id,
                                                "unit_price",
                                                parseFloat(text) || 0
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
                                        value={(
                                            item.labor_hours ?? 0
                                        ).toString()}
                                        onChangeText={(text) =>
                                            updateItem(
                                                item.id,
                                                "labor_hours",
                                                parseFloat(text) || 0
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
                                        value={(
                                            item.labor_rate ?? 0
                                        ).toString()}
                                        onChangeText={(text) =>
                                            updateItem(
                                                item.id,
                                                "labor_rate",
                                                parseFloat(text) || 0
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

                {/* Action Buttons */}
                <Pressable
                    className={`bg-blue-600 rounded-lg py-4 mb-3 ${
                        saving ? "opacity-60" : "active:opacity-80"
                    }`}
                    onPress={handleSave}
                    disabled={saving}
                >
                    <Text className="text-white text-center font-semibold text-base">
                        {saving ? "Saving..." : "Save Changes"}
                    </Text>
                </Pressable>

                <Pressable
                    className="border border-red-600 rounded-lg py-4 mb-8 active:opacity-80"
                    onPress={handleDelete}
                    disabled={saving}
                >
                    <Text className="text-red-600 text-center font-semibold text-base">
                        Delete Template
                    </Text>
                </Pressable>
            </ScrollView>
        </View>
    );
}
