import STTApi from "./index";

export async function loadFullTree(onProgress: (description: string) => void): Promise<void> {
    let mapEquipment: Set<number> = new Set();
    let missingEquipment: any[] = [];

    // Search for all equipment assignable to the crew at all levels
    // This was a terrible idea; since the data is crowdsourced, it could come from outdated recipe trees and introduce cycles in the graph; data from STTApi.allcrew is not to be trusted

    let allCrewEquip: Set<string> = new Set();
    STTApi.allcrew.forEach((crew: any) => {
        crew.equipment_slots.forEach((es: any) => {
            let a = crew.archetypes.find((a: any) => a.id === es.archetype);

            if (a) {
                allCrewEquip.add(a.symbol);
                es.symbol = a.symbol;
            }
        });
    });

    STTApi.itemArchetypeCache.archetypes.forEach((equipment: any) => {
        mapEquipment.add(equipment.id);
        allCrewEquip.delete(equipment.symbol);
    });

    // Have we already cached equipment details for the current digest (since the last recipe update)?
    let entry = await STTApi.equipmentCache.where('digest').equals(STTApi.serverConfig.config.craft_config.recipe_tree.digest).first();

    if (entry) {
        // Merge the cached equipment, since the recipe tree didn't change since our last load
        entry.archetypeCache.forEach((cacheEntry: any) => {
            if (!mapEquipment.has(cacheEntry.id)) {
                STTApi.itemArchetypeCache.archetypes.push(cacheEntry);
                mapEquipment.add(cacheEntry.id);
            }

            allCrewEquip.delete(cacheEntry.symbol);
        });
    }

    // Load the description for all crew equipment
    let allcrewData = Array.from(allCrewEquip.values());
    while (allcrewData.length > 0) {
        onProgress(`Loading all crew equipment... (${allcrewData.length} remaining)`);
        let archetypesAll = await loadItemsDescription(allcrewData.splice(0,20));
        console.log(`Loaded ${archetypesAll.length}, remaining ${allcrewData.length}`);
        if (archetypesAll.length > 0) {
            STTApi.itemArchetypeCache.archetypes = STTApi.itemArchetypeCache.archetypes.concat(archetypesAll);
        }
    }

    // Now replace the ids with proper ones
    STTApi.allcrew.forEach((crew: any) => {
        crew.equipment_slots.forEach((es: any) => {
            let a = STTApi.itemArchetypeCache.archetypes.find((a: any) => a.symbol === es.symbol);
            if (a) {
                //console.log(`For ${crew.name} at level ${es.level} updating ${es.symbol} from ${es.archetype} to ${a.id}`);
                es.archetype = a.id;
            } else {
                console.warn(`Something went wrong looking for equipment '${es.symbol}'`);
                es.archetype = 0;
            }
        });

        crew.archetypes = [];
    });

    // Search for all equipment in the recipe tree
    STTApi.itemArchetypeCache.archetypes.forEach((equipment: any) => {
        if (equipment.recipe && equipment.recipe.demands && (equipment.recipe.demands.length > 0)) {
            equipment.recipe.demands.forEach((item: any) => {
                if (!mapEquipment.has(item.archetype_id)) {
                    missingEquipment.push(item.archetype_id);
                }
            });
        }
    });

    // Search for all equipment currently assigned to crew
    STTApi.roster.forEach((crew: any) => {
        crew.equipment_slots.forEach((es:any) => {
            if (!mapEquipment.has(es.archetype)) {
                missingEquipment.push(es.archetype);
            }
        });
    });

    onProgress(`Loading equipment... (${missingEquipment.length} remaining)`);
    if (missingEquipment.length === 0) {
        // We're done loading, let's cache the current list, to save on future loading time
        /*await*/ STTApi.equipmentCache.put({
            digest: STTApi.serverConfig.config.craft_config.recipe_tree.digest,
            archetypeCache: STTApi.itemArchetypeCache.archetypes
        });

        return;
    }

    // Load the description for the missing equipment
    let archetypes = await loadItemsDescription(missingEquipment.slice(0,20));

    if (archetypes.length > 0) {
        STTApi.itemArchetypeCache.archetypes = STTApi.itemArchetypeCache.archetypes.concat(archetypes);
        return loadFullTree(onProgress);
    }

    // We're done loading, let's cache the current list, to save on future loading time
    /*await*/ STTApi.equipmentCache.put({
        digest: STTApi.serverConfig.config.craft_config.recipe_tree.digest,
        archetypeCache: STTApi.itemArchetypeCache.archetypes
    });
}

async function loadItemsDescription(ids: number[] | string[]): Promise<any[]> {
    let archetypes: any[] = [];
    try
    {
        // Load the description for the missing equipment
        let data = await STTApi.executeGetRequest("item/description", { ids });

        if (data.item_archetype_cache && data.item_archetype_cache.archetypes) {
            archetypes = data.item_archetype_cache.archetypes;
        }
    }
    catch(error)
    {
        // Some equipment is causing the server to choke, time to binary search the culprit
        if (ids.length === 1) {
            console.error(`The description for item ${ids[0]} fails to load.`);
        } else {
            let leftSide = ids.splice(0,Math.ceil(ids.length / 2));

            let leftArchetypes = await loadItemsDescription(leftSide);
            let rightArchetypes = await loadItemsDescription(ids);

            archetypes = leftArchetypes.concat(rightArchetypes);
        }
    }

    return archetypes;
}