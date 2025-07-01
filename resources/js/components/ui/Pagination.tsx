import { Component, For, Show } from 'solid-js';
import { ChevronLeft, ChevronRight } from 'lucide-solid';
import ApiResponse from '../../interfaces/api/ApiResponse';
import request from '../../util/Requests';

const Pagination: Component<{
	data: ApiResponse<any>; // eslint-disable-line @typescript-eslint/no-explicit-any
	updateData: (newData: ApiResponse<any>) => void; // eslint-disable-line @typescript-eslint/no-explicit-any
	showSummary?: boolean;
	class?: string;
}> = (props) => {
	const prev = '« Previous';
	const next = 'Next »';

	const hasPages = () => {
		return currentPage() != 1 || hasMorePages();
	};

	const currentPage = () => {
		return props.data.meta!.current_page;
	};

	const lastPage = () => {
		return props.data.meta!.last_page;
	};

	const hasMorePages = () => {
		return currentPage() < lastPage();
	};

	const onFirstPage = () => {
		return props.data.meta!.current_page === props.data.meta!.from;
	};

	const navigateToLink = async (link: string | null) => {
		if (link == null) {
			return;
		}

		try {
			const res = await request(link);
			const response = await res.json();
			props.updateData(response);
		} catch (error) {
			console.error('Error fetching tags:', error);
		}
	};

	return (
		<Show when={hasPages()}>
			<nav role="navigation" aria-label="Pagination Navigation" class={`${props.class} flex items-center justify-between`}>
				<div class="flex justify-between flex-1 sm:hidden">
					{ onFirstPage()
						? (
								<span class="inline-flex items-center px-4 py-2 bg-blue-500 border border-transparent rounded-md font-semibold text-xs text-white uppercase tracking-widest hover:bg-blue-600 active:bg-blue-700 focus:outline-none opacity-25 transition ease-in-out duration-150">
									{ prev }
								</span>
							)
						: (
								<button onClick={() => navigateToLink(props.data.links!.prev)} class="cursor-pointer inline-flex items-center px-4 py-2 bg-blue-500 border border-transparent rounded-md font-semibold text-xs text-white uppercase tracking-widest hover:bg-blue-600 active:bg-blue-700 focus:outline-none transition ease-in-out duration-150">
									{ prev }
								</button>
							)}

					{ hasMorePages()
						? (
								<button onClick={() => navigateToLink(props.data.links!.next)} class="cursor-pointer inline-flex items-center px-4 py-2 bg-blue-500 border border-transparent rounded-md font-semibold text-xs text-white uppercase tracking-widest hover:bg-blue-600 active:bg-blue-700 focus:outline-none transition ease-in-out duration-150">
									{ next }
								</button>
							)
						: (
								<span class="inline-flex items-center px-4 py-2 bg-blue-500 border border-transparent rounded-md font-semibold text-xs text-white uppercase tracking-widest hover:bg-blue-600 active:bg-blue-700 focus:outline-none opacity-25 transition ease-in-out duration-150">
									{ next }
								</span>
							)}
				</div>

				<div class="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
					<Show when={props.showSummary}>
						<div>
							<p class="text-sm leading-5">
								Showing
								{' '}
								<span class="font-medium">{props.data.meta!.from}</span>
								{' '}
								to
								{' '}
								<span class="font-medium">{props.data.meta!.to}</span>
								{' '}
								of
								{' '}
								<span class="font-medium">{props.data.meta!.total}</span>
								{' '}
								results
							</p>
						</div>
					</Show>

					<div>
						<span class="relative z-0 inline-flex shadow-sm rounded-md">
							<Show
								when={onFirstPage()}
								fallback={(
									<button onClick={() => navigateToLink(props.data.links!.prev)} class="cursor-pointer relative inline-flex items-center px-2 py-2 text-sm font-medium text-white bg-blue-500 border border-transparent rounded-l-md leading-5 hover:text-gray-200 focus:z-10 focus:outline-none active:bg-blue-600 transition ease-in-out duration-150" aria-label={prev}>
										<ChevronLeft />
									</button>
								)}
							>
								<span aria-disabled="true" aria-label={prev}>
									<span class="relative inline-flex items-center px-2 py-2 text-sm font-medium text-white bg-blue-500 opacity-80 border border-transparent cursor-default rounded-l-md min-h-[46px]" aria-hidden="true">
										<ChevronLeft />
									</span>
								</span>
							</Show>
							<Show when={props.data.meta!.links}>
								<For each={props.data.meta!.links}>
									{link => (
										<Show
											when={link.label.includes('&')}
											fallback={(
												<Show
													when={link.url == null || link.label == '...' || link.active}
													fallback={(
														<button onClick={() => navigateToLink(link.url)} class="cursor-pointer relative inline-flex items-center px-4 py-2 -ml-px text-sm font-medium text-white bg-blue-500 border border-transparent leading-5 hover:text-gray-200 focus:z-10 focus:outline-none active:bg-blue-600 transition ease-in-out duration-150" aria-label={`Go to page ${link.label}`}>
															{link.label}
														</button>
													)}
												>
													<span aria-disabled="true">
														<span class="relative inline-flex items-center px-4 py-2 -ml-px text-sm font-medium text-white opacity-80 bg-blue-500 border border-transparent cursor-default leading-7">{link.label}</span>
													</span>
												</Show>
											)}
										>
											<></>
										</Show>
									)}
								</For>
							</Show>
							<Show
								when={hasMorePages()}
								fallback={(
									<span aria-disabled="true" aria-label={next}>
										<span class="relative inline-flex items-center px-2 py-2 -ml-px text-sm font-medium text-white opacity-80 bg-blue-500 border border-transparent cursor-default rounded-r-md min-h-[46px]" aria-hidden="true">
											<ChevronRight />
										</span>
									</span>
								)}
							>
								<button onClick={() => navigateToLink(props.data.links!.next)} class="cursor-pointer relative inline-flex items-center px-2 py-2 -ml-px text-sm font-medium text-white bg-blue-500 border border-transparent rounded-r-md leading-5 hover:text-gray-200 focus:z-10 active:bg-blue-600 transition ease-in-out duration-150" aria-label={next}>
									<ChevronRight />
								</button>
							</Show>
						</span>
					</div>
				</div>
			</nav>
		</Show>
	);
};

export default Pagination;
