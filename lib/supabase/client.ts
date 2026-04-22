// 🔥 TEMP DISABLED SUPABASE (FOR DEPLOY)

export const supabase = {
  auth: {
    getUser: async () => ({ data: { user: null } }),
  },
  from: () => ({
    select: () => ({
      eq: () => ({
        single: async () => ({ data: null }),
      }),
    }),
  }),
};