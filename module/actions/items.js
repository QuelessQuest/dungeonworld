import {DW} from "../config.js";

/**
 * CONSUME
 * @param actor
 * @param item
 * @returns {Promise<void>}
 */
export async function consume(actor, item) {
    let itemData = item.data.data;

    if (itemData.details.consume) {
       let uses = itemData.uses - 1;
       if (uses > 0) {
           let updatedItem = duplicate(item);
           updatedItem.data.uses = uses;
           await actor.updateOwnedItem(updatedItem);
       } else {
            await actor.deleteOwnedItem(item.id);
       }
    }
}

export async function adventuringGear(actor, thing) {

    let templateData = {
        aGear: DW.adventuringGear.sort()
    }

    const content = await renderTemplate("systems/dungeonworld/templates/dialog/adventuring-gear.html", templateData);
    let equip =  await new Promise((resolve, reject) => {
        new Dialog({
            title: "Adventuring Gear",
            content: content,
            default: 'ok',
            buttons: {
                use: {
                    icon: '<i class="fas fa-ban"></i>',
                    label: "Choose Gear",
                    callback: html => {
                        let dd = html.find("#gear")[0].value;
                        if (dd === "Other") {
                            dd = html.find("#other")[0].value;
                        }
                        resolve(dd)
                    }
                },
                cancel: {
                    icon: '<i class="fas fa-times"></i>',
                    label: "Cancel",
                    callback: () => {
                        resolve(false);
                    }
                }
            }
        }).render(true);
    });

    let items = game.items.entities.filter(i => i.type === 'equipment' && i.data.data.itemType === 'adventuringgear');
    for (let c of game.packs) {
        if (c.metadata.entity && c.metadata.entity === 'Item' && c.metadata.name === 'equipment-adventuring') {
            let cItems = c ? await c.getContent() : [];
            items = items.concat(cItems);
        }
    }

    let item = items.find(i => i.data.name === equip);
    if (item) {
        await actor.createOwnedItem(item.data);
    }

    return equip;
}

/**
 * TORCH
 * @param actor
 * @param item
 * @returns {Promise<void>}
 */
export async function torch(actor, item) {

    let itemData = item.data.data;
    let updatedItem = duplicate(item);

    if (itemData.details) {
        if (itemData.details.on === undefined || itemData.details.on === null) {
            updatedItem.data.details = {...updatedItem.data.details, ...{on: true}};
        } else {
            updatedItem.data.details.on = !itemData.details.on;
        }
    }

    let dimLight, brightLight;
    if (updatedItem.data.details.on) {
        dimLight = 40;
        brightLight = 20;
    } else {
        dimLight = null;
        brightLight = null;
    }

    let actorToken = canvas.tokens.controlled[0];
    actorToken.update(
        {
            "dimLight": dimLight,
            "brightLight": brightLight,
            "lightAngle": 360,
            "lightColor": "#ffddbb"
        });

    await actor.updateOwnedItem(updatedItem);
}