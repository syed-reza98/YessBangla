export const lovable = {
  auth: {
    signInWithOAuth: async (_provider: any, _opts?: any) => {
      return { error: new Error("Social login not configured. Please use phone/email sign-in.") };
    },
  },
};
