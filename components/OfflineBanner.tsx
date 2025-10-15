import { View, Text } from "react-native";
import { WifiOff } from "lucide-react-native";
import React, { useEffect, useState } from "react";
import NetInfo from "@react-native-community/netinfo";

export default function OfflineBanner() {
    const [isOffline, setIsOffline] = useState(false);

    useEffect(() => {
        // subscribe to network state changes
        const unsubscribe = NetInfo.addEventListener((state) => {
            setIsOffline(!state.isConnected);
        });

        // chcek initial state
        NetInfo.fetch().then((state) => {
            setIsOffline(!state.isConnected);
        });

        return () => unsubscribe();
    }, []);

    if (!isOffline) return null;

    return (
        <View className="bg-red-600 px-4 py-3 flex-row items-center">
            <WifiOff size={18} color="white" />
            <Text className="text-white font-semibold ml-2 flex-1">
                No internet connection
            </Text>
        </View>
    );
}
