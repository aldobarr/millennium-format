import { Separator } from '@kobalte/core/separator';
import { Skeleton } from '@kobalte/core/skeleton';
import { Switch } from '@kobalte/core/switch';
import { Tooltip } from '@kobalte/core/tooltip';
import { createInfiniteScroll } from '@solid-primitives/pagination';
import { createOptions, CreateSelectValue, Select as SolidSelect } from '@thisbeyond/solid-select';
import { batch, Component, createSignal, For, onCleanup, onMount, Show, useContext } from 'solid-js';
import { Input, Select } from '../components/ui/Input';
import Label from '../components/ui/Label';
import Spinner from '../components/ui/Spinner';
import Attribute from '../enums/Attribute';
import Property from '../enums/Property';
import CardName from '../interfaces/CardName';
import SearchCard from '../interfaces/SearchCard';
import { MainContentClassContext } from '../layouts/AppLayout';
import request from '../util/Requests';

const CARDS_PER_PAGE = 50;
const Cards: Component = () => {
	const [fetching, setFetching] = createSignal<boolean>(false);
	const [searchTerm, setSearchTerm] = createSignal<string>('');
	const [dm, setDM] = createSignal<number | null>(null);
	const [loading, setLoading] = createSignal<boolean>(true);
	const [cardNames, setCardNames] = createSignal<CardName[]>([]);
	const [allMonsterTypes, setAllMonsterTypes] = createSignal<{ id: number; type: string }[]>([]);
	const [excludeMonsters, setExcludeMonsters] = createSignal<boolean>(false);
	const [excludeSpells, setExcludeSpells] = createSignal<boolean>(false);
	const [excludeTraps, setExcludeTraps] = createSignal<boolean>(false);
	const [excludeNonLegendaries, setExcludeNonLegendaries] = createSignal<boolean>(false);
	const [maxLevel, setMaxLevel] = createSignal<number | string>('');
	const [properties, setProperties] = createSignal<string[]>([]);
	const [attributes, setAttributes] = createSignal<string[]>([]);
	const [monsterTypes, setMonsterTypes] = createSignal<number[]>([]);
	const [matchAllMonsterTypes, setMatchAllMonsterTypes] = createSignal<boolean>(false);
	const [tooltipOpen, setTooltipOpen] = createSignal<number>(-1);
	const [limit, setLimit] = createSignal<string>('');
	const [limitBy, setLimitBy] = createSignal<string>('=');
	const [minAtk, setMinAtk] = createSignal<string>('');
	const [maxAtk, setMaxAtk] = createSignal<string>('');
	const [minDef, setMinDef] = createSignal<string>('');
	const [maxDef, setMaxDef] = createSignal<string>('');
	const { setMainContentClass } = useContext(MainContentClassContext);

	onMount(async () => {
		setMainContentClass('mb-auto');

		const fetchMasters = async () => {
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
		};

		const fetchMonsterTypes = async () => {
			try {
				const res = await request('/cards/monster/types');
				const response = await res.json();
				if (!response.success) {
					throw new Error(Array.isArray(response.errors) ? response.errors.join(', ') : (Object.values(response.errors) as string[][]).flat().join(', '));
				}

				setAllMonsterTypes(response.data);
				setLoading(false);
			} catch (error) {
				console.error('Error fetching data:', error);
			}
		};

		await Promise.all([
			fetchMasters(),
			fetchMonsterTypes(),
		]);
	});

	const fetcher = (page: number) => {
		page++;
		if (fetching()) {
			return Promise.resolve([]);
		}

		setFetching(true);
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

			if (excludeNonLegendaries()) {
				params.set('exclude_non_legendaries', '1');
			}

			if (properties().length > 0) {
				properties().forEach(property => params.append('properties[]', property));
			}

			if (attributes().length > 0) {
				attributes().forEach(attribute => params.append('attributes[]', attribute));
			}

			if (monsterTypes().length > 0) {
				monsterTypes().forEach(type => params.append('monster_types[]', type.toString()));
				params.append('match_all_monster_types', matchAllMonsterTypes() ? '1' : '0');
			}

			if (maxLevel()) {
				params.set('max_level', Number(maxLevel()).toString());
			}

			if (limit().length > 0) {
				params.set('limit', Number(limit()).toString());
				params.set('limit_by', limitBy());
			}

			if (minAtk().length > 0) {
				params.set('min_atk', Number(minAtk()).toString());
			}

			if (maxAtk().length > 0) {
				params.set('max_atk', Number(maxAtk()).toString());
			}

			if (minDef().length > 0) {
				params.set('min_def', Number(minDef()).toString());
			}

			if (maxDef().length > 0) {
				params.set('max_def', Number(maxDef()).toString());
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
				}).catch(err => reject(err)).finally(() => setFetching(false));
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

	const changeExcludeNonLegendaries = (checked: boolean) => {
		if (checked === excludeNonLegendaries()) {
			return;
		}

		setExcludeNonLegendaries(checked);
		resetPage();
	};

	const changeProperties = (value: CreateSelectValue[]) => {
		setProperties(value);
		resetPage();
	};

	const changeAttributes = (value: CreateSelectValue[]) => {
		setAttributes(value);
		resetPage();
	};

	const changeMonsterTypes = (value: CreateSelectValue[]) => {
		setMonsterTypes(value.map(v => v.id));
		resetPage();
	};

	const changeMatchAllMonsterTypes = (checked: boolean) => {
		setMatchAllMonsterTypes(checked);

		if (monsterTypes().length > 0) {
			resetPage();
		}
	};

	const changeLimitBy = (value: CreateSelectValue) => {
		const newVal = value ?? '=';
		setLimitBy(newVal);

		if (limit().length > 0) {
			resetPage();
		}
	};

	const changeLimit = (value: string) => {
		if (value === limit()) {
			return;
		}

		setLimit(value);
		resetPage();
	};

	const changeMinAtk = (value: string) => {
		setMinAtk(value);
		resetPage();
	};

	const changeMaxAtk = (value: string) => {
		setMaxAtk(value);
		resetPage();
	};

	const changeMinDef = (value: string) => {
		setMinDef(value);
		resetPage();
	};

	const changeMaxDef = (value: string) => {
		setMaxDef(value);
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
							<div class="flex flex-col md:flex-row justify-start">
								<div class="flex flex-row items-center">
									<Label for="max_level" class="leading-7 text-sm text-gray-100 whitespace-nowrap" value="Max Level" />
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
									class="switch ml-0 mt-2 md:ml-5 md:mt-0"
									checked={excludeMonsters()}
									onChange={checked => changeExcludeMonsters(checked)}
								>
									<Switch.Label class="switch__label whitespace-nowrap">Exclude Monsters</Switch.Label>
									<Switch.Input class="switch__input" />
									<Switch.Control class="switch__control">
										<Switch.Thumb class="switch__thumb" />
									</Switch.Control>
								</Switch>
								<Switch
									class="switch ml-0 mt-2 md:ml-5 md:mt-0"
									checked={excludeSpells()}
									onChange={checked => changeExcludeSpells(checked)}
								>
									<Switch.Label class="switch__label whitespace-nowrap">Exclude Spells</Switch.Label>
									<Switch.Input class="switch__input" />
									<Switch.Control class="switch__control">
										<Switch.Thumb class="switch__thumb" />
									</Switch.Control>
								</Switch>
								<Switch
									class="switch ml-0 mt-2 md:ml-5 md:mt-0"
									checked={excludeTraps()}
									onChange={checked => changeExcludeTraps(checked)}
								>
									<Switch.Label class="switch__label whitespace-nowrap">Exclude Traps</Switch.Label>
									<Switch.Input class="switch__input" />
									<Switch.Control class="switch__control">
										<Switch.Thumb class="switch__thumb" />
									</Switch.Control>
								</Switch>
								<Switch
									class="switch ml-0 mt-2 md:ml-5 md:mt-0"
									checked={excludeNonLegendaries()}
									onChange={checked => changeExcludeNonLegendaries(checked)}
								>
									<Tooltip>
										<Tooltip.Trigger>
											<Switch.Label class="switch__label whitespace-nowrap">Legendaries</Switch.Label>
										</Tooltip.Trigger>
										<Tooltip.Content class="tooltip__content">
											<p>When enabled, only legendary cards will be included in the search results.</p>
										</Tooltip.Content>
									</Tooltip>
									<Switch.Input class="switch__input" />
									<Switch.Control class="switch__control">
										<Switch.Thumb class="switch__thumb" />
									</Switch.Control>
								</Switch>
								<div class="flex flex-row items-center ml-0 mt-2 md:ml-5 md:mt-0">
									<Tooltip>
										<Tooltip.Trigger>
											<Label for="properties" class="leading-7 text-sm text-gray-100" value="Properties" />
										</Tooltip.Trigger>
										<Tooltip.Content class="tooltip__content">
											<p>Filter cards by their spell/trap property. This will result in monsters being removed from results.</p>
										</Tooltip.Content>
									</Tooltip>
									<SolidSelect
										multiple
										class="dark-bg ml-1 w-50"
										name="properties"
										onChange={value => changeProperties(value)}
										{...createOptions(Object.values(Property).filter((property: string) => !properties().includes(property)))}
									/>
								</div>
								<div class="flex flex-row items-center ml-0 mt-2 md:ml-5 md:mt-0">
									<Tooltip>
										<Tooltip.Trigger>
											<Label for="attributes" class="leading-7 text-sm text-gray-100" value="Attributes" />
										</Tooltip.Trigger>
										<Tooltip.Content class="tooltip__content">
											<p>Filter cards by their monster attributes. This will result in spells and traps being removed from results.</p>
										</Tooltip.Content>
									</Tooltip>
									<SolidSelect
										multiple
										class="dark-bg ml-1 w-50"
										name="attributes"
										onChange={value => changeAttributes(value)}
										{...createOptions(Object.values(Attribute).filter((attribute: string) => !attributes().includes(attribute)))}
									/>
								</div>
								<div class="flex flex-row items-center ml-0 mt-2 md:ml-5 md:mt-0">
									<div class="flex flex-col">
										<Tooltip>
											<Tooltip.Trigger>
												<Label for="monster_types" class="leading-7 text-sm text-gray-100 whitespace-nowrap" value="Monster Types" />
											</Tooltip.Trigger>
											<Tooltip.Content class="tooltip__content">
												<p>Filter cards by their monster type(s). This will result in spells and traps being removed from results.</p>
											</Tooltip.Content>
										</Tooltip>
										<Switch
											class="switch ml-1"
											checked={matchAllMonsterTypes()}
											onChange={checked => changeMatchAllMonsterTypes(checked)}
										>
											<Tooltip>
												<Tooltip.Trigger>
													<Switch.Label class="switch__label">All</Switch.Label>
												</Tooltip.Trigger>
												<Tooltip.Content class="tooltip__content">
													<p>When on, the monster must match all selected types</p>
												</Tooltip.Content>
											</Tooltip>
											<Switch.Input class="switch__input" />
											<Switch.Control class="switch__control">
												<Switch.Thumb class="switch__thumb" />
											</Switch.Control>
										</Switch>
									</div>
									<SolidSelect
										multiple
										class="dark-bg ml-1 w-50"
										name="monster_types"
										onChange={value => changeMonsterTypes(value)}
										{...createOptions(allMonsterTypes().filter((type: { id: number; type: string }) => !monsterTypes().includes(type.id)), { filterable: true, key: 'type' })}
									/>
								</div>
								<div class="flex flex-row items-center ml-0 mt-2 md:ml-5 md:mt-0">
									<Label for="limit" class="leading-7 text-sm text-gray-100 whitespace-nowrap" value="Card Limit" />
									<Select
										name="limit_by"
										class="ml-1 w-20"
										handleChange={e => changeLimitBy(e.currentTarget.value)}
										value={limitBy()}
										darkBg
									>
										<option value="=">=</option>
										<option value=">">&gt;</option>
										<option value=">=">&gt;=</option>
										<option value="<">&lt;</option>
										<option value="<=">&lt;=</option>
										<option value="!=">!=</option>
									</Select>
									<Input
										type="number"
										min={0}
										max={3}
										name="limit"
										class="ml-1 block w-15"
										value={limit()}
										handleChange={e => changeLimit(e.currentTarget.value)}
										darkBg
									/>
								</div>
							</div>
							<div class="flex flex-col md:flex-row justify-start mt-2">
								<div class="flex flex-row items-center">
									<Label for="limit" class="leading-7 text-sm text-gray-100" value="Min Atk" />
									<Input
										type="number"
										min={0}
										max={1000000}
										name="limit"
										class="ml-1 block w-30"
										value={minAtk()}
										handleChange={e => changeMinAtk(e.currentTarget.value)}
										darkBg
									/>
								</div>
								<div class="flex flex-row items-center ml-0 mt-2 md:ml-5 md:mt-0">
									<Label for="limit" class="leading-7 text-sm text-gray-100" value="Max Atk" />
									<Input
										type="number"
										min={0}
										max={1000000}
										name="limit"
										class="ml-1 block w-30"
										value={maxAtk()}
										handleChange={e => changeMaxAtk(e.currentTarget.value)}
										darkBg
									/>
								</div>
							</div>
							<div class="flex flex-col md:flex-row justify-start mt-2">
								<div class="flex flex-row items-center">
									<Label for="limit" class="leading-7 text-sm text-gray-100" value="Min Def" />
									<Input
										type="number"
										min={0}
										max={1000000}
										name="limit"
										class="ml-1 block w-30"
										value={minDef()}
										handleChange={e => changeMinDef(e.currentTarget.value)}
										darkBg
									/>
								</div>
								<div class="flex flex-row items-center ml-0 mt-2 md:ml-5 md:mt-0">
									<Label for="limit" class="leading-7 text-sm text-gray-100" value="Max Def" />
									<Input
										type="number"
										min={0}
										max={1000000}
										name="limit"
										class="ml-1 block w-30"
										value={maxDef()}
										handleChange={e => changeMaxDef(e.currentTarget.value)}
										darkBg
									/>
								</div>
							</div>
						</div>
					</div>
					<div class="md:mb-12 px-1 sm:px-6 py-6 flex flex-col items-start bg-gray-900 rounded-md">
						<div class="flex flex-wrap min-h-[212px]">
							<For each={pages()}>
								{card => (
									<Tooltip open={tooltipOpen() === card.id}>
										<Tooltip.Trigger>
											<div class="min-w-[144px] m-1">
												<img
													src={card.image}
													alt={card.name}
													class="card relative z-10 hover:z-50 min-w-[144px] max-w-[144px] ease-in duration-200 hover:scale-[2.08]"
													draggable={false}
													onClick={() => setTooltipOpen(card.id)}
													onMouseLeave={() => setTooltipOpen(-1)}
												/>
											</div>
										</Tooltip.Trigger>
										<Tooltip.Content class="tooltip__content">
											<p>{card.description}</p>
										</Tooltip.Content>
									</Tooltip>
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
