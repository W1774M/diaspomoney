"use client";
import { AppointmentData } from "@/types";
import { createContext, useContext, useState } from "react";

interface AppointmentContextType {
  data: AppointmentData | null;
  setData: (data: AppointmentData | null) => void;
}

const AppointmentContext = createContext<AppointmentContextType | undefined>(
  undefined,
);

export function useAppointment() {
  const context = useContext(AppointmentContext);
  if (context === undefined) {
    throw new Error(
      "useAppointment must be used within an AppointmentProvider",
    );
  }
  return context;
}

interface AppointmentProviderProps {
  children: React.ReactNode;
  data?: AppointmentData;
}

export function AppointmentProvider({
  children,
  data: _data,
}: AppointmentProviderProps) {
  const [data, setData] = useState<AppointmentData | null>(null);

  return (
    <AppointmentContext.Provider value={{ data, setData }}>
      {children}
    </AppointmentContext.Provider>
  );
}
