export const env = {
  API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000',
  WEB_URL: process.env.WEB_URL || 'http://localhost:3000',
} as const;