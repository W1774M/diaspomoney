import { useForm } from "@/hooks/forms/useForm";
import { renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { z } from "zod";

// Mock @hookform/resolvers/zod - hoist-safe
const mockZodResolver = vi.hoisted(() => vi.fn());
vi.mock("@hookform/resolvers/zod", () => ({
  zodResolver: mockZodResolver,
}));

// Mock react-hook-form - Defined after
const mockUseHookForm = vi.hoisted(() => vi.fn());
vi.mock("react-hook-form", () => ({
  useForm: mockUseHookForm,
}));

describe("useForm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should call useHookForm with correct parameters", () => {
    const mockFormReturn = {
      register: vi.fn(),
      handleSubmit: vi.fn(),
      formState: { errors: {} },
    };
    mockUseHookForm.mockReturnValue(mockFormReturn);

    const schema = z.object({
      email: z.string().email(),
      password: z.string().min(8),
    });

    const props = {
      schema,
      defaultValues: {
        email: "",
        password: "",
      },
      mode: "onChange" as const,
    };

    const { result } = renderHook(() => useForm(props));

    expect(mockZodResolver).toHaveBeenCalledWith(schema);
    expect(mockUseHookForm).toHaveBeenCalledWith({
      resolver: mockZodResolver(schema),
      defaultValues: {
        email: "",
        password: "",
      },
      mode: "onChange",
    });
    expect(result.current).toBe(mockFormReturn);
  });

  it("should handle schema-only props", () => {
    const mockFormReturn = {
      register: vi.fn(),
      handleSubmit: vi.fn(),
      formState: { errors: {} },
    };
    mockUseHookForm.mockReturnValue(mockFormReturn);

    const schema = z.object({
      name: z.string(),
    });

    const { result } = renderHook(() => useForm({ schema }));

    expect(mockZodResolver).toHaveBeenCalledWith(schema);
    expect(mockUseHookForm).toHaveBeenCalledWith({
      resolver: mockZodResolver(schema),
    });
    expect(result.current).toBe(mockFormReturn);
  });

  it("should handle complex schema with nested objects", () => {
    const mockFormReturn = {
      register: vi.fn(),
      handleSubmit: vi.fn(),
      formState: { errors: {} },
    };
    mockUseHookForm.mockReturnValue(mockFormReturn);

    const schema = z.object({
      user: z.object({
        profile: z.object({
          firstName: z.string(),
          lastName: z.string(),
          age: z.number().min(18),
        }),
        preferences: z.object({
          theme: z.enum(["light", "dark", "system"]),
          notifications: z.boolean(),
        }),
      }),
      settings: z.object({
        language: z.string(),
        timezone: z.string(),
      }),
    });

    const props = {
      schema,
      defaultValues: {
        user: {
          profile: {
            firstName: "",
            lastName: "",
            age: 18,
          },
          preferences: {
            theme: "system" as const,
            notifications: true,
          },
        },
        settings: {
          language: "en",
          timezone: "UTC",
        },
      },
    };

    const { result } = renderHook(() => useForm(props));

    expect(mockZodResolver).toHaveBeenCalledWith(schema);
    expect(mockUseHookForm).toHaveBeenCalledWith({
      resolver: mockZodResolver(schema),
      defaultValues: props.defaultValues,
    });
    expect(result.current).toBe(mockFormReturn);
  });

  it("should handle schema with arrays", () => {
    const mockFormReturn = {
      register: vi.fn(),
      handleSubmit: vi.fn(),
      formState: { errors: {} },
    };
    mockUseHookForm.mockReturnValue(mockFormReturn);

    const schema = z.object({
      tags: z.array(z.string()),
      scores: z.array(z.number().min(0).max(100)),
      items: z.array(
        z.object({
          id: z.string(),
          name: z.string(),
          quantity: z.number().positive(),
        })
      ),
    });

    const props = {
      schema,
      defaultValues: {
        tags: [],
        scores: [],
        items: [],
      },
    };

    const { result } = renderHook(() => useForm(props));

    expect(mockZodResolver).toHaveBeenCalledWith(schema);
    expect(mockUseHookForm).toHaveBeenCalledWith({
      resolver: mockZodResolver(schema),
      defaultValues: props.defaultValues,
    });
    expect(result.current).toBe(mockFormReturn);
  });

  it("should handle schema with unions", () => {
    const mockFormReturn = {
      register: vi.fn(),
      handleSubmit: vi.fn(),
      formState: { errors: {} },
    };
    mockUseHookForm.mockReturnValue(mockFormReturn);

    const schema = z.object({
      type: z.union([
        z.literal("user"),
        z.literal("admin"),
        z.literal("moderator"),
      ]),
      status: z.union([
        z.literal("active"),
        z.literal("inactive"),
        z.literal("pending"),
      ]),
      value: z.union([z.string(), z.number(), z.boolean()]),
    });

    const props = {
      schema,
      defaultValues: {
        type: "user" as const,
        status: "active" as const,
        value: "",
      },
    };

    const { result } = renderHook(() => useForm(props));

    expect(mockZodResolver).toHaveBeenCalledWith(schema);
    expect(mockUseHookForm).toHaveBeenCalledWith({
      resolver: mockZodResolver(schema),
      defaultValues: props.defaultValues,
    });
    expect(result.current).toBe(mockFormReturn);
  });

  it("should handle schema with optional fields", () => {
    const mockFormReturn = {
      register: vi.fn(),
      handleSubmit: vi.fn(),
      formState: { errors: {} },
    };
    mockUseHookForm.mockReturnValue(mockFormReturn);

    const schema = z.object({
      required: z.string(),
      optional: z.string().optional(),
      nullable: z.string().nullable(),
      undefined: z.string().optional().or(z.literal(undefined)),
    });

    const props = {
      schema,
      defaultValues: {
        required: "",
        optional: undefined,
        nullable: null,
        undefined: undefined,
      },
    };

    const { result } = renderHook(() => useForm(props));

    expect(mockZodResolver).toHaveBeenCalledWith(schema);
    expect(mockUseHookForm).toHaveBeenCalledWith({
      resolver: mockZodResolver(schema),
      defaultValues: props.defaultValues,
    });
    expect(result.current).toBe(mockFormReturn);
  });

  it("should handle schema with transformations", () => {
    const mockFormReturn = {
      register: vi.fn(),
      handleSubmit: vi.fn(),
      formState: { errors: {} },
    };
    mockUseHookForm.mockReturnValue(mockFormReturn);

    const schema = z.object({
      email: z
        .string()
        .email()
        .transform(val => val.toLowerCase()),
      age: z.string().transform(val => parseInt(val, 10)),
      tags: z.string().transform(val => val.split(",").map(tag => tag.trim())),
    });

    const props = {
      schema,
      defaultValues: {
        email: "",
        age: "",
        tags: "",
      },
    };

    const { result } = renderHook(() => useForm(props));

    expect(mockZodResolver).toHaveBeenCalledWith(schema);
    expect(mockUseHookForm).toHaveBeenCalledWith({
      resolver: mockZodResolver(schema),
      defaultValues: props.defaultValues,
    });
    expect(result.current).toBe(mockFormReturn);
  });

  it("should handle schema with custom validation", () => {
    const mockFormReturn = {
      register: vi.fn(),
      handleSubmit: vi.fn(),
      formState: { errors: {} },
    };
    mockUseHookForm.mockReturnValue(mockFormReturn);

    const schema = z
      .object({
        password: z
          .string()
          .min(8)
          .refine(
            val => /[A-Z]/.test(val),
            "Password must contain at least one uppercase letter"
          ),
        confirmPassword: z.string(),
      })
      .refine(data => data.password === data.confirmPassword, {
        message: "Passwords don't match",
        path: ["confirmPassword"],
      });

    const props = {
      schema,
      defaultValues: {
        password: "",
        confirmPassword: "",
      },
    };

    const { result } = renderHook(() => useForm(props));

    expect(mockZodResolver).toHaveBeenCalledWith(schema);
    expect(mockUseHookForm).toHaveBeenCalledWith({
      resolver: mockZodResolver(schema),
      defaultValues: props.defaultValues,
    });
    expect(result.current).toBe(mockFormReturn);
  });

  it("should handle schema with enums", () => {
    const mockFormReturn = {
      register: vi.fn(),
      handleSubmit: vi.fn(),
      formState: { errors: {} },
    };
    mockUseHookForm.mockReturnValue(mockFormReturn);

    const schema = z.object({
      role: z.enum(["admin", "user", "moderator"]),
      status: z.enum(["active", "inactive", "pending", "suspended"]),
      priority: z.enum(["low", "medium", "high", "urgent"]),
    });

    const props = {
      schema,
      defaultValues: {
        role: "user" as const,
        status: "active" as const,
        priority: "medium" as const,
      },
    };

    const { result } = renderHook(() => useForm(props));

    expect(mockZodResolver).toHaveBeenCalledWith(schema);
    expect(mockUseHookForm).toHaveBeenCalledWith({
      resolver: mockZodResolver(schema),
      defaultValues: props.defaultValues,
    });
    expect(result.current).toBe(mockFormReturn);
  });

  it("should handle schema with date fields", () => {
    const mockFormReturn = {
      register: vi.fn(),
      handleSubmit: vi.fn(),
      formState: { errors: {} },
    };
    mockUseHookForm.mockReturnValue(mockFormReturn);

    const schema = z.object({
      startDate: z.date(),
      endDate: z.date(),
      createdAt: z.date().optional(),
    });

    const now = new Date();
    const props = {
      schema,
      defaultValues: {
        startDate: now,
        endDate: now,
        createdAt: undefined,
      },
    };

    const { result } = renderHook(() => useForm(props));

    expect(mockZodResolver).toHaveBeenCalledWith(schema);
    expect(mockUseHookForm).toHaveBeenCalledWith({
      resolver: mockZodResolver(schema),
      defaultValues: props.defaultValues,
    });
    expect(result.current).toBe(mockFormReturn);
  });

  it("should handle schema with literal values", () => {
    const mockFormReturn = {
      register: vi.fn(),
      handleSubmit: vi.fn(),
      formState: { errors: {} },
    };
    mockUseHookForm.mockReturnValue(mockFormReturn);

    const schema = z.object({
      type: z.literal("form"),
      version: z.literal(1),
      enabled: z.literal(true),
      disabled: z.literal(false),
    });

    const props = {
      schema,
      defaultValues: {
        type: "form" as const,
        version: 1 as const,
        enabled: true as const,
        disabled: false as const,
      },
    };

    const { result } = renderHook(() => useForm(props));

    expect(mockZodResolver).toHaveBeenCalledWith(schema);
    expect(mockUseHookForm).toHaveBeenCalledWith({
      resolver: mockZodResolver(schema),
      defaultValues: props.defaultValues,
    });
    expect(result.current).toBe(mockFormReturn);
  });

  it("should handle schema with discriminated unions", () => {
    const mockFormReturn = {
      register: vi.fn(),
      handleSubmit: vi.fn(),
      formState: { errors: {} },
    };
    mockUseHookForm.mockReturnValue(mockFormReturn);

    const schema = z.discriminatedUnion("type", [
      z.object({
        type: z.literal("success"),
        data: z.string(),
      }),
      z.object({
        type: z.literal("error"),
        message: z.string(),
        code: z.number(),
      }),
    ]);

    const props = {
      schema,
      defaultValues: {
        type: "success" as const,
        data: "",
      },
    };

    const { result } = renderHook(() => useForm(props));

    expect(mockZodResolver).toHaveBeenCalledWith(schema);
    expect(mockUseHookForm).toHaveBeenCalledWith({
      resolver: mockZodResolver(schema),
      defaultValues: props.defaultValues,
    });
    expect(result.current).toBe(mockFormReturn);
  });

  it("should handle schema with recursive structures", () => {
    const mockFormReturn = {
      register: vi.fn(),
      handleSubmit: vi.fn(),
      formState: { errors: {} },
    };
    mockUseHookForm.mockReturnValue(mockFormReturn);

    const schema = z.object({
      name: z.string(),
      children: z.array(z.lazy(() => schema)).optional(),
    });

    const props = {
      schema,
      defaultValues: {
        name: "",
        children: [],
      },
    };

    const { result } = renderHook(() => useForm(props));

    expect(mockZodResolver).toHaveBeenCalledWith(schema);
    expect(mockUseHookForm).toHaveBeenCalledWith({
      resolver: mockZodResolver(schema),
      defaultValues: props.defaultValues,
    });
    expect(result.current).toBe(mockFormReturn);
  });

  it("should handle schema with branded types", () => {
    const mockFormReturn = {
      register: vi.fn(),
      handleSubmit: vi.fn(),
      formState: { errors: {} },
    };
    mockUseHookForm.mockReturnValue(mockFormReturn);

    const Email = z.string().email().brand<"Email">();
    const Password = z.string().min(8).brand<"Password">();

    const schema = z.object({
      email: Email,
      password: Password,
    });

    const props = {
      schema,
      defaultValues: {
        email: "",
        password: "",
      },
    };

    const { result } = renderHook(() => useForm(props));

    expect(mockZodResolver).toHaveBeenCalledWith(schema);
    expect(mockUseHookForm).toHaveBeenCalledWith({
      resolver: mockZodResolver(schema),
      defaultValues: props.defaultValues,
    });
    expect(result.current).toBe(mockFormReturn);
  });

  it("should handle schema with effects", () => {
    const mockFormReturn = {
      register: vi.fn(),
      handleSubmit: vi.fn(),
      formState: { errors: {} },
    };
    mockUseHookForm.mockReturnValue(mockFormReturn);

    const schema = z.object({
      username: z
        .string()
        .min(3)
        .max(20)
        .pipe(z.string().transform(val => val.toLowerCase())),
      email: z
        .string()
        .email()
        .pipe(z.string().transform(val => val.trim())),
    });

    const props = {
      schema,
      defaultValues: {
        username: "",
        email: "",
      },
    };

    const { result } = renderHook(() => useForm(props));

    expect(mockZodResolver).toHaveBeenCalledWith(schema);
    expect(mockUseHookForm).toHaveBeenCalledWith({
      resolver: mockZodResolver(schema),
      defaultValues: props.defaultValues,
    });
    expect(result.current).toBe(mockFormReturn);
  });

  it("should handle schema with preprocess", () => {
    const mockFormReturn = {
      register: vi.fn(),
      handleSubmit: vi.fn(),
      formState: { errors: {} },
    };
    mockUseHookForm.mockReturnValue(mockFormReturn);

    const schema = z.object({
      number: z.preprocess(
        val => (val === "" ? undefined : val),
        z.number().optional()
      ),
      date: z.preprocess(
        val => (typeof val === "string" ? new Date(val) : val),
        z.date()
      ),
    });

    const props = {
      schema,
      defaultValues: {
        number: undefined,
        date: new Date(),
      },
    };

    const { result } = renderHook(() => useForm(props));

    expect(mockZodResolver).toHaveBeenCalledWith(schema);
    expect(mockUseHookForm).toHaveBeenCalledWith({
      resolver: mockZodResolver(schema),
      defaultValues: props.defaultValues,
    });
    expect(result.current).toBe(mockFormReturn);
  });

  it("should handle schema with catch", () => {
    const mockFormReturn = {
      register: vi.fn(),
      handleSubmit: vi.fn(),
      formState: { errors: {} },
    };
    mockUseHookForm.mockReturnValue(mockFormReturn);

    const schema = z.object({
      number: z.number().catch(0),
      string: z.string().catch("default"),
      boolean: z.boolean().catch(false),
    });

    const props = {
      schema,
      defaultValues: {
        number: 0,
        string: "default",
        boolean: false,
      },
    };

    const { result } = renderHook(() => useForm(props));

    expect(mockZodResolver).toHaveBeenCalledWith(schema);
    expect(mockUseHookForm).toHaveBeenCalledWith({
      resolver: mockZodResolver(schema),
      defaultValues: props.defaultValues,
    });
    expect(result.current).toBe(mockFormReturn);
  });

  it("should handle schema with superRefine", () => {
    const mockFormReturn = {
      register: vi.fn(),
      handleSubmit: vi.fn(),
      formState: { errors: {} },
    };
    mockUseHookForm.mockReturnValue(mockFormReturn);

    const schema = z
      .object({
        startDate: z.date(),
        endDate: z.date(),
      })
      .superRefine((data, ctx) => {
        if (data.startDate >= data.endDate) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Start date must be before end date",
            path: ["endDate"],
          });
        }
      });

    const now = new Date();
    const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    const props = {
      schema,
      defaultValues: {
        startDate: now,
        endDate: tomorrow,
      },
    };

    const { result } = renderHook(() => useForm(props));

    expect(mockZodResolver).toHaveBeenCalledWith(schema);
    expect(mockUseHookForm).toHaveBeenCalledWith({
      resolver: mockZodResolver(schema),
      defaultValues: props.defaultValues,
    });
    expect(result.current).toBe(mockFormReturn);
  });

  it("should handle schema with custom error map", () => {
    const mockFormReturn = {
      register: vi.fn(),
      handleSubmit: vi.fn(),
      formState: { errors: {} },
    };
    mockUseHookForm.mockReturnValue(mockFormReturn);

    const schema = z.object({
      email: z.string().email("Invalid email format"),
      password: z.string().min(8, "Password must be at least 8 characters"),
    });

    const props = {
      schema,
      defaultValues: {
        email: "",
        password: "",
      },
    };

    const { result } = renderHook(() => useForm(props));

    expect(mockZodResolver).toHaveBeenCalledWith(schema);
    expect(mockUseHookForm).toHaveBeenCalledWith({
      resolver: mockZodResolver(schema),
      defaultValues: props.defaultValues,
    });
    expect(result.current).toBe(mockFormReturn);
  });

  it("should handle schema with async validation", () => {
    const mockFormReturn = {
      register: vi.fn(),
      handleSubmit: vi.fn(),
      formState: { errors: {} },
    };
    mockUseHookForm.mockReturnValue(mockFormReturn);

    const schema = z.object({
      username: z.string().refine(async val => {
        // Simulate async validation
        await new Promise(resolve => setTimeout(resolve, 100));
        return val.length >= 3;
      }, "Username must be at least 3 characters"),
    });

    const props = {
      schema,
      defaultValues: {
        username: "",
      },
    };

    const { result } = renderHook(() => useForm(props));

    expect(mockZodResolver).toHaveBeenCalledWith(schema);
    expect(mockUseHookForm).toHaveBeenCalledWith({
      resolver: mockZodResolver(schema),
      defaultValues: props.defaultValues,
    });
    expect(result.current).toBe(mockFormReturn);
  });

  it("should handle schema with multiple refinements", () => {
    const mockFormReturn = {
      register: vi.fn(),
      handleSubmit: vi.fn(),
      formState: { errors: {} },
    };
    mockUseHookForm.mockReturnValue(mockFormReturn);

    const schema = z.object({
      password: z
        .string()
        .min(8, "Password must be at least 8 characters")
        .refine(
          val => /[A-Z]/.test(val),
          "Password must contain uppercase letter"
        )
        .refine(
          val => /[a-z]/.test(val),
          "Password must contain lowercase letter"
        )
        .refine(val => /[0-9]/.test(val), "Password must contain number")
        .refine(
          val => /[^A-Za-z0-9]/.test(val),
          "Password must contain special character"
        ),
    });

    const props = {
      schema,
      defaultValues: {
        password: "",
      },
    };

    const { result } = renderHook(() => useForm(props));

    expect(mockZodResolver).toHaveBeenCalledWith(schema);
    expect(mockUseHookForm).toHaveBeenCalledWith({
      resolver: mockZodResolver(schema),
      defaultValues: props.defaultValues,
    });
    expect(result.current).toBe(mockFormReturn);
  });

  it("should handle schema with conditional validation", () => {
    const mockFormReturn = {
      register: vi.fn(),
      handleSubmit: vi.fn(),
      formState: { errors: {} },
    };
    mockUseHookForm.mockReturnValue(mockFormReturn);

    const schema = z
      .object({
        hasAddress: z.boolean(),
        address: z.string().optional(),
        city: z.string().optional(),
        postalCode: z.string().optional(),
      })
      .refine(
        data => {
          if (data.hasAddress) {
            return data.address && data.city && data.postalCode;
          }
          return true;
        },
        {
          message: "Address fields are required when hasAddress is true",
          path: ["address"],
        }
      );

    const props = {
      schema,
      defaultValues: {
        hasAddress: false,
        address: undefined,
        city: undefined,
        postalCode: undefined,
      },
    };

    const { result } = renderHook(() => useForm(props));

    expect(mockZodResolver).toHaveBeenCalledWith(schema);
    expect(mockUseHookForm).toHaveBeenCalledWith({
      resolver: mockZodResolver(schema),
      defaultValues: props.defaultValues,
    });
    expect(result.current).toBe(mockFormReturn);
  });
});
