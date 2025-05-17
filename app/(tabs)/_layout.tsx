import { Tabs } from "expo-router";
import React from "react";
import { Image, Text, View } from "react-native";
import { icons } from "../../constants";
import { useTheme } from "../../context/ThemeContext";
import "../../global.css";

interface TabIconProps {
  icon: any;
  color: string;
  name: string;
  focused: boolean;
}

const TabIcon: React.FC<TabIconProps> = ({ icon, color, name, focused }) => {
  return (
    <View className="flex-1 items-center justify-center gap-2 w-20">
      <Image
        source={icon}
        resizeMode="contain"
        tintColor={color}
        className="w-6 h-6"
      />
      <Text
        className={`${
          focused ? "font-psemibold" : "font-pregular"
        } text-xs text-center`}
        style={{ color: color }}
      >
        {name}
      </Text>
    </View>
  );
};

const TabsLayout = () => {
  const { isDark } = useTheme();

  // Define theme colors for navigation
  const darkTheme = {
    backgroundColor: "#161122",
    cardColor: "#252136",
    textColor: "#FFFFFF",
    accentColor: "#FFA001",
    secondaryColor: "#CDCDE0",
  };

  const lightTheme = {
    backgroundColor: "#F9FAFB",
    cardColor: "#FFFFFF",
    textColor: "#1F2937",
    accentColor: "#3B82F6",
    secondaryColor: "#9CA3AF",
  };

  // Use theme based on context
  const theme = isDark ? darkTheme : lightTheme;

  return (
    <Tabs
      screenOptions={{
        tabBarShowLabel: false,
        tabBarActiveTintColor: theme.accentColor,
        tabBarInactiveTintColor: theme.secondaryColor,
        tabBarStyle: {
          backgroundColor: theme.backgroundColor,
          borderTopColor: isDark ? "#111" : "#E5E7EB",
          borderTopWidth: 1,
          height: 84,
          paddingTop: 10,
        },
        tabBarItemStyle: {
          width: "auto",
        },
        headerShown: false,
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: "Home",
          tabBarIcon: ({ color, focused }) => (
            <TabIcon
              icon={icons.home}
              name="Home"
              color={color}
              focused={focused}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="budget"
        options={{
          title: "Budget",
          tabBarIcon: ({ color, focused }) => (
            <TabIcon
              icon={icons.budget}
              name="Budget"
              color={color}
              focused={focused}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="saving"
        options={{
          title: "Saving",
          tabBarIcon: ({ color, focused }) => (
            <TabIcon
              icon={icons.saving}
              name="Saving"
              color={color}
              focused={focused}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="insight"
        options={{
          title: "Insight",
          tabBarIcon: ({ color, focused }) => (
            <TabIcon
              icon={icons.insight}
              name="Insight"
              color={color}
              focused={focused}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="setting"
        options={{
          title: "Setting",
          tabBarIcon: ({ color, focused }) => (
            <TabIcon
              icon={icons.profile}
              name="Setting"
              color={color}
              focused={focused}
            />
          ),
        }}
      />
    </Tabs>
  );
};

export default TabsLayout;
