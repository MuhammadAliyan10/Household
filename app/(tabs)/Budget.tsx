import { Feather, MaterialIcons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { StatusBar } from "expo-status-bar";
import React, { useContext, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Animated,
  Modal,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import DateTimePickerModal from "react-native-modal-datetime-picker";
import { SafeAreaView } from "react-native-safe-area-context";
import { ThemeContext } from "../../context/ThemeContext";

interface Transaction {
  id: string;
  name: string;
  price: number;
  date: string;
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

const BudgetScreen: React.FC = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [modalVisible, setModalVisible] = useState(false);
  const [loading, setLoading] = useState(true);
  const [selectedTransaction, setSelectedTransaction] =
    useState<Transaction | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [spendingLimits, setSpendingLimits] = useState<SpendingLimit>({
    weekly: 0,
    monthly: 0,
    yearly: 0,
  });
  const [limitModalVisible, setLimitModalVisible] = useState(false);
  const [weeklyLimit, setWeeklyLimit] = useState("");
  const [monthlyLimit, setMonthlyLimit] = useState("");
  const [yearlyLimit, setYearlyLimit] = useState("");
  const [selectedDate, setSelectedDate] = useState<number | null>(null);
  const [isDatePickerVisible, setDatePickerVisibility] = useState(false);

  const scaleAnim = useState(new Animated.Value(0.9))[0];
  const { isDark } = useContext(ThemeContext);

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
    loadTransactions();
    loadSpendingLimits();
    Animated.spring(scaleAnim, {
      toValue: 1,
      friction: 6,
      tension: 40,
      useNativeDriver: true,
    }).start();
  }, []);

  const loadTransactions = async () => {
    try {
      setLoading(true);
      const storedTransactions = await AsyncStorage.getItem("transactions");
      if (storedTransactions) {
        setTransactions(JSON.parse(storedTransactions));
      }
    } catch (error) {
      Alert.alert("Error", "Failed to load transactions");
    } finally {
      setLoading(false);
    }
  };

  const loadSpendingLimits = async () => {
    try {
      const storedLimits = await AsyncStorage.getItem("spendingLimits");
      if (storedLimits) {
        const limits = JSON.parse(storedLimits);
        setSpendingLimits(limits);
        setWeeklyLimit(limits.weekly.toString());
        setMonthlyLimit(limits.monthly.toString());
        setYearlyLimit(limits.yearly?.toString() || "0");
      }
    } catch (error) {
      Alert.alert("Error", "Failed to load spending limits");
    }
  };

  const saveTransactions = async (newTransactions: Transaction[]) => {
    try {
      await AsyncStorage.setItem(
        "transactions",
        JSON.stringify(newTransactions)
      );
    } catch (error) {
      Alert.alert("Error", "Failed to save transactions");
    }
  };

  const saveSpendingLimits = async (limits: SpendingLimit) => {
    try {
      await AsyncStorage.setItem("spendingLimits", JSON.stringify(limits));
    } catch (error) {
      Alert.alert("Error", "Failed to save spending limits");
    }
  };

  const addTransaction = () => {
    if (!name.trim() || !price.trim() || isNaN(parseFloat(price))) {
      Alert.alert("Error", "Please enter a valid name and price");
      return;
    }

    const now = new Date();
    const newTransaction: Transaction = {
      id: Date.now().toString(),
      name: name.trim(),
      price: parseFloat(price),
      date: now.toLocaleString(),
      timestamp: now.getTime(),
    };

    const updatedTransactions = [...transactions, newTransaction];
    setTransactions(updatedTransactions);
    saveTransactions(updatedTransactions);

    setName("");
    setPrice("");
    setModalVisible(false);

    const addAnimation = new Animated.Value(0);
    Animated.timing(addAnimation, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();
  };

  const updateTransaction = () => {
    if (
      !selectedTransaction ||
      !name.trim() ||
      !price.trim() ||
      isNaN(parseFloat(price))
    ) {
      Alert.alert("Error", "Please enter valid details");
      return;
    }

    const updatedTransactions = transactions.map((t) =>
      t.id === selectedTransaction.id
        ? { ...t, name: name.trim(), price: parseFloat(price) }
        : t
    );

    setTransactions(updatedTransactions);
    saveTransactions(updatedTransactions);

    setName("");
    setPrice("");
    setSelectedTransaction(null);
    setIsEditing(false);
    setModalVisible(false);
  };

  const deleteTransaction = (id: string) => {
    Alert.alert(
      "Confirm Delete",
      "Are you sure you want to delete this transaction?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => {
            const updatedTransactions = transactions.filter((t) => t.id !== id);
            setTransactions(updatedTransactions);
            saveTransactions(updatedTransactions);
          },
        },
      ]
    );
  };

  const updateSpendingLimits = () => {
    const weekly = parseFloat(weeklyLimit) || 0;
    const monthly = parseFloat(monthlyLimit) || 0;
    const yearly = parseFloat(yearlyLimit) || 0;

    const newLimits = { weekly, monthly, yearly };
    setSpendingLimits(newLimits);
    saveSpendingLimits(newLimits);
    setLimitModalVisible(false);
  };

  const editTransaction = (transaction: Transaction) => {
    setSelectedTransaction(transaction);
    setName(transaction.name);
    setPrice(transaction.price.toString());
    setIsEditing(true);
    setModalVisible(true);
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
      .filter((t) => t.timestamp >= today && t.timestamp < today + oneDay)
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

  const generateDateTabs = () => {
    const today = new Date();
    const currentDay = today.getDate();
    const tabs = [];
    for (let i = 4; i >= 0; i--) {
      const date = new Date(
        today.getFullYear(),
        today.getMonth(),
        currentDay - i
      );
      tabs.push({
        day: date.getDate(),
        timestamp: new Date(
          today.getFullYear(),
          today.getMonth(),
          date.getDate()
        ).getTime(),
        disabled: false,
      });
    }
    tabs.push({
      day: currentDay + 1,
      timestamp: new Date(
        today.getFullYear(),
        today.getMonth(),
        currentDay + 1
      ).getTime(),
      disabled: true,
    });
    return tabs;
  };

  const filterTransactionsByDate = () => {
    if (selectedDate === null) return transactions;
    const oneDay = 24 * 60 * 60 * 1000;
    return transactions.filter(
      (t) => t.timestamp >= selectedDate && t.timestamp < selectedDate + oneDay
    );
  };

  const handleDateSelect = (timestamp: number) => {
    setSelectedDate(timestamp);
  };

  const handleCalendarSelect = (date: Date) => {
    setDatePickerVisibility(false);
    setSelectedDate(
      new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime()
    );
  };

  const formatCurrency = (amount: number) => {
    return `PKR ${amount.toFixed(2)}`;
  };

  const totals = calculateTotals();
  const dateTabs = generateDateTabs();
  const filteredTransactions = filterTransactionsByDate();

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
            Home Budget
          </Text>
          <TouchableOpacity
            onPress={() => setLimitModalVisible(true)}
            style={{
              padding: 8,
              backgroundColor: theme.cardColor,
              borderRadius: 8,
            }}
          >
            <MaterialIcons
              name="settings"
              size={24}
              color={theme.accentColor}
            />
          </TouchableOpacity>
        </View>

        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            marginBottom: 20,
            backgroundColor: theme.cardColor,
            borderRadius: 12,
            padding: 8,
          }}
        >
          {dateTabs.map((tab, index) => (
            <TouchableOpacity
              key={index}
              style={{
                padding: 10,
                borderRadius: 8,
                backgroundColor:
                  selectedDate === tab.timestamp
                    ? theme.accentColor
                    : tab.disabled
                    ? theme.secondaryColor + "33"
                    : theme.cardColor,
                opacity: tab.disabled ? 0.5 : 1,
                flex: 1,
                alignItems: "center",
                marginHorizontal: 2,
              }}
              onPress={() => !tab.disabled && handleDateSelect(tab.timestamp)}
              disabled={tab.disabled}
            >
              <Text
                style={{
                  color:
                    selectedDate === tab.timestamp
                      ? "#FFFFFF"
                      : tab.disabled
                      ? theme.secondaryColor
                      : theme.textColor,
                  fontWeight: "600",
                }}
              >
                {tab.day}
              </Text>
            </TouchableOpacity>
          ))}
          <TouchableOpacity
            style={{
              padding: 10,
              borderRadius: 8,
              backgroundColor: theme.cardColor,
              alignItems: "center",
              marginHorizontal: 2,
            }}
            onPress={() => setDatePickerVisibility(true)}
          >
            <Feather name="calendar" size={20} color={theme.accentColor} />
          </TouchableOpacity>
        </View>

        <Animated.View
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
          <Text
            style={{
              fontSize: 18,
              fontWeight: "600",
              color: theme.textColor,
              marginBottom: 12,
            }}
          >
            Spending Overview
          </Text>

          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              marginBottom: 8,
            }}
          >
            <Text style={{ color: theme.secondaryColor }}>Today</Text>
            <Text style={{ color: theme.textColor, fontWeight: "600" }}>
              {formatCurrency(totals.daily)}
            </Text>
          </View>

          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              marginBottom: 8,
            }}
          >
            <Text style={{ color: theme.secondaryColor }}>This Week</Text>
            <View style={{ alignItems: "flex-end" }}>
              <Text style={{ color: theme.textColor, fontWeight: "600" }}>
                {formatCurrency(totals.weekly)}
              </Text>
              {spendingLimits.weekly > 0 && (
                <Text
                  style={{
                    color:
                      totals.weekly > spendingLimits.weekly
                        ? "#EF4444"
                        : "#10B981",
                    fontSize: 12,
                  }}
                >
                  {totals.weekly > spendingLimits.weekly
                    ? "Over limit"
                    : `Limit: ${formatCurrency(spendingLimits.weekly)}`}
                </Text>
              )}
            </View>
          </View>

          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              marginBottom: 8,
            }}
          >
            <Text style={{ color: theme.secondaryColor }}>This Month</Text>
            <View style={{ alignItems: "flex-end" }}>
              <Text style={{ color: theme.textColor, fontWeight: "600" }}>
                {formatCurrency(totals.monthly)}
              </Text>
              {spendingLimits.monthly > 0 && (
                <Text
                  style={{
                    color:
                      totals.monthly > spendingLimits.monthly
                        ? "#EF4444"
                        : "#10B981",
                    fontSize: 12,
                  }}
                >
                  {totals.monthly > spendingLimits.monthly
                    ? "Over limit"
                    : `Limit: ${formatCurrency(spendingLimits.monthly)}`}
                </Text>
              )}
            </View>
          </View>

          <View
            style={{ flexDirection: "row", justifyContent: "space-between" }}
          >
            <Text style={{ color: theme.secondaryColor }}>This Year</Text>
            <View style={{ alignItems: "flex-end" }}>
              <Text style={{ color: theme.textColor, fontWeight: "600" }}>
                {formatCurrency(totals.yearly)}
              </Text>
              {spendingLimits.yearly > 0 && (
                <Text
                  style={{
                    color:
                      totals.yearly > spendingLimits.yearly
                        ? "#EF4444"
                        : "#10B981",
                    fontSize: 12,
                  }}
                >
                  {totals.yearly > spendingLimits.yearly
                    ? "Over limit"
                    : `Limit: ${formatCurrency(spendingLimits.yearly)}`}
                </Text>
              )}
            </View>
          </View>

          {spendingLimits.weekly > 0 && (
            <View style={{ marginTop: 12 }}>
              <Text
                style={{
                  color: theme.secondaryColor,
                  fontSize: 12,
                  marginBottom: 4,
                }}
              >
                Weekly Budget
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

          {spendingLimits.monthly > 0 && (
            <View style={{ marginTop: 8 }}>
              <Text
                style={{
                  color: theme.secondaryColor,
                  fontSize: 12,
                  marginBottom: 4,
                }}
              >
                Monthly Budget
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
            </View>
          )}

          {spendingLimits.yearly > 0 && (
            <View style={{ marginTop: 8 }}>
              <Text
                style={{
                  color: theme.secondaryColor,
                  fontSize: 12,
                  marginBottom: 4,
                }}
              >
                Yearly Budget
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
            </View>
          )}
        </Animated.View>

        <View style={{ marginBottom: 80 }}>
          <Text
            style={{
              fontSize: 18,
              fontWeight: "600",
              color: theme.textColor,
              marginBottom: 12,
            }}
          >
            Recent Transactions
          </Text>

          {filteredTransactions.length === 0 ? (
            <View
              style={{
                padding: 24,
                backgroundColor: theme.cardColor,
                borderRadius: 12,
                alignItems: "center",
                opacity: 0.8,
              }}
            >
              <Text
                style={{ color: theme.secondaryColor, textAlign: "center" }}
              >
                No transactions yet. Tap the + button to add one.
              </Text>
            </View>
          ) : (
            filteredTransactions
              .sort((a, b) => b.timestamp - a.timestamp)
              .map((transaction, index) => (
                <Animated.View
                  key={transaction.id}
                  style={{
                    backgroundColor: theme.cardColor,
                    borderRadius: 12,
                    padding: 16,
                    marginBottom: 12,
                    shadowColor: "#000",
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.05,
                    shadowRadius: 4,
                    elevation: 2,
                    opacity: 1,
                    transform: [{ translateY: new Animated.Value(0) }],
                  }}
                >
                  <View
                    style={{
                      flexDirection: "row",
                      justifyContent: "space-between",
                    }}
                  >
                    <View style={{ flex: 1 }}>
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
                          color: theme.secondaryColor,
                          fontSize: 12,
                          marginTop: 4,
                        }}
                      >
                        {transaction.date}
                      </Text>
                    </View>
                    <View
                      style={{ flexDirection: "row", alignItems: "center" }}
                    >
                      <Text
                        style={{
                          fontSize: 16,
                          fontWeight: "600",
                          color: theme.textColor,
                          marginRight: 16,
                        }}
                      >
                        {formatCurrency(transaction.price)}
                      </Text>
                      <TouchableOpacity
                        onPress={() => editTransaction(transaction)}
                        style={{ marginRight: 12 }}
                      >
                        <Feather
                          name="edit-2"
                          size={18}
                          color={theme.secondaryColor}
                        />
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={() => deleteTransaction(transaction.id)}
                      >
                        <Feather name="trash-2" size={18} color="#EF4444" />
                      </TouchableOpacity>
                    </View>
                  </View>
                </Animated.View>
              ))
          )}
        </View>
      </ScrollView>

      <TouchableOpacity
        style={{
          position: "absolute",
          bottom: 24,
          right: 24,
          width: 60,
          height: 60,
          borderRadius: 30,
          backgroundColor: theme.accentColor,
          justifyContent: "center",
          alignItems: "center",
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.2,
          shadowRadius: 8,
          elevation: 5,
        }}
        onPress={() => {
          setName("");
          setPrice("");
          setIsEditing(false);
          setSelectedTransaction(null);
          setModalVisible(true);
        }}
      >
        <Feather name="plus" size={24} color="#FFFFFF" />
      </TouchableOpacity>

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
              {isEditing ? "Edit Transaction" : "Add Transaction"}
            </Text>

            <Text
              style={{
                fontSize: 14,
                marginBottom: 8,
                color: theme.secondaryColor,
              }}
            >
              Name
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
              placeholder="Enter expense name"
              placeholderTextColor={theme.secondaryColor}
              value={name}
              onChangeText={setName}
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
                marginBottom: 24,
                color: theme.textColor,
                backgroundColor: theme.cardColor,
              }}
              placeholder="Enter amount"
              placeholderTextColor={theme.secondaryColor}
              keyboardType="numeric"
              value={price}
              onChangeText={setPrice}
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
                onPress={isEditing ? updateTransaction : addTransaction}
              >
                <Text
                  style={{
                    color: "#FFFFFF",
                    fontWeight: "600",
                  }}
                >
                  {isEditing ? "Update" : "Add"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal
        animationType="slide"
        transparent={true}
        visible={limitModalVisible}
        onRequestClose={() => setLimitModalVisible(false)}
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
              Spending Limits
            </Text>

            <Text
              style={{
                fontSize: 14,
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
                borderRadius: 8,
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
                fontSize: 14,
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
                borderRadius: 8,
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
                fontSize: 14,
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
                borderRadius: 8,
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
                  borderRadius: 8,
                  backgroundColor: "transparent",
                  alignItems: "center",
                  width: "48%",
                }}
                onPress={() => setLimitModalVisible(false)}
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
                onPress={updateSpendingLimits}
              >
                <Text
                  style={{
                    color: "#FFFFFF",
                    fontWeight: "600",
                  }}
                >
                  Save
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <DateTimePickerModal
        isVisible={isDatePickerVisible}
        mode="date"
        onConfirm={handleCalendarSelect}
        onCancel={() => setDatePickerVisibility(false)}
        maximumDate={new Date()}
      />

      <StatusBar style={isDark ? "light" : "dark"} />
    </SafeAreaView>
  );
};

export default BudgetScreen;
