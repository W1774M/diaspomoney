"use client";

import { Appointment, AppointmentStats } from "@/types/appointments";
import { useMemo } from "react";

export function useAppointmentStats(
  appointments: Appointment[]
): AppointmentStats {
  return useMemo(() => {
    const totalAppointments = appointments.length;
    const confirmedAppointments = appointments.filter(
      a => a.status === "confirmed"
    ).length;
    const pendingAppointments = appointments.filter(
      a => a.status === "pending"
    ).length;
    const cancelledAppointments = appointments.filter(
      a => a.status === "cancelled"
    ).length;
    const completedAppointments = appointments.filter(
      a => a.status === "completed"
    ).length;

    const totalRevenue = appointments
      .filter(a => a.paymentStatus === "paid")
      .reduce((sum, a) => sum + a.totalAmount, 0);

    const averageAmount =
      totalAppointments > 0
        ? appointments.reduce((sum, a) => sum + a.totalAmount, 0) /
          totalAppointments
        : 0;

    return {
      totalAppointments,
      confirmedAppointments,
      pendingAppointments,
      cancelledAppointments,
      completedAppointments,
      totalRevenue,
      averageAmount,
    };
  }, [appointments]);
}
