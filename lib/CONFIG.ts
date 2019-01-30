export interface Rarity {
	name: string;
	color: string;
}

export interface Mastery {
	name: string;
	url: () => string | undefined;
}

function rgbToHex(r: number, g: number, b: number): string {
	return "#" + ((b | g << 8 | r << 16) / 0x1000000).toString(16).substring(2);
}

export default class CONFIG {
	static readonly URL_PLATFORM: string = "https://thorium.disruptorbeam.com/";
	static readonly URL_SERVER: string = "https://stt.disruptorbeam.com/";

	// default client_id of the Steam Windows version of STT
	static readonly CLIENT_ID: string = "4fc852d7-d602-476a-a292-d243022a475d";
	static readonly CLIENT_API_VERSION: number = 12;
	static readonly CLIENT_VERSION: string = "7.0.9";
	static readonly CLIENT_PLATFORM: string = "webgl";

	// releases URL
	static readonly URL_GITHUBRELEASES: string = "https://api.github.com/repos/IAmPicard/StarTrekTimelinesSpreadsheet/releases";

	// Every 10 days, check the wiki again for updated / new images
	static readonly HOURS_TO_RECOVERY: number = 24 * 10;

	static readonly RARITIES: Rarity[] = [
		{ name: 'Basic', color: 'Grey' },
		{ name: 'Common', color: rgbToHex(155, 155, 155) },
		{ name: 'Uncommon', color: rgbToHex(80, 170, 60) },
		{ name: 'Rare', color: rgbToHex(90, 170, 255) },
		{ name: 'Super Rare', color: rgbToHex(170, 45, 235) },
		{ name: 'Legendary', color: rgbToHex(253, 210, 106) }
	];

	static readonly MASTERY_LEVELS: Mastery[] = [
		{ name: 'Normal', url: () => CONFIG.SPRITES['mastery_lowest_icon'].url },
		{ name: 'Elite', url: () => CONFIG.SPRITES['mastery_medium_icon'].url },
		{ name: 'Epic', url: () => CONFIG.SPRITES['mastery_highest_icon'].url }
	];

	static readonly SKILLS: { [index: string]: string } = {
		'command_skill': 'Command',
		'science_skill': 'Science',
		'security_skill': 'Security',
		'engineering_skill': 'Engineering',
		'diplomacy_skill': 'Diplomacy',
		'medicine_skill': 'Medicine'
	};

	static readonly CREW_SHIP_BATTLE_BONUS_TYPE: { [index: number]: string } = {
		0: 'Attack',
		1: 'Evasion',
		2: 'Accuracy',
		// These are only for penalty
		3: 'Shield Regeneration'
	};

	static readonly CREW_SHIP_BATTLE_TRIGGER: { [index: number]: string } = {
		0: 'None',
		1: 'Position',
		2: 'Cloak',
		4: 'Boarding'
	};

	static readonly CREW_SHIP_BATTLE_ABILITY_TYPE: { [index: number]: string } = {
		0: 'Increase bonus boost by +%VAL%',
		1: 'Immediately deals %VAL%% damage',
		2: 'Immediately repairs Hulls by %VAL%%',
		3: 'Immediately repairs Shields by %VAL%%',
		4: '+%VAL% to Crit Rating',
		5: '+%VAL% to Crit Bonus',
		6: 'Shield regeneration +%VAL%',
		7: '+%VAL%% to Attack Speed',
		8: 'Increase boarding damage by %VAL%%'
	};

	static readonly REWARDS_ITEM_TYPE: { [index: number]: string } = {
		0: 'None',
		1: 'Crew',
		2: 'Equipment',
		3: 'Component',
		4: 'Shuttle consumable',
		5: 'Ship part',
		6: 'Shuttle token',
		7: 'Crew experience training',
		8: 'Ship schematic',
		9: 'Replicator ration',
		10: 'Honorable citation',
		11: 'Buff',
		12: 'Starbase component',
		13: 'Voyage consumable'
	};

	static readonly REWARDS_TYPE: { [index: number]: string } = {
		0: 'Generic loot', // ?
		1: 'Crew',
		2: 'Item',
		3: 'Currency',
		4: 'Faction',
		5: 'Dispute',
		6: 'Pack',
		7: 'Ship',
		8: 'Schematic',
		9: 'Conflict energy',
		10: 'Bundle',
		11: 'Event',
		12: 'Stimpack grant',
		13: 'Useful loot'  // ?
	};

