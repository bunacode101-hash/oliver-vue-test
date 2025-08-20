import {
  signUp,
  confirmSignUp,
  signIn,
  signOut,
  updatePassword,
  resetPassword,
  confirmResetPassword,
  updateUserAttributes,
  fetchAuthSession,
  getCurrentUser,
} from "aws-amplify/auth";

function formatDateForCognito(date) {
  const pad = (n) => String(n).padStart(2, "0");
  return `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}-${pad(
    date.getUTCDate()
  )} ${pad(date.getUTCHours())}:${pad(date.getUTCMinutes())}:${pad(
    date.getUTCSeconds()
  )} UTC`;
}

export const authHandler = {
  async register(email, password, attributes = {}) {
    try {
      return await signUp({
        username: email,
        password,
        options: { userAttributes: attributes },
      });
    } catch (err) {
      console.error("Cognito signup error:", err);
      throw new Error(`Registration failed: ${err.message || "Unknown error"}`);
    }
  },

  async confirmSignUp(email, code) {
    try {
      return await confirmSignUp({
        username: email,
        confirmationCode: code,
      });
    } catch (err) {
      console.error("Cognito confirm signup error:", err);
      throw new Error(`Confirmation failed: ${err.message || "Unknown error"}`);
    }
  },

  async login(email, password) {
    try {
      await signIn({
        username: email,
        password,
      });
      const formattedDate = formatDateForCognito(new Date());
      await updateUserAttributes({
        userAttributes: {
          "custom:lastlogin": formattedDate,
        },
      });
      return await fetchAuthSession();
    } catch (err) {
      console.error("Cognito login error:", err);
      throw new Error(`Login failed: ${err.message || "Unknown error"}`);
    }
  },

  async logout() {
    try {
      await signOut();
    } catch (err) {
      console.error("Cognito logout error:", err);
      throw new Error(`Logout failed: ${err.message || "Unknown error"}`);
    }
  },

  async changePassword(currentPassword, newPassword) {
    try {
      return await updatePassword({
        oldPassword: currentPassword,
        newPassword,
      });
    } catch (err) {
      console.error("Cognito password change error:", err);
      throw new Error(
        `Password change failed: ${err.message || "Unknown error"}`
      );
    }
  },

  async forgotPassword(email) {
    try {
      return await resetPassword({
        username: email,
      });
    } catch (err) {
      console.error("Cognito forgot password error:", err);
      throw new Error(
        `Forgot password failed: ${err.message || "Unknown error"}`
      );
    }
  },

  async confirmPassword(email, code, newPassword) {
    try {
      return await confirmResetPassword({
        username: email,
        confirmationCode: code,
        newPassword,
      });
    } catch (err) {
      console.error("Cognito confirm password error:", err);
      throw new Error(
        `Password reset failed: ${err.message || "Unknown error"}`
      );
    }
  },

  async updateProfileAttributes(attributes) {
    try {
      return await updateUserAttributes({
        userAttributes: attributes,
      });
    } catch (err) {
      console.error("Cognito update attributes error:", err);
      throw new Error(
        `Attribute update failed: ${err.message || "Unknown error"}`
      );
    }
  },

  async restoreSession() {
    try {
      await getCurrentUser();
      return await fetchAuthSession();
    } catch (err) {
      console.error("Cognito session restore error:", err);
      throw new Error(
        `Session restore failed: ${err.message || "Unknown error"}`
      );
    }
  },
};
