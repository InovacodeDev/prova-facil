import React from "react";
import { createRouter, createRootRoute, createRoute } from "@tanstack/react-router";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import NewAssessment from "./pages/NewAssessment";
import MyAssessments from "./pages/MyAssessments";
import Templates from "./pages/Templates";
import Profile from "./pages/Profile";
import ChangePassword from "./pages/ChangePassword";
import Plan from "./pages/Plan";
import Usage from "./pages/Usage";
import NotFound from "./pages/NotFound";

// Create a root route and child routes to mirror the existing react-router-dom paths.
// Create routes using the helper factories which align with the v1 API and TypeScript types.
// Root route created with default options; keep it minimal to satisfy types.
const rootRoute = createRootRoute();

export const indexRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: "/",
    component: Index,
});

export const authRoute = createRoute({ getParentRoute: () => rootRoute, path: "/auth", component: Auth });
export const dashboardRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: "/dashboard",
    component: Dashboard,
});
export const newAssessmentRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: "/new-assessment",
    component: NewAssessment,
});
export const myAssessmentsRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: "/my-assessments",
    component: MyAssessments,
});
export const templatesRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: "/templates",
    component: Templates,
});
export const profileRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: "/profile",
    component: Profile,
});
export const changePasswordRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: "/change-password",
    component: ChangePassword,
});
export const planRoute = createRoute({ getParentRoute: () => rootRoute, path: "/plan", component: Plan });
export const usageRoute = createRoute({ getParentRoute: () => rootRoute, path: "/usage", component: Usage });
export const notFoundRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: "*",
    component: NotFound,
});

// Create the router. We avoid an explicit ts-ignore and instead provide a lightweight cast
// on the routeTree to keep compilation deterministic while we finish typing.
const routeTree = rootRoute.addChildren([
    indexRoute,
    authRoute,
    dashboardRoute,
    newAssessmentRoute,
    myAssessmentsRoute,
    templatesRoute,
    usageRoute,
    planRoute,
    profileRoute,
    changePasswordRoute,
    notFoundRoute,
]);

const router = createRouter({
    routeTree,
});

export default router;