	static SPRITES: { [index: string]: { asset: string, url: string|undefined } } = {
		'mastery_highest_icon': { asset: 'atlas_stt_icons', url: undefined },
		'mastery_medium_icon': { asset: 'atlas_stt_icons', url: undefined },
		'mastery_lowest_icon': { asset: 'atlas_stt_icons', url: undefined },
		'star_reward': { asset: 'atlas_stt_icons', url: undefined },
		'star_reward_inactive': { asset: 'atlas_stt_icons', url: undefined },
		'fleet_rank_admiral_icon': { asset: 'atlas_stt_icons', url: undefined },
		'fleet_rank_captain_icon': { asset: 'atlas_stt_icons', url: undefined },
		'fleet_rank_ensign_icon': { asset: 'atlas_stt_icons', url: undefined },
		'fleet_rank_lt_icon': { asset: 'atlas_stt_icons', url: undefined },
		'honor_currency': { asset: 'atlas_stt_icons', url: undefined },
		'icon_command_skill': { asset: 'atlas_stt_icons', url: undefined },
		'icon_diplomacy_skill': { asset: 'atlas_stt_icons', url: undefined },
		'icon_engineering_skill': { asset: 'atlas_stt_icons', url: undefined },
		'icon_medicine_skill': { asset: 'atlas_stt_icons', url: undefined },
		'icon_science_skill': { asset: 'atlas_stt_icons', url: undefined },
		'icon_security_skill': { asset: 'atlas_stt_icons', url: undefined },
		'icon_shuttle_lg': { asset: 'atlas_stt_icons', url: undefined },
		'node_icon': { asset: 'atlas_stt_icons', url: undefined },
		'pe_currency_icon': { asset: 'atlas_stt_icons', url: undefined },
		'pp_currency_icon': { asset: 'atlas_stt_icons', url: undefined },
		'soft_currency_icon': { asset: 'atlas_stt_icons', url: undefined },
		'victory_point_icon': { asset: 'atlas_stt_icons', url: undefined },
		'energy_icon': { asset: 'atlas_stt_icons', url: undefined }, // chronitons
		'cadet_icon': { asset: 'atlas_stt_icons', url: undefined }, // cadet
		'images_currency_honor_currency_0': { asset: '', url: undefined }, // honor
		'images_currency_pe_currency_0': { asset: '', url: undefined }, // merits
		'images_currency_pp_currency_0': { asset: '', url: undefined }, // dilithium
		'images_currency_sc_currency_0': { asset: '', url: undefined }, // credits
		'wrench_icon': { asset: 'atlas_stt_icons', url: undefined },
		'crew_icon': { asset: 'atlas_stt_icons', url: undefined },
		'trashcan_icon': { asset: 'atlas_stt_icons', url: undefined },
		'item_icon': { asset: 'atlas_stt_icons', url: undefined },
		'collection_blue_icon': { asset: 'atlas_stt_icons', url: undefined },
		'transmission_icon': { asset: 'atlas_stt_icons', url: undefined },
		'fusion_icon': { asset: 'atlas_stt_icons', url: undefined },
		'mission_icon': { asset: 'atlas_stt_icons', url: undefined },
		'equipment_icon': { asset: 'atlas_stt_icons', url: undefined },
		'trait_icon': { asset: 'atlas_stt_icons', url: undefined },
		'faction_store_icon': { asset: 'atlas_stt_icons', url: undefined },
		'freeze_icon': { asset: 'atlas_stt_icons', url: undefined },
		'friends_icon': { asset: 'atlas_stt_icons', url: undefined },
		'fleet_icon': { asset: 'atlas_stt_icons', url: undefined },
		'buyback_icon': { asset: 'atlas_stt_icons', url: undefined },
		'change_ship_icon': { asset: 'atlas_stt_icons', url: undefined },
		'collection_icon': { asset: 'atlas_stt_icons', url: undefined },
		'unlock_icon': { asset: 'atlas_stt_icons', url: undefined },
		'system_icon': { asset: 'atlas_stt_icons', url: undefined },
		'event_attn_icon': { asset: 'atlas_stt_icons', url: undefined },
		'response_icon': { asset: 'atlas_stt_icons', url: undefined },
		'info_icon': { asset: 'atlas_stt_icons', url: undefined },
		'merits_icon': { asset: 'atlas_stt_icons', url: undefined },
		'event_icon': { asset: 'atlas_stt_icons', url: undefined },
		'options_icon': { asset: 'atlas_stt_icons', url: undefined },
		'dilemma_icon': { asset: 'atlas_stt_icons', url: undefined },
		'warning_icon': { asset: 'atlas_stt_icons', url: undefined },
		'galaxy_icon': { asset: 'atlas_stt_icons', url: undefined },
		'get_icon': { asset: 'atlas_stt_icons', url: undefined },
		'proficency_icon': { asset: 'atlas_stt_icons', url: undefined },
		'conflictmarker_icon': { asset: 'atlas_stt_icons', url: undefined },
		'exclamation_icon': { asset: 'atlas_stt_icons', url: undefined },
		'captain_xp_icon': { asset: 'atlas_stt_icons', url: undefined },
		'starfleet_icon': { asset: 'atlas_stt_icons', url: undefined },
		'menu_icon': { asset: 'atlas_stt_icons', url: undefined },
		'dilithium_icon': { asset: 'atlas_stt_icons', url: undefined },
		'icon_antimatter': { asset: 'atlas_stt_icons', url: undefined },
		'complete_icon': { asset: 'atlas_stt_icons', url: undefined },
		'q_icon': { asset: 'atlas_stt_icons', url: undefined },
		'news_icon': { asset: 'atlas_stt_icons', url: undefined },
		'anomally_icon': { asset: 'atlas_stt_icons', url: undefined },
		'trophy_icon': { asset: 'atlas_stt_icons', url: undefined },
		'question_icon': { asset: 'atlas_stt_icons', url: undefined },
		'event_expedition_icon': { asset: 'atlas_stt_icons', url: undefined },
		'restricted_icon': { asset: 'atlas_stt_icons', url: undefined },
		'shuttle_icon': { asset: 'atlas_stt_icons', url: undefined },
		'ship_icon': { asset: 'atlas_stt_icons', url: undefined },
		'search_icon': { asset: 'atlas_stt_icons', url: undefined },
		'scanning_icon': { asset: 'atlas_stt_icons', url: undefined },
		'sb_hull_repair': { asset: 'atlas_stt_icons', url: undefined },
		'images_collection_vault_vault_item_bg_immortalized_256': { asset: '', url: undefined },
		'images_collection_vault_vault_item_bg_popup': { asset: '', url: undefined },
		'images_icons_dilemma_icon': { asset: '', url: undefined },
		'images_voyages_voyage_bg': { asset: '', url: undefined },
		'images_voyages_scanlines': { asset: '', url: undefined },
		'images_ship_battles_pvp_battle_img': { asset: '', url: undefined }
	};
}