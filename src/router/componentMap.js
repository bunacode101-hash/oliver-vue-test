// src/router/componentMap.js
import LogIn from "@/components/auth/log-in.vue";
import SignUp from "@/components/auth/sign-up.vue";
import SignUpOnboarding from "@/components/auth/sign-up-onboarding.vue";
import SignUpOnboardingKYC from "@/components/auth/sign-up-onboarding-kyc.vue";
import SignUpOnboardingKYCStatus from "@/components/auth/sign-up/onboarding-kyc-status.vue";
import LostPassword from "@/components/auth/lost-password.vue";
import ResetPassword from "@/components/auth/reset-password.vue";
import ConfirmEmail from "@/components/auth/confirm-email.vue";
import DashboardIndex from "@/components/dashboard/index.vue";
import DashboardOverviewCreator from "@/components/dashboard/dashboardOverviewCreator.vue";
import DashboardOverviewVendor from "@/components/dashboard/dashboardOverviewVendor.vue";
import DashboardOverviewCustomer from "@/components/dashboard/dashboardOverviewCustomer.vue";
import DashboardOverviewAgent from "@/components/dashboard/dashboardOverviewAgent.vue";
import DashboardEditSettingsCreator from "@/components/dashboard/dashboardEditSettingsCreator.vue";
import DashboardMyMediaCreator from "@/components/dashboard/dashboardMyMediaCreator.vue";
import ProfileIndex from "@/components/profile/index.vue";
import DiscoverIndex from "@/components/discover/index.vue";
import ShopIndex from "@/components/shop/index.vue";
import NotFound from "@/components/NotFound.vue";
import DashboardEditProfileCreator from "@/components/dashboard/dashboardEditProfileCreator.vue";

export const componentMap = {
  "/log-in": LogIn,
  "/sign-up": SignUp,
  "/sign-up/onboarding": SignUpOnboarding,
  "/sign-up/onboarding/kyc": SignUpOnboardingKYC,
  "/sign-up/onboarding/kyc/status": SignUpOnboardingKYCStatus,
  "/lost-password": LostPassword,
  "/reset-password": ResetPassword,
  "/confirm-email": ConfirmEmail,
  "/dashboard": DashboardIndex,
  "/dashboard/overview/creator": DashboardOverviewCreator,
  "/dashboard/overview/vendor": DashboardOverviewVendor,
  "/dashboard/overview/customer": DashboardOverviewCustomer,
  "/dashboard/overview/agent": DashboardOverviewAgent,
  "/dashboard/overview/edit-profile": DashboardEditProfileCreator,
  "/dashboard/overview/settings": DashboardEditSettingsCreator,
  "/dashboard/overview/my-media": DashboardMyMediaCreator,
  "/profile": ProfileIndex,
  "/discover": DiscoverIndex,
  "/shop": ShopIndex,
  "/404": NotFound,
};
