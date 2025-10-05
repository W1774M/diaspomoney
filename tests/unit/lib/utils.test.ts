import { describe, expect, it, vi, beforeEach } from "vitest";
import {
  cn,
  formatCurrency,
  formatDate,
  formatDateTime,
  getStatusColor,
  getPriorityColor,
  generateId,
  isValidEmail,
  truncateText,
  capitalize,
  slugify,
  debounce,
  deepClone,
} from "@/lib/utils";

describe("Utils", () => {
  describe("cn (class names utility)", () => {
    it("should combine class names correctly", () => {
      expect(cn("class1", "class2")).toBe("class1 class2");
    });

    it("should handle empty strings", () => {
      expect(cn("", "class1", "")).toBe("class1");
    });

    it("should handle undefined and null values", () => {
      expect(cn(undefined, "class1", null)).toBe("class1");
    });

    it("should handle conditional classes", () => {
      const isActive = true;
      const isDisabled = false;
      expect(cn("base", isActive && "active", isDisabled && "disabled")).toBe("base active");
    });

    it("should handle arrays of classes", () => {
      expect(cn(["class1", "class2"], "class3")).toBe("class1 class2 class3");
    });

    it("should handle objects with boolean values", () => {
      expect(cn({ class1: true, class2: false, class3: true })).toBe("class1 class3");
    });

    it("should handle mixed input types", () => {
      expect(cn("base", ["nested1", "nested2"], { conditional: true }, "final")).toBe("base nested1 nested2 conditional final");
    });
  });

  describe("formatCurrency", () => {
    it("should format EUR currency correctly", () => {
      expect(formatCurrency(1234.56)).toMatch(/1\s234,56\s€/);
    });

    it("should format USD currency correctly", () => {
      expect(formatCurrency(1234.56, "USD")).toMatch(/\$1,234\.56/);
    });

    it("should handle zero values", () => {
      expect(formatCurrency(0)).toMatch(/0,00\s€/);
    });

    it("should handle negative values", () => {
      expect(formatCurrency(-1234.56)).toMatch(/-1\s234,56\s€/);
    });

    it("should handle very large numbers", () => {
      expect(formatCurrency(999999999.99)).toMatch(/999\s999\s999,99\s€/);
    });

    it("should handle very small decimal values", () => {
      expect(formatCurrency(0.01)).toMatch(/0,01\s€/);
    });

    it("should handle integer values", () => {
      expect(formatCurrency(100)).toMatch(/100,00\s€/);
    });
  });

  describe("formatDate", () => {
    it("should format Date object correctly", () => {
      const date = new Date("2024-01-15");
      expect(formatDate(date)).toMatch(/15\s\w+\s2024/);
    });

    it("should format date string correctly", () => {
      expect(formatDate("2024-01-15")).toMatch(/15\s\w+\s2024/);
    });

    it("should handle ISO date strings", () => {
      expect(formatDate("2024-01-15T10:30:00Z")).toMatch(/15\s\w+\s2024/);
    });

    it("should handle different date formats", () => {
      expect(formatDate("2024/01/15")).toMatch(/15\s\w+\s2024/);
    });

    it("should handle edge case dates", () => {
      expect(formatDate("2024-12-31")).toMatch(/31.*\w+.*2024/);
      expect(formatDate("2024-02-29")).toMatch(/29.*\w+.*2024/); // Leap year
    });
  });

  describe("formatDateTime", () => {
    it("should format Date object with time correctly", () => {
      const date = new Date("2024-01-15T14:30:00");
      const result = formatDateTime(date);
      expect(result).toMatch(/15\s\w+\s2024/);
      expect(result).toMatch(/14:30/);
    });

    it("should format date string with time correctly", () => {
      const result = formatDateTime("2024-01-15T14:30:00");
      expect(result).toMatch(/15\s\w+\s2024/);
      expect(result).toMatch(/14:30/);
    });

    it("should handle midnight time", () => {
      const result = formatDateTime("2024-01-15T00:00:00");
      expect(result).toMatch(/15\s\w+\s2024/);
      expect(result).toMatch(/00:00/);
    });

    it("should handle end of day time", () => {
      const result = formatDateTime("2024-01-15T23:59:59");
      expect(result).toMatch(/15\s\w+\s2024/);
      expect(result).toMatch(/23:59/);
    });
  });

  describe("getStatusColor", () => {
    it("should return correct colors for client statuses", () => {
      expect(getStatusColor("ACTIVE")).toBe("bg-green-100 text-green-800");
      expect(getStatusColor("INACTIVE")).toBe("bg-gray-100 text-gray-800");
      expect(getStatusColor("PROSPECT")).toBe("bg-blue-100 text-blue-800");
    });

    it("should return correct colors for invoice statuses", () => {
      expect(getStatusColor("DRAFT")).toBe("bg-gray-100 text-gray-800");
      expect(getStatusColor("SENT")).toBe("bg-blue-100 text-blue-800");
      expect(getStatusColor("PAID")).toBe("bg-green-100 text-green-800");
      expect(getStatusColor("OVERDUE")).toBe("bg-red-100 text-red-800");
      expect(getStatusColor("CANCELLED")).toBe("bg-yellow-100 text-yellow-800");
    });

    it("should return correct colors for project statuses", () => {
      expect(getStatusColor("PLANNING")).toBe("bg-purple-100 text-purple-800");
      expect(getStatusColor("IN_PROGRESS")).toBe("bg-blue-100 text-blue-800");
      expect(getStatusColor("ON_HOLD")).toBe("bg-yellow-100 text-yellow-800");
      expect(getStatusColor("COMPLETED")).toBe("bg-green-100 text-green-800");
    });

    it("should return correct colors for task statuses", () => {
      expect(getStatusColor("TODO")).toBe("bg-gray-100 text-gray-800");
      expect(getStatusColor("TASK_IN_PROGRESS")).toBe("bg-blue-100 text-blue-800");
      expect(getStatusColor("REVIEW")).toBe("bg-yellow-100 text-yellow-800");
      expect(getStatusColor("DONE")).toBe("bg-green-100 text-green-800");
    });

    it("should return correct colors for appointment statuses", () => {
      expect(getStatusColor("pending")).toBe("bg-yellow-100 text-yellow-800");
      expect(getStatusColor("confirmed")).toBe("bg-green-100 text-green-800");
      expect(getStatusColor("cancelled")).toBe("bg-red-100 text-red-800");
      expect(getStatusColor("completed")).toBe("bg-blue-100 text-blue-800");
    });

    it("should return default color for unknown statuses", () => {
      expect(getStatusColor("UNKNOWN_STATUS")).toBe("bg-gray-100 text-gray-800");
      expect(getStatusColor("")).toBe("bg-gray-100 text-gray-800");
      expect(getStatusColor("random text")).toBe("bg-gray-100 text-gray-800");
    });

    it("should handle case sensitivity", () => {
      expect(getStatusColor("active")).toBe("bg-gray-100 text-gray-800"); // lowercase
      expect(getStatusColor("ACTIVE")).toBe("bg-green-100 text-green-800"); // uppercase
    });
  });

  describe("getPriorityColor", () => {
    it("should return correct colors for priority levels", () => {
      expect(getPriorityColor("LOW")).toBe("bg-gray-100 text-gray-800");
      expect(getPriorityColor("MEDIUM")).toBe("bg-blue-100 text-blue-800");
      expect(getPriorityColor("HIGH")).toBe("bg-orange-100 text-orange-800");
      expect(getPriorityColor("URGENT")).toBe("bg-red-100 text-red-800");
    });

    it("should return default color for unknown priorities", () => {
      expect(getPriorityColor("UNKNOWN_PRIORITY")).toBe("bg-gray-100 text-gray-800");
      expect(getPriorityColor("")).toBe("bg-gray-100 text-gray-800");
      expect(getPriorityColor("random text")).toBe("bg-gray-100 text-gray-800");
    });

    it("should handle case sensitivity", () => {
      expect(getPriorityColor("low")).toBe("bg-gray-100 text-gray-800"); // lowercase
      expect(getPriorityColor("LOW")).toBe("bg-gray-100 text-gray-800"); // uppercase
    });
  });

  describe("generateId", () => {
    it("should generate unique IDs", () => {
      const id1 = generateId();
      const id2 = generateId();
      expect(id1).not.toBe(id2);
    });

    it("should generate IDs with correct format", () => {
      const id = generateId();
      expect(typeof id).toBe("string");
      expect(id.length).toBeGreaterThan(10);
    });

    it("should generate different IDs on rapid calls", () => {
      const ids = Array.from({ length: 100 }, () => generateId());
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(100);
    });
  });

  describe("isValidEmail", () => {
    it("should validate correct email formats", () => {
      expect(isValidEmail("test@example.com")).toBe(true);
      expect(isValidEmail("user.name@domain.co.uk")).toBe(true);
      expect(isValidEmail("user+tag@example.org")).toBe(true);
      expect(isValidEmail("123@numbers.com")).toBe(true);
      expect(isValidEmail("user@subdomain.example.com")).toBe(true);
    });

    it("should reject invalid email formats", () => {
      expect(isValidEmail("invalid-email")).toBe(false);
      expect(isValidEmail("@example.com")).toBe(false);
      expect(isValidEmail("user@")).toBe(false);
      expect(isValidEmail("user@.com")).toBe(false);
      expect(isValidEmail("user..name@example.com")).toBe(false);
      expect(isValidEmail("user@example..com")).toBe(false);
      expect(isValidEmail("")).toBe(false);
      expect(isValidEmail(" ")).toBe(false);
    });

    it("should handle edge cases", () => {
      expect(isValidEmail("user@example")).toBe(false); // Missing TLD
      expect(isValidEmail("user@example.c")).toBe(false); // Too short TLD
      expect(isValidEmail("user@example.com.")).toBe(false); // Trailing dot
      expect(isValidEmail(".user@example.com")).toBe(false); // Leading dot
    });

    it("should handle special characters", () => {
      expect(isValidEmail("user-name@example.com")).toBe(true);
      expect(isValidEmail("user_name@example.com")).toBe(true);
      expect(isValidEmail("user.name@example.com")).toBe(true);
      expect(isValidEmail("user+name@example.com")).toBe(true);
    });
  });

  describe("truncateText", () => {
    it("should truncate long text correctly", () => {
      expect(truncateText("This is a very long text that needs to be truncated", 20)).toBe("This is a very long ...");
    });

    it("should not truncate short text", () => {
      expect(truncateText("Short text", 20)).toBe("Short text");
    });

    it("should handle exact length text", () => {
      expect(truncateText("Exactly twenty chars", 20)).toBe("Exactly twenty chars");
    });

    it("should handle empty string", () => {
      expect(truncateText("", 10)).toBe("");
    });

    it("should handle very short maxLength", () => {
      expect(truncateText("Hello world", 3)).toBe("Hel...");
    });

    it("should handle maxLength of 0", () => {
      expect(truncateText("Hello world", 0)).toBe("...");
    });

    it("should handle maxLength less than 0", () => {
      expect(truncateText("Hello world", -5)).toBe("...");
    });
  });

  describe("capitalize", () => {
    it("should capitalize first letter of string", () => {
      expect(capitalize("hello")).toBe("Hello");
      expect(capitalize("world")).toBe("World");
    });

    it("should handle already capitalized strings", () => {
      expect(capitalize("Hello")).toBe("Hello");
      expect(capitalize("WORLD")).toBe("World");
    });

    it("should handle single character strings", () => {
      expect(capitalize("a")).toBe("A");
      expect(capitalize("Z")).toBe("Z");
    });

    it("should handle empty string", () => {
      expect(capitalize("")).toBe("");
    });

    it("should handle strings with numbers", () => {
      expect(capitalize("123abc")).toBe("123abc");
      expect(capitalize("abc123")).toBe("Abc123");
    });

    it("should handle special characters", () => {
      expect(capitalize("!hello")).toBe("!hello");
      expect(capitalize("hello!")).toBe("Hello!");
    });
  });

  describe("slugify", () => {
    it("should convert simple strings to slugs", () => {
      expect(slugify("Hello World")).toBe("hello-world");
      expect(slugify("This is a test")).toBe("this-is-a-test");
    });

    it("should handle special characters", () => {
      expect(slugify("Hello & World!")).toBe("hello-world");
      expect(slugify("Test@#$%^&*()")).toBe("test");
      expect(slugify("Hello, World.")).toBe("hello-world");
    });

    it("should handle multiple spaces and hyphens", () => {
      expect(slugify("Hello   World")).toBe("hello-world");
      expect(slugify("Hello---World")).toBe("hello-world");
      expect(slugify("Hello___World")).toBe("hello-world");
    });

    it("should handle leading and trailing spaces/hyphens", () => {
      expect(slugify(" Hello World ")).toBe("hello-world");
      expect(slugify("---Hello World---")).toBe("hello-world");
    });

    it("should handle accented characters", () => {
      expect(slugify("Café au lait")).toBe("caf-au-lait");
      expect(slugify("Hôtel réservation")).toBe("htel-rservation");
    });

    it("should handle empty string", () => {
      expect(slugify("")).toBe("");
    });

    it("should handle strings with only special characters", () => {
      expect(slugify("!@#$%^&*()")).toBe("");
      expect(slugify("   ")).toBe("");
    });
  });

  describe("debounce", () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it("should debounce function calls", () => {
      const mockFn = vi.fn();
      const debouncedFn = debounce(mockFn, 100);

      debouncedFn("arg1");
      debouncedFn("arg2");
      debouncedFn("arg3");

      expect(mockFn).not.toHaveBeenCalled();

      vi.advanceTimersByTime(100);
      expect(mockFn).toHaveBeenCalledTimes(1);
      expect(mockFn).toHaveBeenCalledWith("arg3");
    });

    it("should handle different wait times", () => {
      const mockFn = vi.fn();
      const debouncedFn = debounce(mockFn, 500);

      debouncedFn("test");
      vi.advanceTimersByTime(250);
      expect(mockFn).not.toHaveBeenCalled();

      vi.advanceTimersByTime(250);
      expect(mockFn).toHaveBeenCalledTimes(1);
    });

    it("should handle zero wait time", () => {
      const mockFn = vi.fn();
      const debouncedFn = debounce(mockFn, 0);

      debouncedFn("test");
      expect(mockFn).toHaveBeenCalledTimes(1);
    });
  });

  describe("deepClone", () => {
    it("should clone primitive values", () => {
      expect(deepClone(42)).toBe(42);
      expect(deepClone("hello")).toBe("hello");
      expect(deepClone(true)).toBe(true);
      expect(deepClone(null)).toBe(null);
      expect(deepClone(undefined)).toBe(undefined);
    });

    it("should clone Date objects", () => {
      const originalDate = new Date("2024-01-15");
      const clonedDate = deepClone(originalDate);
      
      expect(clonedDate).not.toBe(originalDate);
      expect(clonedDate.getTime()).toBe(originalDate.getTime());
    });

    it("should clone arrays", () => {
      const originalArray = [1, "hello", { key: "value" }];
      const clonedArray = deepClone(originalArray);
      
      expect(clonedArray).not.toBe(originalArray);
      expect(clonedArray).toEqual(originalArray);
      expect(clonedArray[2]).not.toBe(originalArray[2]);
    });

    it("should clone objects", () => {
      const originalObject = { a: 1, b: "hello", c: { nested: true } };
      const clonedObject = deepClone(originalObject);
      
      expect(clonedObject).not.toBe(originalObject);
      expect(clonedObject).toEqual(originalObject);
      expect(clonedObject.c).not.toBe(originalObject.c);
    });

    it("should handle nested structures", () => {
      const original = {
        level1: {
          level2: {
            level3: [1, 2, { deep: "value" }]
          }
        }
      };
      const cloned = deepClone(original);
      
      expect(cloned).not.toBe(original);
      expect(cloned.level1).not.toBe(original.level1);
      expect(cloned.level1.level2).not.toBe(original.level1.level2);
      expect(cloned.level1.level2.level3[2]).not.toBe(original.level1.level2.level3[2]);
    });

    it("should handle circular references gracefully", () => {
      const original: any = { a: 1 };
      original.self = original;
      
      // Should not cause infinite recursion
      expect(() => deepClone(original)).not.toThrow();
    });

    it("should handle empty objects and arrays", () => {
      expect(deepClone({})).toEqual({});
      expect(deepClone([])).toEqual([]);
    });

    it("should handle objects with null values", () => {
      const original = { a: null, b: undefined, c: 0 };
      const cloned = deepClone(original);
      
      expect(cloned).toEqual(original);
      expect(cloned.a).toBe(null);
      expect(cloned.b).toBe(undefined);
      expect(cloned.c).toBe(0);
    });
  });
});
