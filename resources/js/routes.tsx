import { lazy } from 'solid-js';

const appRoutes = [
	{
		path: '/',
		component: lazy(() => import('./pages/Home')),
	},
	{
		path: '/decks',
		component: lazy(() => import('./pages/Decks')),
	},
	{
		path: '/decks/:id?/builder',
		component: lazy(() => import('./pages/DeckBuilder')),
		matchFilters: {
			id: /^\d+$/,
		},
	},
	{
		path: '/decks/:id?/viewer',
		component: lazy(() => import('./pages/DeckViewer')),
		matchFilters: {
			id: /^\d+$/,
		},
	},
	{
		path: '/cards',
		component: lazy(() => import('./pages/Cards')),
	},
	{
		path: '/format/:page/:child?',
		component: lazy(() => import('./pages/FormatPage')),
	},
	{
		path: '/login',
		component: lazy(() => import('./pages/auth/Login')),
	},
	{
		path: '/forgot/password',
		component: lazy(() => import('./pages/auth/ForgotPassword')),
	},
	{
		path: '/forgot/password/:token',
		component: lazy(() => import('./pages/auth/ResetPassword')),
	},
	{
		path: '/register',
		component: lazy(() => import('./pages/auth/Register')),
	},
	{
		path: '/verify/email/:token',
		component: lazy(() => import('./pages/auth/VerifyEmail')),
	},
	{
		path: '*404',
		component: lazy(() => import('./pages/404')),
	},
];

const adminRoutes = [
	{
		path: '/',
		component: lazy(() => import('./pages/admin/Dashboard')),
	},
	{
		path: '/dashboard',
		component: lazy(() => import('./pages/admin/Dashboard')),
	},
	{
		path: '/cards',
		component: lazy(() => import('./pages/admin/Cards')),
	},
	{
		path: '/decks',
		component: lazy(() => import('./pages/admin/Decks')),
	},
	{
		path: '/tags',
		component: lazy(() => import('./pages/admin/Tags')),
	},
	{
		path: '/pages',
		component: lazy(() => import('./pages/admin/Pages')),
	},
	{
		path: '/pages/new',
		component: lazy(() => import('./pages/admin/Page')),
	},
	{
		path: '/pages/:id?',
		component: lazy(() => import('./pages/admin/Page')),
		matchFilters: {
			id: /^\d+$/,
		},
	},
	{
		path: '/users',
		component: lazy(() => import('./pages/admin/Users')),
	},
	{
		path: '*404',
		component: lazy(() => import('./pages/404')),
	},
];

const routes = [
	{
		path: '/',
		component: lazy(() => import('./layouts/AppLayout')),
		children: appRoutes,
	},
	{
		path: '/admin',
		component: lazy(() => import('./layouts/AdminLayout')),
		children: adminRoutes,
	},
];

export default routes;
