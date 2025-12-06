// Performance optimization for dashboard
// Issue #105: Dashboard loading optimization

import { lazy, Suspense } from "react";

// Lazy load heavy components
const InventoryPage = lazy(() => import("./inventory/page"));
const ShoppingPage = lazy(() => import("./shopping/page"));
const RecommenderPage = lazy(() => import("./recommender/page"));

// Loading fallback
const LoadingFallback = () => (
  <div className="flex items-center justify-center h-screen">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
  </div>
);

export const dashboardModules = {
  inventory: { Component: InventoryPage, fallback: LoadingFallback },
  shopping: { Component: ShoppingPage, fallback: LoadingFallback },
  recommender: { Component: RecommenderPage, fallback: LoadingFallback },
};
