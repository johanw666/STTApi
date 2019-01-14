import STTApi from "./index";

export function replicatorCurrencyCost(archetypeType: number, rarity: number): number {
    return STTApi.platformConfig.config.replicator_config.currency_costs[rarity].amount;
}

export function replicatorFuelCost(archetypeType: number, rarity: number): number {
    let replicatorFuel = STTApi.platformConfig.config.replicator_config.fuel_costs.find((replicatorFuel: any) => (replicatorFuel.item_type === archetypeType) && (replicatorFuel.rarity === rarity));
    return replicatorFuel.fuel;
}

export function canReplicate(archetypeId: number): boolean {
    // TODO: latinum is not in this list, how are they validating it? (probably parsing the error message)
    return STTApi.platformConfig.config.replicator_config.target_blacklist.indexOf(archetypeId) === -1;
}

export function replicatorFuelValue(itemType: number, itemRarity: number): number {
    let replicatorFuel = STTApi.platformConfig.config.replicator_config.fuel_values.find((replicatorFuel: any) => (replicatorFuel.item_type === itemType) && (replicatorFuel.rarity === itemRarity));
    return replicatorFuel.fuel;
}

export function canUseAsFuel(itemId: number): boolean {
    return STTApi.platformConfig.config.replicator_config.fuel_blacklist.indexOf(itemId) === -1;
}

export interface ReplicatorFuel
{
    archetype_id: number;
    quantity: number;
}

export async function replicate(targetArchetypeId: number, fuel: ReplicatorFuel[]): Promise<any> {
    let params: any = { id: targetArchetypeId};

    // TODO: figure out how these are formatted
    fuel.forEach(f => {
        params[`fuels[${f.archetype_id}]`] = f.quantity;
    });

    let data = await STTApi.executePostRequest("item/replicate", params);

    await STTApi.applyUpdates(data);

    return;
}