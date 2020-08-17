import {DW} from '../config.js';

/**
 * GET COLORS
 * If the actor and or target are characters, return the player color
 * @param actor
 * @param target
 * @returns {{source: string, target: string}}
 */
export function getColors(actor, target) {

    let gColors = {
        source: "#000000",
        target: "#000000"
    }

    if (actor) {
        let sourceUser = game.users.find(u => u.data.character === actor._id);
        if (sourceUser) {
            gColors.source = sourceUser.data.color;
        }
    }

    if (target) {
        let targetUser = game.users.find(u => u.data.character === target._id);
        if (targetUser) {
            gColors.target = targetUser.data.color;
        }
    }

    return gColors;
}

/**
 * COLORED CHAT
 * @param actor
 * @param target
 * @param startingWords
 * @param middleWords
 * @param endWords
 * @param showChat
 * @returns {Promise<void>}
 */
export async function coloredChat({
                                      actor = null,
                                      target = null,
                                      startingWords = "",
                                      middleWords = "",
                                      endWords = ""
                                  }) {
    let template = "systems/dungeonworld/templates/chat/default-with-color.html";

    let gColors = getColors(actor, target);

    let sName = actor ? actor.name : "";
    let tName = target ? target.name : "";

    let templateData = {
        sourceColor: gColors.source,
        sourceName: sName,
        targetColor: gColors.target,
        targetName: tName,
        startingWords: startingWords,
        middleWords: middleWords,
        endWords: endWords
    }

    return renderTemplate(template, templateData).then(content => {
        ChatMessage.create({
            speaker: ChatMessage.getSpeaker(),
            content: content
        });
    });
}

/**
 * GET TARGETS
 * @param actor
 * @returns {{targetActor: *, targetToken: PlaceableObject}}
 */
export function getTargets(actor) {
    let targetActor;
    let targetToken;
    if (game.user.targets.size > 0) {
        targetActor = game.user.targets.values().next().value.actor;
        let xx = canvas.tokens.placeables.filter(placeable => placeable.isTargeted);
        targetToken = xx[0];
    } else {
        targetActor = actor;
        targetToken = canvas.tokens.controlled[0];
    }
    return {
        targetActor: targetActor,
        targetToken: targetToken
    }
}

/**
 * PROCESS CHOICE
 * @param options
 * @param flavor
 * @param templateData
 * @param title
 * @param chatData
 * @returns {Promise<unknown>}
 */
export async function processChoice({
                                        title = "",
                                        flavor = "",
                                        rollData = {},
                                        templateData = {},
                                        chatData = {},
                                        spell = ""
                                    }) {

    return new Promise(resolve => {
        const dialog = new Dialog({
            title: title,
            content: flavor,
            buttons: getButtons(rollData, templateData, chatData, spell, resolve),
        }, {width: 450, classes: ["dungeonworld", "dwmacros", "dialog", "column"]});
        dialog.render(true);
    });
}

/**
 * GET BUTTONS
 * @param rollData
 * @param templateData
 * @param chatData
 * @param spell
 * @param resolve
 * @returns {{}}
 */
