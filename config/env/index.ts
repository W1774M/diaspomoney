export const config = {
  apiUrl: process.env["NEXT_PUBLIC_API_URL"] || "http://localhost:3000/api",
  environment: process.env.NODE_ENV || "development",
  isProduction: process.env.NODE_ENV === "production",
  isDevelopment: process.env.NODE_ENV === "development",
  isTest: process.env.NODE_ENV === "test",
  smtp: {
    host: process.env["SMTP_HOST"] || "smtp.gmail.com",
    port: parseInt(process.env["SMTP_PORT"] || "587"),
    user: process.env["SMTP_USER"],
    pass: process.env["SMTP_PASS"],
  },
} as const;

export type Config = typeof config;
