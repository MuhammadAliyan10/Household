import { Feather } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { StatusBar } from "expo-status-bar";
import React, { useContext, useState } from "react";
import { Animated, Switch, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ThemeContext } from "../../context/ThemeContext";

interface Theme {
  backgroundColor: string;
  cardColor: string;
  textColor: string;
  accentColor: string;
  secondaryColor: string;
}

const SettingsScreen: React.FC = () => {
  const { isDark, toggleTheme } = useContext(ThemeContext);
  const scaleAnim = useState(new Animated.Value(1))[0];

  const darkTheme: Theme = {
    backgroundColor: "#0F172A",
    cardColor: "#1E293B",
    textColor: "#F1F5F9",
    accentColor: "#8B5CF6",
    secondaryColor: "#94A3B8",
  };

  const lightTheme: Theme = {
    backgroundColor: "#F8FAFC",
    cardColor: "#FFFFFF",
    textColor: "#1E293B",
    accentColor: "#3B82F6",
    secondaryColor: "#6B7280",
  };

  const theme = isDark ? darkTheme : lightTheme;

  const handleToggle = () => {
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 0.9,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();

    console.log("Toggling theme, current isDark:", isDark); // Debug log
    toggleTheme();
  };

  const clearData = async () => {
    try {
      await AsyncStorage.clear();
      alert("All data cleared successfully");
    } catch (error) {
      alert("Error clearing data");
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.backgroundColor }}>
      <View style={{ padding: 16 }}>
        <Text
          style={{
            fontSize: 30,
            fontWeight: "800",
            color: theme.textColor,
            marginBottom: 24,
            letterSpacing: -0.5,
          }}
        >
          Settings
        </Text>

        <View
          style={{
            backgroundColor: theme.cardColor,
            borderRadius: 16,
            padding: 20,
            marginBottom: 24,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.1,
            shadowRadius: 8,
            elevation: 4,
          }}
        >
          <TouchableOpacity
            onPress={handleToggle}
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
              paddingVertical: 12,
            }}
          >
            <Text
              style={{
                fontSize: 18,
                fontWeight: "600",
                color: theme.textColor,
              }}
            >
              Dark Mode
            </Text>
            <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
              <Switch
                value={isDark}
                onValueChange={handleToggle}
                trackColor={{
                  false: theme.secondaryColor,
                  true: theme.accentColor,
                }}
                thumbColor={isDark ? "#FFFFFF" : "#F4F4F5"}
                ios_backgroundColor={theme.secondaryColor}
              />
            </Animated.View>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={clearData}
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
              paddingVertical: 12,
              borderTopWidth: 1,
              borderTopColor: theme.secondaryColor + "33",
            }}
          >
            <Text
              style={{
                fontSize: 18,
                fontWeight: "600",
                color: theme.textColor,
              }}
            >
              Clear All Data
            </Text>
            <Feather name="trash-2" size={20} color="#EF4444" />
          </TouchableOpacity>
        </View>

        <View
          style={{
            backgroundColor: theme.cardColor,
            borderRadius: 16,
            padding: 20,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.1,
            shadowRadius: 8,
            elevation: 4,
          }}
        >
          <Text
            style={{
              fontSize: 18,
              fontWeight: "600",
              color: theme.textColor,
              marginBottom: 12,
            }}
          >
            App Information
          </Text>
          <Text
            style={{
              fontSize: 14,
              color: theme.secondaryColor,
              marginBottom: 8,
            }}
          >
            Version: 1.0.0
          </Text>
          <Text
            style={{
              fontSize: 14,
              color: theme.secondaryColor,
            }}
          >
            Developed by: Muhammad Aliyan
          </Text>
        </View>
      </View>
      <StatusBar style={isDark ? "light" : "dark"} />
    </SafeAreaView>
  );
};

export default SettingsScreen;
