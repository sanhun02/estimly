import { View, DimensionValue } from "react-native";
import React from "react";

interface SkeletonProps {
    width?: DimensionValue;
    height?: number;
    borderRadius?: number;
    className?: string;
}

export function Skeleton({
    width = "100%",
    height = 20,
    borderRadius = 8,
    className = "",
}: SkeletonProps) {
    return (
        <View
            style={{
                width,
                height,
                borderRadius,
                backgroundColor: "#E5E7EB",
            }}
            className={className}
        />
    );
}

export function SkeletonCard() {
    return (
        <View className="bg-white rounded-xl border border-gray-200 p-4 mb-3">
            <Skeleton height={24} width="70%" className="mb-3" />
            <Skeleton height={16} width="50%" className="mb-2" />
            <Skeleton height={16} width="40%" />
        </View>
    );
}

export function SkeletonList({ count = 3 }: { count?: number }) {
    return (
        <>
            {Array.from({ length: count }).map((_, i) => (
                <SkeletonCard key={i} />
            ))}
        </>
    );
}

export function SkeletonMetricCard() {
    return (
        <View className="bg-white rounded-xl border border-gray-200 p-4">
            <Skeleton height={16} width="60%" className="mb-2" />
            <Skeleton height={32} width="50%" />
        </View>
    );
}
