import { describe, expect, it } from "vitest";
import {
  // Types
  Theme,
  NotificationType,
  UserRole,
  UserStatus,
  InvoiceStatus,
  AppointmentStatus,
  PaymentStatus,
  ProviderGroup,
  
  // Constantes
  APPOINTMENT_STATUSES,
  PAYMENT_STATUSES,
  SERVICE_TYPES,
  SPECIALITY_TYPES,
  INVOICE_STATUSES,
  USER_ROLES,
  USER_STATUSES,
  
  // Interfaces
  BaseDocument,
  ApiResponse,
  ApiError,
  PaginatedResponse,
  ThemeState,
  Notification,
  NotificationState,
  AuthState,
  Service,
  ServiceType,
  ProviderType,
  ApiGeoLocation,
  IUser,
} from "@/types";

describe("Types and Constants", () => {
  describe("Theme type", () => {
    it("should accept valid theme values", () => {
      const validThemes: Theme[] = ["light", "dark", "system"];
      
      validThemes.forEach(theme => {
        expect(typeof theme).toBe("string");
        expect(["light", "dark", "system"]).toContain(theme);
      });
    });

    it("should not accept invalid theme values", () => {
      // @ts-expect-error - Testing invalid theme
      const invalidTheme: Theme = "invalid";
      expect(invalidTheme).toBe("invalid");
    });
  });

  describe("NotificationType type", () => {
    it("should accept valid notification types", () => {
      const validTypes: NotificationType[] = ["success", "error", "info", "warning"];
      
      validTypes.forEach(type => {
        expect(typeof type).toBe("string");
        expect(["success", "error", "info", "warning"]).toContain(type);
      });
    });

    it("should not accept invalid notification types", () => {
      // @ts-expect-error - Testing invalid type
      const invalidType: NotificationType = "invalid";
      expect(invalidType).toBe("invalid");
    });
  });

  describe("UserRole type", () => {
    it("should accept valid user roles", () => {
      const validRoles: UserRole[] = ["ADMIN", "PROVIDER", "CUSTOMER", "CSM"];
      
      validRoles.forEach(role => {
        expect(typeof role).toBe("string");
        expect(["ADMIN", "PROVIDER", "CUSTOMER", "CSM"]).toContain(role);
      });
    });

    it("should not accept invalid user roles", () => {
      // @ts-expect-error - Testing invalid role
      const invalidRole: UserRole = "INVALID";
      expect(invalidRole).toBe("INVALID");
    });
  });

  describe("UserStatus type", () => {
    it("should accept valid user statuses", () => {
      const validStatuses: UserStatus[] = ["ACTIVE", "INACTIVE", "PENDING", "SUSPENDED"];
      
      validStatuses.forEach(status => {
        expect(typeof status).toBe("string");
        expect(["ACTIVE", "INACTIVE", "PENDING", "SUSPENDED"]).toContain(status);
      });
    });

    it("should not accept invalid user statuses", () => {
      // @ts-expect-error - Testing invalid status
      const invalidStatus: UserStatus = "INVALID";
      expect(invalidStatus).toBe("INVALID");
    });
  });

  describe("InvoiceStatus type", () => {
    it("should accept valid invoice statuses", () => {
      const validStatuses: InvoiceStatus[] = ["DRAFT", "SENT", "PAID", "OVERDUE", "CANCELLED"];
      
      validStatuses.forEach(status => {
        expect(typeof status).toBe("string");
        expect(["DRAFT", "SENT", "PAID", "OVERDUE", "CANCELLED"]).toContain(status);
      });
    });

    it("should not accept invalid invoice statuses", () => {
      // @ts-expect-error - Testing invalid status
      const invalidStatus: InvoiceStatus = "INVALID";
      expect(invalidStatus).toBe("INVALID");
    });
  });

  describe("AppointmentStatus type", () => {
    it("should accept valid appointment statuses", () => {
      const validStatuses: AppointmentStatus[] = ["pending", "confirmed", "cancelled", "completed"];
      
      validStatuses.forEach(status => {
        expect(typeof status).toBe("string");
        expect(["pending", "confirmed", "cancelled", "completed"]).toContain(status);
      });
    });

    it("should not accept invalid appointment statuses", () => {
      // @ts-expect-error - Testing invalid status
      const invalidStatus: AppointmentStatus = "invalid";
      expect(invalidStatus).toBe("invalid");
    });
  });

  describe("PaymentStatus type", () => {
    it("should accept valid payment statuses", () => {
      const validStatuses: PaymentStatus[] = ["pending", "paid", "failed", "refunded"];
      
      validStatuses.forEach(status => {
        expect(typeof status).toBe("string");
        expect(["pending", "paid", "failed", "refunded"]).toContain(status);
      });
    });

    it("should not accept invalid payment statuses", () => {
      // @ts-expect-error - Testing invalid status
      const invalidStatus: PaymentStatus = "invalid";
      expect(invalidStatus).toBe("invalid");
    });
  });

  describe("ProviderGroup type", () => {
    it("should accept valid provider groups", () => {
      const validGroups: ProviderGroup[] = ["sante", "edu", "immo"];
      
      validGroups.forEach(group => {
        expect(typeof group).toBe("string");
        expect(["sante", "edu", "immo"]).toContain(group);
      });
    });

    it("should not accept invalid provider groups", () => {
      // @ts-expect-error - Testing invalid group
      const invalidGroup: ProviderGroup = "invalid";
      expect(invalidGroup).toBe("invalid");
    });
  });

  describe("APPOINTMENT_STATUSES constant", () => {
    it("should have correct structure", () => {
      expect(Array.isArray(APPOINTMENT_STATUSES)).toBe(true);
      expect(APPOINTMENT_STATUSES).toHaveLength(4);
    });

    it("should have correct values", () => {
      const expectedValues = ["pending", "confirmed", "cancelled", "completed"];
      const actualValues = APPOINTMENT_STATUSES.map(status => status.value);
      
      expect(actualValues).toEqual(expectedValues);
    });

    it("should have correct labels", () => {
      const expectedLabels = ["En attente", "Confirmé", "Annulé", "Terminé"];
      const actualLabels = APPOINTMENT_STATUSES.map(status => status.label);
      
      expect(actualLabels).toEqual(expectedLabels);
    });

    it("should have correct structure for each status", () => {
      APPOINTMENT_STATUSES.forEach(status => {
        expect(status).toHaveProperty("value");
        expect(status).toHaveProperty("label");
        expect(typeof status.value).toBe("string");
        expect(typeof status.label).toBe("string");
      });
    });
  });

  describe("PAYMENT_STATUSES constant", () => {
    it("should have correct structure", () => {
      expect(Array.isArray(PAYMENT_STATUSES)).toBe(true);
      expect(PAYMENT_STATUSES).toHaveLength(4);
    });

    it("should have correct values", () => {
      const expectedValues = ["pending", "paid", "failed", "refunded"];
      const actualValues = PAYMENT_STATUSES.map(status => status.value);
      
      expect(actualValues).toEqual(expectedValues);
    });

    it("should have correct labels", () => {
      const expectedLabels = ["En attente", "Payé", "Échoué", "Remboursé"];
      const actualLabels = PAYMENT_STATUSES.map(status => status.label);
      
      expect(actualLabels).toEqual(expectedLabels);
    });

    it("should have correct structure for each status", () => {
      PAYMENT_STATUSES.forEach(status => {
        expect(status).toHaveProperty("value");
        expect(status).toHaveProperty("label");
        expect(typeof status.value).toBe("string");
        expect(typeof status.label).toBe("string");
      });
    });
  });

  describe("SERVICE_TYPES constant", () => {
    it("should have correct structure", () => {
      expect(Array.isArray(SERVICE_TYPES)).toBe(true);
      expect(SERVICE_TYPES).toHaveLength(5);
    });

    it("should have correct structure for each service type", () => {
      SERVICE_TYPES.forEach(serviceType => {
        expect(serviceType).toHaveProperty("id");
        expect(serviceType).toHaveProperty("name");
        expect(typeof serviceType.id).toBe("number");
        expect(typeof serviceType.name).toBe("string");
      });
    });

    it("should have unique IDs", () => {
      const ids = SERVICE_TYPES.map(serviceType => serviceType.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(ids.length);
    });

    it("should have correct service names", () => {
      const expectedNames = [
        "Consultation médicale",
        "Formation professionnelle",
        "Service immobilier",
        "Conseil juridique",
        "Service informatique"
      ];
      
      const actualNames = SERVICE_TYPES.map(serviceType => serviceType.name);
      expect(actualNames).toEqual(expectedNames);
    });
  });

  describe("SPECIALITY_TYPES constant", () => {
    it("should have correct structure", () => {
      expect(Array.isArray(SPECIALITY_TYPES)).toBe(true);
      expect(SPECIALITY_TYPES).toHaveLength(10);
    });

    it("should have correct structure for each speciality type", () => {
      SPECIALITY_TYPES.forEach(specialityType => {
        expect(specialityType).toHaveProperty("id");
        expect(specialityType).toHaveProperty("name");
        expect(specialityType).toHaveProperty("group");
        expect(typeof specialityType.id).toBe("number");
        expect(typeof specialityType.name).toBe("string");
        expect(typeof specialityType.group).toBe("string");
      });
    });

    it("should have valid group values", () => {
      const validGroups = ["sante", "edu", "immo"];
      SPECIALITY_TYPES.forEach(specialityType => {
        expect(validGroups).toContain(specialityType.group);
      });
    });

    it("should have unique IDs", () => {
      const ids = SPECIALITY_TYPES.map(specialityType => specialityType.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(ids.length);
    });

    it("should have correct group distribution", () => {
      const groupCounts = SPECIALITY_TYPES.reduce((acc, specialityType) => {
        acc[specialityType.group] = (acc[specialityType.group] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      expect(groupCounts.sante).toBeGreaterThan(0);
      expect(groupCounts.edu).toBeGreaterThan(0);
      expect(groupCounts.immo).toBeGreaterThan(0);
    });
  });

  describe("INVOICE_STATUSES constant", () => {
    it("should have correct structure", () => {
      expect(Array.isArray(INVOICE_STATUSES)).toBe(true);
      expect(INVOICE_STATUSES).toHaveLength(5);
    });

    it("should have correct values", () => {
      const expectedValues = ["DRAFT", "SENT", "PAID", "OVERDUE", "CANCELLED"];
      const actualValues = INVOICE_STATUSES.map(status => status.value);
      
      expect(actualValues).toEqual(expectedValues);
    });

    it("should have correct labels", () => {
      const expectedLabels = ["Brouillon", "Envoyée", "Payée", "En retard", "Annulée"];
      const actualLabels = INVOICE_STATUSES.map(status => status.label);
      
      expect(actualLabels).toEqual(expectedLabels);
    });

    it("should have correct structure for each status", () => {
      INVOICE_STATUSES.forEach(status => {
        expect(status).toHaveProperty("value");
        expect(status).toHaveProperty("label");
        expect(typeof status.value).toBe("string");
        expect(typeof status.label).toBe("string");
      });
    });
  });

  describe("USER_ROLES constant", () => {
    it("should have correct structure", () => {
      expect(Array.isArray(USER_ROLES)).toBe(true);
      expect(USER_ROLES).toHaveLength(4);
    });

    it("should have correct values", () => {
      const expectedValues = ["ADMIN", "PROVIDER", "CUSTOMER", "CSM"];
      const actualValues = USER_ROLES.map(role => role.value);
      
      expect(actualValues).toEqual(expectedValues);
    });

    it("should have correct labels", () => {
      const expectedLabels = ["Administrateur", "Prestataire", "Client", "CSM"];
      const actualLabels = USER_ROLES.map(role => role.label);
      
      expect(actualLabels).toEqual(expectedLabels);
    });

    it("should have correct structure for each role", () => {
      USER_ROLES.forEach(role => {
        expect(role).toHaveProperty("value");
        expect(role).toHaveProperty("label");
        expect(typeof role.value).toBe("string");
        expect(typeof role.label).toBe("string");
      });
    });
  });

  describe("USER_STATUSES constant", () => {
    it("should have correct structure", () => {
      expect(Array.isArray(USER_STATUSES)).toBe(true);
      expect(USER_STATUSES).toHaveLength(4);
    });

    it("should have correct values", () => {
      const expectedValues = ["ACTIVE", "INACTIVE", "PENDING", "SUSPENDED"];
      const actualValues = USER_STATUSES.map(status => status.value);
      
      expect(actualValues).toEqual(expectedValues);
    });

    it("should have correct labels", () => {
      const expectedLabels = ["Actif", "Inactif", "En attente", "Suspendu"];
      const actualLabels = USER_STATUSES.map(status => status.label);
      
      expect(actualLabels).toEqual(expectedLabels);
    });

    it("should have correct structure for each status", () => {
      USER_STATUSES.forEach(status => {
        expect(status).toHaveProperty("value");
        expect(status).toHaveProperty("label");
        expect(typeof status.value).toBe("string");
        expect(typeof status.label).toBe("string");
      });
    });
  });

  describe("Interface validation", () => {
    describe("BaseDocument interface", () => {
      it("should have correct structure", () => {
        const baseDoc: BaseDocument = {
          _id: "test-id",
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        expect(baseDoc).toHaveProperty("_id");
        expect(baseDoc).toHaveProperty("createdAt");
        expect(baseDoc).toHaveProperty("updatedAt");
        expect(typeof baseDoc._id).toBe("string");
        expect(baseDoc.createdAt).toBeInstanceOf(Date);
        expect(baseDoc.updatedAt).toBeInstanceOf(Date);
      });
    });

    describe("ApiResponse interface", () => {
      it("should have correct structure", () => {
        const apiResponse: ApiResponse<string> = {
          data: "test data",
          status: 200,
          message: "Success",
        };

        expect(apiResponse).toHaveProperty("data");
        expect(apiResponse).toHaveProperty("status");
        expect(apiResponse).toHaveProperty("message");
        expect(typeof apiResponse.data).toBe("string");
        expect(typeof apiResponse.status).toBe("number");
        expect(typeof apiResponse.message).toBe("string");
      });

      it("should work with different data types", () => {
        const stringResponse: ApiResponse<string> = {
          data: "string data",
          status: 200,
        };

        const numberResponse: ApiResponse<number> = {
          data: 42,
          status: 200,
        };

        const objectResponse: ApiResponse<{ key: string }> = {
          data: { key: "value" },
          status: 200,
        };

        expect(stringResponse.data).toBe("string data");
        expect(numberResponse.data).toBe(42);
        expect(objectResponse.data.key).toBe("value");
      });
    });

    describe("ApiError interface", () => {
      it("should have correct structure", () => {
        const apiError: ApiError = {
          message: "Error message",
          code: "ERROR_CODE",
          status: 400,
        };

        expect(apiError).toHaveProperty("message");
        expect(apiError).toHaveProperty("code");
        expect(apiError).toHaveProperty("status");
        expect(typeof apiError.message).toBe("string");
        expect(typeof apiError.code).toBe("string");
        expect(typeof apiError.status).toBe("number");
      });
    });

    describe("PaginatedResponse interface", () => {
      it("should have correct structure", () => {
        const paginatedResponse: PaginatedResponse<string> = {
          data: ["item1", "item2"],
          total: 2,
          page: 1,
          limit: 10,
          totalPages: 1,
        };

        expect(paginatedResponse).toHaveProperty("data");
        expect(paginatedResponse).toHaveProperty("total");
        expect(paginatedResponse).toHaveProperty("page");
        expect(paginatedResponse).toHaveProperty("limit");
        expect(paginatedResponse).toHaveProperty("totalPages");
        expect(Array.isArray(paginatedResponse.data)).toBe(true);
        expect(typeof paginatedResponse.total).toBe("number");
        expect(typeof paginatedResponse.page).toBe("number");
        expect(typeof paginatedResponse.limit).toBe("number");
        expect(typeof paginatedResponse.totalPages).toBe("number");
      });
    });

    describe("ThemeState interface", () => {
      it("should have correct structure", () => {
        const themeState: ThemeState = {
          theme: "light",
          setTheme: (theme: Theme) => {},
        };

        expect(themeState).toHaveProperty("theme");
        expect(themeState).toHaveProperty("setTheme");
        expect(typeof themeState.theme).toBe("string");
        expect(typeof themeState.setTheme).toBe("function");
      });
    });

    describe("Notification interface", () => {
      it("should have correct structure", () => {
        const notification: Notification = {
          id: "notification-id",
          type: "success",
          message: "Success message",
          duration: 5000,
        };

        expect(notification).toHaveProperty("id");
        expect(notification).toHaveProperty("type");
        expect(notification).toHaveProperty("message");
        expect(notification).toHaveProperty("duration");
        expect(typeof notification.id).toBe("string");
        expect(typeof notification.type).toBe("string");
        expect(typeof notification.message).toBe("string");
        expect(typeof notification.duration).toBe("number");
      });

      it("should work without optional duration", () => {
        const notification: Notification = {
          id: "notification-id",
          type: "info",
          message: "Info message",
        };

        expect(notification).toHaveProperty("id");
        expect(notification).toHaveProperty("type");
        expect(notification).toHaveProperty("message");
        expect(notification.duration).toBeUndefined();
      });
    });

    describe("NotificationState interface", () => {
      it("should have correct structure", () => {
        const notificationState: NotificationState = {
          notifications: [],
          addNotification: (notification) => {},
          removeNotification: (id: string) => {},
        };

        expect(notificationState).toHaveProperty("notifications");
        expect(notificationState).toHaveProperty("addNotification");
        expect(notificationState).toHaveProperty("removeNotification");
        expect(Array.isArray(notificationState.notifications)).toBe(true);
        expect(typeof notificationState.addNotification).toBe("function");
        expect(typeof notificationState.removeNotification).toBe("function");
      });
    });

    describe("AuthState interface", () => {
      it("should have correct structure", () => {
        const authState: AuthState = {
          isLoading: false,
          error: null,
          setError: (error: string | null) => {},
          login: async (email: string, password: string) => true,
        };

        expect(authState).toHaveProperty("isLoading");
        expect(authState).toHaveProperty("error");
        expect(authState).toHaveProperty("setError");
        expect(authState).toHaveProperty("login");
        expect(typeof authState.isLoading).toBe("boolean");
        expect(authState.error).toBe(null);
        expect(typeof authState.setError).toBe("function");
        expect(typeof authState.login).toBe("function");
      });
    });

    describe("Service interface", () => {
      it("should have correct structure", () => {
        const service: Service = {
          id: 1,
          name: "Service Name",
          price: 99.99,
        };

        expect(service).toHaveProperty("name");
        expect(service).toHaveProperty("price");
        expect(service).toHaveProperty("id");
        expect(typeof service.name).toBe("string");
        expect(typeof service.price).toBe("number");
        expect(typeof service.id).toBe("number");
      });

      it("should work without optional id", () => {
        const service: Service = {
          name: "Service Name",
          price: 99.99,
        };

        expect(service).toHaveProperty("name");
        expect(service).toHaveProperty("price");
        expect(service.id).toBeUndefined();
      });
    });

    describe("ServiceType interface", () => {
      it("should have correct structure", () => {
        const serviceType: ServiceType = {
          id: 1,
          name: "Service Type Name",
        };

        expect(serviceType).toHaveProperty("name");
        expect(serviceType).toHaveProperty("id");
        expect(typeof serviceType.name).toBe("string");
        expect(typeof serviceType.id).toBe("number");
      });

      it("should work without optional id", () => {
        const serviceType: ServiceType = {
          name: "Service Type Name",
        };

        expect(serviceType).toHaveProperty("name");
        expect(serviceType.id).toBeUndefined();
      });
    });

    describe("ProviderType interface", () => {
      it("should have correct structure", () => {
        const providerType: ProviderType = {
          id: "provider-id",
          value: "provider-value",
          group: "sante",
        };

        expect(providerType).toHaveProperty("id");
        expect(providerType).toHaveProperty("value");
        expect(providerType).toHaveProperty("group");
        expect(typeof providerType.id).toBe("string");
        expect(typeof providerType.value).toBe("string");
        expect(typeof providerType.group).toBe("string");
      });

      it("should work with numeric id", () => {
        const providerType: ProviderType = {
          id: 42,
          value: "provider-value",
          group: "edu",
        };

        expect(providerType.id).toBe(42);
        expect(typeof providerType.id).toBe("number");
      });
    });

    describe("ApiGeoLocation interface", () => {
      it("should have correct structure", () => {
        const apiGeoLocation: ApiGeoLocation = {
          place_id: 12345,
          licence: "test-license",
          osm_type: "node",
          osm_id: 67890,
          lat: "48.8566",
          lon: "2.3522",
          class: "place",
          type: "city",
          place_rank: 10,
          importance: 0.8,
          addresstype: "city",
          name: "Paris",
          display_name: "Paris, France",
          boundingbox: ["48.8156", "48.9022", "2.2241", "2.4699"],
        };

        expect(apiGeoLocation).toHaveProperty("place_id");
        expect(apiGeoLocation).toHaveProperty("licence");
        expect(apiGeoLocation).toHaveProperty("osm_type");
        expect(apiGeoLocation).toHaveProperty("osm_id");
        expect(apiGeoLocation).toHaveProperty("lat");
        expect(apiGeoLocation).toHaveProperty("lon");
        expect(apiGeoLocation).toHaveProperty("class");
        expect(apiGeoLocation).toHaveProperty("type");
        expect(apiGeoLocation).toHaveProperty("place_rank");
        expect(apiGeoLocation).toHaveProperty("importance");
        expect(apiGeoLocation).toHaveProperty("addresstype");
        expect(apiGeoLocation).toHaveProperty("name");
        expect(apiGeoLocation).toHaveProperty("display_name");
        expect(apiGeoLocation).toHaveProperty("boundingbox");

        expect(typeof apiGeoLocation.place_id).toBe("number");
        expect(typeof apiGeoLocation.licence).toBe("string");
        expect(typeof apiGeoLocation.osm_type).toBe("string");
        expect(typeof apiGeoLocation.osm_id).toBe("number");
        expect(typeof apiGeoLocation.lat).toBe("string");
        expect(typeof apiGeoLocation.lon).toBe("string");
        expect(typeof apiGeoLocation.class).toBe("string");
        expect(typeof apiGeoLocation.type).toBe("string");
        expect(typeof apiGeoLocation.place_rank).toBe("number");
        expect(typeof apiGeoLocation.importance).toBe("number");
        expect(typeof apiGeoLocation.addresstype).toBe("string");
        expect(typeof apiGeoLocation.name).toBe("string");
        expect(typeof apiGeoLocation.display_name).toBe("string");
        expect(Array.isArray(apiGeoLocation.boundingbox)).toBe(true);
      });
    });

    describe("IUser interface", () => {
      it("should have correct structure", () => {
        const user: IUser = {
          _id: "user-id",
          email: "user@example.com",
          name: "User Name",
          phone: "+1234567890",
          company: "Company Name",
          address: "User Address",
          roles: ["CUSTOMER"],
          status: "ACTIVE",
          specialty: "General",
          recommended: true,
          apiGeo: [],
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        expect(user).toHaveProperty("_id");
        expect(user).toHaveProperty("email");
        expect(user).toHaveProperty("name");
        expect(user).toHaveProperty("phone");
        expect(user).toHaveProperty("company");
        expect(user).toHaveProperty("address");
        expect(user).toHaveProperty("roles");
        expect(user).toHaveProperty("status");
        expect(user).toHaveProperty("specialty");
        expect(user).toHaveProperty("recommended");
        expect(user).toHaveProperty("apiGeo");
        expect(user).toHaveProperty("createdAt");
        expect(user).toHaveProperty("updatedAt");

        expect(typeof user._id).toBe("string");
        expect(typeof user.email).toBe("string");
        expect(typeof user.name).toBe("string");
        expect(typeof user.phone).toBe("string");
        expect(typeof user.company).toBe("string");
        expect(typeof user.address).toBe("string");
        expect(Array.isArray(user.roles)).toBe(true);
        expect(typeof user.status).toBe("string");
        expect(typeof user.specialty).toBe("string");
        expect(typeof user.recommended).toBe("boolean");
        expect(Array.isArray(user.apiGeo)).toBe(true);
        expect(user.createdAt).toBeInstanceOf(Date);
        expect(user.updatedAt).toBeInstanceOf(Date);
      });

      it("should work with minimal required fields", () => {
        const user: IUser = {
          _id: "user-id",
          email: "user@example.com",
          name: "User Name",
          roles: ["CUSTOMER"],
          status: "ACTIVE",
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        expect(user).toHaveProperty("_id");
        expect(user).toHaveProperty("email");
        expect(user).toHaveProperty("name");
        expect(user).toHaveProperty("roles");
        expect(user).toHaveProperty("status");
        expect(user).toHaveProperty("createdAt");
        expect(user).toHaveProperty("updatedAt");

        expect(user.phone).toBeUndefined();
        expect(user.company).toBeUndefined();
        expect(user.address).toBeUndefined();
        expect(user.specialty).toBeUndefined();
        expect(user.recommended).toBeUndefined();
        expect(user.apiGeo).toBeUndefined();
      });
    });
  });
});
