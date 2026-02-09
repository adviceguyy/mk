import React from "react";
import { View, StyleSheet } from "react-native";

export function GlobalHeaderLeft() {
  return <View style={styles.container} />;
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
  },
});
