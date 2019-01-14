import Dexie from "dexie";

export class DexieCache extends Dexie {
    private _questsTable!: Dexie.Table<QuestsTable, number>;
    private _immortalsTable!: Dexie.Table<ImmortalsTable, string>;
    private _equipmentTable!: Dexie.Table<EquipmentTable, string>;
    private _wikiImageTable!: Dexie.Table<WikiImageTable, string>;
    private _config!: Dexie.Table<ConfigTable, string>;

    get quests(): Dexie.Table<QuestsTable, number> {
		return this._questsTable;
    }
    
    get immortals(): Dexie.Table<ImmortalsTable, string> {
		return this._immortalsTable;
    }

    get equipment(): Dexie.Table<EquipmentTable, string> {
		return this._equipmentTable;
    }
    
    get wikiImages(): Dexie.Table<WikiImageTable, string> {
		return this._wikiImageTable;
    }
    
    get config(): Dexie.Table<ConfigTable, string> {
		return this._config;
	}

    constructor (databaseName: string) {
        super(databaseName);
        this.version(1).stores({
            _questsTable: 'id,description,challenges,mastery_levels,cadet,crew_requirement',
            _immortalsTable: 'symbol,crew',
            _wikiImageTable: 'fileName,url,lastQueried',
            _config: 'key,value'
        });

        this.version(2).stores({
            _questsTable: 'id,description,challenges,mastery_levels,cadet,crew_requirement',
            _immortalsTable: 'symbol,crew',
            _equipmentTable: 'digest,archetypeCache',
            _wikiImageTable: 'fileName,url,lastQueried',
            _config: 'key,value'
        });
    }
}

export interface QuestsTable {
    id: number,
    description: string,
    challenges: any,
    mastery_levels: any,
    cadet: boolean,
    crew_requirement: any
}

export interface EquipmentTable {
    digest: string,
    archetypeCache: any
}

export interface ImmortalsTable {
    symbol: string,
    crew: any
}

export interface WikiImageTable {
    fileName: string,
    url: string | undefined,
    lastQueried: number
}

export interface ConfigTable {
    key: string,
    value: any
}