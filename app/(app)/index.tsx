import { View, Text, StyleSheet } from 'react-native';
import { useStore } from '@/store';
import React from 'react';

export default function Dashboard() {
    const { user, company } = useStore();

    return (
        <View className="flex-1 justify-center items-center bg-gray-50 px-6">
            <Text className="text-3xl font-bold mb-2 text-gray-900">
                Welcome back!
            </Text>
            <Text className="text-base text-gray-600 mb-1">{user?.email}</Text>
            {company && (
                <Text className="text-lg text-blue-600 font-semibold">
                    {company.name}
                </Text>
            )}
        </View>
    );
}
