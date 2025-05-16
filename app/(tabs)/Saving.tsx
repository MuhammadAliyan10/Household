import { Feather } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { StatusBar } from "expo-status-bar";
import React, { useContext, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Animated,
  Dimensions,
  Modal,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { LineChart } from "react-native-chart-kit";
import { SafeAreaView } from "react-native-safe-area-context";
import { ThemeContext } from "../../context/ThemeContext";

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

interface Expense {
  id: string;
  goalId: string;
  name: string;
  amount: number;
  date: string;
  timestamp: number;
  frequency: "daily" | "weekly";
}

interface Theme {
  backgroundColor: string;
  cardColor: string;
  textColor: string;
  accentColor: string;
  secondaryColor: string;
}

const Saving: React.FC = () => {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [expenseModalVisible, setExpenseModalVisible] = useState(false);
  const [loading, setLoading] = useState(true);
  const [goalName, setGoalName] = useState("");
  const [targetAmount, setTargetAmount] = useState("");
  const [targetDate, setTargetDate] = useState("");
  const [monthlyIncome, setMonthlyIncome] = useState("");
  const [weeklyIncome, setWeeklyIncome] = useState("");
  const [expenseName, setExpenseName] = useState("");
  const [expenseAmount, setExpenseAmount] = useState("");
  const [expenseFrequency, setExpenseFrequency] = useState<"daily" | "weekly">(
    "daily"
  );
  const [selectedGoal, setSelectedGoal] = useState<Goal | null>(null);
  const { isDark } = useContext(ThemeContext);

  const scaleAnim = useState(new Animated.Value(0.9))[0];

  const darkTheme: Theme = {
    backgroundColor: "#161122",
    cardColor: "#252136",
    textColor: "#FFFFFF",
    accentColor: "#FFA001",
    secondaryColor: "#CDCDE0",
  };

  const lightTheme: Theme = {
    backgroundColor: "#F9FAFB",
    cardColor: "#FFFFFF",
    textColor: "#1F2937",
    accentColor: "#3B82F6",
    secondaryColor: "#9CA3AF",
  };

  const theme = isDark ? darkTheme : lightTheme;

  useEffect(() => {
    loadData();
    Animated.spring(scaleAnim, {
      toValue: 1,
      friction: 6,
      tension: 40,
      useNativeDriver: true,
    }).start();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [storedGoals, storedExpenses] = await Promise.all([
        AsyncStorage.getItem("goals"),
        AsyncStorage.getItem("goalExpenses"),
      ]);
      if (storedGoals) setGoals(JSON.parse(storedGoals));
      if (storedExpenses) setExpenses(JSON.parse(storedExpenses));
    } catch (error) {
      Alert.alert("Error", "Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  const saveGoals = async (newGoals: Goal[]) => {
    try {
      await AsyncStorage.setItem("goals", JSON.stringify(newGoals));
    } catch (error) {
      Alert.alert("Error", "Failed to save goals");
    }
  };

  const saveExpenses = async (newExpenses: Expense[]) => {
    try {
      await AsyncStorage.setItem("goalExpenses", JSON.stringify(newExpenses));
    } catch (error) {
      Alert.alert("Error", "Failed to save expenses");
    }
  };

  const addGoal = () => {
    if (
      !goalName.trim() ||
      !targetAmount.trim() ||
      !targetDate.trim() ||
      !monthlyIncome.trim() ||
      !weeklyIncome.trim() ||
      isNaN(parseFloat(targetAmount)) ||
      isNaN(parseFloat(monthlyIncome)) ||
      isNaN(parseFloat(weeklyIncome))
    ) {
      Alert.alert("Error", "Please enter valid details");
      return;
    }

    const newGoal: Goal = {
      id: Date.now().toString(),
      name: goalName.trim(),
      targetAmount: parseFloat(targetAmount),
      targetDate,
      monthlyIncome: parseFloat(monthlyIncome),
      weeklyIncome: parseFloat(weeklyIncome),
      savedAmount: 0,
      timestamp: Date.now(),
    };

    const updatedGoals = [...goals, newGoal];
    setGoals(updatedGoals);
    saveGoals(updatedGoals);

    setGoalName("");
    setTargetAmount("");
    setTargetDate("");
    setMonthlyIncome("");
    setWeeklyIncome("");
    setModalVisible(false);
  };

  const addExpense = () => {
    if (
      !selectedGoal ||
      !expenseName.trim() ||
      !expenseAmount.trim() ||
      isNaN(parseFloat(expenseAmount))
    ) {
      Alert.alert("Error", "Please enter valid expense details");
      return;
    }

    const now = new Date();
    const newExpense: Expense = {
      id: Date.now().toString(),
      goalId: selectedGoal.id,
      name: expenseName.trim(),
      amount: parseFloat(expenseAmount),
      date: now.toLocaleString(),
      timestamp: now.getTime(),
      frequency: expenseFrequency,
    };

    const updatedExpenses = [...expenses, newExpense];
    setExpenses(updatedExpenses);
    saveExpenses(updatedExpenses);

    const updatedGoals = goals.map((g) =>
      g.id === selectedGoal.id
        ? { ...g, savedAmount: g.savedAmount + parseFloat(expenseAmount) }
        : g
    );
    setGoals(updatedGoals);
    saveGoals(updatedGoals);

    setExpenseName("");
    setExpenseAmount("");
    setExpenseFrequency("daily");
    setExpenseModalVisible(false);
  };

  const calculateProgress = (goal: Goal) => {
    const targetDate = new Date(goal.targetDate);
    const now = new Date();
    const totalDays = Math.ceil(
      (targetDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
    );
    const weeksLeft = Math.ceil(totalDays / 7);
    const monthsLeft = Math.ceil(totalDays / 30);

    const totalExpenses = expenses
      .filter((e) => e.goalId === goal.id)
      .reduce((sum, e) => sum + e.amount, 0);

    const weeklySavingsNeeded =
      (goal.targetAmount - goal.savedAmount) / weeksLeft;
    const monthlySavingsNeeded =
      (goal.targetAmount - goal.savedAmount) / monthsLeft;

    return {
      progress: (goal.savedAmount / goal.targetAmount) * 100,
      totalExpenses,
      weeksLeft,
      monthsLeft,
      weeklySavingsNeeded,
      monthlySavingsNeeded,
      status:
        goal.savedAmount >= goal.targetAmount
          ? "Goal Reached!"
          : weeklySavingsNeeded <= goal.weeklyIncome &&
            monthlySavingsNeeded <= goal.monthlyIncome
          ? "On Track"
          : "Needs Attention",
    };
  };

  const getSavingsTrend = (goal: Goal) => {
    const monthlyData: { [key: string]: number } = {};
    expenses
      .filter((e) => e.goalId === goal.id)
      .forEach((e) => {
        const date = new Date(e.timestamp);
        const monthKey = `${date.getFullYear()}-${date.getMonth() + 1}`;
        monthlyData[monthKey] = (monthlyData[monthKey] || 0) + e.amount;
      });

    const labels = Object.keys(monthlyData).slice(-6);
    const data = labels.map((key) => monthlyData[key] || 0);
    return { labels, data };
  };

  const formatCurrency = (amount: number) => {
    return `PKR ${amount.toFixed(2)}`;
  };

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
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 20,
          }}
        >
          <Text
            style={{ fontSize: 24, fontWeight: "bold", color: theme.textColor }}
          >
            Savings Goals
          </Text>
          <TouchableOpacity
            onPress={() => setModalVisible(true)}
            style={{
              padding: 8,
              backgroundColor: theme.cardColor,
              borderRadius: 8,
            }}
          >
            <Feather name="plus" size={24} color={theme.accentColor} />
          </TouchableOpacity>
        </View>

        {goals.length === 0 ? (
          <View
            style={{
              padding: 24,
              backgroundColor: theme.cardColor,
              borderRadius: 12,
              alignItems: "center",
              opacity: 0.8,
            }}
          >
            <Text style={{ color: theme.secondaryColor, textAlign: "center" }}>
              No goals yet. Tap the + button to add one.
            </Text>
          </View>
        ) : (
          goals.map((goal) => {
            const {
              progress,
              totalExpenses,
              weeksLeft,
              monthsLeft,
              weeklySavingsNeeded,
              monthlySavingsNeeded,
              status,
            } = calculateProgress(goal);
            const { labels, data } = getSavingsTrend(goal);

            return (
              <Animated.View
                key={goal.id}
                style={{
                  backgroundColor: theme.cardColor,
                  borderRadius: 16,
                  padding: 16,
                  marginBottom: 20,
                  shadowColor: "#000",
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.1,
                  shadowRadius: 8,
                  elevation: 4,
                  transform: [{ scale: scaleAnim }],
                }}
              >
                <View
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: 12,
                  }}
                >
                  <Text
                    style={{
                      fontSize: 18,
                      fontWeight: "600",
                      color: theme.textColor,
                    }}
                  >
                    {goal.name}
                  </Text>
                  <TouchableOpacity
                    onPress={() => {
                      setSelectedGoal(goal);
                      setExpenseModalVisible(true);
                    }}
                  >
                    <Feather
                      name="plus-circle"
                      size={20}
                      color={theme.accentColor}
                    />
                  </TouchableOpacity>
                </View>

                <View
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                    marginBottom: 8,
                  }}
                >
                  <Text style={{ color: theme.secondaryColor }}>Target</Text>
                  <Text style={{ color: theme.textColor, fontWeight: "600" }}>
                    {formatCurrency(goal.targetAmount)}
                  </Text>
                </View>

                <View
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                    marginBottom: 8,
                  }}
                >
                  <Text style={{ color: theme.secondaryColor }}>Saved</Text>
                  <Text style={{ color: theme.textColor, fontWeight: "600" }}>
                    {formatCurrency(goal.savedAmount)}
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
                    Target Date
                  </Text>
                  <Text style={{ color: theme.textColor, fontWeight: "600" }}>
                    {goal.targetDate}
                  </Text>
                </View>

                <View
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                    marginBottom: 12,
                  }}
                >
                  <Text style={{ color: theme.secondaryColor }}>Status</Text>
                  <Text
                    style={{
                      color:
                        status === "Goal Reached!"
                          ? "#10B981"
                          : status === "On Track"
                          ? "#3B82F6"
                          : "#EF4444",
                      fontWeight: "600",
                    }}
                  >
                    {status}
                  </Text>
                </View>

                <View style={{ marginTop: 12 }}>
                  <Text
                    style={{
                      color: theme.secondaryColor,
                      fontSize: 12,
                      marginBottom: 4,
                    }}
                  >
                    Progress
                  </Text>
                  <View
                    style={{
                      height: 8,
                      backgroundColor: "#E5E7EB",
                      borderRadius: 4,
                      overflow: "hidden",
                    }}
                  >
                    <View
                      style={{
                        height: "100%",
                        width: `${Math.min(progress, 100)}%`,
                        backgroundColor:
                          progress >= 100 ? "#10B981" : theme.accentColor,
                        borderRadius: 4,
                      }}
                    />
                  </View>
                </View>

                <Text
                  style={{
                    fontSize: 16,
                    fontWeight: "600",
                    color: theme.textColor,
                    marginTop: 16,
                    marginBottom: 12,
                  }}
                >
                  Savings Plan
                </Text>
                <View
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                    marginBottom: 8,
                  }}
                >
                  <Text style={{ color: theme.secondaryColor }}>
                    Weekly Savings Needed
                  </Text>
                  <Text style={{ color: theme.textColor, fontWeight: "600" }}>
                    {formatCurrency(weeklySavingsNeeded)}
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
                    Monthly Savings Needed
                  </Text>
                  <Text style={{ color: theme.textColor, fontWeight: "600" }}>
                    {formatCurrency(monthlySavingsNeeded)}
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
                    Time Remaining
                  </Text>
                  <Text style={{ color: theme.textColor, fontWeight: "600" }}>
                    {monthsLeft} months
                  </Text>
                </View>

                <Text
                  style={{
                    fontSize: 16,
                    fontWeight: "600",
                    color: theme.textColor,
                    marginTop: 16,
                    marginBottom: 12,
                  }}
                >
                  Savings Trend
                </Text>
                {data.length > 0 ? (
                  <LineChart
                    data={{
                      labels: labels.map((l) => l.split("-")[1]),
                      datasets: [{ data }],
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
                    style={{ color: theme.secondaryColor, textAlign: "center" }}
                  >
                    No savings data available
                  </Text>
                )}
              </Animated.View>
            );
          })
        )}
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
              borderTopLeftRadius: 20,
              borderTopRightRadius: 20,
              padding: 20,
              shadowColor: "#000",
              shadowOffset: { width: 0, height: -4 },
              shadowOpacity: 0.1,
              shadowRadius: 8,
              elevation: 8,
            }}
          >
            <Text
              style={{
                fontSize: 20,
                fontWeight: "bold",
                marginBottom: 20,
                color: theme.textColor,
              }}
            >
              Add Savings Goal
            </Text>

            <Text
              style={{
                fontSize: 14,
                marginBottom: 8,
                color: theme.secondaryColor,
              }}
            >
              Goal Name
            </Text>
            <TextInput
              style={{
                borderWidth: 1,
                borderColor: theme.secondaryColor,
                borderRadius: 8,
                padding: 12,
                marginBottom: 16,
                color: theme.textColor,
                backgroundColor: theme.cardColor,
              }}
              placeholder="e.g., Marriage Fund"
              placeholderTextColor={theme.secondaryColor}
              value={goalName}
              onChangeText={setGoalName}
            />

            <Text
              style={{
                fontSize: 14,
                marginBottom: 8,
                color: theme.secondaryColor,
              }}
            >
              Target Amount (PKR)
            </Text>
            <TextInput
              style={{
                borderWidth: 1,
                borderColor: theme.secondaryColor,
                borderRadius: 8,
                padding: 12,
                marginBottom: 16,
                color: theme.textColor,
                backgroundColor: theme.cardColor,
              }}
              placeholder="Enter target amount"
              placeholderTextColor={theme.secondaryColor}
              keyboardType="numeric"
              value={targetAmount}
              onChangeText={setTargetAmount}
            />

            <Text
              style={{
                fontSize: 14,
                marginBottom: 8,
                color: theme.secondaryColor,
              }}
            >
              Target Date (YYYY-MM-DD)
            </Text>
            <TextInput
              style={{
                borderWidth: 1,
                borderColor: theme.secondaryColor,
                borderRadius: 8,
                padding: 12,
                marginBottom: 16,
                color: theme.textColor,
                backgroundColor: theme.cardColor,
              }}
              placeholder="e.g., 2025-12-31"
              placeholderTextColor={theme.secondaryColor}
              value={targetDate}
              onChangeText={setTargetDate}
            />

            <Text
              style={{
                fontSize: 14,
                marginBottom: 8,
                color: theme.secondaryColor,
              }}
            >
              Monthly Income (PKR)
            </Text>
            <TextInput
              style={{
                borderWidth: 1,
                borderColor: theme.secondaryColor,
                borderRadius: 8,
                padding: 12,
                marginBottom: 16,
                color: theme.textColor,
                backgroundColor: theme.cardColor,
              }}
              placeholder="Enter monthly income"
              placeholderTextColor={theme.secondaryColor}
              keyboardType="numeric"
              value={monthlyIncome}
              onChangeText={setMonthlyIncome}
            />

            <Text
              style={{
                fontSize: 14,
                marginBottom: 8,
                color: theme.secondaryColor,
              }}
            >
              Weekly Income (PKR)
            </Text>
            <TextInput
              style={{
                borderWidth: 1,
                borderColor: theme.secondaryColor,
                borderRadius: 8,
                padding: 12,
                marginBottom: 24,
                color: theme.textColor,
                backgroundColor: theme.cardColor,
              }}
              placeholder="Enter weekly income"
              placeholderTextColor={theme.secondaryColor}
              keyboardType="numeric"
              value={weeklyIncome}
              onChangeText={setWeeklyIncome}
            />

            <View
              style={{ flexDirection: "row", justifyContent: "space-between" }}
            >
              <TouchableOpacity
                style={{
                  padding: 16,
                  borderRadius: 8,
                  backgroundColor: "transparent",
                  alignItems: "center",
                  width: "48%",
                }}
                onPress={() => setModalVisible(false)}
              >
                <Text
                  style={{
                    color: theme.secondaryColor,
                    fontWeight: "600",
                  }}
                >
                  Cancel
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={{
                  padding: 16,
                  borderRadius: 8,
                  backgroundColor: theme.accentColor,
                  alignItems: "center",
                  width: "48%",
                }}
                onPress={addGoal}
              >
                <Text
                  style={{
                    color: "#FFFFFF",
                    fontWeight: "600",
                  }}
                >
                  Add
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal
        animationType="slide"
        transparent={true}
        visible={expenseModalVisible}
        onRequestClose={() => setExpenseModalVisible(false)}
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
              borderTopLeftRadius: 20,
              borderTopRightRadius: 20,
              padding: 20,
              shadowColor: "#000",
              shadowOffset: { width: 0, height: -4 },
              shadowOpacity: 0.1,
              shadowRadius: 8,
              elevation: 8,
            }}
          >
            <Text
              style={{
                fontSize: 20,
                fontWeight: "bold",
                marginBottom: 20,
                color: theme.textColor,
              }}
            >
              Add Expense
            </Text>

            <Text
              style={{
                fontSize: 14,
                marginBottom: 8,
                color: theme.secondaryColor,
              }}
            >
              Expense Name
            </Text>
            <TextInput
              style={{
                borderWidth: 1,
                borderColor: theme.secondaryColor,
                borderRadius: 8,
                padding: 12,
                marginBottom: 16,
                color: theme.textColor,
                backgroundColor: theme.cardColor,
              }}
              placeholder="e.g., Venue Deposit"
              placeholderTextColor={theme.secondaryColor}
              value={expenseName}
              onChangeText={setExpenseName}
            />

            <Text
              style={{
                fontSize: 14,
                marginBottom: 8,
                color: theme.secondaryColor,
              }}
            >
              Amount (PKR)
            </Text>
            <TextInput
              style={{
                borderWidth: 1,
                borderColor: theme.secondaryColor,
                borderRadius: 8,
                padding: 12,
                marginBottom: 16,
                color: theme.textColor,
                backgroundColor: theme.cardColor,
              }}
              placeholder="Enter amount"
              placeholderTextColor={theme.secondaryColor}
              keyboardType="numeric"
              value={expenseAmount}
              onChangeText={setExpenseAmount}
            />

            <Text
              style={{
                fontSize: 14,
                marginBottom: 8,
                color: theme.secondaryColor,
              }}
            >
              Frequency
            </Text>
            <View
              style={{
                flexDirection: "row",
                marginBottom: 24,
                justifyContent: "space-between",
              }}
            >
              <TouchableOpacity
                style={{
                  flex: 1,
                  padding: 12,
                  borderRadius: 8,
                  backgroundColor:
                    expenseFrequency === "daily"
                      ? theme.accentColor
                      : theme.cardColor,
                  alignItems: "center",
                  marginRight: 8,
                }}
                onPress={() => setExpenseFrequency("daily")}
              >
                <Text
                  style={{
                    color:
                      expenseFrequency === "daily"
                        ? "#FFFFFF"
                        : theme.textColor,
                    fontWeight: "600",
                  }}
                >
                  Daily
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={{
                  flex: 1,
                  padding: 12,
                  borderRadius: 8,
                  backgroundColor:
                    expenseFrequency === "weekly"
                      ? theme.accentColor
                      : theme.cardColor,
                  alignItems: "center",
                }}
                onPress={() => setExpenseFrequency("weekly")}
              >
                <Text
                  style={{
                    color:
                      expenseFrequency === "weekly"
                        ? "#FFFFFF"
                        : theme.textColor,
                    fontWeight: "600",
                  }}
                >
                  Weekly
                </Text>
              </TouchableOpacity>
            </View>

            <View
              style={{ flexDirection: "row", justifyContent: "space-between" }}
            >
              <TouchableOpacity
                style={{
                  padding: 16,
                  borderRadius: 8,
                  backgroundColor: "transparent",
                  alignItems: "center",
                  width: "48%",
                }}
                onPress={() => setExpenseModalVisible(false)}
              >
                <Text
                  style={{
                    color: theme.secondaryColor,
                    fontWeight: "600",
                  }}
                >
                  Cancel
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={{
                  padding: 16,
                  borderRadius: 8,
                  backgroundColor: theme.accentColor,
                  alignItems: "center",
                  width: "48%",
                }}
                onPress={addExpense}
              >
                <Text
                  style={{
                    color: "#FFFFFF",
                    fontWeight: "600",
                  }}
                >
                  Add
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

export default Saving;
