import nextConfig from "../../next.config";

describe("next.config.ts", () => {
  it("exports a valid NextConfig object", () => {
    expect(nextConfig).toBeDefined();
    expect(typeof nextConfig).toBe("object");
  });

  it("configures themealdb.com as allowed image domain", () => {
    expect(nextConfig.images).toBeDefined();
    expect(nextConfig.images?.domains).toContain("www.themealdb.com");
  });

  it("has images configuration", () => {
    expect(nextConfig.images).toEqual({
      domains: ["www.themealdb.com"],
    });
  });

  it("allows external images from themealdb", () => {
    const domains = nextConfig.images?.domains || [];
    const hasTheMealDB = domains.some((domain) => domain.includes("themealdb.com"));
    expect(hasTheMealDB).toBe(true);
  });
});
