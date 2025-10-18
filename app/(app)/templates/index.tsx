import { useEffect, useState } from "react";
import {
    View,
    Text,
    FlatList,
    Pressable,
    RefreshControl,
    Alert,
} from "react-native";
import { Stack, useRouter } from "expo-router";
import { Plus, Package, Trash2 } from "lucide-react-native";
import { supabase } from "@/lib/supabase/supabase";
import { useStore } from "@/store";
import { EstimateTemplate } from "@/lib/supabase/types";
import React from "react";
import EmptyState from "@/components/EmptyState";
import { handleError } from "@/lib/errorHandler";
import { showToast } from "@/lib/toast";
import { Skeleton } from "@/components/Skeleton";

function TemplateCardSkeleton() {
    return (
        <View className="bg-white rounded-xl p-4 mb-3 border border-gray-200">
            <Skeleton height={24} width="70%" className="mb-2" />
            <Skeleton height={16} width="50%" />
        </View>
    );
}

export default function TemplatesScreen() {
    const router = useRouter();
    const { company, templates, setTemplates, deleteTemplate } = useStore();
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    useEffect(() => {
        loadTemplates();
    }, []);

    const loadTemplates = async () => {
        if (!company) return;

        try {
            const { data, error } = await supabase
                .from("estimate_templates")
                .select("*")
                .eq("company_id", company.id)
                .order("created_at", { ascending: false });

            if (error) throw error;
            setTemplates(data || []);
        } catch (error: any) {
            handleError(error, {
                operation: "load templates",
                fallbackMessage: "Unable to load templates",
            });
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const onRefresh = () => {
        setRefreshing(true);
        loadTemplates();
    };

    const handleDelete = (template: EstimateTemplate) => {
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

    const renderTemplate = ({ item }: { item: EstimateTemplate }) => (
        <Pressable
            className="bg-white rounded-xl p-4 mb-3 border border-gray-200 active:opacity-80"
            onPress={() => router.push(`/templates/${item.id}`)}
        >
            <View className="flex-row items-center justify-between">
                <View className="flex-1">
                    <Text className="text-lg font-semibold text-gray-900 mb-1">
                        {item.name}
                    </Text>
                    {item.description && (
                        <Text className="text-sm text-gray-600">
                            {item.description}
                        </Text>
                    )}
                </View>
                <Pressable
                    onPress={() => handleDelete(item)}
                    className="ml-3 p-2"
                >
                    <Trash2 size={20} color="#EF4444" />
                </Pressable>
            </View>
        </Pressable>
    );

    return (
        <View className="flex-1 bg-gray-50">
            <Stack.Screen
                options={{
                    title: "Templates",
                    headerStyle: { backgroundColor: "#2563EB" },
                    headerTintColor: "white",
                    headerRight: () => (
                        <Pressable
                            onPress={() => router.push("/templates/new")}
                            className="mr-4"
                        >
                            <Plus size={24} color="white" />
                        </Pressable>
                    ),
                }}
            />

            {loading ? (
                <View className="p-4">
                    <TemplateCardSkeleton />
                    <TemplateCardSkeleton />
                    <TemplateCardSkeleton />
                </View>
            ) : templates.length === 0 ? (
                <EmptyState
                    icon={Package}
                    title="No templates yet"
                    description="Save your common line items as templates to speed up estimate creation"
                    buttonText="Create First Template"
                    buttonIcon={Plus}
                    onButtonPress={() => router.push("/templates/new")}
                />
            ) : (
                <FlatList
                    data={templates}
                    renderItem={renderTemplate}
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

            {!loading && (
                <Pressable
                    className="absolute right-5 bottom-5 w-14 h-14 rounded-full bg-blue-600 items-center justify-center shadow-lg active:opacity-80"
                    onPress={() => router.push("/templates/new")}
                >
                    <Plus size={28} color="white" />
                </Pressable>
            )}
        </View>
    );
}
