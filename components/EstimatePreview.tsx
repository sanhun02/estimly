import { View, Text, ScrollView, Pressable, Modal } from "react-native";
import { X } from "lucide-react-native";
import React from "react";
import { Estimate, EstimateItem, Client, Company } from "@/lib/supabase/types";

interface EstimatePreviewProps {
    visible: boolean;
    onClose: () => void;
    estimate: Estimate;
    items: EstimateItem[];
    client: Client | null;
    company: Company | null;
}

export default function EstimatePreview({
    visible,
    onClose,
    estimate,
    items,
    client,
    company,
}: EstimatePreviewProps) {
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

    return (
        <Modal
            visible={visible}
            animationType="slide"
            presentationStyle="pageSheet"
            onRequestClose={onClose}
        >
            <View className="flex-1 bg-white">
                {/* Header */}
                <View className="bg-blue-600 px-4 py-4 flex-row items-center justify-between">
                    <Text className="text-white text-lg font-bold">
                        Preview
                    </Text>
                    <Pressable
                        onPress={onClose}
                        className="w-8 h-8 items-center justify-center"
                    >
                        <X size={24} color="white" />
                    </Pressable>
                </View>

                <ScrollView className="flex-1">
                    <View className="p-6">
                        {/* Company Info */}
                        <View className="mb-8">
                            <Text className="text-3xl font-bold text-gray-900 mb-2">
                                {company?.name || "Your Company"}
                            </Text>
                            {company?.email && (
                                <Text className="text-gray-600">
                                    {company.email}
                                </Text>
                            )}
                            {company?.phone && (
                                <Text className="text-gray-600">
                                    {company.phone}
                                </Text>
                            )}
                            {company?.address && (
                                <Text className="text-gray-600 mt-1">
                                    {company.address}
                                </Text>
                            )}
                        </View>

                        {/* Estimate Header */}
                        <View className="mb-6">
                            <Text className="text-2xl font-bold text-gray-900 mb-1">
                                Estimate #{estimate.estimate_number}
                            </Text>
                            <Text className="text-gray-600">
                                {estimate.created_at
                                    ? formatDate(estimate.created_at)
                                    : ""}
                            </Text>
                        </View>

                        {/* Client Info */}
                        {client && (
                            <View className="mb-8 bg-gray-50 rounded-lg p-4">
                                <Text className="text-sm font-semibold text-gray-500 uppercase mb-2">
                                    Prepared For
                                </Text>
                                <Text className="text-lg font-semibold text-gray-900">
                                    {client.name}
                                </Text>
                                {client.email && (
                                    <Text className="text-gray-600">
                                        {client.email}
                                    </Text>
                                )}
                                {client.phone && (
                                    <Text className="text-gray-600">
                                        {client.phone}
                                    </Text>
                                )}
                                {client.address && (
                                    <Text className="text-gray-600 mt-1">
                                        {client.address}
                                    </Text>
                                )}
                            </View>
                        )}

                        {/* Line Items */}
                        <View className="mb-8">
                            <Text className="text-lg font-bold text-gray-900 mb-4">
                                Items
                            </Text>
                            <View className="border border-gray-200 rounded-lg overflow-hidden">
                                {items.map((item, index) => (
                                    <View
                                        key={item.id}
                                        className={`p-4 ${
                                            index > 0
                                                ? "border-t border-gray-200"
                                                : ""
                                        }`}
                                    >
                                        <View className="flex-row justify-between items-start mb-2">
                                            <Text className="flex-1 font-semibold text-gray-900 mr-4">
                                                {item.description}
                                            </Text>
                                            <Text className="font-semibold text-gray-900">
                                                {formatCurrency(
                                                    (item.quantity ?? 0) *
                                                        (item.unit_price ?? 0) +
                                                        (item.labor_hours ??
                                                            0) *
                                                            (item.labor_rate ??
                                                                0)
                                                )}
                                            </Text>
                                        </View>
                                        <View>
                                            {(item.quantity ?? 0) > 0 &&
                                                (item.unit_price ?? 0) > 0 && (
                                                    <Text className="text-sm text-gray-600">
                                                        Quantity:{" "}
                                                        {item.quantity} ×{" "}
                                                        {formatCurrency(
                                                            item.unit_price ?? 0
                                                        )}
                                                    </Text>
                                                )}
                                            {(item.labor_hours ?? 0) > 0 &&
                                                (item.labor_rate ?? 0) > 0 && (
                                                    <Text className="text-sm text-gray-600">
                                                        Labor:{" "}
                                                        {item.labor_hours} hrs ×{" "}
                                                        {formatCurrency(
                                                            item.labor_rate ?? 0
                                                        )}
                                                        /hr
                                                    </Text>
                                                )}
                                        </View>
                                    </View>
                                ))}
                            </View>
                        </View>

                        {/* Totals */}
                        <View className="mb-8 bg-gray-50 rounded-lg p-4">
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
                                    <View className="flex-row justify-between pt-3 border-t border-gray-200">
                                        <Text className="font-semibold text-gray-700">
                                            Deposit Due (
                                            {estimate.deposit_percent}%)
                                        </Text>
                                        <Text className="font-bold text-green-600">
                                            {formatCurrency(
                                                estimate.deposit_amount
                                            )}
                                        </Text>
                                    </View>
                                )}
                        </View>

                        {/* Notes */}
                        {estimate.notes && (
                            <View className="mb-6">
                                <Text className="text-lg font-bold text-gray-900 mb-2">
                                    Notes
                                </Text>
                                <Text className="text-gray-700">
                                    {estimate.notes}
                                </Text>
                            </View>
                        )}

                        {/* Terms */}
                        {estimate.terms && (
                            <View className="mb-6">
                                <Text className="text-lg font-bold text-gray-900 mb-2">
                                    Terms & Conditions
                                </Text>
                                <Text className="text-gray-700 text-sm">
                                    {estimate.terms}
                                </Text>
                            </View>
                        )}

                        {/* Footer Note */}
                        <View className="mt-8 pt-6 border-t border-gray-200">
                            <Text className="text-sm text-gray-500 text-center">
                                This is how your client will see this estimate
                            </Text>
                        </View>
                    </View>
                </ScrollView>

                {/* Close Button */}
                <View className="p-4 bg-white border-t border-gray-200">
                    <Pressable
                        className="bg-blue-600 rounded-lg py-4 active:opacity-80"
                        onPress={onClose}
                    >
                        <Text className="text-white text-center font-semibold text-base">
                            Close Preview
                        </Text>
                    </Pressable>
                </View>
            </View>
        </Modal>
    );
}
