import { Feather, MaterialIcons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { NavigationProp, useNavigation } from "@react-navigation/native";
import { StatusBar } from "expo-status-bar";
import React, { useContext, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Dimensions,
  ScrollView,
  Text,
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

interface Goal {
  id: string;
  name: string;
  targetAmount: number;
  targetDate: string;
  monthlyIncome: number;
  weeklyIncome: number;
  savedAmount: number;
  timestamp: number;
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

type RootStackParamList = {
  Summary: undefined;
  Budget: undefined;
  Goals: undefined;
};

const HomeScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [spendingLimits, setSpendingLimits] = useState<SpendingLimit>({
    weekly: 0,
    monthly: 0,
    yearly: 0,
  });
  const [loading, setLoading] = useState(true);
  const { isDark } = useContext(ThemeContext);
  // Removed redundant navigation declaration

  const fadeAnim = useState(new Animated.Value(0))[0];
  const scaleAnim = useState(new Animated.Value(0.95))[0];

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

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 30000); // Real-time data refresh
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 7,
        tension: 50,
        useNativeDriver: true,
      }),
    ]).start();
    return () => clearInterval(interval);
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [storedTransactions, storedGoals, storedLimits] = await Promise.all(
        [
          AsyncStorage.getItem("transactions"),
          AsyncStorage.getItem("goals"),
          AsyncStorage.getItem("spendingLimits"),
        ]
      );
      if (storedTransactions) setTransactions(JSON.parse(storedTransactions));
      if (storedGoals) setGoals(JSON.parse(storedGoals));
      if (storedLimits) setSpendingLimits(JSON.parse(storedLimits));
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setLoading(false);
    }
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

    const dailyTotal = transactions
      .filter((t) => t.timestamp >= today)
      .reduce((sum, t) => sum + t.price, 0);

    const weeklyTotal = transactions
      .filter((t) => t.timestamp >= startOfWeek)
      .reduce((sum, t) => sum + t.price, 0);

    const monthlyTotal = transactions
      .filter((t) => t.timestamp >= startOfMonth)
      .reduce((sum, t) => sum + t.price, 0);

    return { daily: dailyTotal, weekly: weeklyTotal, monthly: monthlyTotal };
  };

  const calculateCategoryBreakdown = () => {
    const categoryData: { [key: string]: number } = {};
    transactions.forEach((t) => {
      categoryData[t.category] = (categoryData[t.category] || 0) + t.price;
    });

    return Object.keys(categoryData)
      .map((category, index) => ({
        name: category,
        amount: categoryData[category],
        color: `hsl(${index * 60}, 70%, 50%)`,
        legendFontColor: theme.textColor,
        legendFontSize: 12,
      }))
      .slice(0, 5); // Limit to top 5 categories
  };

  const calculateWeeklyTrends = () => {
    const weeklyData: { [key: string]: number } = {};
    const now = new Date();
    const oneWeek = 7 * 24 * 60 * 60 * 1000;
    for (let i = 4; i >= 0; i--) {
      const weekStart = new Date(now.getTime() - i * oneWeek);
      const weekKey = `W${5 - i}`;
      weeklyData[weekKey] = 0;
    }

    transactions.forEach((t) => {
      const date = new Date(t.timestamp);
      const weeksAgo = Math.floor((now.getTime() - date.getTime()) / oneWeek);
      if (weeksAgo <= 4) {
        const weekKey = `W${5 - weeksAgo}`;
        weeklyData[weekKey] += t.price;
      }
    });

    const labels = Object.keys(weeklyData);
    const data = labels.map((key) => weeklyData[key]);
    return { labels, data };
  };

  const calculateGoalProgress = () => {
    return goals
      .map((goal) => {
        const targetDate = new Date(goal.targetDate);
        const now = new Date();
        const daysLeft = Math.ceil(
          (targetDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
        );
        const progress = (goal.savedAmount / goal.targetAmount) * 100;
        return { ...goal, progress, daysLeft };
      })
      .sort((a, b) => a.daysLeft - b.daysLeft); // Sort by urgency
  };

  const formatCurrency = (amount: number) => {
    return `PKR ${amount.toFixed(2)}`;
  };

  const totals = calculateTotals();
  const weeklyTrends = calculateWeeklyTrends();
  const categoryBreakdown = calculateCategoryBreakdown();
  const goalProgress = calculateGoalProgress();

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
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 80 }}>
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
                fontSize: 30,
                fontWeight: "800",
                color: theme.textColor,
                letterSpacing: -0.5,
              }}
            >
              Dashboard
            </Text>
            <TouchableOpacity
              onPress={() => navigation.navigate("Summary")}
              style={{
                padding: 12,
                backgroundColor: theme.cardColor,
                borderRadius: 16,
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.1,
                shadowRadius: 4,
                elevation: 3,
              }}
            >
              <MaterialIcons
                name="analytics"
                size={24}
                color={theme.accentColor}
              />
            </TouchableOpacity>
          </View>

          <Animated.View
            style={{
              backgroundColor: theme.cardColor,
              borderRadius: 24,
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
                fontWeight: "700",
                color: theme.textColor,
                marginBottom: 16,
              }}
            >
              Quick Overview
            </Text>
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                marginBottom: 12,
              }}
            >
              <View style={{ flex: 1, marginRight: 8 }}>
                <Text
                  style={{
                    fontSize: 14,
                    color: theme.secondaryColor,
                    marginBottom: 4,
                  }}
                >
                  Today
                </Text>
                <Text
                  style={{
                    fontSize: 18,
                    fontWeight: "600",
                    color: theme.textColor,
                  }}
                >
                  {formatCurrency(totals.daily)}
                </Text>
              </View>
              <View style={{ flex: 1, marginHorizontal: 8 }}>
                <Text
                  style={{
                    fontSize: 14,
                    color: theme.secondaryColor,
                    marginBottom: 4,
                  }}
                >
                  This Week
                </Text>
                <Text
                  style={{
                    fontSize: 18,
                    fontWeight: "600",
                    color:
                      spendingLimits.weekly &&
                      totals.weekly > spendingLimits.weekly
                        ? "#EF4444"
                        : theme.textColor,
                  }}
                >
                  {formatCurrency(totals.weekly)}
                </Text>
              </View>
              <View style={{ flex: 1, marginLeft: 8 }}>
                <Text
                  style={{
                    fontSize: 14,
                    color: theme.secondaryColor,
                    marginBottom: 4,
                  }}
                >
                  This Month
                </Text>
                <Text
                  style={{
                    fontSize: 18,
                    fontWeight: "600",
                    color:
                      spendingLimits.monthly &&
                      totals.monthly > spendingLimits.monthly
                        ? "#EF4444"
                        : theme.textColor,
                  }}
                >
                  {formatCurrency(totals.monthly)}
                </Text>
              </View>
            </View>
            {spendingLimits.weekly > 0 && (
              <View style={{ marginTop: 12 }}>
                <Text
                  style={{
                    fontSize: 12,
                    color: theme.secondaryColor,
                    marginBottom: 4,
                  }}
                >
                  Weekly Budget Progress
                </Text>
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
              </View>
            )}
          </Animated.View>

          <Animated.View
            style={{
              backgroundColor: theme.cardColor,
              borderRadius: 24,
              padding: 20,
              marginBottom: 24,
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 6 },
              shadowOpacity: 0.15,
              shadowRadius: 12,
              elevation: 8,
            }}
          >
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 16,
              }}
            >
              <Text
                style={{
                  fontSize: 20,
                  fontWeight: "700",
                  color: theme.textColor,
                }}
              >
                Weekly Spending
              </Text>
              <TouchableOpacity
                onPress={() => navigation.navigate("Budget")}
                style={{ padding: 8 }}
              >
                <Feather
                  name="arrow-right"
                  size={20}
                  color={theme.accentColor}
                />
              </TouchableOpacity>
            </View>
            {weeklyTrends.data.length > 0 ? (
              <LineChart
                data={{
                  labels: weeklyTrends.labels,
                  datasets: [{ data: weeklyTrends.data }],
                }}
                width={Dimensions.get("window").width - 64}
                height={180}
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
                style={{
                  color: theme.secondaryColor,
                  textAlign: "center",
                  padding: 16,
                }}
              >
                No spending data available
              </Text>
            )}
          </Animated.View>

          <Animated.View
            style={{
              backgroundColor: theme.cardColor,
              borderRadius: 24,
              padding: 20,
              marginBottom: 24,
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 6 },
              shadowOpacity: 0.15,
              shadowRadius: 12,
              elevation: 8,
            }}
          >
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 16,
              }}
            >
              <Text
                style={{
                  fontSize: 20,
                  fontWeight: "700",
                  color: theme.textColor,
                }}
              >
                Category Breakdown
              </Text>
              <TouchableOpacity
                onPress={() => navigation.navigate("Summary")}
                style={{ padding: 8 }}
              >
                <Feather
                  name="arrow-right"
                  size={20}
                  color={theme.accentColor}
                />
              </TouchableOpacity>
            </View>
            {categoryBreakdown.length > 0 ? (
              <PieChart
                data={categoryBreakdown}
                width={Dimensions.get("window").width - 64}
                height={180}
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
                style={{
                  color: theme.secondaryColor,
                  textAlign: "center",
                  padding: 16,
                }}
              >
                No category data available
              </Text>
            )}
          </Animated.View>

          <Animated.View
            style={{
              backgroundColor: theme.cardColor,
              borderRadius: 24,
              padding: 20,
              marginBottom: 24,
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 6 },
              shadowOpacity: 0.15,
              shadowRadius: 12,
              elevation: 8,
            }}
          >
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 16,
              }}
            >
              <Text
                style={{
                  fontSize: 20,
                  fontWeight: "700",
                  color: theme.textColor,
                }}
              >
                Savings Goals
              </Text>
              <TouchableOpacity
                onPress={() => navigation.navigate("Goals")}
                style={{ padding: 8 }}
              >
                <Feather
                  name="arrow-right"
                  size={20}
                  color={theme.accentColor}
                />
              </TouchableOpacity>
            </View>
            {goalProgress.length > 0 ? (
              goalProgress.slice(0, 3).map((goal) => (
                <TouchableOpacity
                  key={goal.id}
                  onPress={() => navigation.navigate("Goals")}
                  style={{
                    backgroundColor: theme.backgroundColor,
                    borderRadius: 16,
                    padding: 16,
                    marginBottom: 12,
                    flexDirection: "row",
                    alignItems: "center",
                  }}
                >
                  <View style={{ flex: 1 }}>
                    <Text
                      style={{
                        fontSize: 16,
                        fontWeight: "600",
                        color: theme.textColor,
                        marginBottom: 4,
                      }}
                    >
                      {goal.name}
                    </Text>
                    <Text
                      style={{
                        fontSize: 12,
                        color: theme.secondaryColor,
                        marginBottom: 8,
                      }}
                    >
                      {goal.daysLeft} days left
                    </Text>
                    <View
                      style={{
                        height: 6,
                        backgroundColor: "#E5E7EB",
                        borderRadius: 3,
                        overflow: "hidden",
                      }}
                    >
                      <Animated.View
                        style={{
                          height: "100%",
                          width: `${Math.min(goal.progress, 100)}%`,
                          backgroundColor:
                            goal.progress >= 100
                              ? "#10B981"
                              : theme.accentColor,
                          borderRadius: 3,
                        }}
                      />
                    </View>
                  </View>
                  <Text
                    style={{
                      fontSize: 16,
                      fontWeight: "600",
                      color: theme.textColor,
                      marginLeft: 12,
                    }}
                  >
                    {formatCurrency(goal.savedAmount)} /{" "}
                    {formatCurrency(goal.targetAmount)}
                  </Text>
                </TouchableOpacity>
              ))
            ) : (
              <Text
                style={{
                  color: theme.secondaryColor,
                  textAlign: "center",
                  padding: 16,
                }}
              >
                No goals set. Add one in the Goals section.
              </Text>
            )}
          </Animated.View>

          <Animated.View
            style={{
              backgroundColor: theme.cardColor,
              borderRadius: 24,
              padding: 20,
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
                fontWeight: "700",
                color: theme.textColor,
                marginBottom: 16,
              }}
            >
              Recent Transactions
            </Text>
            {transactions.length > 0 ? (
              transactions
                .sort((a, b) => b.timestamp - a.timestamp)
                .slice(0, 3)
                .map((transaction) => (
                  <TouchableOpacity
                    key={transaction.id}
                    onPress={() => navigation.navigate("Budget")}
                    style={{
                      flexDirection: "row",
                      justifyContent: "space-between",
                      alignItems: "center",
                      padding: 12,
                      borderBottomWidth: 1,
                      borderBottomColor: theme.secondaryColor + "33",
                    }}
                  >
                    <View>
                      <Text
                        style={{
                          fontSize: 16,
                          fontWeight: "600",
                          color: theme.textColor,
                        }}
                      >
                        {transaction.name}
                      </Text>
                      <Text
                        style={{
                          fontSize: 12,
                          color: theme.secondaryColor,
                        }}
                      >
                        {transaction.category} • {transaction.date}
                      </Text>
                    </View>
                    <Text
                      style={{
                        fontSize: 16,
                        fontWeight: "600",
                        color: theme.textColor,
                      }}
                    >
                      {formatCurrency(transaction.price)}
                    </Text>
                  </TouchableOpacity>
                ))
            ) : (
              <Text
                style={{
                  color: theme.secondaryColor,
                  textAlign: "center",
                  padding: 16,
                }}
              >
                No recent transactions
              </Text>
            )}
          </Animated.View>
        </Animated.View>
      </ScrollView>

      <TouchableOpacity
        style={{
          position: "absolute",
          bottom: 32,
          right: 24,
          width: 64,
          height: 64,
          borderRadius: 32,
          backgroundColor: theme.accentColor,
          justifyContent: "center",
          alignItems: "center",
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.3,
          shadowRadius: 8,
          elevation: 8,
        }}
        onPress={() => navigation.navigate("Budget")}
      >
        <Feather name="plus" size={28} color="#FFFFFF" />
      </TouchableOpacity>

      <StatusBar style={isDark ? "light" : "dark"} />
    </SafeAreaView>
  );
};

export default HomeScreen;
