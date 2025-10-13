import { useEffect, useState } from "react";
import {
    View,
    Text,
    ScrollView,
    Pressable,
    ActivityIndicator,
    Alert,
} from "react-native";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { Trash2, Mail, FileText } from "lucide-react-native";
import { supabase } from "@/lib/supabase";
import { useStore } from "@/store";
import { Estimate, EstimateItem, Client } from "@/lib/types";
import React from "react";

export default function EstimateDetailScreen() {
    const params = useLocalSearchParams();
    const router = useRouter();
    const { deleteEstimate } = useStore();

    const id = Array.isArray(params.id) ? params.id[0] : params.id;

    const [loading, setLoading] = useState(true);
    const [estimate, setEstimate] = useState<Estimate | null>(null);
    const [items, setItems] = useState<EstimateItem[]>([]);
    const [client, setClient] = useState<Client | null>(null);
    const [sending, setSending] = useState(false);

    useEffect(() => {
        loadEstimate();
    }, [id]);

    const loadEstimate = async () => {
        try {
            // load estimate
            const { data: estimateData, error: estimateError } = await supabase
                .from("estimates")
                .select("*")
                .eq("id", id)
                .single();

            if (estimateError) throw estimateError;
            setEstimate(estimateData);

            // load items
            const { data: itemsData, error: itemsError } = await supabase
                .from("estimate_items")
                .select("*")
                .eq("estimate_id", id)
                .order("sort_order");

            if (itemsError) throw itemsError;
            setItems(itemsData || []);

            // load client
            if (estimateData.client_id) {
                const { data: clientData, error: clientError } = await supabase
                    .from("clients")
                    .select("*")
                    .eq("id", estimateData.client_id)
                    .single();

                if (clientError) throw clientError;
                setClient(clientData);
            }
        } catch (error: any) {
            alert(error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = () => {
        Alert.alert(
            "Delete Estimate",
            "Are you sure you want to delete this estimate?",
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Delete",
                    style: "destructive",
                    onPress: async () => {
                        try {
                            const { error } = await supabase
                                .from("estimates")
                                .delete()
                                .eq("id", id);

                            if (error) throw error;
                            deleteEstimate(id);
                            router.back();
                        } catch (error: any) {
                            alert(error.message);
                        }
                    },
                },
            ]
        );
    };

    const handleGeneratePDF = async () => {
        try {
            setSending(true);

            const { data, error } = await supabase.functions.invoke(
                "generate-pdf",
                {
                    body: { estimateId: id },
                }
            );

            if (error) throw error;

            alert("PDF generated successfully!");
            loadEstimate();
        } catch (error: any) {
            alert(error.message);
        } finally {
            setSending(false);
        }
    };

    const handleSendEstimate = async () => {
        if (!client?.email) {
            alert("This client has no email address");
            return;
        }

        try {
            setSending(true);

            // generate PDF if it doesn't exist
            if (!estimate?.pdf_url) {
                const { error: pdfError } = await supabase.functions.invoke(
                    "generate-pdf",
                    {
                        body: { estimateId: id },
                    }
                );
                if (pdfError) {
                    throw pdfError;
                }
            }

            // then send email
            const result = await supabase.functions.invoke(
                "send-estimate-email",
                {
                    body: { estimateId: id },
                }
            );

            if (result.error) {
                throw result.error;
            }

            alert(`Estimate sent to ${client.email}!`);
            await loadEstimate();
        } catch (error: any) {
            alert(error.message || "Failed to send estimate");
        } finally {
            setSending(false);
        }
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat("en-US", {
            style: "currency",
            currency: "USD",
        }).format(amount);
    };

    const formatDate = (date: string) => {
        return new Date(date).toLocaleDateString("en-US", {
            month: "long",
            day: "numeric",
            year: "numeric",
        });
    };

    if (loading) {
        return (
            <View className="flex-1 justify-center items-center">
                <ActivityIndicator size="large" color="#2563EB" />
            </View>
        );
    }

    if (!estimate) {
        return (
            <View className="flex-1 justify-center items-center">
                <Text className="text-gray-600">Estimate not found</Text>
            </View>
        );
    }

    return (
        <View className="flex-1 bg-gray-50">
            <Stack.Screen
                options={{
                    title: `Estimate #${estimate.estimate_number}`,
                    headerStyle: { backgroundColor: "#2563EB" },
                    headerTintColor: "white",
                    headerRight: () => (
                        <Pressable onPress={handleDelete} className="mr-4">
                            <Trash2 size={22} color="white" />
                        </Pressable>
                    ),
                }}
            />

            <ScrollView className="flex-1">
                <View className="p-4">
                    {/* Status Badge */}
                    <View className="bg-white rounded-lg p-4 mb-4 border border-gray-200">
                        <View className="flex-row justify-between items-center mb-3">
                            <Text className="text-lg font-bold text-gray-900">
                                #{estimate.estimate_number}
                            </Text>
                            <View
                                className={`px-3 py-1 rounded-full ${
                                    estimate.status === "draft"
                                        ? "bg-gray-100"
                                        : estimate.status === "sent"
                                          ? "bg-blue-100"
                                          : estimate.status === "accepted"
                                            ? "bg-green-100"
                                            : estimate.status === "declined"
                                              ? "bg-red-100"
                                              : "bg-purple-100"
                                }`}
                            >
                                <Text
                                    className={`text-xs font-semibold capitalize ${
                                        estimate.status === "draft"
                                            ? "text-gray-700"
                                            : estimate.status === "sent"
                                              ? "text-blue-700"
                                              : estimate.status === "accepted"
                                                ? "text-green-700"
                                                : estimate.status === "declined"
                                                  ? "text-red-700"
                                                  : "text-purple-700"
                                    }`}
                                >
                                    {estimate.status}
                                </Text>
                            </View>
                        </View>
                        <Text className="text-sm text-gray-600">
                            Created{" "}
                            {estimate.created_at
                                ? formatDate(estimate.created_at)
                                : "Unknown"}
                        </Text>
                        {estimate.accepted_at && (
                            <Text className="text-sm text-green-600 font-semibold mt-2">
                                ✓ Accepted {formatDate(estimate.accepted_at)}
                            </Text>
                        )}
                        {estimate.signature && (
                            <Text className="text-sm text-gray-600 mt-1">
                                Signed by: {estimate.signature}
                            </Text>
                        )}
                    </View>

                    {/* Client Info */}
                    {client && (
                        <View className="bg-white rounded-lg p-4 mb-4 border border-gray-200">
                            <Text className="text-xs font-semibold text-gray-500 uppercase mb-2">
                                Client
                            </Text>
                            <Text className="text-lg font-semibold text-gray-900 mb-1">
                                {client.name}
                            </Text>
                            {client.email && (
                                <Text className="text-sm text-gray-600">
                                    {client.email}
                                </Text>
                            )}
                            {client.phone && (
                                <Text className="text-sm text-gray-600">
                                    {client.phone}
                                </Text>
                            )}
                            {client.address && (
                                <Text className="text-sm text-gray-600 mt-1">
                                    {client.address}
                                </Text>
                            )}
                        </View>
                    )}

                    {/* Line Items */}
                    <View className="bg-white rounded-lg p-4 mb-4 border border-gray-200">
                        <Text className="text-xs font-semibold text-gray-500 uppercase mb-3">
                            Line Items
                        </Text>
                        {items.map((item, index) => (
                            <View
                                key={item.id}
                                className={
                                    index > 0
                                        ? "pt-3 mt-3 border-t border-gray-100"
                                        : ""
                                }
                            >
                                <Text className="font-semibold text-gray-900 mb-2">
                                    {item.description}
                                </Text>
                                <View className="flex-row justify-between items-start">
                                    <View>
                                        {(item.quantity ?? 0) > 0 &&
                                            (item.unit_price ?? 0) > 0 && (
                                                <Text className="text-sm text-gray-600">
                                                    {item.quantity} ×{" "}
                                                    {formatCurrency(
                                                        item.unit_price ?? 0
                                                    )}
                                                </Text>
                                            )}
                                        {(item.labor_hours ?? 0) > 0 &&
                                            (item.labor_rate ?? 0) > 0 && (
                                                <Text className="text-sm text-gray-600">
                                                    {item.labor_hours} hrs ×{" "}
                                                    {formatCurrency(
                                                        item.labor_rate ?? 0
                                                    )}
                                                    /hr
                                                </Text>
                                            )}
                                        {item.taxable && (
                                            <Text className="text-xs text-gray-500 mt-1">
                                                Taxable
                                            </Text>
                                        )}
                                    </View>
                                    <Text className="font-semibold text-gray-900">
                                        {formatCurrency(
                                            (item.quantity ?? 0) *
                                                (item.unit_price ?? 0) +
                                                (item.labor_hours ?? 0) *
                                                    (item.labor_rate ?? 0)
                                        )}
                                    </Text>
                                </View>
                            </View>
                        ))}
                    </View>

                    {/* Totals */}
                    <View className="bg-white rounded-lg p-4 mb-4 border border-gray-200">
                        <View className="flex-row justify-between mb-2">
                            <Text className="text-gray-700">Subtotal</Text>
                            <Text className="font-semibold text-gray-900">
                                {formatCurrency(estimate.subtotal)}
                            </Text>
                        </View>
                        <View className="flex-row justify-between mb-3">
                            <Text className="text-gray-700">Tax</Text>
                            <Text className="font-semibold text-gray-900">
                                {formatCurrency(estimate.tax)}
                            </Text>
                        </View>
                        <View className="flex-row justify-between pt-3 border-t border-gray-200 mb-3">
                            <Text className="text-lg font-bold text-gray-900">
                                Total
                            </Text>
                            <Text className="text-lg font-bold text-blue-600">
                                {formatCurrency(estimate.total)}
                            </Text>
                        </View>
                        {estimate.deposit_amount &&
                            estimate.deposit_amount > 0 && (
                                <View className="flex-row justify-between pt-3 border-t border-gray-100">
                                    <Text className="text-gray-700">
                                        Deposit ({estimate.deposit_percent}%)
                                    </Text>
                                    <Text className="font-semibold text-green-600">
                                        {formatCurrency(
                                            estimate.deposit_amount
                                        )}
                                    </Text>
                                </View>
                            )}
                    </View>

                    {/* Notes */}
                    {estimate.notes && (
                        <View className="bg-white rounded-lg p-4 mb-4 border border-gray-200">
                            <Text className="text-xs font-semibold text-gray-500 uppercase mb-2">
                                Notes
                            </Text>
                            <Text className="text-sm text-gray-700">
                                {estimate.notes}
                            </Text>
                        </View>
                    )}

                    {/* Terms */}
                    {estimate.terms && (
                        <View className="bg-white rounded-lg p-4 mb-4 border border-gray-200">
                            <Text className="text-xs font-semibold text-gray-500 uppercase mb-2">
                                Terms & Conditions
                            </Text>
                            <Text className="text-sm text-gray-700">
                                {estimate.terms}
                            </Text>
                        </View>
                    )}
                </View>
            </ScrollView>

            {/* Action Buttons */}
            {estimate.status === "draft" && (
                <View className="p-4 bg-white border-t border-gray-200">
                    <Pressable
                        className="bg-blue-600 rounded-lg py-4 flex-row items-center justify-center active:opacity-80 mb-3"
                        onPress={handleSendEstimate}
                        disabled={sending}
                    >
                        {sending ? (
                            <ActivityIndicator color="white" />
                        ) : (
                            <>
                                <Mail size={20} color="white" />
                                <Text className="text-white text-base font-semibold ml-2">
                                    Send to Client
                                </Text>
                            </>
                        )}
                    </Pressable>

                    <Pressable
                        className="bg-gray-100 rounded-lg py-4 flex-row items-center justify-center active:opacity-80"
                        onPress={handleGeneratePDF}
                        disabled={sending}
                    >
                        {sending ? (
                            <ActivityIndicator color="#374151" />
                        ) : (
                            <>
                                <FileText size={20} color="#374151" />
                                <Text className="text-gray-700 text-base font-semibold ml-2">
                                    Generate PDF
                                </Text>
                            </>
                        )}
                    </Pressable>
                </View>
            )}
        </View>
    );
}
