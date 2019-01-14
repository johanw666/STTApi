import STTApi from "./index";
import CONFIG from "./CONFIG";

export async function loadGauntlet(): Promise<any> {
	let data = await STTApi.executeGetRequest("gauntlet/status", { gauntlet_id: -1 });
	if (data.character && data.character.gauntlets) {
		return data.character.gauntlets[0];
	} else {
		throw new Error("Invalid data for gauntlet!");
	}
}

export async function claimRankRewards(gauntlet_id: number): Promise<any> {
	let data = await STTApi.executeGetRequest("gauntlet/claim_rank_rewards", { gauntlet_id: gauntlet_id });
	let results = { description: undefined, rewards: undefined };
	data.forEach((item: any) => {
		if (item.description) {
			results.description = item.description;
		} else if (item.rewards) {
			results.rewards = item.rewards;
		}
	});

	return results;
}

export async function payToGetNewOpponents(gauntlet_id: number): Promise<any> {
	let data = await STTApi.executePostRequest("gauntlet/refresh_opp_pool_and_revive_crew", { gauntlet_id: gauntlet_id, pay: true });
	let currentGauntlet = null;
	let merits = null;
	if (!data.message) {
		data.forEach((item: any) => {
			if (item.character && item.character.gauntlets) {
				currentGauntlet = item.character.gauntlets[0];
			} else if (item.player && item.player.premium_earnable) {
				// TODO: this should update the global state in STTApi (in fact, these kind of updates can come in at any time and could be handled in the request api itself)
				merits = item.player.premium_earnable;
			}
		});
	}

	if (currentGauntlet) {
		return { gauntlet: currentGauntlet, merits: merits };
	} else if (data.message) {
		return { message: data.message };
	} else {
		throw new Error("Invalid data for gauntlet!");
	}
}

// Save is false if the crew is not disabled yet; true if the crew is disabled already
export async function payToReviveCrew(gauntlet_id: number, crew_id: number, save: boolean): Promise<any> {
	let data = await STTApi.executePostRequest("gauntlet/revive_after_crew_contest_loss", { gauntlet_id: gauntlet_id, save: save, crew_id: crew_id });
	let currentGauntlet = null;
	if (data.message) {
		// TODO: error checking
	}
	data.forEach((item: any) => {
		if (item.character && item.character.gauntlets) {
			currentGauntlet = item.character.gauntlets[0];
		} else if (item.player && item.player.premium_purchasable) {
			// TODO: this should update the global state in STTApi (in fact, these kind of updates can come in at any time and could be handled in the request api itself)
		}
	});

	if (currentGauntlet) {
		return { gauntlet: currentGauntlet };
	} else {
		throw new Error("Invalid data for gauntlet!");
	}
}

export async function playContest(gauntlet_id: number, crew_id: number, opponent_id: number, op_crew_id: number): Promise<any> {
	let data = await STTApi.executePostRequest("gauntlet/execute_crew_contest", {
		gauntlet_id: gauntlet_id,
		crew_id: crew_id,
		opponent_id: opponent_id,
		op_crew_id: op_crew_id,
		boost: false
	});
	let currentGauntlet = null;
	let contest = null;
	let rewards = null;
	data.forEach((item: any) => {
		if (item.character && item.character.gauntlets) {
			currentGauntlet = item.character.gauntlets[0];
		} else if (item.contest) {
			contest = item.contest;
		} else if (item.rewards) {
			rewards = item.rewards;
		}

	});

	if (currentGauntlet && contest) {
		return { gauntlet: currentGauntlet, lastResult: contest, rewards: rewards };
	} else {
		throw new Error("Invalid data for gauntlet!");
	}
}

export async function enterGauntlet(gauntletId: number, crewIds: Array<number>): Promise<void> {
	let data = await STTApi.executePostRequest("gauntlet/enter_crew_contest_gauntlet", {
		gauntlet_id: gauntletId,
		crew1_id: crewIds[0],
		crew2_id: crewIds[1],
		crew3_id: crewIds[2],
		crew4_id: crewIds[3],
		crew5_id: crewIds[4]
	});

	if (data && data.character && data.character.gauntlets) {
		return data.character.gauntlets[0];
	} else {
		throw new Error("Invalid data for gauntlet!");
	}
}

