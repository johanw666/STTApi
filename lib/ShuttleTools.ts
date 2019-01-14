import STTApi from "./index";

export async function shuttleComplete(id: number): Promise<any> {
    let data = await STTApi.executePostRequest("shuttle/complete", { id });

    /*
action:update
character.crew[] id: x, active_status ...
character.factions[] id: x, reputation ...
character.events[] id: x, ...

action:delete
character.shuttle_adventures[] id: x

action:ephemeral
rewards.loot[]

action:ephemeral
shuttle_results
    crew:[86299271, 141451388, 267173029, 358583242]
    message:"Your crew locates the ship carrying the abductees and manages to retrieve them, felling any KCA soldiers who try to stop them. The educators show no fear, intent on going to the Mirror Earth despite the ordeal."
    success:true

OR

shuttle_results
    message:"You and your crew attempt to help Data with his public speaking. But your efforts prove to be futile when his speech bores the Terran audience into riots."
    success:false
*/
}

export async function shuttleRedeemToken(token_id: number): Promise<any> {
    let data = await STTApi.executePostRequest("shuttle/redeem_token", { id: token_id });

    /*
action:update
.character.items[].quantity

action:ephemeral
shuttle.shuttle_id: number

action:update
.character.shuttle_adventures[0] {} .completes_in_seconds
*/
}

export async function shuttleStart(id: number, crew_ids: number[], consumable_id: number | undefined, displayed_percent_success: number): Promise<any> {
    let data = await STTApi.executePostRequest("shuttle/start",
        {
            id: id,
            crew: crew_ids.join(','),
            consumable: consumable_id ? consumable_id : 0,
            displayed_percent_success: `${displayed_percent_success}%`
        });

}