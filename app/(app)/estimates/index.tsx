import { useEffect, useState } from "react";
import {
    View,
    Text,
    FlatList,
    Pressable,
    ActivityIndicator,
    RefreshControl,
} from "react-native";
import { Stack, useRouter } from "expo-router";
import { Plus, FileText, DollarSign, Calendar } from "lucide-react-native";
import { supabase } from "@/lib/supabase/supabase";
import { useStore } from "@/store";
import { Estimate } from "@/lib/supabase/types";
import React from "react";
import EmptyState from "@/components/EmptyState";
import { showToast } from "@/lib/toast";

type FilterStatus = "all" | "draft" | "sent" | "accepted";

const STATUS_COLORS = {
    draft: "bg-gray-100 text-gray-700",
    sent: "bg-blue-100 text-blue-700",
    accepted: "bg-green-100 text-green-700",
    declined: "bg-red-100 text-red-700",
    invoiced: "bg-purple-100 text-purple-700",
};

export default function EstimatesScreen() {
    const router = useRouter();
    const { company, estimates, setEstimates } = useStore();
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [activeFilter, setActiveFilter] = useState<FilterStatus>("all");

    useEffect(() => {
        loadEstimates();
    }, []);

    const loadEstimates = async () => {
        if (!company) return;

        try {
            const { data, error } = await supabase
                .from("estimates")
                .select("*")
                .eq("company_id", company.id)
                .order("created_at", { ascending: false });

            if (error) throw error;
            setEstimates(data || []);
        } catch (error: any) {
            showToast.error("Failed to load estimates", error.message);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const onRefresh = () => {
        setRefreshing(true);
        loadEstimates();
    };

    const formatDate = (date: string) => {
        return new Date(date).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
        });
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat("en-US", {
            style: "currency",
            currency: "USD",
        }).format(amount);
    };

    // filter estimates based on active filter
    const filteredEstimates = estimates.filter((estimate) => {
        if (activeFilter === "all") return true;
        return estimate.status === activeFilter;
    });

    // get counts for each status
    const statusCounts = {
        all: estimates.length,
        draft: estimates.filter((e) => e.status === "draft").length,
        sent: estimates.filter((e) => e.status === "sent").length,
        accepted: estimates.filter((e) => e.status === "accepted").length,
    };

    const renderFilterButton = (filter: FilterStatus, label: string) => {
        const isActive = activeFilter === filter;
        const count = statusCounts[filter];

        return (
            <Pressable
                key={filter}
                className={`px-4 py-2 rounded-full mr-2 ${
                    isActive ? "bg-blue-600" : "bg-gray-100"
                }`}
                onPress={() => setActiveFilter(filter)}
            >
                <View className="flex-row items-center">
                    <Text
                        className={`font-semibold ${
                            isActive ? "text-white" : "text-gray-700"
                        }`}
                    >
                        {label}
                    </Text>
                    <View
                        className={`ml-2 px-2 py-0.5 rounded-full ${
                            isActive ? "bg-blue-500" : "bg-gray-200"
                        }`}
                    >
                        <Text
                            className={`text-xs font-bold ${
                                isActive ? "text-white" : "text-gray-600"
                            }`}
                        >
                            {count}
                        </Text>
                    </View>
                </View>
            </Pressable>
        );
    };

    const renderEstimate = ({ item }: { item: Estimate }) => {
        const status = (item.status || "draft") as keyof typeof STATUS_COLORS;

        return (
            <Pressable
                className="bg-white rounded-xl p-4 mb-3 border border-gray-200 active:opacity-80"
                onPress={() => router.push(`/estimates/${item.id}`)}
            >
                <View className="flex-row items-start justify-between mb-3">
                    <View className="flex-1">
                        <Text className="text-lg font-semibold text-gray-900 mb-1">
                            #{item.estimate_number}
                        </Text>
                        <View className="flex-row items-center">
                            <Calendar size={14} color="#6B7280" />
                            <Text className="text-sm text-gray-600 ml-1">
                                {item.created_at
                                    ? formatDate(item.created_at)
                                    : "N/A"}
                            </Text>
                        </View>
                    </View>
                    <View
                        className={`px-3 py-1 rounded-full ${STATUS_COLORS[status].split(" ")[0]}`}
                    >
                        <Text
                            className={`text-xs font-semibold capitalize ${STATUS_COLORS[status].split(" ")[1]}`}
                        >
                            {item.status}
                        </Text>
                    </View>
                </View>

                <View className="flex-row items-center justify-between pt-3 border-t border-gray-100">
                    <View className="flex-row items-center">
                        <DollarSign size={18} color="#2563EB" />
                        <Text className="text-xl font-bold text-gray-900 ml-1">
                            {formatCurrency(item.total)}
                        </Text>
                    </View>
                    {item.deposit_amount && item.deposit_amount > 0 && (
                        <Text className="text-sm text-gray-600">
                            Deposit: {formatCurrency(item.deposit_amount)}
                        </Text>
                    )}
                </View>
            </Pressable>
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
                    title: "Estimates",
                    headerStyle: { backgroundColor: "#2563EB" },
                    headerTintColor: "white",
                    headerRight: () => (
                        <Pressable
                            onPress={() => router.push("/estimates/new")}
                            className="mr-4"
                        >
                            <Plus size={24} color="white" />
                        </Pressable>
                    ),
                }}
            />

            {/* Filter Buttons */}
            <View className="bg-white border-b border-gray-200 px-4 py-3">
                <View className="flex-row">
                    {renderFilterButton("all", "All")}
                    {renderFilterButton("draft", "Draft")}
                    {renderFilterButton("sent", "Sent")}
                    {renderFilterButton("accepted", "Accepted")}
                </View>
            </View>

            {filteredEstimates.length === 0 ? (
                <EmptyState
                    icon={FileText}
                    title={
                        activeFilter === "all"
                            ? "No estimates yet"
                            : `No ${activeFilter} estimates`
                    }
                    description={
                        activeFilter === "all"
                            ? "Start creating professional estimates and send them to your clients in minutes"
                            : `You don't have any ${activeFilter} estimates. Try selecting a different filter.`
                    }
                    buttonText={
                        activeFilter === "all"
                            ? "Create Your First Estimate"
                            : undefined
                    }
                    buttonIcon={activeFilter === "all" ? Plus : undefined}
                    onButtonPress={
                        activeFilter === "all"
                            ? () => router.push("/estimates/new")
                            : undefined
                    }
                />
            ) : (
                <FlatList
                    data={filteredEstimates}
                    renderItem={renderEstimate}
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
                onPress={() => router.push("/estimates/new")}
            >
                <Plus size={28} color="white" />
            </Pressable>
        </View>
    );
}