export interface ICrewOdd {
	archetype_symbol: string;
	crew_id: number;
	crit_chance: number;
	used: number;
	max: number[];
	min: number[];
	iconUrl: string | undefined;
}

export interface IOpponentOdd {
	name: string;
	level: number;
	value: number;
	player_id: number;
	crew_id: number;
	archetype_symbol: string;
	crit_chance: number;
	iconUrl: string | undefined;
	max: number[];
	min: number[];
}

export interface IMatch {
	crewOdd: ICrewOdd;
	opponent: IOpponentOdd;
	chance: number;
}

export interface IGauntletRoundOdds {
	rank: number;
	consecutive_wins: number;
	crewOdds: ICrewOdd[];
	opponents: IOpponentOdd[];
	matches: IMatch[];
}

export function gauntletRoundOdds(currentGauntlet: any, simulatedRounds: number): IGauntletRoundOdds {
	let result: IGauntletRoundOdds = {
		rank: currentGauntlet.rank,
		consecutive_wins: currentGauntlet.consecutive_wins,
		crewOdds: [],
		opponents: [],
		matches: []
	};

	currentGauntlet.contest_data.selected_crew.forEach((crew: any) => {
		crew.iconUrl = '';

		if (!crew.disabled) {
			let crewOdd: ICrewOdd = {
				archetype_symbol: crew.archetype_symbol,
				crew_id: crew.crew_id,
				crit_chance: crew.crit_chance,
				used: crew.debuff / 4,
				max: [0, 0],
				min: [0, 0],
				iconUrl: ''
			};

			crew.skills.forEach((skillStats: any) => {
				if (skillStats.skill == currentGauntlet.contest_data.primary_skill) {
					crewOdd.max[0] = skillStats.max;
					crewOdd.min[0] = skillStats.min;
				} else if (skillStats.skill == currentGauntlet.contest_data.secondary_skill) {
					crewOdd.max[1] = skillStats.max;
					crewOdd.min[1] = skillStats.min;
				}
			});

			result.crewOdds.push(crewOdd);
		}
	});

	currentGauntlet.opponents.forEach((opponent: any) => {
		let opponentOdd: IOpponentOdd = {
			name: opponent.name,
			level: opponent.level,
			value: opponent.value,
			player_id: opponent.player_id,
			crew_id: opponent.crew_contest_data.crew[0].crew_id,
			archetype_symbol: opponent.crew_contest_data.crew[0].archetype_symbol,
			crit_chance: opponent.crew_contest_data.crew[0].crit_chance,
			iconUrl: '',
			max: [0, 0],
			min: [0, 0]
		};

		opponent.crew_contest_data.crew[0].skills.forEach((skillStats: any) => {
			if (skillStats.skill == currentGauntlet.contest_data.primary_skill) {
				opponentOdd.max[0] = skillStats.max;
				opponentOdd.min[0] = skillStats.min;
			} else if (skillStats.skill == currentGauntlet.contest_data.secondary_skill) {
				opponentOdd.max[1] = skillStats.max;
				opponentOdd.min[1] = skillStats.min;
			}
		});

		result.opponents.push(opponentOdd);
	});

	const roll = (data: any, skillIndex: number): number => {
		let max = (Math.random() < 0.5) ? 0 : 1;
		let min = (Math.random() < 0.5) ? 0 : 1;
		if (data.min[skillIndex] > 0) {
			max = data.max[skillIndex];
			min = data.min[skillIndex];
		}

		return (Math.floor((Math.random() * (max - min)) + min) * (Math.random() < (data.crit_chance / 100) ? 2 : 1));
	}

	result.matches = [];

	result.crewOdds.forEach((crewOdd: any) => {
		result.opponents.forEach((opponent: any) => {
			if ((crewOdd.max[0] + crewOdd.max[1]) * 2 < (opponent.min[0] + opponent.min[1])) {
				// If there is 0 chance of winning, bail early and don't waste time
				result.matches.push({
					crewOdd: crewOdd,
					opponent: opponent,
					chance: 0
				});
			} else if ((opponent.max[0] + opponent.max[1]) * 2 < (crewOdd.min[0] + crewOdd.min[1])) {
				// If there is 100 chance of winning, bail early and don't waste time
				result.matches.push({
					crewOdd: crewOdd,
					opponent: opponent,
					chance: 100
				});
			} else {
				// TODO: this is silly; perhaps someone more statisitically-inclined can chime in with a proper probabilistic formula
				let wins = 0;
				for (let i = 0; i < simulatedRounds; i++) {
					let totalCrew = roll(crewOdd, 0);
					totalCrew += roll(crewOdd, 0);
					totalCrew += roll(crewOdd, 0);
					totalCrew += roll(crewOdd, 1);
					totalCrew += roll(crewOdd, 1);
					totalCrew += roll(crewOdd, 1);

					let totalOpponent = roll(opponent, 0);
					totalOpponent += roll(opponent, 0);
					totalOpponent += roll(opponent, 0);
					totalOpponent += roll(opponent, 1);
					totalOpponent += roll(opponent, 1);
					totalOpponent += roll(opponent, 1);

					if (totalCrew > totalOpponent)
						wins++;
				}

				result.matches.push({
					crewOdd: crewOdd,
					opponent: opponent,
					chance: Math.floor((wins / simulatedRounds) * 100)
				});
			}
		});
	});

	result.matches.sort((a: any, b: any) => b.chance - a.chance);

	return result;
}

