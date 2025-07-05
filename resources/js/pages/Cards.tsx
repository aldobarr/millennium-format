import { Separator } from '@kobalte/core/separator';
import { Skeleton } from '@kobalte/core/skeleton';
import { Switch } from '@kobalte/core/switch';
import { createInfiniteScroll } from '@solid-primitives/pagination';
import { createOptions, CreateSelectValue, Select as SolidSelect } from '@thisbeyond/solid-select';
import { batch, Component, createSignal, For, onCleanup, onMount, Show, useContext } from 'solid-js';
import { Input } from '../components/ui/Input';
import Label from '../components/ui/Label';
import Spinner from '../components/ui/Spinner';
import CardName from '../interfaces/CardName';
import SearchCard from '../interfaces/SearchCard';
import { MainContentClassContext } from '../layouts/AppLayout';
import request from '../util/Requests';

const CARDS_PER_PAGE = 50;
const Cards: Component = () => {
	const [searchTerm, setSearchTerm] = createSignal<string>('');
	const [dm, setDM] = createSignal<number | null>(null);
	const [loading, setLoading] = createSignal<boolean>(true);
	const [cardNames, setCardNames] = createSignal<CardName[]>([]);
	const [excludeMonsters, setExcludeMonsters] = createSignal<boolean>(false);
	const [excludeSpells, setExcludeSpells] = createSignal<boolean>(false);
	const [excludeTraps, setExcludeTraps] = createSignal<boolean>(false);
	const [maxLevel, setMaxLevel] = createSignal<number | string>('');
	const { setMainContentClass } = useContext(MainContentClassContext);

	onMount(async () => {
		setMainContentClass('mb-auto');

		try {
			const res = await request('/cards/masters');
			const response = await res.json();
			if (!response.success) {
				throw new Error(Array.isArray(response.errors) ? response.errors.join(', ') : (Object.values(response.errors) as string[][]).flat().join(', '));
			}

			setCardNames(response.data);
			setLoading(false);
		} catch (error) {
			console.error('Error fetching data:', error);
		}
	});

	const fetcher = (page: number) => {
		page++;

		return new Promise<SearchCard[]>((resolve, reject) => {
			const params = new URLSearchParams();
			params.set('page', page.toString());
			params.set('per_page', CARDS_PER_PAGE.toString());
			if (searchTerm().length > 0) {
				params.set('term', searchTerm());
			}

			if (dm()) {
				params.set('dm', dm()!.toString());
			}

			if (excludeMonsters()) {
				params.set('exclude_monsters', '1');
			}

			if (excludeSpells()) {
				params.set('exclude_spells', '1');
			}

			if (excludeTraps()) {
				params.set('exclude_traps', '1');
			}

			if (maxLevel()) {
				params.set('max_level', Number(maxLevel()).toString());
			}

			request('/search?' + params.toString())
				.then(res => res.json())
				.then((response) => {
					if (!response.success) {
						reject(new Error(Array.isArray(response.errors) ? response.errors.join(', ') : (Object.values(response.errors) as string[][]).flat()));
						return;
					}

					resolve(response.data as SearchCard[]);
					setEnd(response.meta.current_page === response.meta.last_page);
				}).catch(err => reject(err));
		});
	};

	const [pages, setEl, { setPage, setPages, end, setEnd }] = createInfiniteScroll(fetcher);

	const resetPage = async () => {
		batch(async () => {
			setPage(0);
			setPages(await fetcher(0));
		});
	};

	const setDeckMaster = (value: CreateSelectValue) => {
		const newVal = value?.id ?? null;
		if (newVal === dm()) {
			return;
		}

		setDM(value?.id ?? null);
		resetPage();
	};

	const changeSearchTerm = (term: string) => {
		if (term === searchTerm()) {
			return;
		}

		setSearchTerm(term);
		resetPage();
	};

	const changeMaxLevel = (level: string) => {
		if (level === searchTerm()) {
			return;
		}

		setMaxLevel(level);
		resetPage();
	};

	const changeExcludeMonsters = (checked: boolean) => {
		if (checked === excludeMonsters()) {
			return;
		}

		setExcludeMonsters(checked);
		resetPage();
	};

	const changeExcludeSpells = (checked: boolean) => {
		if (checked === excludeSpells()) {
			return;
		}

		setExcludeSpells(checked);
		resetPage();
	};

	const changeExcludeTraps = (checked: boolean) => {
		if (checked === excludeTraps()) {
			return;
		}

		setExcludeTraps(checked);
		resetPage();
	};

	onCleanup(() => setMainContentClass(''));

	return (
		<section class="text-gray-400 body-font">
			<h1 class="mx-6 mb-2 mt-6 md:mx-12 md:my-6 text-3xl font-bold mb-4 text-start">
				<div class="mb-2">Format Cards</div>
				<Separator />
			</h1>
			<div class="mx-6 md:mx-12">
				<Skeleton class="flex flex-col gap-4 skeleton" radius={10} height={400} visible={loading()}>
					<div class="px-6 py-6 flex flex-col items-start bg-gray-900 rounded-md">
						<div class="flex flex-col md:flex-row gap-4 py-2 w-full">
							<div class="relative flex-grow">
								<Label for="deck_master" class="leading-7 text-sm text-gray-100" value="Limit For Deck Master" />
								<Show when={!loading()}>
									<SolidSelect
										class="dark-bg mt-1"
										name="deck_master"
										onChange={setDeckMaster}
										{...createOptions(([{ id: null, name: 'NONE' }] as CardName[]).concat(cardNames().filter(card => dm() !== card.id)), { filterable: true, key: 'name' })}
									/>
								</Show>
							</div>
							<div class="relative flex-grow">
								<Label for="search" class="leading-7 text-sm text-gray-100" value="Limit By Search Term" />
								<Input
									type="text"
									name="search"
									class="mt-1 block w-full"
									value={searchTerm()}
									handleChange={e => changeSearchTerm(e.currentTarget.value)}
									darkBg
								/>
							</div>
						</div>
						<div class="py-2 w-full">
							<div class="flex flex-row justify-start">
								<div class="flex flex-row items-center">
									<Label for="max_level" class="leading-7 text-sm text-gray-100" value="Max Level" />
									<Input
										type="number"
										min={0}
										max={100}
										name="max_level"
										class="ml-1 block w-15"
										value={maxLevel()}
										handleChange={e => changeMaxLevel(e.currentTarget.value)}
										darkBg
									/>
								</div>
								<Switch
									class="switch ml-5"
									checked={excludeMonsters()}
									onChange={checked => changeExcludeMonsters(checked)}
								>
									<Switch.Label class="switch__label">Exclude Monsters</Switch.Label>
									<Switch.Input class="switch__input" />
									<Switch.Control class="switch__control">
										<Switch.Thumb class="switch__thumb" />
									</Switch.Control>
								</Switch>
								<Switch
									class="switch ml-5"
									checked={excludeSpells()}
									onChange={checked => changeExcludeSpells(checked)}
								>
									<Switch.Label class="switch__label">Exclude Spells</Switch.Label>
									<Switch.Input class="switch__input" />
									<Switch.Control class="switch__control">
										<Switch.Thumb class="switch__thumb" />
									</Switch.Control>
								</Switch>
								<Switch
									class="switch ml-5"
									checked={excludeTraps()}
									onChange={checked => changeExcludeTraps(checked)}
								>
									<Switch.Label class="switch__label">Exclude Traps</Switch.Label>
									<Switch.Input class="switch__input" />
									<Switch.Control class="switch__control">
										<Switch.Thumb class="switch__thumb" />
									</Switch.Control>
								</Switch>
							</div>
						</div>
					</div>
					<div class="md:mb-12 px-6 py-6 flex flex-col items-start bg-gray-900 rounded-md">
						<div class="flex flex-wrap min-h-[212px]">
							<For each={pages()}>
								{card => (
									<div class="min-w-[144px] m-1">
										<img
											src={card.image}
											alt={card.name}
											class="card relative z-10 hover:z-50 min-w-[144px] max-w-[144px] ease-in duration-200 hover:scale-[2.08]"
											draggable={false}
										/>
									</div>
								)}
							</For>
						</div>
						<Show when={!end()}>
							<h1 class="animate-pulse flex flex-row mx-auto items-center mt-4" ref={setEl}>
								<Spinner />
								<div class="ml-2">Loading...</div>
							</h1>
						</Show>
					</div>
				</Skeleton>
			</div>
		</section>

	);
};

export default Cards;