function getButtons(rollData, templateData, chatData, spell, resolve) {
    let buttonData = {};
    if (rollData.option0.label) {
        buttonData.opt1 = {
            icon: rollData.option0.icon,
            label: rollData.option0.label,
            callback: async () => {
                templateData.startingWords = rollData.option0.startW ? injectVariable(rollData.option0.startW, spell) : "";
                templateData.middleWords = rollData.option0.midW ? injectVariable(rollData.option0.midW, spell) : "";
                templateData.endWords = rollData.option0.endW ? injectVariable(rollData.option0.endW, spell) : "";
                chatData.content = await renderTemplate(DW.template, templateData);
                await ChatMessage.create(chatData);
                resolve(rollData.option0.ret);
            }

        }
    }
    if (rollData.option1.label) {
        buttonData.opt2 = {
            icon: rollData.option1.icon,
            label: rollData.option1.label,
            callback: async () => {
                templateData.startingWords = rollData.option1.startW ? injectVariable(rollData.option1.startW, spell) : "";
                templateData.middleWords = rollData.option1.midW ? injectVariable(rollData.option1.midW, spell) : "";
                templateData.endWords = rollData.option1.endW ? injectVariable(rollData.option1.endW, spell) : "";
                chatData.content = await renderTemplate(DW.template, templateData);
                await ChatMessage.create(chatData);
                resolve(rollData.option1.ret);
            }

        }
    }
    if (rollData.option2.label) {
        buttonData.opt3 = {
            icon: rollData.option2.icon,
            label: rollData.option2.label,
            callback: async () => {
                templateData.startingWords = rollData.option2.startW ? injectVariable(rollData.option2.startW, spell) : "";
                templateData.middleWords = rollData.option2.midW ? injectVariable(rollData.option2.midW, spell) : "";
                templateData.endWords = rollData.option2.endW ? injectVariable(rollData.option2.endW, spell) : "";
                chatData.content = await renderTemplate(DW.template, templateData);
                await ChatMessage.create(chatData);
                resolve(rollData.option2.ret);
            }

        }
    }
    if (rollData.option3.label) {
        buttonData.opt4 = {
            icon: rollData.option3.icon,
            label: rollData.option3.label,
            callback: async () => {
                templateData.startingWords = rollData.option3.startW ? injectVariable(rollData.option3.startW, spell) : "";
                templateData.middleWords = rollData.option3.midW ? injectVariable(rollData.option3.midW, spell) : "";
                templateData.endWords = rollData.option3.endW ? injectVariable(rollData.option3.endW, spell) : "";
                chatData.content = await renderTemplate(DW.template, templateData);
                await ChatMessage.create(chatData);
                resolve(rollData.option3.ret);
            }

        }
    }
    return buttonData;
}

/**
 * RENDER DICE RESULTS
 * @param title
 * @param total
 * @param itemData
 * @param templateData
 * @param spell
 * @returns {Promise<unknown|*>}
 */
export async function renderDiceResults({
                                            title = "",
                                            total = 0,
                                            itemData = {},
                                            templateData = {},
                                            spell = ""
                                        }) {

    let chatData = {
        speaker: ChatMessage.getSpeaker(),
    }

    let rollData;
    if (total >= 10) {
        rollData = itemData.details.success;
        templateData.dialogType = DW.dialogTypes.success;
    } else if (total <= 6) {
        rollData = itemData.details.failure;
        templateData.dialogType = DW.dialogTypes.fail;
    } else {
        rollData = itemData.details.partial;
        templateData.dialogType = DW.dialogTypes.partial;
    }

    if (rollData.choice) {
        return await processChoice({
            title: title,
            rollData: rollData,
            templateData: templateData,
            chatData: chatData,
            spell: spell
        });
    } else {
        templateData.startingWords = rollData.startW ? injectVariable(rollData.startW, spell) : "";
        templateData.middleWords = rollData.midW ? injectVariable(rollData.midW, spell) : "";
        templateData.endWords = rollData.endW ? injectVariable(rollData.endW, spell) : "";
        chatData.content = await renderTemplate(DW.template, templateData);
        await ChatMessage.create(chatData);
        return rollData.ret;
    }
}

/**
 * DO DAMAGE
 * Roll and apply damage to a target
 * @param actorData
 * @param targetData
 * @param damageMod
 * @param title
 * @returns {Promise<void>}
 */
