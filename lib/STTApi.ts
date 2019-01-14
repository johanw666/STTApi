/*
    StarTrekTimelinesSpreadsheet - A tool to help with crew management in Star Trek Timelines
    Copyright (c) 2017 - 2018 IAmPicard

    This program is free software: you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.

    You should have received a copy of the GNU General Public License
    along with this program.  If not, see <http://www.gnu.org/licenses/>.
*/
import { NetworkInterface } from "./NetworkInterface";
import { NetworkFetch } from "./NetworkFetch";
import { DexieCache, QuestsTable, EquipmentTable, ImmortalsTable, ConfigTable, WikiImageTable } from "./Cache";
import { IChallengeSuccess } from './MissionCrewSuccess';
import { matchCrew, calculateBuffConfig, IBuffStat } from './CrewTools';
import { MinimalComplement } from "./MinimalComplement";
import { mergeDeep } from './ObjectMerge';
import { ImageProvider, ImageCache } from './ImageProvider';
import { WikiImageProvider } from './WikiImageTools';
import { AssetImageProvider } from './AssetImageProvider';
import Dexie from "dexie";
import CONFIG from "./CONFIG";

export class STTApiClass {
	private _accessToken: string | undefined;
	private _net: NetworkInterface;
	private _playerData: any;
	private _starbaseData: any;
	private _fleetMemberInfo: any;
	private _cache: DexieCache;
	private _buffConfig: { [index: string]: IBuffStat };

	public platformConfig: any;
	public crewAvatars: any;
	public serverConfig: any;
	public shipSchematics: any;
	public fleetData: any;
	public roster: any;
	public ships: any;
	public missions: any;
	public missionSuccess!: IChallengeSuccess[];
	public minimalComplement?: MinimalComplement;
	public imageProvider! : ImageProvider;
	public inWebMode: boolean;
	public allcrew!: any[];

	// TODO: make this configurable, if someone wants to host the web app themselves
	public serverAddress: string = 'https://iampicard.com/';

	constructor() {
		this.refreshEverything(true);
		this._net = new NetworkFetch();

		// TODO: Dexie uses IndexedDB, so doesn't work in plain node.js without polyfill - should the caching be an interface?
		this._cache = new DexieCache("sttcache");

		this.inWebMode = false;
		this._buffConfig = {};
	}

	setWebMode(webMode: boolean) {
		this.inWebMode = webMode;

		if (this.inWebMode) {
			this._net.setProxy(this.serverAddress + 'proxy');
		}
	}

	async refreshEverything(logout: boolean) {
		this.crewAvatars = null;
		this.serverConfig = null;
		this._playerData = null;
		this.platformConfig = null;
		this.shipSchematics = null;
		this._starbaseData = null;
		this.fleetData = null;
		this._fleetMemberInfo = null;
		this.roster = null;
		this.ships = null;
		this.missions = null;
		this.missionSuccess = [];
		this.minimalComplement = undefined;

		if (logout) {
			this._accessToken = undefined;

			if (this._cache) {
				await this._cache.config.where('key').equals('autoLogin').delete();
				await this._cache.config.where('key').equals('accessToken').delete();
			}
		}
	}

	setImageProvider(useAssets: boolean, imageCache: ImageCache|undefined) {
		if (useAssets) {
			this.imageProvider = new AssetImageProvider(imageCache);
		}
		else {
			this.imageProvider = new WikiImageProvider();
		}
	}

	setImageProviderOverride(iProvider: ImageProvider) {
		this.imageProvider = iProvider;
	}

	get networkHelper(): NetworkInterface {
		return this._net;
	}

	get quests(): Dexie.Table<QuestsTable, number> {
		return this._cache.quests;
	}
	
	get equipmentCache(): Dexie.Table<EquipmentTable, string> {
		return this._cache.equipment;
    }
    
    get immortals(): Dexie.Table<ImmortalsTable, string> {
		return this._cache.immortals;
    }
    
    get wikiImages(): Dexie.Table<WikiImageTable, string> {
		return this._cache.wikiImages;
	}

	get config(): Dexie.Table<ConfigTable, string> {
		return this._cache.config;
	}

	get loggedIn(): boolean {
		return this._accessToken != null;
	}

	get playerData(): any {
		return this._playerData.player;
	}

	get itemArchetypeCache(): any {
		return this._playerData.item_archetype_cache;
	}

	get fleetMembers(): any {
		return this._fleetMemberInfo.members;
	}

	get fleetSquads(): any {
		return this._fleetMemberInfo.squads;
	}

	get starbaseRooms(): any {
		return this._starbaseData[0].character.starbase_rooms;
	}

