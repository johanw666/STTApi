import STTApi from "./index";
import { mergeDeep } from './ObjectMerge';

export async function loadVoyage(voyageId: number, newOnly: boolean = true): Promise<any> {
    let data = await STTApi.executePostRequest("voyage/refresh", { voyage_status_id: voyageId, new_only: newOnly });
    if (data) {
        let voyageNarrative: any[] = [];

        data.forEach((action: any) => {
            if (action.character) {
                // TODO: if DB adds support for more than one voyage at a time this hack won't work
                STTApi.playerData.character.voyage[0] = mergeDeep(STTApi.playerData.character.voyage[0], action.character.voyage[0]);
            }
            else if (action.voyage_narrative) {
                voyageNarrative = action.voyage_narrative;
            }
        });

        return voyageNarrative;
    } else {
        throw new Error("Invalid data for voyage!");
    }
}

export async function recallVoyage(voyageId: number): Promise<void> {
    let data = await STTApi.executePostRequest("voyage/recall", { voyage_status_id: voyageId });
    if (!data) {
        throw new Error("Invalid data for voyage!");
    }
}

export async function completeVoyage(voyageId: number): Promise<void> {
    let data = await STTApi.executePostRequest("voyage/complete", { voyage_status_id: voyageId });
    if (!data) {
        throw new Error("Invalid data for voyage completion!");
    }

    data = await STTApi.executePostRequest("voyage/claim", { voyage_status_id: voyageId });
    if (!data) {
        throw new Error("Invalid data for voyage claim!");
    }
}

export async function reviveVoyage(voyageId: number): Promise<void> {
    let data = await STTApi.executePostRequest("voyage/revive", { voyage_status_id: voyageId });
    if (!data) {
        throw new Error("Invalid data for voyage revive!");
    }
}

export async function resolveDilemma(voyageId: number, dilemmaId: number, index: number): Promise<void> {
    let data = await STTApi.executePostRequest("voyage/resolve_dilemma", { voyage_status_id: voyageId, dilemma_id: dilemmaId, resolution_index: index });
    if (!data) {
        throw new Error("Invalid data for voyage resolve_dilemma!");
    }
}

export async function startVoyage(voyageSymbol: string, shipId: number, shipName: string | undefined, selectedCrewIds: Array<number>): Promise<void> {
    // Start by getting up-to-date crew status
    let currentPlayer = await STTApi.resyncInventory();
    
    let availableCrew = new Set<number>();
    currentPlayer.player.character.crew.forEach((crew: any) => {
        if (!crew.active_id) {
            availableCrew.add(crew.id);
        }
    });

    // Validate all selected crew is available and not already active
    selectedCrewIds.forEach(crewid => {
        if (!availableCrew.has(crewid)) {
            let crew = STTApi.roster.find((crew: any) => (crew.crew_id === crewid))
            throw new Error(`Cannot send '${crew ? crew.name : crewid}' out on a voyage because it's already active! Please DO NOT use this tool at the same time as the game on any platform. Close all game clients then close and restart the tool to try again!`);
        }
    });

    let params: any = {
        voyage_symbol: voyageSymbol,
        ship_id: shipId,
        crew_ids_string: selectedCrewIds.join(','),
    };

    if (shipName !== undefined) {
        params.ship_name = shipName;
    }

    let data = await STTApi.executePostRequest("voyage/start", params);

    if (data) {
        //console.info("Started voyage");

        data.forEach((action: any) => {
            if (action.character && action.character.voyage) {
                STTApi.playerData.character.voyage = action.character.voyage;
            }
        });
    } else {
        throw new Error("Invalid data for voyage start!");
    }
}

export function bestVoyageShip(): any[] {
    let voyage = STTApi.playerData.character.voyage_descriptions[0];

    let consideredShips: any[] = [];
    STTApi.ships.forEach((ship: any) => {
        if (ship.id > 0) {
            let entry = {
                ship: ship,
                score: ship.antimatter
            };

            if (ship.traits.find((trait: any) => trait == voyage.ship_trait)) {
                entry.score += 150; // TODO: where is this constant coming from (Config)?
            }

            consideredShips.push(entry);
        }
    });

    consideredShips = consideredShips.sort((a, b) => b.score - a.score);
    consideredShips = consideredShips.filter(entry => entry.score == consideredShips[0].score);

    return consideredShips;
}