export async function doDamage({
                                   item = {},
                                   actor = null,
                                   targetData = null,
                                   damageMod = null,
                                   baseDamage = null,
                                   effect = null,
                                   title = "",
                               }) {

    let itemData = item.data.data;
    let actorData = actor.data;
    let base, formula;
    let misc = "";
    if (baseDamage) {
        base = baseDamage;
        formula = baseDamage;
    } else {
        base = actorData.data.attributes.damage.value;
        formula = base;
        if (actorData.data.attributes.damage.misc) {
            misc = actorData.data.attributes.damage.misc;
            formula += `+${misc}`;
        }
    }
    if (damageMod) {
        formula += `+${damageMod}`;
    }
    let roll = new Roll(formula, {});
    roll.roll();
    let rolled = await roll.render();
    let damage = roll.total;
    if (damage < 1) damage = 1;

    await game.dice3d.showForRoll(roll);

    if (targetData.targetActor.permission !== CONST.ENTITY_PERMISSIONS.OWNER)
        roll.toMessage({
            speaker: ChatMessage.getSpeaker(),
            flavor: `${actorData.name} hits ${targetData.targetActor.data.name}.<br>
                            <p><em>Manually apply ${damage} damage to ${targetData.targetActor.data.name}</em></p>`
        });
    else {
        let gColors = getColors(actorData, targetData.targetActor);
        let sName = actorData ? actorData.name : "";
        let tName = targetData.targetActor ? targetData.targetActor.name : "";

        let templateData = {
            dialogType: DW.dialogTypes.damage,
            sourceColor: gColors.source,
            sourceName: sName,
            targetColor: gColors.target,
            targetName: tName,
            startingWords: injectVariable(itemData.details.damage.startW, damage),
            middleWords: injectVariable(itemData.details.damage.midW, damage),
            endWords: injectVariable(itemData.details.damage.endW, damage),
            title: title + " Damage",
            base: base,
            misc: misc,
            bonus: damageMod,
            rollDw: rolled
        }

        if (effect && effect !== "None") {
            await TokenMagic.addFiltersOnTargeted(effect === "Default" ? "Default Damage" : effect);
        }

        renderTemplate(DW.template, templateData).then(content => {
            let chatData = {
                speaker: ChatMessage.getSpeaker(),
                content: content
            };

            ChatMessage.create(chatData);

            let hp = targetData.targetActor.data.data.attributes.hp.value - damage;
            targetData.targetActor.update({
                "data.attributes.hp.value": hp < 0 ? 0 : hp
            })
            if (hp <= 0) {
                targetData.targetToken.toggleOverlay(CONFIG.controlIcons.defeated);
            }
        });
    }
}

/**
 * DO HEAL
 * Roll and apply healing to a target
 * @param actorData
 * @param targetData
 * @param baseHeal
 * @param title
 * @returns {Promise<void>}
 */
export async function doHeal({
                                 item = {},
                                 actor = null,
                                 targetData = null,
                                 baseHeal = null,
                                 effect = null,
                                 title = ""
                             }) {


    let itemData = item.data.data;
    let targetActor = targetData.targetActor;
    let actorData = actor.data;
    let healing;
    let rolled = null;
    let roll, maxHeal, words;
    const parsed = Number.parseInt(baseHeal);
    if (Number.isNaN(parsed)) {
        roll = new Roll(baseHeal, {});
        roll.roll();
        rolled = await roll.render();
        healing = roll.total;
        await game.dice3d.showForRoll(roll);

        words = itemData.details.heal;
    } else {
        healing = baseHeal;
        words = itemData.details;
        // TODO roll render equivalent
    }

    if (healing < 1) healing = 1;

    maxHeal = Math.clamped(healing, 0,
        targetActor.data.data.attributes.hp.max - targetActor.data.data.attributes.hp.value);

    if (effect && effect !== "None") {
        await TokenMagic.addFiltersOnTargeted(effect === "Default" ? "Cure Wound" : effect);
    }

    if (targetActor.permission !== CONST.ENTITY_PERMISSIONS.OWNER)
        roll.toMessage({
            speaker: ChatMessage.getSpeaker(),
            flavor: `${actorData.name} hits ${targetData.targetActor.data.name}.<br>
                            <p><em>Manually apply ${healing} healing to ${targetData.targetActor.data.name}</em></p>`
        });
    else {
        let gColors = getColors(actorData, targetActor);
        let sName = actorData ? actorData.name : "";
        let tName = targetActor ? targetActor.name : "";

        let templateData = {
            dialogType: DW.dialogTypes.heal,
            sourceColor: gColors.source,
            sourceName: sName,
            targetColor: gColors.target,
            targetName: tName,
            startingWords: injectVariable(words.startW, maxHeal),
            middleWords: injectVariable(words.midW, maxHeal),
            endWords: injectVariable(words.endW, maxHeal),
            title: title + " Healing",
            base: baseHeal,
            rollDw: rolled
        }

        renderTemplate(DW.template, templateData).then(content => {
            let chatData = {
                speaker: ChatMessage.getSpeaker(),
                content: content
            };

            ChatMessage.create(chatData);

            targetActor.update({
                "data.attributes.hp.value": targetActor.data.data.attributes.hp.value + maxHeal
            });
        });
    }
}

/**
 * INJECT VARIABLE
 * Replaces #v in a string with the value of the variable
 * @param str
 * @param variable
 * @returns {string|*}
 */
export function injectVariable(str, variable) {
    let aLoc = str.indexOf("#v");
    if (aLoc >= 0) {
        return str.substr(0, aLoc) + variable + str.substr(aLoc + 2);
    } else
        return str;
}