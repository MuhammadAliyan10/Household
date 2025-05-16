import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, ReactNode, useEffect, useState } from "react";

// Define the shape of our context
interface ThemeContextType {
  isDark: boolean;
  toggleTheme: () => void;
}

// Create the context with default values
export const ThemeContext = createContext<ThemeContextType>({
  isDark: false,
  toggleTheme: () => {},
});

interface ThemeProviderProps {
  children: ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  // State to track if dark mode is enabled
  const [isDark, setIsDark] = useState<boolean>(false);
  // Track if initial loading is complete
  const [isLoaded, setIsLoaded] = useState<boolean>(false);

  // Load saved theme preference on component mount
  useEffect(() => {
    const loadThemePreference = async () => {
      try {
        const themePreference = await AsyncStorage.getItem("themePreference");
        // Set theme based on saved preference, default to light if not found
        setIsDark(themePreference === "dark");
      } catch (error) {
        console.error("Failed to load theme preference:", error);
      } finally {
        setIsLoaded(true);
      }
    };

    loadThemePreference();
  }, []);

  // Toggle between light and dark theme
  const toggleTheme = async () => {
    try {
      const newTheme = !isDark;
      setIsDark(newTheme);
      // Save the new preference
      await AsyncStorage.setItem(
        "themePreference",
        newTheme ? "dark" : "light"
      );
    } catch (error) {
      console.error("Failed to save theme preference:", error);
    }
  };

  // Don't render children until we've loaded the theme preference
  if (!isLoaded) {
    return null; // Or return a loading spinner
  }

  return (
    <ThemeContext.Provider value={{ isDark, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

// Custom hook for using theme context
export const useTheme = () => React.useContext(ThemeContext);
