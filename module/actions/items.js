import {DW} from "../config.js";
import {doHeal, getTargets, getColors} from "./dwUtils.js";

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
    let equip = await new Promise((resolve, reject) => {
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
    } else {
        // TODO - Create item
    }

    return equip;
}

/**
 * HEALING POTION
 * @param actor
 * @param item
 * @returns {Promise<void>}
 */
export async function healingPotion(actor, item) {

    let dbs = [];
    for (let attr of Object.keys(actor.data.data.abilities)) {
        if (actor.data.data.abilities[attr].debility) {
            dbs.push({
                name: attr,
                data: actor.data.data.abilities[attr]
            });
        }
    }

    if (dbs.length > 0) {
        let templateData = {
            debility: dbs
        }

        const content = await renderTemplate("systems/dungeonworld/templates/dialog/healing-potion.html", templateData);
        return await new Promise((resolve) => {
            new Dialog({
                title: "Healing Potion",
                content: content,
                buttons: {
                    heal: {
                        icon: '<i class="fas fa-heart"></i>',
                        label: "Heal",
                        callback: () => {
                            doHeal({
                                item: item,
                                actor: actor,
                                targetData: getTargets(actor),
                                baseHeal: 10,
                                title: "Healing Potion"
                            });
                            resolve(true);
                        }
                    },
                    cancel: {
                        icon: '<i class="fas fa-prescription-bottle-alt"></i>',
                        label: "Cure",
                        callback: async html => {
                            let db = html.find("#debility")[0].value;
                            let info = db.split(',');
                            let f = dbs.find(f => f.name === info[1]);

                            let templateData = {
                                dialogType: DW.dialogTypes.heal,
                                sourceColor: getColors(actor).source,
                                sourceName: actor.name,
                                middleWords: `is cured of being ${f.data.debilityLabel}`,
                                title: item.name + " Cure"
                            }

                            renderTemplate(DW.template, templateData).then(content => {
                                let chatData = {
                                    speaker: ChatMessage.getSpeaker(),
                                    content: content
                                };

                                ChatMessage.create(chatData);
                                actor.update({"data": {"abilities": {[f.name]: {"debility": false}}}});
                            });

                            resolve(true);
                        }
                    }
                }
            }).render(true);
        });
    } else {
        await doHeal({
            item: item,
            actor: actor,
            targetData: getTargets(actor),
            baseHeal: 10,
            title: "Healing Potion"
        });
        return true;
    }
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