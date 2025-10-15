import { useEffect, useState } from "react";
import {
    View,
    Text,
    ScrollView,
    RefreshControl,
    Pressable,
} from "react-native";
import { useRouter } from "expo-router";
import {
    DollarSign,
    FileText,
    Clock,
    CheckCircle,
    TrendingUp,
    AlertCircle,
    ChevronRight,
    Plus,
} from "lucide-react-native";
import { supabase } from "@/lib/supabase/supabase";
import { useStore } from "@/store";
import { Estimate } from "@/lib/supabase/types";
import React from "react";
import EmptyState from "@/components/EmptyState";
import { showToast } from "@/lib/toast";
import { Skeleton } from "@/components/Skeleton";
import { handleError } from "@/lib/errorHandler";

interface DashboardStats {
    totalEstimates: number;
    sentEstimates: number;
    acceptedEstimates: number;
    draftEstimates: number;
    totalRevenue: number;
    pendingRevenue: number;
    unpaidDeposits: number;
    thisMonthAccepted: number;
}

function MetricCardSkeleton() {
    return (
        <View className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
            <Skeleton
                height={24}
                width={24}
                className="mb-2"
                borderRadius={12}
            />
            <Skeleton height={32} width="70%" className="mb-1" />
            <Skeleton height={12} width="50%" />
        </View>
    );
}

function EstimateItemSkeleton() {
    return (
        <View className="flex-row items-center justify-between py-3 border-b border-gray-100">
            <View className="flex-1">
                <View className="flex-row items-center mb-1">
                    <Skeleton height={16} width={100} className="mr-2" />
                    <Skeleton height={20} width={60} borderRadius={12} />
                </View>
                <Skeleton height={14} width={80} />
            </View>
            <Skeleton height={20} width={80} />
        </View>
    );
}