interface ISortedCrew {
	id: number;
	name: string;
	score: number;
}

export interface Dictionary<T> {
	[key: string]: T;
}

interface IGauntletCrew {
	skills: Dictionary<number>;
	id: number;
	name: string;
	crit: number;
}

export interface IGauntletCrewSelection {
	best: Dictionary<string>;
	recommendations: Array<number>;
}

export function gauntletCrewSelection(currentGauntlet: any, roster: any, featuredSkillBonus: number, critBonusDivider: number, preSortCount: number, includeFrozen: boolean): any {
	let gauntletCrew: any[] = [];

	roster.forEach((crew: any) => {
		if ((crew.frozen > 0) && !includeFrozen) {
			return;
		}

		let newCrew: IGauntletCrew = {
			id: crew.crew_id || crew.id,
			name: crew.name,
			crit: 5,
			skills: {}
		};

		for (let skill in CONFIG.SKILLS) {
			newCrew.skills[skill] = crew[skill].min + crew[skill].max;
		}

		newCrew.skills[currentGauntlet.contest_data.featured_skill] = newCrew.skills[currentGauntlet.contest_data.featured_skill] * featuredSkillBonus;

		currentGauntlet.contest_data.traits.forEach((trait: any) => {
			if (crew.rawTraits.includes(trait))
				newCrew.crit += currentGauntlet.contest_data.crit_chance_per_trait;
		});

		for (let skill in CONFIG.SKILLS) {
			newCrew.skills[skill] = newCrew.skills[skill] * (100 + newCrew.crit / critBonusDivider) / 100;
		}

		gauntletCrew.push(newCrew);
	});

	let sortedCrew: ISortedCrew[] = [];

	function getScore(gauntletCrewItem: IGauntletCrew, maxSkill: any): number {
		let score = gauntletCrewItem.skills[maxSkill]; // double account for preferred skill

		for (let skill in CONFIG.SKILLS) {
			score += gauntletCrewItem.skills[skill];
		}

		return score;
	}

	let result: IGauntletCrewSelection = { best: {}, recommendations: [] };

	for (let skill in CONFIG.SKILLS) {
		gauntletCrew.sort((a: any, b: any) => {
			return b.skills[skill] - a.skills[skill];
		});
		result.best[skill] = gauntletCrew[0].name;

		// Get the first few in the final score sheet
		for (let i = 0; i < preSortCount; i++) {
			sortedCrew.push({ 'id': gauntletCrew[i].id, 'name': gauntletCrew[i].name, 'score': getScore(gauntletCrew[i], skill) });
		}
	}

	sortedCrew.sort((a: any, b: any) => {
		return b.score - a.score;
	});

	// Remove duplicates
	let seen = new Set();
	sortedCrew = sortedCrew.filter((item: any) => {
		if (seen.has(item.id)) {
			return false;
		}
		else {
			seen.add(item.id);
			return true;
		}
	});

	// Get the first 5
	sortedCrew = sortedCrew.slice(0, 5);

	result.recommendations = sortedCrew.map((crew) => crew.id);

	return result;
}