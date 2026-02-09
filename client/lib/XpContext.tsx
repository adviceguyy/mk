import React, { createContext, useContext, useState, useCallback, ReactNode } from "react";
import { XpToast } from "@/components/XpToast";

interface XpContextType {
  notifyXpGain: (xpAmount: number, leveledUp: boolean, newLevel?: number) => void;
}

const XpContext = createContext<XpContextType | undefined>(undefined);

export function XpProvider({ children }: { children: ReactNode }) {
  const [toastState, setToastState] = useState({
    visible: false,
    xpAmount: 0,
    leveledUp: false,
    newLevel: undefined as number | undefined,
  });

  const notifyXpGain = useCallback(
    (xpAmount: number, leveledUp: boolean, newLevel?: number) => {
      setToastState({ visible: true, xpAmount, leveledUp, newLevel });
    },
    []
  );

  const hideToast = useCallback(() => {
    setToastState((prev) => ({ ...prev, visible: false }));
  }, []);

  return (
    <XpContext.Provider value={{ notifyXpGain }}>
      {children}
      <XpToast
        visible={toastState.visible}
        xpAmount={toastState.xpAmount}
        leveledUp={toastState.leveledUp}
        newLevel={toastState.newLevel}
        onHide={hideToast}
      />
    </XpContext.Provider>
  );
}

export function useXp() {
  const context = useContext(XpContext);
  if (context === undefined) {
    throw new Error("useXp must be used within an XpProvider");
  }
  return context;
}
