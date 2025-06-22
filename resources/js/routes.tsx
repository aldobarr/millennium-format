import { lazy } from "solid-js";

const appRoutes = [
	{
		path: "/",
		component: lazy(() => import("./pages/Home"))
	},
	{
		path: "/login",
		component: lazy(() => import("./pages/auth/Login"))
	},
	{
		path: "/forgot/password",
		component: lazy(() => import("./pages/auth/ForgotPassword"))
	},
	{
		path: "/forgot/password/:token",
		component: lazy(() => import("./pages/auth/ResetPassword"))
	},
	{
		path: "/register",
		component: lazy(() => import("./pages/auth/Register"))
	},
	{
		path: "/verify/email/:token",
		component: lazy(() => import("./pages/auth/VerifyEmail"))
	},
	{
		path: "*404",
		component: lazy(() => import("./pages/404"))
	}
];

const adminRoutes = [
	{
		path: "/",
		component: lazy(() => import("./pages/admin/Dashboard"))
	},
	{
		path: "/dashboard",
		component: lazy(() => import("./pages/admin/Dashboard"))
	},
	{
		path: "/cards",
		component: lazy(() => import("./pages/admin/Cards"))
	},
	{
		path: "/categories",
		component: lazy(() => import("./pages/admin/Categories"))
	},
	{
		path: "/tags",
		component: lazy(() => import("./pages/admin/Tags"))
	},
	{
		path: "*404",
		component: lazy(() => import("./pages/404"))
	}
]

const routes = [
	{
		path: "/",
		component: lazy(() => import("./layouts/AppLayout")),
		children: appRoutes
	},
	{
		path: "/admin",
		component: lazy(() => import("./layouts/AdminLayout")),
		children: adminRoutes
	}
];

export default routes;