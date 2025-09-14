import { describe, expect, it } from "vitest";
import {
  MOCK_USERS,
  MOCK_APPOINTMENTS,
  MOCK_INVOICES,
  MOCK_SPECIALITIES,
  findUserByEmail,
  findUserById,
  findAppointmentById,
  findProviderById,
  findInvoiceById,
  getAppointmentsByUserId,
  getProvidersBySpecialty,
  getUsersByRole,
} from "@/mocks";
import { IUser, IAppointment, IInvoice, ISpeciality } from "@/types";

describe("Mocks", () => {
  describe("MOCK_USERS", () => {
    it("should have correct structure for all users", () => {
      expect(Array.isArray(MOCK_USERS)).toBe(true);
      expect(MOCK_USERS.length).toBeGreaterThan(0);

      MOCK_USERS.forEach((user, index) => {
        expect(user).toHaveProperty("_id");
        expect(user).toHaveProperty("email");
        expect(user).toHaveProperty("password");
        expect(user).toHaveProperty("name");
        expect(user).toHaveProperty("roles");
        expect(user).toHaveProperty("status");
        expect(user).toHaveProperty("createdAt");
        expect(user).toHaveProperty("updatedAt");

        expect(typeof user._id).toBe("string");
        expect(typeof user.email).toBe("string");
        expect(typeof user.password).toBe("string");
        expect(typeof user.name).toBe("string");
        expect(Array.isArray(user.roles)).toBe(true);
        expect(typeof user.status).toBe("string");
        expect(user.createdAt).toBeInstanceOf(Date);
        expect(user.updatedAt).toBeInstanceOf(Date);
      });
    });

    it("should have unique IDs for all users", () => {
      const ids = MOCK_USERS.map(user => user._id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(ids.length);
    });

    it("should have unique emails for all users", () => {
      const emails = MOCK_USERS.map(user => user.email);
      const uniqueEmails = new Set(emails);
      expect(uniqueEmails.size).toBe(emails.length);
    });

    it("should have valid user roles", () => {
      const validRoles = ["ADMIN", "PROVIDER", "CUSTOMER", "CSM"];
      MOCK_USERS.forEach(user => {
        user.roles.forEach(role => {
          expect(validRoles).toContain(role);
        });
      });
    });

    it("should have valid user statuses", () => {
      const validStatuses = ["ACTIVE", "INACTIVE", "PENDING", "SUSPENDED"];
      MOCK_USERS.forEach(user => {
        expect(validStatuses).toContain(user.status);
      });
    });

    it("should have admin users", () => {
      const adminUsers = MOCK_USERS.filter(user => user.roles.includes("ADMIN"));
      expect(adminUsers.length).toBeGreaterThan(0);
      
      adminUsers.forEach(user => {
        expect(user.roles).toContain("ADMIN");
      });
    });

    it("should have provider users", () => {
      const providerUsers = MOCK_USERS.filter(user => user.roles.includes("PROVIDER"));
      expect(providerUsers.length).toBeGreaterThan(0);
      
      providerUsers.forEach(user => {
        expect(user.roles).toContain("PROVIDER");
        expect(user).toHaveProperty("specialty");
        expect(typeof user.specialty).toBe("string");
      });
    });

    it("should have customer users", () => {
      const customerUsers = MOCK_USERS.filter(user => user.roles.includes("CUSTOMER"));
      expect(customerUsers.length).toBeGreaterThan(0);
      
      customerUsers.forEach(user => {
        expect(user.roles).toContain("CUSTOMER");
      });
    });

    it("should have CSM users", () => {
      const csmUsers = MOCK_USERS.filter(user => user.roles.includes("CSM"));
      expect(csmUsers.length).toBeGreaterThan(0);
      
      csmUsers.forEach(user => {
        expect(user.roles).toContain("CSM");
      });
    });

    it("should have users with multiple roles", () => {
      const multiRoleUsers = MOCK_USERS.filter(user => user.roles.length > 1);
      expect(multiRoleUsers.length).toBeGreaterThan(0);
      
      multiRoleUsers.forEach(user => {
        expect(user.roles.length).toBeGreaterThan(1);
      });
    });

    it("should have users with different statuses", () => {
      const statuses = MOCK_USERS.map(user => user.status);
      const uniqueStatuses = new Set(statuses);
      expect(uniqueStatuses.size).toBeGreaterThan(1);
    });

    it("should have users with specialties when they are providers", () => {
      const providerUsers = MOCK_USERS.filter(user => user.roles.includes("PROVIDER"));
      
      providerUsers.forEach(user => {
        expect(user.specialty).toBeDefined();
        expect(typeof user.specialty).toBe("string");
        expect(user.specialty!.length).toBeGreaterThan(0);
      });
    });

    it("should have consistent date ranges", () => {
      const now = new Date();
      const oneYearAgo = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
      
      MOCK_USERS.forEach(user => {
        expect(user.createdAt.getTime()).toBeLessThanOrEqual(now.getTime());
        expect(user.createdAt.getTime()).toBeGreaterThanOrEqual(oneYearAgo.getTime());
        expect(user.updatedAt.getTime()).toBeLessThanOrEqual(now.getTime());
        expect(user.updatedAt.getTime()).toBeGreaterThanOrEqual(oneYearAgo.getTime());
      });
    });
  });

  describe("MOCK_APPOINTMENTS", () => {
    it("should have correct structure for all appointments", () => {
      expect(Array.isArray(MOCK_APPOINTMENTS)).toBe(true);
      expect(MOCK_APPOINTMENTS.length).toBeGreaterThan(0);

      MOCK_APPOINTMENTS.forEach((appointment, index) => {
        expect(appointment).toHaveProperty("_id");
        expect(appointment).toHaveProperty("userId");
        expect(appointment).toHaveProperty("providerId");
        expect(appointment).toHaveProperty("serviceId");
        expect(appointment).toHaveProperty("date");
        expect(appointment).toHaveProperty("time");
        expect(appointment).toHaveProperty("status");
        expect(appointment).toHaveProperty("price");
        expect(appointment).toHaveProperty("reservationNumber");
        expect(appointment).toHaveProperty("requester");
        expect(appointment).toHaveProperty("recipient");
        expect(appointment).toHaveProperty("provider");
        expect(appointment).toHaveProperty("selectedService");
        expect(appointment).toHaveProperty("timeslot");
        expect(appointment).toHaveProperty("totalAmount");
        expect(appointment).toHaveProperty("createdAt");
        expect(appointment).toHaveProperty("updatedAt");

        expect(typeof appointment._id).toBe("string");
        expect(typeof appointment.userId).toBe("string");
        expect(typeof appointment.providerId).toBe("string");
        expect(typeof appointment.serviceId).toBe("string");
        expect(appointment.date).toBeInstanceOf(Date);
        expect(typeof appointment.time).toBe("string");
        expect(typeof appointment.status).toBe("string");
        expect(typeof appointment.price).toBe("number");
        expect(typeof appointment.reservationNumber).toBe("string");
        expect(typeof appointment.requester).toBe("object");
        expect(typeof appointment.recipient).toBe("object");
        expect(typeof appointment.provider).toBe("object");
        expect(typeof appointment.selectedService).toBe("object");
        expect(typeof appointment.timeslot).toBe("string");
        expect(typeof appointment.totalAmount).toBe("number");
        expect(appointment.createdAt).toBeInstanceOf(Date);
        expect(appointment.updatedAt).toBeInstanceOf(Date);
      });
    });

    it("should have unique IDs for all appointments", () => {
      const ids = MOCK_APPOINTMENTS.map(appointment => appointment._id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(ids.length);
    });

    it("should have unique reservation numbers", () => {
      const reservationNumbers = MOCK_APPOINTMENTS.map(appointment => appointment.reservationNumber);
      const uniqueReservationNumbers = new Set(reservationNumbers);
      expect(uniqueReservationNumbers.size).toBe(reservationNumbers.length);
    });

    it("should have valid appointment statuses", () => {
      const validStatuses = ["pending", "confirmed", "cancelled", "completed"];
      MOCK_APPOINTMENTS.forEach(appointment => {
        expect(validStatuses).toContain(appointment.status);
      });
    });

    it("should have valid payment statuses", () => {
      const validPaymentStatuses = ["pending", "paid", "failed", "refunded"];
      MOCK_APPOINTMENTS.forEach(appointment => {
        if (appointment.paymentStatus) {
          expect(validPaymentStatuses).toContain(appointment.paymentStatus);
        }
      });
    });

    it("should have valid requester structure", () => {
      MOCK_APPOINTMENTS.forEach(appointment => {
        const requester = appointment.requester;
        expect(requester).toHaveProperty("firstName");
        expect(requester).toHaveProperty("lastName");
        expect(requester).toHaveProperty("phone");
        expect(requester).toHaveProperty("email");

        expect(typeof requester.firstName).toBe("string");
        expect(typeof requester.lastName).toBe("string");
        expect(typeof requester.phone).toBe("string");
        expect(typeof requester.email).toBe("string");
      });
    });

    it("should have valid recipient structure", () => {
      MOCK_APPOINTMENTS.forEach(appointment => {
        const recipient = appointment.recipient;
        expect(recipient).toHaveProperty("firstName");
        expect(recipient).toHaveProperty("lastName");
        expect(recipient).toHaveProperty("phone");

        expect(typeof recipient.firstName).toBe("string");
        expect(typeof recipient.lastName).toBe("string");
        expect(typeof recipient.phone).toBe("string");
      });
    });

    it("should have valid provider structure", () => {
      MOCK_APPOINTMENTS.forEach(appointment => {
        const provider = appointment.provider;
        expect(provider).toHaveProperty("id");
        expect(provider).toHaveProperty("name");
        expect(provider).toHaveProperty("services");
        expect(provider).toHaveProperty("type");
        expect(provider).toHaveProperty("specialty");
        expect(provider).toHaveProperty("recommended");
        expect(provider).toHaveProperty("apiGeo");
        expect(provider).toHaveProperty("images");
        expect(provider).toHaveProperty("rating");

        expect(typeof provider.id).toBe("string");
        expect(typeof provider.name).toBe("string");
        expect(Array.isArray(provider.services)).toBe(true);
        expect(typeof provider.type).toBe("object");
        expect(typeof provider.specialty).toBe("string");
        expect(typeof provider.recommended).toBe("boolean");
        expect(Array.isArray(provider.apiGeo)).toBe(true);
        expect(Array.isArray(provider.images)).toBe(true);
        expect(typeof provider.rating).toBe("number");
      });
    });

    it("should have valid selected service structure", () => {
      MOCK_APPOINTMENTS.forEach(appointment => {
        const selectedService = appointment.selectedService;
        expect(selectedService).toHaveProperty("id");
        expect(selectedService).toHaveProperty("name");
        expect(selectedService).toHaveProperty("price");

        expect(typeof selectedService.id).toBe("number");
        expect(typeof selectedService.name).toBe("string");
        expect(typeof selectedService.price).toBe("number");
        expect(selectedService.price).toBeGreaterThan(0);
      });
    });

    it("should have consistent pricing", () => {
      MOCK_APPOINTMENTS.forEach(appointment => {
        expect(appointment.price).toBeGreaterThan(0);
        expect(appointment.totalAmount).toBeGreaterThan(0);
        expect(appointment.price).toBe(appointment.totalAmount);
      });
    });

    it("should have valid date ranges", () => {
      const now = new Date();
      const oneYearAgo = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
      
      MOCK_APPOINTMENTS.forEach(appointment => {
        expect(appointment.date.getTime()).toBeGreaterThanOrEqual(oneYearAgo.getTime());
        expect(appointment.date.getTime()).toBeLessThanOrEqual(now.getTime());
        expect(appointment.createdAt.getTime()).toBeLessThanOrEqual(now.getTime());
        expect(appointment.updatedAt.getTime()).toBeLessThanOrEqual(now.getTime());
      });
    });
  });

  describe("MOCK_INVOICES", () => {
    it("should have correct structure for all invoices", () => {
      expect(Array.isArray(MOCK_INVOICES)).toBe(true);
      expect(MOCK_INVOICES.length).toBeGreaterThan(0);

      MOCK_INVOICES.forEach((invoice, index) => {
        expect(invoice).toHaveProperty("_id");
        expect(invoice).toHaveProperty("invoiceNumber");
        expect(invoice).toHaveProperty("customerId");
        expect(invoice).toHaveProperty("providerId");
        expect(invoice).toHaveProperty("amount");
        expect(invoice).toHaveProperty("currency");
        expect(invoice).toHaveProperty("status");
        expect(invoice).toHaveProperty("issueDate");
        expect(invoice).toHaveProperty("dueDate");
        expect(invoice).toHaveProperty("items");
        expect(invoice).toHaveProperty("userId");
        expect(invoice).toHaveProperty("createdAt");
        expect(invoice).toHaveProperty("updatedAt");

        expect(typeof invoice._id).toBe("string");
        expect(typeof invoice.invoiceNumber).toBe("string");
        expect(typeof invoice.customerId).toBe("string");
        expect(typeof invoice.providerId).toBe("string");
        expect(typeof invoice.amount).toBe("number");
        expect(typeof invoice.currency).toBe("string");
        expect(typeof invoice.status).toBe("string");
        expect(invoice.issueDate).toBeInstanceOf(Date);
        expect(invoice.dueDate).toBeInstanceOf(Date);
        expect(Array.isArray(invoice.items)).toBe(true);
        expect(typeof invoice.userId).toBe("string");
        expect(invoice.createdAt).toBeInstanceOf(Date);
        expect(invoice.updatedAt).toBeInstanceOf(Date);
      });
    });

    it("should have unique IDs for all invoices", () => {
      const ids = MOCK_INVOICES.map(invoice => invoice._id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(ids.length);
    });

    it("should have unique invoice numbers", () => {
      const invoiceNumbers = MOCK_INVOICES.map(invoice => invoice.invoiceNumber);
      const uniqueInvoiceNumbers = new Set(invoiceNumbers);
      expect(uniqueInvoiceNumbers.size).toBe(invoiceNumbers.length);
    });

    it("should have valid invoice statuses", () => {
      const validStatuses = ["DRAFT", "SENT", "PAID", "OVERDUE", "CANCELLED"];
      MOCK_INVOICES.forEach(invoice => {
        expect(validStatuses).toContain(invoice.status);
      });
    });

    it("should have valid currency", () => {
      const validCurrencies = ["EUR", "USD", "CAD"];
      MOCK_INVOICES.forEach(invoice => {
        expect(validCurrencies).toContain(invoice.currency);
      });
    });

    it("should have valid items structure", () => {
      MOCK_INVOICES.forEach(invoice => {
        expect(invoice.items.length).toBeGreaterThan(0);
        
        invoice.items.forEach(item => {
          expect(item).toHaveProperty("description");
          expect(item).toHaveProperty("quantity");
          expect(item).toHaveProperty("unitPrice");
          expect(item).toHaveProperty("total");

          expect(typeof item.description).toBe("string");
          expect(typeof item.quantity).toBe("number");
          expect(typeof item.unitPrice).toBe("number");
          expect(typeof item.total).toBe("number");

          expect(item.quantity).toBeGreaterThan(0);
          expect(item.unitPrice).toBeGreaterThan(0);
          expect(item.total).toBeGreaterThan(0);
          expect(item.total).toBe(item.quantity * item.unitPrice);
        });
      });
    });

    it("should have consistent amounts", () => {
      MOCK_INVOICES.forEach(invoice => {
        expect(invoice.amount).toBeGreaterThan(0);
        
        const calculatedAmount = invoice.items.reduce((sum, item) => sum + item.total, 0);
        expect(invoice.amount).toBe(calculatedAmount);
      });
    });

    it("should have valid date ranges", () => {
      const now = new Date();
      const oneYearAgo = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
      
      MOCK_INVOICES.forEach(invoice => {
        expect(invoice.issueDate.getTime()).toBeLessThanOrEqual(now.getTime());
        // Les dates peuvent être dans le passé, mais pas trop anciennes
        expect(invoice.issueDate.getTime()).toBeGreaterThanOrEqual(oneYearAgo.getTime());
        expect(invoice.dueDate.getTime()).toBeLessThanOrEqual(now.getTime());
        expect(invoice.dueDate.getTime()).toBeGreaterThanOrEqual(oneYearAgo.getTime());
        expect(invoice.createdAt.getTime()).toBeLessThanOrEqual(now.getTime());
        expect(invoice.updatedAt.getTime()).toBeLessThanOrEqual(now.getTime());
      });
    });

    it("should have valid due dates after issue dates", () => {
      MOCK_INVOICES.forEach(invoice => {
        expect(invoice.dueDate.getTime()).toBeGreaterThanOrEqual(invoice.issueDate.getTime());
      });
    });
  });

  describe("MOCK_SPECIALITIES", () => {
    it("should have correct structure for all specialities", () => {
      expect(Array.isArray(MOCK_SPECIALITIES)).toBe(true);
      expect(MOCK_SPECIALITIES.length).toBeGreaterThan(0);

      MOCK_SPECIALITIES.forEach((speciality, index) => {
        expect(speciality).toHaveProperty("_id");
        expect(speciality).toHaveProperty("name");
        expect(speciality).toHaveProperty("description");
        expect(speciality).toHaveProperty("group");
        expect(speciality).toHaveProperty("isActive");
        expect(speciality).toHaveProperty("createdAt");
        expect(speciality).toHaveProperty("updatedAt");

        expect(typeof speciality._id).toBe("string");
        expect(typeof speciality.name).toBe("string");
        expect(typeof speciality.description).toBe("string");
        expect(typeof speciality.group).toBe("string");
        expect(typeof speciality.isActive).toBe("boolean");
        expect(speciality.createdAt).toBeInstanceOf(Date);
        expect(speciality.updatedAt).toBeInstanceOf(Date);
      });
    });

    it("should have unique IDs for all specialities", () => {
      const ids = MOCK_SPECIALITIES.map(speciality => speciality._id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(ids.length);
    });

    it("should have unique names for all specialities", () => {
      const names = MOCK_SPECIALITIES.map(speciality => speciality.name);
      const uniqueNames = new Set(names);
      expect(uniqueNames.size).toBe(names.length);
    });

    it("should have valid groups", () => {
      const validGroups = ["sante", "edu", "immo"];
      MOCK_SPECIALITIES.forEach(speciality => {
        expect(validGroups).toContain(speciality.group);
      });
    });

    it("should have active specialities", () => {
      const activeSpecialities = MOCK_SPECIALITIES.filter(speciality => speciality.isActive);
      expect(activeSpecialities.length).toBeGreaterThan(0);
    });

    it("should have meaningful descriptions", () => {
      MOCK_SPECIALITIES.forEach(speciality => {
        expect(speciality.description.length).toBeGreaterThan(10);
      });
    });

    it("should have valid date ranges", () => {
      const now = new Date();
      const oneYearAgo = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
      
      MOCK_SPECIALITIES.forEach(speciality => {
        expect(speciality.createdAt.getTime()).toBeLessThanOrEqual(now.getTime());
        expect(speciality.createdAt.getTime()).toBeGreaterThanOrEqual(oneYearAgo.getTime());
        expect(speciality.updatedAt.getTime()).toBeLessThanOrEqual(now.getTime());
        expect(speciality.updatedAt.getTime()).toBeGreaterThanOrEqual(oneYearAgo.getTime());
      });
    });
  });

  describe("Utility Functions", () => {
    describe("findUserByEmail", () => {
      it("should find user by email", () => {
        const user = findUserByEmail("admin@diaspomoney.com");
        expect(user).toBeDefined();
        expect(user!.email).toBe("admin@diaspomoney.com");
        expect(user!.roles).toContain("ADMIN");
      });

      it("should return undefined for non-existent email", () => {
        const user = findUserByEmail("nonexistent@example.com");
        expect(user).toBeUndefined();
      });

      it("should be case sensitive", () => {
        const user = findUserByEmail("ADMIN@DIASPOMONEY.COM");
        expect(user).toBeUndefined();
      });
    });

    describe("findUserById", () => {
      it("should find user by ID", () => {
        const user = findUserById("1");
        expect(user).toBeDefined();
        expect(user!._id).toBe("1");
        expect(user!.email).toBe("admin@diaspomoney.com");
      });

      it("should return undefined for non-existent ID", () => {
        const user = findUserById("999");
        expect(user).toBeUndefined();
      });
    });

    describe("findAppointmentById", () => {
      it("should find appointment by ID", () => {
        const appointment = findAppointmentById("1");
        expect(appointment).toBeDefined();
        expect(appointment!._id).toBe("1");
        expect(appointment!.reservationNumber).toBe("RDV-001");
      });

      it("should return undefined for non-existent ID", () => {
        const appointment = findAppointmentById("999");
        expect(appointment).toBeUndefined();
      });
    });

    describe("findProviderById", () => {
      it("should find provider by ID", () => {
        const provider = findProviderById("5");
        expect(provider).toBeDefined();
        if (provider) {
          expect(provider._id).toBe("5");
          expect(provider.roles).toContain("PROVIDER");
          expect(provider.specialty).toBe("Médecine générale");
        }
      });

      it("should return undefined for non-provider user", () => {
        const provider = findProviderById("1"); // Admin user
        expect(provider).toBeUndefined();
      });

      it("should return undefined for non-existent ID", () => {
        const provider = findProviderById("999");
        expect(provider).toBeUndefined();
      });
    });

    describe("findInvoiceById", () => {
      it("should find invoice by ID", () => {
        const invoice = findInvoiceById("1");
        expect(invoice).toBeDefined();
        expect(invoice!._id).toBe("1");
        expect(invoice!.invoiceNumber).toBe("FACT-2024-001");
      });

      it("should return undefined for non-existent ID", () => {
        const invoice = findInvoiceById("999");
        expect(invoice).toBeUndefined();
      });
    });

    describe("getAppointmentsByUserId", () => {
      it("should return appointments for existing user", () => {
        const appointments = getAppointmentsByUserId("9");
        expect(Array.isArray(appointments)).toBe(true);
        expect(appointments.length).toBeGreaterThan(0);
        
        appointments.forEach(appointment => {
          expect(appointment.userId).toBe("9");
        });
      });

      it("should return empty array for user with no appointments", () => {
        const appointments = getAppointmentsByUserId("999");
        expect(Array.isArray(appointments)).toBe(true);
        expect(appointments.length).toBe(0);
      });
    });

    describe("getProvidersBySpecialty", () => {
      it("should return providers for existing specialty", () => {
        const providers = getProvidersBySpecialty("Médecine générale");
        expect(Array.isArray(providers)).toBe(true);
        expect(providers.length).toBeGreaterThan(0);

        providers.forEach(provider => {
          expect(provider.roles).toContain("PROVIDER");
          expect(provider.specialty).toBe("Médecine générale");
        });
      });

      it("should return empty array for non-existent specialty", () => {
        const providers = getProvidersBySpecialty("NonExistentSpecialty");
        expect(Array.isArray(providers)).toBe(true);
        expect(providers.length).toBe(0);
      });
    });

    describe("getUsersByRole", () => {
      it("should return users for existing role", () => {
        const adminUsers = getUsersByRole("ADMIN");
        expect(Array.isArray(adminUsers)).toBe(true);
        expect(adminUsers.length).toBeGreaterThan(0);
        
        adminUsers.forEach(user => {
          expect(user.roles).toContain("ADMIN");
        });
      });

      it("should return empty array for non-existent role", () => {
        const users = getUsersByRole("NONEXISTENT");
        expect(Array.isArray(users)).toBe(true);
        expect(users.length).toBe(0);
      });

      it("should handle case sensitivity", () => {
        const adminUsers = getUsersByRole("admin");
        expect(Array.isArray(adminUsers)).toBe(true);
        expect(adminUsers.length).toBe(0); // Case sensitive
      });
    });
  });

  describe("Data Consistency", () => {
    it("should have consistent user references in appointments", () => {
      MOCK_APPOINTMENTS.forEach(appointment => {
        const user = findUserById(appointment.userId);
        const provider = findUserById(appointment.providerId);
        
        expect(user).toBeDefined();
        expect(provider).toBeDefined();
        expect(provider!.roles).toContain("PROVIDER");
      });
    });

    it("should have consistent user references in invoices", () => {
      MOCK_INVOICES.forEach(invoice => {
        const customer = findUserById(invoice.customerId);
        const provider = findUserById(invoice.providerId);
        
        expect(customer).toBeDefined();
        expect(provider).toBeDefined();
        expect(provider!.roles).toContain("PROVIDER");
      });
    });

    it("should have consistent speciality references", () => {
      const providerUsers = MOCK_USERS.filter(user => user.roles.includes("PROVIDER"));
      
      providerUsers.forEach(user => {
        if (user.specialty) {
          const speciality = MOCK_SPECIALITIES.find(s => s.name === user.specialty);
          expect(speciality).toBeDefined();
        }
      });
    });

    it("should have valid email formats", () => {
      MOCK_USERS.forEach(user => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        expect(emailRegex.test(user.email)).toBe(true);
      });
    });

    it("should have valid phone formats", () => {
      MOCK_APPOINTMENTS.forEach(appointment => {
        const phoneRegex = /^\+?[0-9\s\-\(\)]+$/;
        expect(phoneRegex.test(appointment.requester.phone)).toBe(true);
        expect(phoneRegex.test(appointment.recipient.phone)).toBe(true);
      });
    });

    it("should have valid reservation number format", () => {
      MOCK_APPOINTMENTS.forEach(appointment => {
        const reservationRegex = /^RDV-\d+$/;
        expect(reservationRegex.test(appointment.reservationNumber)).toBe(true);
      });
    });

    it("should have valid invoice number format", () => {
      MOCK_INVOICES.forEach(invoice => {
        const invoiceRegex = /^FACT-\d{4}-\d+$/;
        expect(invoiceRegex.test(invoice.invoiceNumber)).toBe(true);
      });
    });
  });
});
