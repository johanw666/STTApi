import STTApi from "./index";
import CONFIG from "./CONFIG";

export interface IBuffStat {
	multiplier: number;
	percent_increase: number;
};

export function calculateBuffConfig(): { [index: string]: IBuffStat } {
	const skills = ['command_skill', 'science_skill', 'security_skill', 'engineering_skill', 'diplomacy_skill', 'medicine_skill'];
	const buffs = ['core', 'range_min', 'range_max'];

	const buffConfig: { [index: string]: IBuffStat } = {};

	for(let skill of skills) {
		for(let buff of buffs) {
			buffConfig[`${skill}_${buff}`] = {
				multiplier: 1,
				percent_increase: 0
			};
		}
	}

	for(let buff of STTApi.playerData.character.crew_collection_buffs.concat(STTApi.playerData.character.starbase_buffs)) {
		if (buffConfig[buff.stat]) {
			if (buff.operator === 'percent_increase') {
				buffConfig[buff.stat].percent_increase += buff.value;
			} else if (buff.operator === "multiplier") {
				buffConfig[buff.stat].multiplier = buff.value;
			} else {
				console.warn(`Unknown buff operator '${buff.operator }' for '${buff.stat}'.`);
			}
		}
	}

	return buffConfig;
}

function rosterFromCrew(rosterEntry: any, crew: any): void {
	rosterEntry.level = crew.level;
	rosterEntry.rarity = crew.rarity;
	rosterEntry.buyback = crew.in_buy_back_state;
	rosterEntry.favorite = crew.favorite;
	rosterEntry.crew_id = crew.id;
	rosterEntry.active_id = crew.active_id;

	for (let skill in crew.skills) {
		rosterEntry[skill].core = crew.skills[skill].core;
		rosterEntry[skill].min = crew.skills[skill].range_min;
		rosterEntry[skill].max = crew.skills[skill].range_max;
	}

	rosterEntry.command_skill_core = rosterEntry.command_skill.core;
	rosterEntry.science_skill_core = rosterEntry.science_skill.core;
	rosterEntry.security_skill_core = rosterEntry.security_skill.core;
	rosterEntry.engineering_skill_core = rosterEntry.engineering_skill.core;
	rosterEntry.diplomacy_skill_core = rosterEntry.diplomacy_skill.core;
	rosterEntry.medicine_skill_core = rosterEntry.medicine_skill.core;

	rosterEntry.ship_battle = crew.ship_battle;
	rosterEntry.action = crew.action;
	rosterEntry.flavor = crew.flavor;

	rosterEntry.equipment_slots = crew.equipment_slots;

	rosterEntry.equipment_slots.forEach((equipment: any) => {
		equipment.have = false;
	});

	crew.equipment.forEach((equipment: any) => {
		rosterEntry.equipment_slots[equipment[0]].have = true;
	});

	rosterEntry.traits = crew.traits.concat(crew.traits_hidden).map((trait: any) => { return STTApi.getTraitName(trait); }).join();
	rosterEntry.rawTraits = crew.traits.concat(crew.traits_hidden);

	// Replace "nonhuman" with "alien" to make the search easier
	let nh = rosterEntry.rawTraits.indexOf('nonhuman');
	if (nh > -1) {
		rosterEntry.rawTraits.splice(nh,1);
		rosterEntry.rawTraits.push('alien');
	}
}

function getDefaultsInner(crew: any): any {
	if (!crew) {
		return undefined;
	}

	return {
		id: crew.id, name: crew.name, short_name: crew.short_name, max_rarity: crew.max_rarity, symbol: crew.symbol, isExternal: false,
		level: 0, rarity: 0, frozen: 0, buyback: false, traits: '', rawTraits: [], portrait: crew.portrait, full_body: crew.full_body,
		command_skill: { 'core': 0, 'min': 0, 'max': 0 }, science_skill: { 'core': 0, 'min': 0, 'max': 0 },
		security_skill: { 'core': 0, 'min': 0, 'max': 0 }, engineering_skill: { 'core': 0, 'min': 0, 'max': 0 },
		diplomacy_skill: { 'core': 0, 'min': 0, 'max': 0 }, medicine_skill: { 'core': 0, 'min': 0, 'max': 0 }
	};
}

