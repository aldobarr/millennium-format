import { lazy } from "solid-js";

const routes = [
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

export default routes;