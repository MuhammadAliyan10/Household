import { MaterialIcons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { StatusBar } from "expo-status-bar";
import React, { useContext, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Dimensions,
  Modal,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { LineChart, PieChart } from "react-native-chart-kit";
import { SafeAreaView } from "react-native-safe-area-context";
import { ThemeContext } from "../../context/ThemeContext";

interface Transaction {
  id: string;
  name: string;
  price: number;
  date: string;
  timestamp: number;
  category: string;
}

interface SpendingLimit {
  weekly: number;
  monthly: number;
  yearly: number;
}

interface Theme {
  backgroundColor: string;
  cardColor: string;
  textColor: string;
  accentColor: string;
  secondaryColor: string;
}

const SummaryScreen: React.FC = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [spendingLimits, setSpendingLimits] = useState<SpendingLimit>({
    weekly: 0,
    monthly: 0,
    yearly: 0,
  });
  const [weeklyLimit, setWeeklyLimit] = useState("");
  const [monthlyLimit, setMonthlyLimit] = useState("");
  const [yearlyLimit, setYearlyLimit] = useState("");
  const [modalVisible, setModalVisible] = useState(false);
  const [loading, setLoading] = useState(true);
  const { isDark } = useContext(ThemeContext);

  const fadeAnim = useState(new Animated.Value(0))[0];
  const scaleAnim = useState(new Animated.Value(0.95))[0];

  const darkTheme: Theme = {
    backgroundColor: "#1A1A2E",
    cardColor: "#2A2A3E",
    textColor: "#E4E4F7",
    accentColor: "#6366F1",
    secondaryColor: "#A1A1AA",
  };

  const lightTheme: Theme = {
    backgroundColor: "#F8FAFC",
    cardColor: "#FFFFFF",
    textColor: "#1E293B",
    accentColor: "#3B82F6",
    secondaryColor: "#6B7280",
  };

  const theme = isDark ? darkTheme : lightTheme;

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 30000); // Fetch data every 30 seconds
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start();
    return () => clearInterval(interval);
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [storedTransactions, storedLimits] = await Promise.all([
        AsyncStorage.getItem("transactions"),
        AsyncStorage.getItem("spendingLimits"),
      ]);
      if (storedTransactions) {
        setTransactions(JSON.parse(storedTransactions));
      }
      if (storedLimits) {
        const limits = JSON.parse(storedLimits);
        setSpendingLimits(limits);
        setWeeklyLimit(limits.weekly.toString());
        setMonthlyLimit(limits.monthly.toString());
        setYearlyLimit(limits.yearly?.toString() || "0");
      }
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setLoading(false);
    }
  };

  const saveSpendingLimits = async (limits: SpendingLimit) => {
    try {
      await AsyncStorage.setItem("spendingLimits", JSON.stringify(limits));
    } catch (error) {
      console.error("Error saving limits:", error);
    }
  };

  const updateSpendingLimits = () => {
    const newLimits = {
      weekly: parseFloat(weeklyLimit) || 0,
      monthly: parseFloat(monthlyLimit) || 0,
      yearly: parseFloat(yearlyLimit) || 0,
    };
    setSpendingLimits(newLimits);
    saveSpendingLimits(newLimits);
    setModalVisible(false);
  };

  const calculateTotals = () => {
    const now = new Date();
    const today = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate()
    ).getTime();
    const oneDay = 24 * 60 * 60 * 1000;
    const oneWeek = 7 * oneDay;
    const startOfWeek = today - now.getDay() * oneDay;
    const startOfMonth = new Date(
      now.getFullYear(),
      now.getMonth(),
      1
    ).getTime();
    const startOfYear = new Date(now.getFullYear(), 0, 1).getTime();

    const dailyTotal = transactions
      .filter((t) => t.timestamp >= today)
      .reduce((sum, t) => sum + t.price, 0);

    const weeklyTotal = transactions
      .filter((t) => t.timestamp >= startOfWeek)
      .reduce((sum, t) => sum + t.price, 0);

    const monthlyTotal = transactions
      .filter((t) => t.timestamp >= startOfMonth)
      .reduce((sum, t) => sum + t.price, 0);

    const yearlyTotal = transactions
      .filter((t) => t.timestamp >= startOfYear)
      .reduce((sum, t) => sum + t.price, 0);

    return {
      daily: dailyTotal,
      weekly: weeklyTotal,
      monthly: monthlyTotal,
      yearly: yearlyTotal,
    };
  };

  const calculateMonthlyTrends = () => {
    const monthlyData: { [key: string]: number } = {};
    transactions.forEach((t) => {
      const date = new Date(t.timestamp);
      const monthKey = `${date.getFullYear()}-${date.getMonth() + 1}`;
      monthlyData[monthKey] = (monthlyData[monthKey] || 0) + t.price;
    });

    const labels = Object.keys(monthlyData).slice(-6);
    const data = labels.map((key) => monthlyData[key] || 0);
    return { labels, data };
  };

  const calculateCategoryBreakdown = () => {
    const categoryData: { [key: string]: number } = {};
    transactions.forEach((t) => {
      categoryData[t.category] = (categoryData[t.category] || 0) + t.price;
    });

    return Object.keys(categoryData).map((category, index) => ({
      name: category,
      amount: categoryData[category],
      color: `hsl(${index * 60}, 70%, 50%)`,
      legendFontColor: theme.textColor,
      legendFontSize: 12,
    }));
  };

  const calculateDailyTrends = () => {
    const dailyData: { [key: string]: number } = {};
    const now = new Date();
    const oneDay = 24 * 60 * 60 * 1000;
    for (let i = 6; i >= 0; i--) {
      const date = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate() - i
      );
      const dateKey = `${date.getDate()}/${date.getMonth() + 1}`;
      dailyData[dateKey] = 0;
    }

    transactions.forEach((t) => {
      const date = new Date(t.timestamp);
      const dateKey = `${date.getDate()}/${date.getMonth() + 1}`;
      if (dailyData[dateKey] !== undefined) {
        dailyData[dateKey] += t.price;
      }
    });

    const labels = Object.keys(dailyData);
    const data = labels.map((key) => dailyData[key]);
    return { labels, data };
  };

  const formatCurrency = (amount: number) => {
    return `PKR ${amount.toFixed(2)}`;
  };

  const totals = calculateTotals();
  const monthlyTrends = calculateMonthlyTrends();
  const dailyTrends = calculateDailyTrends();
  const categoryBreakdown = calculateCategoryBreakdown();

  if (loading) {
    return (
      <SafeAreaView
        style={{
          flex: 1,
          backgroundColor: theme.backgroundColor,
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <ActivityIndicator size="large" color={theme.accentColor} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.backgroundColor }}>
      <ScrollView contentContainerStyle={{ padding: 16 }}>
        <Animated.View
          style={{ opacity: fadeAnim, transform: [{ scale: scaleAnim }] }}
        >
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 24,
            }}
          >
            <Text
              style={{
                fontSize: 28,
                fontWeight: "700",
                color: theme.textColor,
              }}
            >
              Budget Dashboard
            </Text>
            <TouchableOpacity
              onPress={() => setModalVisible(true)}
              style={{
                padding: 12,
                backgroundColor: theme.cardColor,
                borderRadius: 12,
              }}
            >
              <MaterialIcons
                name="settings"
                size={24}
                color={theme.accentColor}
              />
            </TouchableOpacity>
          </View>

          <Animated.View
            style={{
              backgroundColor: theme.cardColor,
              borderRadius: 20,
              padding: 20,
              marginBottom: 24,
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 6 },
              shadowOpacity: 0.15,
              shadowRadius: 12,
              elevation: 8,
            }}
          >
            <Text
              style={{
                fontSize: 20,
                fontWeight: "600",
                color: theme.textColor,
                marginBottom: 16,
              }}
            >
              Daily Spending Trends
            </Text>
            {dailyTrends.data.length > 0 ? (
              <LineChart
                data={{
                  labels: dailyTrends.labels,
                  datasets: [{ data: dailyTrends.data }],
                }}
                width={Dimensions.get("window").width - 64}
                height={220}
                chartConfig={{
                  backgroundColor: theme.cardColor,
                  backgroundGradientFrom: theme.cardColor,
                  backgroundGradientTo: theme.cardColor,
                  decimalPlaces: 0,
                  color: () => theme.accentColor,
                  labelColor: () => theme.secondaryColor,
                  style: { borderRadius: 16 },
                  propsForDots: {
                    r: "6",
                    strokeWidth: "2",
                    stroke: theme.backgroundColor,
                  },
                }}
                bezier
                style={{ marginVertical: 8, borderRadius: 16 }}
              />
            ) : (
              <Text
                style={{ color: theme.secondaryColor, textAlign: "center" }}
              >
                No daily data available
              </Text>
            )}
          </Animated.View>

          <Animated.View
            style={{
              backgroundColor: theme.cardColor,
              borderRadius: 20,
              padding: 20,
              marginBottom: 24,
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 6 },
              shadowOpacity: 0.15,
              shadowRadius: 12,
              elevation: 8,
            }}
          >
            <Text
              style={{
                fontSize: 20,
                fontWeight: "600",
                color: theme.textColor,
                marginBottom: 16,
              }}
            >
              Monthly Spending Trends
            </Text>
            {monthlyTrends.data.length > 0 ? (
              <LineChart
                data={{
                  labels: monthlyTrends.labels.map((l) => l.split("-")[1]),
                  datasets: [{ data: monthlyTrends.data }],
                }}
                width={Dimensions.get("window").width - 64}
                height={220}
                chartConfig={{
                  backgroundColor: theme.cardColor,
                  backgroundGradientFrom: theme.cardColor,
                  backgroundGradientTo: theme.cardColor,
                  decimalPlaces: 0,
                  color: () => theme.accentColor,
                  labelColor: () => theme.secondaryColor,
                  style: { borderRadius: 16 },
                  propsForDots: {
                    r: "6",
                    strokeWidth: "2",
                    stroke: theme.backgroundColor,
                  },
                }}
                bezier
                style={{ marginVertical: 8, borderRadius: 16 }}
              />
            ) : (
              <Text
                style={{ color: theme.secondaryColor, textAlign: "center" }}
              >
                No monthly data available
              </Text>
            )}
          </Animated.View>

          <Animated.View
            style={{
              backgroundColor: theme.cardColor,
              borderRadius: 20,
              padding: 20,
              marginBottom: 24,
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 6 },
              shadowOpacity: 0.15,
              shadowRadius: 12,
              elevation: 8,
            }}
          >
            <Text
              style={{
                fontSize: 20,
                fontWeight: "600",
                color: theme.textColor,
                marginBottom: 16,
              }}
            >
              Category Breakdown
            </Text>
            {categoryBreakdown.length > 0 ? (
              <PieChart
                data={categoryBreakdown}
                width={Dimensions.get("window").width - 64}
                height={220}
                chartConfig={{
                  color: () => theme.accentColor,
                  labelColor: () => theme.secondaryColor,
                }}
                accessor="amount"
                backgroundColor="transparent"
                paddingLeft="15"
                absolute
              />
            ) : (
              <Text
                style={{ color: theme.secondaryColor, textAlign: "center" }}
              >
                No category data available
              </Text>
            )}
          </Animated.View>

          <Animated.View
            style={{
              backgroundColor: theme.cardColor,
              borderRadius: 20,
              padding: 20,
              marginBottom: 24,
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 6 },
              shadowOpacity: 0.15,
              shadowRadius: 12,
              elevation: 8,
            }}
          >
            <Text
              style={{
                fontSize: 20,
                fontWeight: "600",
                color: theme.textColor,
                marginBottom: 16,
              }}
            >
              Budget Status
            </Text>

            <View style={{ marginBottom: 16 }}>
              <Text
                style={{
                  color: theme.secondaryColor,
                  fontSize: 14,
                  marginBottom: 8,
                }}
              >
                Daily
              </Text>
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  marginBottom: 8,
                }}
              >
                <Text style={{ color: theme.textColor, fontWeight: "600" }}>
                  {formatCurrency(totals.daily)}
                </Text>
              </View>
              <View
                style={{
                  height: 8,
                  backgroundColor: "#E5E7EB",
                  borderRadius: 4,
                  overflow: "hidden",
                }}
              >
                <Animated.View
                  style={{
                    height: "100%",
                    width: `${Math.min(
                      (totals.daily / (spendingLimits.weekly / 7)) * 100,
                      100
                    )}%`,
                    backgroundColor: theme.accentColor,
                    borderRadius: 4,
                  }}
                />
              </View>
            </View>

            <View style={{ marginBottom: 16 }}>
              <Text
                style={{
                  color: theme.secondaryColor,
                  fontSize: 14,
                  marginBottom: 8,
                }}
              >
                Weekly
              </Text>
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  marginBottom: 8,
                }}
              >
                <Text style={{ color: theme.textColor, fontWeight: "600" }}>
                  {formatCurrency(totals.weekly)}
                </Text>
                <Text
                  style={{
                    color:
                      spendingLimits.weekly &&
                      totals.weekly > spendingLimits.weekly
                        ? "#EF4444"
                        : "#10B981",
                    fontSize: 12,
                  }}
                >
                  {spendingLimits.weekly
                    ? `Limit: ${formatCurrency(spendingLimits.weekly)}`
                    : "No limit set"}
                </Text>
              </View>
              {spendingLimits.weekly > 0 && (
                <View
                  style={{
                    height: 8,
                    backgroundColor: "#E5E7EB",
                    borderRadius: 4,
                    overflow: "hidden",
                  }}
                >
                  <Animated.View
                    style={{
                      height: "100%",
                      width: `${Math.min(
                        (totals.weekly / spendingLimits.weekly) * 100,
                        100
                      )}%`,
                      backgroundColor:
                        totals.weekly > spendingLimits.weekly
                          ? "#EF4444"
                          : theme.accentColor,
                      borderRadius: 4,
                    }}
                  />
                </View>
              )}
            </View>

            <View style={{ marginBottom: 16 }}>
              <Text
                style={{
                  color: theme.secondaryColor,
                  fontSize: 14,
                  marginBottom: 8,
                }}
              >
                Monthly
              </Text>
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  marginBottom: 8,
                }}
              >
                <Text style={{ color: theme.textColor, fontWeight: "600" }}>
                  {formatCurrency(totals.monthly)}
                </Text>
                <Text
                  style={{
                    color:
                      spendingLimits.monthly &&
                      totals.monthly > spendingLimits.monthly
                        ? "#EF4444"
                        : "#10B981",
                    fontSize: 12,
                  }}
                >
                  {spendingLimits.monthly
                    ? `Limit: ${formatCurrency(spendingLimits.monthly)}`
                    : "No limit set"}
                </Text>
              </View>
              {spendingLimits.monthly > 0 && (
                <View
                  style={{
                    height: 8,
                    backgroundColor: "#E5E7EB",
                    borderRadius: 4,
                    overflow: "hidden",
                  }}
                >
                  <Animated.View
                    style={{
                      height: "100%",
                      width: `${Math.min(
                        (totals.monthly / spendingLimits.monthly) * 100,
                        100
                      )}%`,
                      backgroundColor:
                        totals.monthly > spendingLimits.monthly
                          ? "#EF4444"
                          : theme.accentColor,
                      borderRadius: 4,
                    }}
                  />
                </View>
              )}
            </View>

            <View>
              <Text
                style={{
                  color: theme.secondaryColor,
                  fontSize: 14,
                  marginBottom: 8,
                }}
              >
                Yearly
              </Text>
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  marginBottom: 8,
                }}
              >
                <Text style={{ color: theme.textColor, fontWeight: "600" }}>
                  {formatCurrency(totals.yearly)}
                </Text>
                <Text
                  style={{
                    color:
                      spendingLimits.yearly &&
                      totals.yearly > spendingLimits.yearly
                        ? "#EF4444"
                        : "#10B981",
                    fontSize: 12,
                  }}
                >
                  {spendingLimits.yearly
                    ? `Limit: ${formatCurrency(spendingLimits.yearly)}`
                    : "No limit set"}
                </Text>
              </View>
              {spendingLimits.yearly > 0 && (
                <View
                  style={{
                    height: 8,
                    backgroundColor: "#E5E7EB",
                    borderRadius: 4,
                    overflow: "hidden",
                  }}
                >
                  <Animated.View
                    style={{
                      height: "100%",
                      width: `${Math.min(
                        (totals.yearly / spendingLimits.yearly) * 100,
                        100
                      )}%`,
                      backgroundColor:
                        totals.yearly > spendingLimits.yearly
                          ? "#EF4444"
                          : theme.accentColor,
                      borderRadius: 4,
                    }}
                  />
                </View>
              )}
            </View>
          </Animated.View>

          <Animated.View
            style={{
              backgroundColor: theme.cardColor,
              borderRadius: 20,
              padding: 20,
              marginBottom: 24,
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 6 },
              shadowOpacity: 0.15,
              shadowRadius: 12,
              elevation: 8,
            }}
          >
            <Text
              style={{
                fontSize: 20,
                fontWeight: "600",
                color: theme.textColor,
                marginBottom: 16,
              }}
            >
              Financial Summary
            </Text>
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                marginBottom: 8,
              }}
            >
              <Text style={{ color: theme.secondaryColor }}>
                Highest Expense
              </Text>
              <Text style={{ color: theme.textColor, fontWeight: "600" }}>
                {transactions.length > 0
                  ? formatCurrency(
                      Math.max(...transactions.map((t) => t.price))
                    )
                  : "N/A"}
              </Text>
            </View>
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                marginBottom: 8,
              }}
            >
              <Text style={{ color: theme.secondaryColor }}>
                Average Daily Spend
              </Text>
              <Text style={{ color: theme.textColor, fontWeight: "600" }}>
                {formatCurrency(totals.daily / 7)}
              </Text>
            </View>
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
              }}
            >
              <Text style={{ color: theme.secondaryColor }}>
                Most Frequent Category
              </Text>
              <Text style={{ color: theme.textColor, fontWeight: "600" }}>
                {categoryBreakdown.length > 0
                  ? categoryBreakdown.reduce((prev, curr) =>
                      prev.amount > curr.amount ? prev : curr
                    ).name
                  : "N/A"}
              </Text>
            </View>
          </Animated.View>
        </Animated.View>
      </ScrollView>

      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View
          style={{
            flex: 1,
            justifyContent: "flex-end",
            backgroundColor: "rgba(0,0,0,0.5)",
          }}
        >
          <View
            style={{
              backgroundColor: theme.backgroundColor,
              borderTopLeftRadius: 24,
              borderTopRightRadius: 24,
              padding: 24,
              shadowColor: "#000",
              shadowOffset: { width: 0, height: -4 },
              shadowOpacity: 0.2,
              shadowRadius: 12,
              elevation: 10,
            }}
          >
            <Text
              style={{
                fontSize: 24,
                fontWeight: "700",
                marginBottom: 24,
                color: theme.textColor,
              }}
            >
              Set Spending Limits
            </Text>

            <Text
              style={{
                fontSize: 16,
                marginBottom: 8,
                color: theme.secondaryColor,
              }}
            >
              Weekly Limit (PKR)
            </Text>
            <TextInput
              style={{
                borderWidth: 1,
                borderColor: theme.secondaryColor,
                borderRadius: 12,
                padding: 12,
                marginBottom: 16,
                color: theme.textColor,
                backgroundColor: theme.cardColor,
              }}
              placeholder="Enter weekly limit"
              placeholderTextColor={theme.secondaryColor}
              keyboardType="numeric"
              value={weeklyLimit}
              onChangeText={setWeeklyLimit}
            />

            <Text
              style={{
                fontSize: 16,
                marginBottom: 8,
                color: theme.secondaryColor,
              }}
            >
              Monthly Limit (PKR)
            </Text>
            <TextInput
              style={{
                borderWidth: 1,
                borderColor: theme.secondaryColor,
                borderRadius: 12,
                padding: 12,
                marginBottom: 16,
                color: theme.textColor,
                backgroundColor: theme.cardColor,
              }}
              placeholder="Enter monthly limit"
              placeholderTextColor={theme.secondaryColor}
              keyboardType="numeric"
              value={monthlyLimit}
              onChangeText={setMonthlyLimit}
            />

            <Text
              style={{
                fontSize: 16,
                marginBottom: 8,
                color: theme.secondaryColor,
              }}
            >
              Yearly Limit (PKR)
            </Text>
            <TextInput
              style={{
                borderWidth: 1,
                borderColor: theme.secondaryColor,
                borderRadius: 12,
                padding: 12,
                marginBottom: 24,
                color: theme.textColor,
                backgroundColor: theme.cardColor,
              }}
              placeholder="Enter yearly limit"
              placeholderTextColor={theme.secondaryColor}
              keyboardType="numeric"
              value={yearlyLimit}
              onChangeText={setYearlyLimit}
            />

            <View
              style={{ flexDirection: "row", justifyContent: "space-between" }}
            >
              <TouchableOpacity
                style={{
                  padding: 16,
                  borderRadius: 12,
                  backgroundColor: theme.cardColor,
                  alignItems: "center",
                  width: "48%",
                }}
                onPress={() => setModalVisible(false)}
              >
                <Text style={{ color: theme.textColor, fontWeight: "600" }}>
                  Cancel
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={{
                  padding: 16,
                  borderRadius: 12,
                  backgroundColor: theme.accentColor,
                  alignItems: "center",
                  width: "48%",
                }}
                onPress={updateSpendingLimits}
              >
                <Text style={{ color: "#FFFFFF", fontWeight: "600" }}>
                  Save
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
      <StatusBar style={isDark ? "light" : "dark"} />
    </SafeAreaView>
  );
};

export default SummaryScreen;
