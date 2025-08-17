const eagerSection = import.meta.env.VITE_EAGER_SECTION;

if (eagerSection) {
  console.log(`[EAGER] Pre-importing section "${eagerSection}"`);
  const imports = [];
  switch (eagerSection) {
    case "auth":
      imports.push(import("@/components/auth/log-in.vue"));
      imports.push(import("@/components/auth/sign-up.vue"));
      imports.push(import("@/components/auth/sign-up-onboarding.vue"));
      imports.push(import("@/components/auth/sign-up-onboarding-kyc.vue"));
      imports.push(
        import("@/components/auth/sign-up/onboarding-kyc-status.vue")
      );
      imports.push(import("@/components/auth/lost-password.vue"));
      imports.push(import("@/components/auth/reset-password.vue"));
      imports.push(import("@/components/auth/confirm-email.vue"));
      break;
    case "dashboard":
      imports.push(import("@/components/dashboard/index.vue"));
      imports.push(
        import("@/components/dashboard/dashboardOverviewCreator.vue")
      );
      imports.push(
        import("@/components/dashboard/dashboardOverviewVendor.vue")
      );
      imports.push(
        import("@/components/dashboard/dashboardOverviewCustomer.vue")
      );
      imports.push(import("@/components/dashboard/dashboardOverviewAgent.vue"));
      imports.push(
        import("@/components/dashboard/dashboardEditProfileCreator.vue")
      );
      imports.push(
        import("@/components/dashboard/dashboardEditSettingsCreator.vue")
      );
      imports.push(
        import("@/components/dashboard/dashboardMyMediaCreator.vue")
      );
      break;
    case "profile":
      imports.push(import("@/components/profile/index.vue"));
      break;
    case "discover":
      imports.push(import("@/components/discover/index.vue"));
      break;
    case "shop":
      imports.push(import("@/components/shop/index.vue"));
      break;
    case "misc":
      imports.push(import("@/components/NotFound.vue"));
      break;
  }
  Promise.allSettled(imports).then((results) => {
    results.forEach((result, index) => {
      if (result.status === "fulfilled") {
        console.log(
          `[EAGER] Successfully pre-imported component ${
            index + 1
          } for section "${eagerSection}"`
        );
      } else {
        console.error(
          `[EAGER] Failed to pre-import component ${
            index + 1
          } for section "${eagerSection}":`,
          result.reason
        );
      }
    });
    console.log(`[EAGER] Section "${eagerSection}" pre-import completed.`);
  });
}
