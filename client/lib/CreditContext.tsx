import React, { createContext, useContext, useState, ReactNode } from "react";
import { View, StyleSheet, Pressable, Modal, Platform } from "react-native";
import { useNavigation, CommonActions } from "@react-navigation/native";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";

import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius, Colors } from "@/constants/theme";
import { useAuth } from "./AuthContext";

interface CreditContextType {
  showUpgradeModal: () => void;
  hideUpgradeModal: () => void;
  checkCreditError: (response: Response) => Promise<boolean>;
}

const CreditContext = createContext<CreditContextType | undefined>(undefined);

export function CreditProvider({ children }: { children: ReactNode }) {
  const [modalVisible, setModalVisible] = useState(false);
  const [errorMessage, setErrorMessage] = useState("You've run out of credits.");
  const { theme, isDark } = useTheme();
  const { user } = useAuth();
  const navigation = useNavigation();

  const showUpgradeModal = () => {
    if (Platform.OS !== "web") {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    }
    setModalVisible(true);
  };

  const hideUpgradeModal = () => {
    setModalVisible(false);
  };

  const checkCreditError = async (response: Response): Promise<boolean> => {
    if (response.status === 402) {
      try {
        const data = await response.clone().json();
        setErrorMessage(data.error || "You've run out of credits.");
      } catch {
        setErrorMessage("You've run out of credits.");
      }
      showUpgradeModal();
      return true;
    }
    return false;
  };

  const handleUpgrade = () => {
    hideUpgradeModal();
    navigation.dispatch(
      CommonActions.navigate({
        name: "Profile",
        params: {
          screen: "Subscription",
        },
      })
    );
  };

  return (
    <CreditContext.Provider value={{ showUpgradeModal, hideUpgradeModal, checkCreditError }}>
      {children}
      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
        onRequestClose={hideUpgradeModal}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.surface }]}>
            <View style={[styles.iconCircle, { backgroundColor: Colors.light.primary + "20" }]}>
              <Feather name="zap-off" size={32} color={Colors.light.primary} />
            </View>
            <ThemedText style={styles.modalTitle}>Out of Credits</ThemedText>
            <ThemedText style={[styles.modalMessage, { color: theme.textSecondary }]}>
              {errorMessage}
            </ThemedText>
            <ThemedText style={[styles.currentCredits, { color: theme.textSecondary }]}>
              Current credits: {user?.credits ?? 0}
            </ThemedText>
            <View style={styles.modalButtons}>
              <Pressable
                style={[styles.modalButton, { backgroundColor: theme.backgroundSecondary }]}
                onPress={hideUpgradeModal}
              >
                <ThemedText style={styles.modalButtonText}>Maybe Later</ThemedText>
              </Pressable>
              <Pressable
                style={[styles.modalButton, styles.upgradeButton, { backgroundColor: Colors.light.primary }]}
                onPress={handleUpgrade}
              >
                <Feather name="zap" size={16} color="#fff" />
                <ThemedText style={[styles.modalButtonText, { color: "#fff" }]}>Upgrade</ThemedText>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </CreditContext.Provider>
  );
}

export function useCredits() {
  const context = useContext(CreditContext);
  if (context === undefined) {
    throw new Error("useCredits must be used within a CreditProvider");
  }
  return context;
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: Spacing.xl,
  },
  modalContent: {
    width: "100%",
    maxWidth: 340,
    borderRadius: BorderRadius.lg,
    padding: Spacing.xl,
    alignItems: "center",
  },
  iconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.lg,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: "700",
    marginBottom: Spacing.sm,
  },
  modalMessage: {
    fontSize: 15,
    textAlign: "center",
    marginBottom: Spacing.sm,
  },
  currentCredits: {
    fontSize: 13,
    marginBottom: Spacing.xl,
  },
  modalButtons: {
    flexDirection: "row",
    gap: Spacing.md,
    width: "100%",
  },
  modalButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    gap: Spacing.xs,
  },
  upgradeButton: {
    flex: 1.5,
  },
  modalButtonText: {
    fontSize: 15,
    fontWeight: "600",
  },
});
