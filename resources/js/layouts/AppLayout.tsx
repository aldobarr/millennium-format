import { Link } from '@kobalte/core/link';
import { ChevronDown } from 'lucide-solid';
import { Accessor, Component, createContext, createSignal, For, JSXElement, Setter, Show, useContext } from 'solid-js';
import { AppContext } from '../App';
import ApplicationLogo from '../components/ApplicationLogo';
import Profile from '../components/Profile';
import Dropdown from '../components/ui/Dropdown';
import Modal from '../components/ui/Modal';
import NavLink from '../components/ui/NavLink';
import ResponsiveNavLink from '../components/ui/ResponsiveNavLink';
import { logout } from '../util/AuthHelpers';
import { locationIs } from '../util/Helpers';

export type MainContentClassContextType = {
	mainContentClass: Accessor<string>;
	setMainContentClass: Setter<string>;
};

export const MainContentClassContext = createContext<MainContentClassContextType>({} as MainContentClassContextType);
const [mainContentClass, setMainContentClass] = createSignal('');

const AppLayout: Component<{ children?: JSXElement }> = (props) => {
	const [showingNavigationDropdown, setShowingNavigationDropdown] = createSignal(false);
	const [showUserModal, setShowUserModal] = createSignal(false);
	const { appState, setAppState } = useContext(AppContext);

	return (
		<div class="flex flex-col min-h-screen justify-between">
			<nav class="bg-gray-900 border-b border-gray-800">
				<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
					<div class="flex justify-between h-16">
						<div class="flex">
							<div class="shrink-0 flex items-center">
								<Link href="/">
									<ApplicationLogo class="block h-16 w-auto text-blue-500 hover:text-blue-600" />
								</Link>
							</div>
							<div class="hidden space-x-8 sm:-my-px sm:ml-10 sm:flex">
								<NavLink href="/" active={locationIs('')} name="Home" />
								<For each={appState.nav}>
									{navItem => (
										<Show
											when={navItem.children && navItem.children.length > 0}
											fallback={(
												<Show when={!navItem.isPlaceholder}>
													<NavLink href={`/format/${navItem.slug}`} name={navItem.name} active={locationIs('format.' + navItem.slug)} />
												</Show>
											)}
										>
											<Show when={navItem.isPlaceholder}>
												<div
													class="
														group inline-flex items-center px-1 pt-1 border-b-2
														border-transparent text-sm font-medium leading-5
														text-gray-400 hover:text-blue-400 hover:border-blue-300
														focus:outline-none focus:text-blue-500 focus:border-blue-300
														transition duration-150 ease-in-out cursor-default
													"
												>
													<div class="relative">
														<div class="flex flex-row items-center">
															{navItem.name}
															<ChevronDown size={14} class="ml-1" />
														</div>
														<div class="absolute z-10 hidden bg-gray-800 text-white rounded-md shadow-lg mt-2 group-hover:block origin-top-left -left-1 min-w-35 w-auto">
															<div class="rounded-md ring-1 ring-black ring-opacity-5">
																<For each={navItem.children}>
																	{childNavItem => (
																		<Dropdown.Link href={`/format/${navItem.slug}/${childNavItem.slug}`}>
																			{childNavItem.name}
																		</Dropdown.Link>
																	)}
																</For>
															</div>
														</div>
													</div>
												</div>
											</Show>
											<Show when={!navItem.isPlaceholder}>
												<NavLink name={navItem.name} href={`/format/${navItem.slug}`} active={locationIs('format.' + navItem.slug) || locationIs('format.' + navItem.slug + '.:child')}>
													<For each={navItem.children}>
														{childNavItem => (
															<Dropdown.Link href={`/format/${navItem.slug}/${childNavItem.slug}`}>
																{childNavItem.name}
															</Dropdown.Link>
														)}
													</For>
												</NavLink>
											</Show>
										</Show>
									)}
								</For>
								<NavLink href="/decks/builder" name="Deck Builder" active={locationIs('decks.builder') || locationIs('decks.:id.builder')} />
								<NavLink href="/decks" name="Decks" show={!!appState.auth.user} active={locationIs('decks')} />
								<NavLink href="/cards" name="Format Cards" active={locationIs('cards')} />
								<NavLink href="/admin" name="Admin" show={!!appState.auth.user && appState.auth.user.isAdmin} active={false} />
							</div>
						</div>

						<div class="hidden sm:flex sm:items-center sm:ml-6 top-0 right-0 px-6 py-4">
							<Show when={!appState.auth.user}>
								<Link href="/login" class="text-sm text-gray-400 hover:text-white">
									Log in
								</Link>

								<Link href="/register" class="ml-4 text-sm text-gray-400 hover:text-white">
									Register
								</Link>
							</Show>
						</div>

						<Show when={appState.auth.user}>
							<div class="hidden sm:flex sm:items-center sm:ml-6">
								<div class="ml-3 relative">
									<Dropdown>
										<Dropdown.Trigger>
											{appState.auth.user?.name ?? ''}
										</Dropdown.Trigger>

										<Dropdown.Content>
											<Dropdown.Button onClick={() => setShowUserModal(true)}>
												Account Settings
											</Dropdown.Button>
											<Dropdown.Button onClick={() => logout(appState.auth.token!, setAppState)}>
												Log Out
											</Dropdown.Button>
										</Dropdown.Content>
									</Dropdown>
								</div>
							</div>
						</Show>

						<div class="-mr-2 flex items-center sm:hidden">
							<button
								onClick={() => setShowingNavigationDropdown(previousState => !previousState)}
								class="inline-flex items-center justify-center p-2 rounded-md text-white bg-gray-700 hover:text-gray-500 hover:bg-gray-800 focus:outline-none focus:bg-gray-800 focus:text-gray-100 transition duration-150 ease-in-out"
							>
								<svg class="h-6 w-6" stroke="currentColor" fill="none" viewBox="0 0 24 24">
									<Show
										when={showingNavigationDropdown()}
										fallback={(
											<path
												class={!showingNavigationDropdown() ? 'inline-flex' : 'hidden'}
												stroke-linecap="round"
												stroke-linejoin="round"
												stroke-width="2"
												d="M4 6h16M4 12h16M4 18h16"
											/>
										)}
									>
										<path
											class="inline-flex"
											stroke-linecap="round"
											stroke-linejoin="round"
											stroke-width="2"
											d="M6 18L18 6M6 6l12 12"
										/>
									</Show>
								</svg>
							</button>
						</div>
					</div>
				</div>

				<div class={(showingNavigationDropdown() ? 'block' : 'hidden') + ' sm:hidden'}>
					<div class="pt-2 pb-3 space-y-1">
						<ResponsiveNavLink href="/" active={locationIs('')}>
							Home
						</ResponsiveNavLink>
						<For each={appState.nav}>
							{navItem => (
								<ResponsiveNavLink href={`/format/${navItem.slug}`} active={locationIs('format.' + navItem.slug)}>
									{navItem.name}
								</ResponsiveNavLink>
							)}
						</For>
						<ResponsiveNavLink href="/decks/builder" active={locationIs('decks.builder')}>
							Deck Builder
						</ResponsiveNavLink>
						<Show when={!appState.auth.user}>
							<ResponsiveNavLink href="/cards" active={locationIs('cards')}>
								Format Cards
							</ResponsiveNavLink>
						</Show>
						<Show when={!!appState.auth.user}>
							<ResponsiveNavLink href="/decks" active={locationIs('decks')}>
								Decks
							</ResponsiveNavLink>
							<ResponsiveNavLink href="/cards" active={locationIs('cards')}>
								Format Cards
							</ResponsiveNavLink>
							<Show when={appState.auth.user!.isAdmin}>
								<ResponsiveNavLink href="/admin" active={false}>
									Admin
								</ResponsiveNavLink>
							</Show>
						</Show>
					</div>
					<Show when={appState.auth.user}>
						<div class="pt-4 pb-1 border-t border-gray-200">
							<div class="px-4">
								<div class="font-medium text-base text-gray-800">{appState.auth.user!.name}</div>
								<div class="font-medium text-sm text-gray-500">{appState.auth.user!.email}</div>
							</div>

							<div class="mt-3 space-y-1">
								<ResponsiveNavLink href="/logout" as="button">
									Log Out
								</ResponsiveNavLink>
							</div>
						</div>
					</Show>
					<Show when={!appState.auth.user}>
						<div class="pt-4 pb-1 border-t border-gray-800">
							<div class="mt-3 space-y-1">
								<ResponsiveNavLink href="/login">
									Log in
								</ResponsiveNavLink>
								<ResponsiveNavLink href="/register">
									Register
								</ResponsiveNavLink>
							</div>
						</div>
					</Show>
				</div>
			</nav>

			<main class={mainContentClass()}>
				<MainContentClassContext.Provider value={{ mainContentClass, setMainContentClass }}>
					{props.children}
				</MainContentClassContext.Provider>
			</main>
			<footer />
			<Modal
				open={showUserModal()}
				onOpenChange={setShowUserModal}
				size="xl"
			>
				<Modal.Header>
					<h2 class="text-2xl font-bold">Profile</h2>
				</Modal.Header>
				<Modal.Body>
					<Profile />
				</Modal.Body>
			</Modal>
		</div>
	);
};

export default AppLayout;
