import { View, Text, Pressable } from "react-native";
import { LucideIcon } from "lucide-react-native";
import React from "react";

interface EmptyStateProps {
    icon: LucideIcon;
    iconColor?: string;
    title: string;
    description: string;
    buttonText?: string;
    onButtonPress?: () => void;
    buttonIcon?: LucideIcon;
}

export default function EmptyState({
    icon: Icon,
    iconColor = "#2563EB",
    title,
    description,
    buttonText,
    onButtonPress,
    buttonIcon: ButtonIcon,
}: EmptyStateProps) {
    return (
        <View className="flex-1 justify-center items-center px-6 py-12">
            <View className="w-32 h-32 rounded-full bg-blue-50 items-center justify-center mb-6">
                <Icon size={64} color={iconColor} />
            </View>

            <Text className="text-2xl font-bold text-gray-900 mb-3 text-center">
                {title}
            </Text>

            <Text className="text-base text-gray-600 text-center mb-8 px-4 leading-6">
                {description}
            </Text>

            {buttonText && onButtonPress && (
                <Pressable
                    className="bg-blue-600 rounded-lg px-8 py-4 flex-row items-center active:opacity-80 shadow-lg"
                    onPress={onButtonPress}
                >
                    {ButtonIcon && <ButtonIcon size={22} color="white" />}
                    <Text
                        className={`text-white font-bold text-base ${ButtonIcon ? "ml-2" : ""}`}
                    >
                        {buttonText}
                    </Text>
                </Pressable>
            )}
        </View>
    );
}