function getDefaults(id: number): any {
	return getDefaultsInner(STTApi.getCrewAvatarById(id));
}

export function formatAllCrew(allcrew: any[]) {
	let roster: any[] = [];
	allcrew.forEach((crew: any) => {
		STTApi.applyBuffConfig(crew);

		let rosterEntry = getDefaultsInner(crew);
		rosterEntry.isExternal = true;

		rosterFromCrew(rosterEntry, crew);

		rosterEntry.archetypes = crew.archetypes;
		roster.push(rosterEntry);
	});

	for (let crew of roster) {
		// Populate default icons (if they're already cached)
		crew.iconUrl = STTApi.imageProvider.getCrewCached(crew, false);
		crew.iconBodyUrl = STTApi.imageProvider.getCrewCached(crew, true);
	}

	return roster;
}

export async function matchCrew(character: any): Promise<any> {
	let roster: any[] = [];
	let rosterEntry: any = {};

	// Add all the crew in the active roster
	character.crew.forEach((crew: any) => {
		rosterEntry = getDefaults(crew.archetype_id);
		if (!rosterEntry) {
			console.error(`Could not find the crew avatar for archetype_id ${crew.archetype_id}`);
			return;
		}

		rosterFromCrew(rosterEntry, crew);
		roster.push(rosterEntry);
	});

	// Now add all the frozen crew
	if (character.stored_immortals && character.stored_immortals.length > 0) {
		// Use the cache wherever possible
		// TODO: does DB ever change the stats of crew? If yes, we may need to ocasionally clear the cache - perhaps based on record's age
		let frozenPromises: Promise<any>[] = [];

		character.stored_immortals.forEach((crew: any) => {
			rosterEntry = getDefaults(crew.id);
			if (!rosterEntry) {
				console.error(`Could not find the crew avatar for frozen archetype_id ${crew.id}`);
				return;
			}
			rosterEntry.frozen = crew.quantity;
			rosterEntry.level = 100;
			rosterEntry.rarity = rosterEntry.max_rarity;
			roster.push(rosterEntry);

			frozenPromises.push(loadFrozen(rosterEntry));
		});

		await Promise.all(frozenPromises);
	}

	for (let crew of roster) {
		// Populate default icons (if they're already cached)
		crew.iconUrl = STTApi.imageProvider.getCrewCached(crew, false);
		crew.iconBodyUrl = STTApi.imageProvider.getCrewCached(crew, true);
	}

	return roster;
}

async function loadFrozen(rosterEntry: any): Promise<void> {
	let entry = await STTApi.immortals.where('symbol').equals(rosterEntry.symbol).first();
	if (entry) {
		//console.info('Found ' + rosterEntry.symbol + ' in the immortalized crew cache');
		rosterFromCrew(rosterEntry, entry.crew);
	} else {
		let crew = await STTApi.loadFrozenCrew(rosterEntry.symbol);
		rosterFromCrew(rosterEntry, crew);

		// We don't need to await, as this is just populating a cache and can be done whenever
		STTApi.immortals.put({
			symbol: rosterEntry.symbol,
			crew: crew
		});
	}
}

export function formatCrewStats(crew: any): string {
	let SkillShortNames: { [index: string]: string } = {
		'command_skill': 'CMD',
		'science_skill': 'SCI',
		'security_skill': 'SEC',
		'engineering_skill': 'ENG',
		'diplomacy_skill': 'DIP',
		'medicine_skill': 'MED'
	};

	let result = '';
	for (let skillName in CONFIG.SKILLS) {
		let skill = crew[skillName];
		
		if (skill.core && (skill.core > 0)) {
			result += `${SkillShortNames[skillName]} (${Math.floor(skill.core + (skill.min + skill.max) / 2)}) `;
		}
	}
	return result;
}