	getTraitName(trait: string): string {
		return this.platformConfig.config.trait_names[trait] ? this.platformConfig.config.trait_names[trait] : trait;
	}

	getShipTraitName(trait: string): string {
		return this.platformConfig.config.ship_trait_names[trait] ? this.platformConfig.config.ship_trait_names[trait] : trait;
	}

	getCrewAvatarById(id: number): any {
		return this.crewAvatars.find((avatar: any) => avatar.id === id);
	}

	getCrewAvatarBySymbol(symbol: string): any {
		return this.crewAvatars.find((avatar: any) => avatar.symbol === symbol);
	}

	async login(username: string, password: string, autoLogin: boolean): Promise<any> {
		let data = await this._net.post_proxy(CONFIG.URL_PLATFORM + "oauth2/token", {
			"username": username,
			"password": password,
			"client_id": CONFIG.CLIENT_ID,
			"grant_type": "password"
		});

		if (data.error_description) {
			throw new Error(data.error_description);
		} else if (data.access_token) {
			return this._loginWithAccessToken(data.access_token, autoLogin);
		} else {
			throw new Error("Invalid data for login!");
		}
	}

	async loginWithCachedAccessToken(): Promise<boolean> {
		let entry = await this._cache.config.where('key').equals('autoLogin').first();
		if (entry && entry.value === true) {
			entry = await this._cache.config.where('key').equals('accessToken').first();
			if (entry && entry.value) {
				this._accessToken = entry.value;
				return true;
			}
			else {
				return false;
			}
		}
		else {
			return false;
		}
	}

	private async _loginWithAccessToken(access_token: string, autoLogin: boolean): Promise<void> {
		this._accessToken = access_token;

		/*await*/ this._cache.config.put({
			key: 'autoLogin',
			value: autoLogin
		});

		if (autoLogin) {
			/*await*/ this._cache.config.put({
				key: 'accessToken',
				value: access_token
			});
		}
	}

	async loginWithFacebook(facebookAccessToken: string, facebookUserId: string, autoLogin: boolean): Promise<any> {
		let data = await this._net.post_proxy(CONFIG.URL_PLATFORM + "oauth2/token", {
			"third_party.third_party": "facebook",
			"third_party.access_token": facebookAccessToken,
			"third_party.uid": facebookUserId,
			"client_id": CONFIG.CLIENT_ID,
			"grant_type": "third_party"
		});

		if (data.error_description) {
			throw new Error(data.error_description);
		} else if (data.access_token) {
			return this._loginWithAccessToken(data.access_token, autoLogin);
		} else {
			throw new Error("Invalid data for login!");
		}
	}

	async executeGetRequest(resourceUrl: string, qs: any = {}): Promise<any> {
		if (this._accessToken === undefined) {
			throw new Error("Not logged in!");
		}

		return this._net.get_proxy(CONFIG.URL_SERVER + resourceUrl,
			Object.assign({ client_api: CONFIG.CLIENT_API_VERSION, access_token: this._accessToken}, qs));
	}

	async executePostRequest(resourceUrl: string, qs: any): Promise<any> {
		if (this._accessToken === undefined) {
			throw new Error("Not logged in!");
		}

		return this._net.post_proxy(CONFIG.URL_SERVER + resourceUrl,
			Object.assign({ client_api: CONFIG.CLIENT_API_VERSION }, qs),
			this._accessToken
		);
	}

	async loadServerConfig(): Promise<any> {
		let data = await this.executeGetRequest("config", {
			platform:'WebGLPlayer',
			device_type:'Desktop',
			client_version:CONFIG.CLIENT_VERSION,
			platform_folder:CONFIG.CLIENT_PLATFORM
		});

		this.serverConfig = data;
	}

	async loadCrewArchetypes(): Promise<any> {
		let data = await this.executeGetRequest("character/get_avatar_crew_archetypes");
		if (data.crew_avatars) {
			this.crewAvatars = data.crew_avatars;
		} else {
			throw new Error("Invalid data for crew avatars!");
		}
	}

	async loadPlatformConfig(): Promise<any> {
		let data = await this.executeGetRequest("config/platform");
		this.platformConfig = data;
	}

	async loadPlayerData(): Promise<any> {
		let data = await this.executeGetRequest("player");
		if (data.player) {
			this._playerData = data;

			// After loading player data, we can calculate the buff config for collections and starbase
			this._buffConfig = calculateBuffConfig();
		} else {
			throw new Error("Invalid data for player!");
		}
	}

	async resyncPlayerCurrencyData(): Promise<any> {
		// this code reloads minimal stuff to update the player information and merge things back in
		let data = await this.executeGetRequest("player/resync_currency");
		if (data.player) {
			this._playerData.player = mergeDeep(this._playerData.player, data.player);
		} else {
			throw new Error("Invalid data for player!");
		}
	}

