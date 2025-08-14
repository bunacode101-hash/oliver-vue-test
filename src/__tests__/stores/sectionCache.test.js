import { createPinia, setActivePinia } from "pinia";
import { describe, it, expect, beforeEach } from "vitest";
import { useSectionCache } from "@/stores/sectionCache";

describe("SectionCache Store", () => {
  beforeEach(() => {
    const pinia = createPinia();
    setActivePinia(pinia);
    localStorage.clear();
  }); 

  it("hydrates with matching version and persists warm state", () => {
    const store = useSectionCache();
    const version = "1.0.0";

    // Simulate stored data
    localStorage.setItem("sectionWarmStateVersion", version);
    localStorage.setItem("sectionWarmState", JSON.stringify({ auth: true }));

    store.hydrate(version);
    expect(store.warmSections).toEqual({ auth: true });
    expect(store.isSectionWarm("auth")).toBe(true);
  });

  it("resets on version mismatch", () => {
    const store = useSectionCache();
    localStorage.setItem("sectionWarmStateVersion", "old");
    localStorage.setItem("sectionWarmState", JSON.stringify({ auth: true }));

    store.hydrate("new");
    expect(store.warmSections).toEqual({});
    expect(localStorage.getItem("sectionWarmStateVersion")).toBe("new");
  });

  it("marks and persists sections as warm", () => {
    const store = useSectionCache();
    store.markSectionWarm("dashboard");
    expect(store.isSectionWarm("dashboard")).toBe(true);
    expect(JSON.parse(localStorage.getItem("sectionWarmState"))).toEqual({
      dashboard: true,
    });
  });

  it("clears all state", () => {
    const store = useSectionCache();
    store.markSectionWarm("auth");
    store.clearAll("2.0.0");
    expect(store.warmSections).toEqual({});
    expect(store.appVersion).toBe("2.0.0");
  });
});
