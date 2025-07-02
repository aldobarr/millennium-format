import { Skeleton } from '@kobalte/core/skeleton';
import { GalleryHorizontalEnd, Layers, Users } from 'lucide-solid';
import { Component, createSignal, onMount } from 'solid-js';
import { createStore } from 'solid-js/store';
import request from '../../util/Requests';

const Dashboard: Component = () => {
	const [loading, setLoading] = createSignal(true);
	const [state, setState] = createStore({
		cards: 0,
		decks: 0,
		users: 0,
	});

	onMount(async () => {
		try {
			const res = await request('/admin/dashboard');
			const response = await res.json();
			if (!response.success) {
				throw new Error((response.errors as string[]).join(', '));
			}

			setState(response.data);
		} catch (error) {
			console.error('Error fetching dashboard data:', error);
		} finally {
			setLoading(false);
		}
	});

	return (
		<section class="text-gray-200 body-font">
			<div>
				<h1>Dashboard</h1>
				<Skeleton class="skeleton mt-4" radius={10} height={400} visible={loading()}>
					<div class="flex flex-row flex-wrap gap-4 mt-4">
						<div class="min-w-xs md:w-sm max-w-sm px-6 py-4 bg-gray-900 rounded-lg shadow-md">
							<div class="flex flex-row items-center">
								<div class="bg-gray-800 p-3 rounded-xl">
									<GalleryHorizontalEnd size={32} />
								</div>
								<div class="ml-6">
									<h2 class="text-xl font-bold text-white">{state.cards}</h2>
									<p class="mt-2 text-gray-300">Total Format Cards</p>
								</div>
							</div>
						</div>
						<div class="min-w-xs md:w-sm max-w-sm px-6 py-4 bg-gray-900 rounded-lg shadow-md">
							<div class="flex flex-row items-center">
								<div class="bg-gray-800 p-3 rounded-xl">
									<Layers size={32} />
								</div>
								<div class="ml-6">
									<h2 class="text-xl font-bold text-white">{state.decks}</h2>
									<p class="mt-2 text-gray-300">Total Decks</p>
								</div>
							</div>
						</div>
						<div class="min-w-xs md:w-sm max-w-sm px-6 py-4 bg-gray-900 rounded-lg shadow-md">
							<div class="flex flex-row items-center">
								<div class="bg-gray-800 p-3 rounded-xl">
									<Users size={32} />
								</div>
								<div class="ml-6">
									<h2 class="text-xl font-bold text-white">{state.users}</h2>
									<p class="mt-2 text-gray-300">Total Users</p>
								</div>
							</div>
						</div>
					</div>
				</Skeleton>
			</div>
		</section>
	);
};

export default Dashboard;