	async resyncInventory(): Promise<any> {
		// TODO: we should sync this data back into _playerData.player somehow (but we're adding too much stuff onto it now to work, like iconUrls, immortals, etc.)
		let data = await this.executeGetRequest("player/resync_inventory");
		if (data.player) {
			return data;
		} else {
			throw new Error("Invalid data for player!");
		}
	}

	async loadShipSchematics(): Promise<any> {
		let data = await this.executeGetRequest("ship_schematic");
		if (data.schematics) {
			this.shipSchematics = data.schematics;
		} else {
			throw new Error("Invalid data for ship schematics!");
		}
	}

	async loadFrozenCrew(symbol: string): Promise<any> {
		let data = await this.executePostRequest("stasis_vault/immortal_restore_info", { symbol: symbol });
		if (data.crew) {
			return data.crew;
		} else {
			throw new Error("Invalid data for frozen crew!");
		}
	}

	async sellCrew(id: number): Promise<any> {
		let data = await this.executePostRequest("crew/sell", { id: id });
		if (data) {
			return this.applyUpdates(data);
		} else {
			throw new Error("Invalid data for crew!");
		}
	}

	async warpQuest(id: number, mastery_level: number, factor: number): Promise<any> {
		let data = await this.executeGetRequest("quest/warp", { id, mastery_level, factor });
		if (data) {
			return this.applyUpdates(data);
		} else {
			throw new Error("Invalid data for quest warp!");
		}
	}

	async loadFleetMemberInfo(guildId: string): Promise<any> {
		let data = await this.executePostRequest("fleet/complete_member_info", { guild_id: guildId });
		if (data) {
			this._fleetMemberInfo = data;
		} else {
			throw new Error("Invalid data for fleet member info!");
		}
	}

	async loadFleetData(guildId: string): Promise<any> {
		let data = await this.executeGetRequest("fleet/" + guildId);
		if (data.fleet) {
			this.fleetData = data.fleet;
		} else {
			throw new Error("Invalid data for fleet!");
		}
	}

	async loadStarbaseData(guildId: string): Promise<any> {
		let data = await this.executeGetRequest("starbase/get");
		if (data) {
			this._starbaseData = data;
		} else {
			throw new Error("Invalid data for starbase!");
		}
	}

	async inspectPlayer(playerId: string): Promise<any> {
		let data = await this.executeGetRequest("player/inspect/" + playerId);
		if (data.player) {
			return data.player;
		} else {
			throw new Error("Invalid data for player!");
		}
	}

	getGithubReleases(): Promise<any> {
		return this._net.get(CONFIG.URL_GITHUBRELEASES, {});
	}

	async refreshRoster(): Promise<any> {
		// TODO: need to reload icon urls as well
		this.roster = await matchCrew(this._playerData.player.character);
	}

	async applyUpdates(data: any): Promise<any[]> {
		if (!data) {
			return [];
		}

		if (Array.isArray(data)) {
			let ephemerals: any[] = [];
			for(let val of data) {
				let e = await this.applyUpdates(val);
				ephemerals = ephemerals.concat(e);
			}

			return ephemerals;
		} else {
			if (!data.action) {
				console.log(`Not sure what message this is; should we be updating something: '${data}'`);
				return [];
			}

			if (data.action === 'update') {
				if (data.player) {
					this._playerData.player = mergeDeep(this._playerData.player, data.player);
				}

				if (data.character) {
					this._playerData.player.character = mergeDeep(this._playerData.player.character, data.character);
				}
			} else if (data.action === 'delete') {
				// TODO
				// For example, data.character.items, array with objects with just the id property in them
				console.log('Delete not applied; data is most likely stale; user should refresh');
			} else if (data.action === 'ephemeral') {
				return [data];
			} else {
				console.log(`Unknown data action '${data.action}' not applied. Data is most likely stale; user should refresh`);
			}

			return [];
		}
	}

	/// Takes the raw stats from a crew and applies the current player buff config (useful for imported crew)
	applyBuffConfig(crew: any): void {
		const getMultiplier = (skill: string, stat: string) => {
			return this._buffConfig[`${skill}_${stat}`].multiplier + this._buffConfig[`${skill}_${stat}`].percent_increase;
		}

		for (let skill in crew.base_skills) {
			crew.skills[skill].core = Math.floor(crew.base_skills[skill].core * getMultiplier(skill, 'core'));
			crew.skills[skill].range_min = Math.floor(crew.base_skills[skill].range_min * getMultiplier(skill, 'range_min'));
			crew.skills[skill].range_max = Math.floor(crew.base_skills[skill].range_max * getMultiplier(skill, 'range_max'));
		}
	}
}