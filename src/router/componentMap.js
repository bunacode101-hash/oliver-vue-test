// src/router/componentMap.js
import LogIn from "@/views/components/auth/log-in.vue";
import SignUp from "@/views/components/auth/sign-up.vue";
import SignUpOnboarding from "@/views/components/auth/sign-up-onboarding.vue";
import SignUpOnboardingKYC from "@/views/components/auth/sign-up-onboarding-kyc.vue";
import SignUpOnboardingKYCStatus from "@/views/components/auth/sign-up/onboarding-kyc-status.vue";
import LostPassword from "@/views/components/auth/lost-password.vue";
import ResetPassword from "@/views/components/auth/reset-password.vue";
import ConfirmEmail from "@/views/components/auth/confirm-email.vue";
import DashboardOverviewCreator from "@/views/components/dashboard/dashboardOverviewCreator.vue";
import DashboardOverviewVendor from "@/views/components/dashboard/dashboardOverviewVendor.vue";
import DashboardOverviewCustomer from "@/views/components/dashboard/dashboardOverviewCustomer.vue";
import DashboardOverviewAgent from "@/views/components/dashboard/dashboardOverviewAgent.vue";
import NotFound from "@/views/components/NotFound.vue";

export const componentMap = {
  "/log-in": LogIn,
  "/sign-up": SignUp,
  "/sign-up/onboarding": SignUpOnboarding,
  "/sign-up/onboarding/kyc": SignUpOnboardingKYC,
  "/sign-up/onboarding/kyc/status": SignUpOnboardingKYCStatus,
  "/lost-password": LostPassword,
  "/reset-password": ResetPassword,
  "/confirm-email": ConfirmEmail,
  "/dashboard/overview/creator": DashboardOverviewCreator,
  "/dashboard/overview/vendor": DashboardOverviewVendor,
  "/dashboard/overview/customer": DashboardOverviewCustomer,
  "/dashboard/overview/agent": DashboardOverviewAgent,
  "/404": NotFound,
};