export default function Dashboard() {
    const router = useRouter();
    const { user, company, estimates, setEstimates } = useStore();
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [stats, setStats] = useState<DashboardStats>({
        totalEstimates: 0,
        sentEstimates: 0,
        acceptedEstimates: 0,
        draftEstimates: 0,
        totalRevenue: 0,
        pendingRevenue: 0,
        unpaidDeposits: 0,
        thisMonthAccepted: 0,
    });
    const [recentEstimates, setRecentEstimates] = useState<Estimate[]>([]);

    useEffect(() => {
        loadDashboardData();
    }, []);

    const loadDashboardData = async () => {
        if (!company) {
            setLoading(false);
            return;
        }

        try {
            // load all estimates
            const { data: estimatesData, error } = await supabase
                .from("estimates")
                .select("*")
                .eq("company_id", company.id)
                .order("created_at", { ascending: false });

            if (error) throw error;

            const allEstimates = estimatesData || [];
            setEstimates(allEstimates);
            setRecentEstimates(allEstimates.slice(0, 5));

            // calculate stats
            const now = new Date();
            const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

            const calculatedStats: DashboardStats = {
                totalEstimates: allEstimates.length,
                sentEstimates: allEstimates.filter((e) => e.status === "sent")
                    .length,
                acceptedEstimates: allEstimates.filter(
                    (e) => e.status === "accepted"
                ).length,
                draftEstimates: allEstimates.filter((e) => e.status === "draft")
                    .length,
                totalRevenue: allEstimates
                    .filter((e) => e.status === "accepted")
                    .reduce((sum, e) => sum + (e.total || 0), 0),
                pendingRevenue: allEstimates
                    .filter((e) => e.status === "sent")
                    .reduce((sum, e) => sum + (e.total || 0), 0),
                unpaidDeposits: allEstimates
                    .filter(
                        (e) =>
                            e.status === "accepted" &&
                            (e.deposit_amount || 0) > 0
                    )
                    .reduce((sum, e) => sum + (e.deposit_amount || 0), 0),
                thisMonthAccepted: allEstimates.filter((e) => {
                    if (e.status !== "accepted" || !e.accepted_at) return false;
                    const acceptedDate = new Date(e.accepted_at);
                    return acceptedDate >= startOfMonth;
                }).length,
            };

            setStats(calculatedStats);
        } catch (error: any) {
            handleError(error, {
                operation: "load dashboard",
                fallbackMessage: "Unable to load dashboard data",
            });
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const onRefresh = () => {
        setRefreshing(true);
        loadDashboardData();
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat("en-US", {
            style: "currency",
            currency: "USD",
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(amount);
    };

    const formatDate = (date: string) => {
        return new Date(date).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
        });
    };

    // if (loading) {
    //     return (
    //         <View className="flex-1 justify-center items-center bg-gray-50">
    //             <ActivityIndicator size="large" color="#2563EB" />
    //         </View>
    //     );
    // }

    return (
        <ScrollView
            className="flex-1 bg-gray-50"
            refreshControl={
                <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
        >
            <View className="p-4">
                {/* Header */}
                <View className="mb-6">
                    {loading ? (
                        <>
                            <Skeleton
                                height={32}
                                width="60%"
                                className="mb-2"
                            />
                            <Skeleton height={20} width="40%" />
                        </>
                    ) : (
                        <>
                            <Text className="text-2xl font-bold text-gray-900 mb-1">
                                Welcome back!
                            </Text>
                            <Text className="text-gray-600">
                                {company?.name || user?.email}
                            </Text>
                        </>
                    )}
                </View>

                {/* Summary Cards Grid */}
                {loading ? (
                    <View className="flex-row flex-wrap -mx-2 mb-4">
                        <View className="w-1/2 px-2 mb-4">
                            <MetricCardSkeleton />
                        </View>
                        <View className="w-1/2 px-2 mb-4">
                            <MetricCardSkeleton />
                        </View>
                        <View className="w-1/2 px-2 mb-4">
                            <MetricCardSkeleton />
                        </View>
                        <View className="w-1/2 px-2 mb-4">
                            <MetricCardSkeleton />
                        </View>
                    </View>
                ) : (
                    <View className="flex-row flex-wrap -mx-2 mb-4">
                        {/* Total Revenue */}
                        <View className="w-1/2 px-2 mb-4">
                            <View className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-4 shadow-sm">
                                <View className="flex-row items-center justify-between mb-2">
                                    <DollarSign size={24} color="white" />
                                    <Text className="text-green-100 text-xs font-semibold">
                                        ALL TIME
                                    </Text>
                                </View>
                                <Text className="text-white text-2xl font-bold mb-1">
                                    {formatCurrency(stats.totalRevenue)}
                                </Text>
                                <Text className="text-green-100 text-xs">
                                    Total Revenue
                                </Text>
                            </View>
                        </View>

                        {/* Pending Revenue */}
                        <View className="w-1/2 px-2 mb-4">
                            <View className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-4 shadow-sm">
                                <View className="flex-row items-center justify-between mb-2">
                                    <Clock size={24} color="white" />
                                    <Text className="text-blue-100 text-xs font-semibold">
                                        PENDING
                                    </Text>
                                </View>
                                <Text className="text-white text-2xl font-bold mb-1">
                                    {formatCurrency(stats.pendingRevenue)}
                                </Text>
                                <Text className="text-blue-100 text-xs">
                                    Awaiting Approval
                                </Text>
                            </View>
                        </View>

                        {/* Accepted This Month */}
                        <View className="w-1/2 px-2 mb-4">
                            <View className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-4 shadow-sm">
                                <View className="flex-row items-center justify-between mb-2">
                                    <CheckCircle size={24} color="white" />
                                    <Text className="text-purple-100 text-xs font-semibold">
                                        THIS MONTH
                                    </Text>
                                </View>
                                <Text className="text-white text-2xl font-bold mb-1">
                                    {stats.thisMonthAccepted}
                                </Text>
                                <Text className="text-purple-100 text-xs">
                                    Accepted
                                </Text>
                            </View>
                        </View>

                        {/* Unpaid Deposits */}
                        <View className="w-1/2 px-2 mb-4">
                            <View className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl p-4 shadow-sm">
                                <View className="flex-row items-center justify-between mb-2">
                                    <AlertCircle size={24} color="white" />
                                    <Text className="text-orange-100 text-xs font-semibold">
                                        DEPOSITS
                                    </Text>
                                </View>
                                <Text className="text-white text-2xl font-bold mb-1">
                                    {formatCurrency(stats.unpaidDeposits)}
                                </Text>
                                <Text className="text-orange-100 text-xs">
                                    Unpaid
                                </Text>
                            </View>
                        </View>
                    </View>
                )}

                {/* Quick Stats */}
                {loading ? (
                    <View className="bg-white rounded-xl p-4 mb-4 border border-gray-200">
                        <Skeleton height={24} width="40%" className="mb-3" />
                        <Skeleton height={16} width="100%" className="mb-3" />
                        <Skeleton height={16} width="100%" className="mb-3" />
                        <Skeleton height={16} width="100%" className="mb-3" />
                        <Skeleton height={16} width="100%" />
                    </View>
                ) : (
                    <View className="bg-white rounded-xl p-4 mb-4 border border-gray-200">
                        <View className="flex-row items-center mb-3">
                            <TrendingUp size={20} color="#2563EB" />
                            <Text className="text-lg font-bold text-gray-900 ml-2">
                                Overview
                            </Text>
                        </View>

                        <View className="flex-row justify-between items-center py-3 border-b border-gray-100">
                            <Text className="text-gray-600">
                                Total Estimates
                            </Text>
                            <Text className="text-gray-900 font-semibold">
                                {stats.totalEstimates}
                            </Text>
                        </View>

                        <View className="flex-row justify-between items-center py-3 border-b border-gray-100">
                            <Text className="text-gray-600">Drafts</Text>
                            <Text className="text-gray-500 font-semibold">
                                {stats.draftEstimates}
                            </Text>
                        </View>

                        <View className="flex-row justify-between items-center py-3 border-b border-gray-100">
                            <Text className="text-gray-600">
                                Sent & Pending
                            </Text>
                            <Text className="text-blue-600 font-semibold">
                                {stats.sentEstimates}
                            </Text>
                        </View>

                        <View className="flex-row justify-between items-center py-3">
                            <Text className="text-gray-600">Accepted</Text>
                            <Text className="text-green-600 font-semibold">
                                {stats.acceptedEstimates}
                            </Text>
                        </View>
                    </View>
                )}

                {/* Recent Estimates */}
                <View className="bg-white rounded-xl p-4 border border-gray-200">
                    <View className="flex-row items-center justify-between mb-3">
                        <View className="flex-row items-center">
                            <FileText size={20} color="#2563EB" />
                            <Text className="text-lg font-bold text-gray-900 ml-2">
                                Recent Estimates
                            </Text>
                        </View>
                        {!loading && (
                            <Pressable
                                onPress={() => router.push("/(app)/estimates")}
                            >
                                <Text className="text-blue-600 text-sm font-semibold">
                                    View All
                                </Text>
                            </Pressable>
                        )}
                    </View>

                    {loading ? (
                        <>
                            <EstimateItemSkeleton />
                            <EstimateItemSkeleton />
                            <EstimateItemSkeleton />
                            <EstimateItemSkeleton />
                            <EstimateItemSkeleton />
                        </>
                    ) : recentEstimates.length === 0 ? (
                        <EmptyState
                            icon={FileText}
                            title="Ready to get started?"
                            description="Create your first estimate and start winning more business"
                            buttonText="Create First Estimate"
                            buttonIcon={Plus}
                            onButtonPress={() =>
                                router.push("/(app)/estimates/new")
                            }
                        />
                    ) : (
                        recentEstimates.map((estimate, index) => (
                            <Pressable
                                key={estimate.id}
                                className={`flex-row items-center justify-between py-3 ${
                                    index < recentEstimates.length - 1
                                        ? "border-b border-gray-100"
                                        : ""
                                }`}
                                onPress={() =>
                                    router.push(
                                        `/(app)/estimates/${estimate.id}`
                                    )
                                }
                            >
                                <View className="flex-1">
                                    <View className="flex-row items-center mb-1">
                                        <Text className="font-semibold text-gray-900 mr-2">
                                            #{estimate.estimate_number}
                                        </Text>
                                        <View
                                            className={`px-2 py-1 rounded-full ${
                                                estimate.status === "draft"
                                                    ? "bg-gray-100"
                                                    : estimate.status === "sent"
                                                      ? "bg-blue-100"
                                                      : estimate.status ===
                                                          "accepted"
                                                        ? "bg-green-100"
                                                        : "bg-gray-100"
                                            }`}
                                        >
                                            <Text
                                                className={`text-xs font-semibold capitalize ${
                                                    estimate.status === "draft"
                                                        ? "text-gray-700"
                                                        : estimate.status ===
                                                            "sent"
                                                          ? "text-blue-700"
                                                          : estimate.status ===
                                                              "accepted"
                                                            ? "text-green-700"
                                                            : "text-gray-700"
                                                }`}
                                            >
                                                {estimate.status}
                                            </Text>
                                        </View>
                                    </View>
                                    <Text className="text-sm text-gray-600">
                                        {estimate.created_at
                                            ? formatDate(estimate.created_at)
                                            : "N/A"}
                                    </Text>
                                </View>
                                <View className="flex-row items-center">
                                    <Text className="text-lg font-bold text-gray-900 mr-2">
                                        {formatCurrency(estimate.total)}
                                    </Text>
                                    <ChevronRight size={20} color="#9CA3AF" />
                                </View>
                            </Pressable>
                        ))
                    )}
                </View>
            </View>
        </ScrollView>
    );
}
