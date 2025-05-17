import { router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useEffect } from "react";
import { Image, ScrollView, Text, View } from "react-native";
import * as Animatable from "react-native-animatable";
import { SafeAreaView } from "react-native-safe-area-context";
import { images } from "../constants";

const index = () => {
  useEffect(() => {
    const timer = setTimeout(() => {
      router.replace("/(tabs)/home");
    }, 2000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <SafeAreaView className="bg-primary h-full">
      <ScrollView contentContainerStyle={{ height: "100%" }}>
        <View className="w-full justify-center items-center min-h-[85vh] px-4">
          <Animatable.View
            animation="fadeInDown"
            duration={1000}
            className="relative mt-5"
          >
            <Text className="text-4xl font-bold text-white text-center">
              Streamline Your Household Expenses with{" "}
              <Text className="text-secondary-200">HouseHold</Text>
            </Text>
            <Image
              source={images.path}
              className="w-[130px] h-[15px] absolute -bottom-2 -right-7"
              resizeMode="contain"
            />
          </Animatable.View>
          <Animatable.Text
            animation="fadeInUp"
            duration={1000}
            className="text-sm font-pregular text-gray-100 mt-7 text-center"
          >
            Efficiently manage your finances with HouseHold's intuitive tools,
            designed for seamless expense tracking and organization.
          </Animatable.Text>
        </View>
      </ScrollView>
      <StatusBar backgroundColor={"#161122"} style={"light"} />
    </SafeAreaView>
  );
};

export default index;
