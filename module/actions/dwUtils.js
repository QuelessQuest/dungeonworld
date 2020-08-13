import { DW } from '../config.js';

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
    let template = "modules/dwmacros/templates/chat/defaultWithColor.html";

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
 * @param template
 * @param chatData
 * @returns {Promise<unknown>}
 */
export async function processChoice({
                                        title = "",
                                        rollData = {},
                                        templateData = {},
                                        chatData = {}
                                    }) {

    return new Promise(resolve => {
        const dialog = new Dialog({
            title: title,
            content: "flavor",
            buttons: getButtons(rollData, templateData, chatData, resolve),
        }, {width: 450, classes: ["dungeonworld", "dialog"]});
        dialog.render(true);
    });
}

/**
 * GET BUTTONS
 * @param rollData
 * @param templateData
 * @param chatData
 * @param resolve
 * @returns {{}}
 */
function getButtons(rollData, templateData, chatData, resolve) {
    let buttonData = {};
    if (rollData.option0.label) {
        buttonData.opt1 = {
            icon: rollData.option0.icon,
            label: rollData.option0.label,
            callback: async () => {
                templateData.startingWords = rollData.option0.startW ? rollData.option0.startW : "";
                templateData.middleWords = rollData.option0.midW ? rollData.option0.midW : "";
                templateData.endWords = rollData.option0.endW ? rollData.option0.endW : "";
                chatData.content = await renderTemplate(CONFIG.DW.template, templateData);
                resolve(rollData.option0.ret);
            }

        }
    }
    if (rollData.option1.label) {
        buttonData.opt2 = {
            icon: rollData.option1.icon,
            label: rollData.option1.label,
            callback: async () => {
                templateData.startingWords = rollData.option1.startW ? rollData.option1.startW : "";
                templateData.middleWords = rollData.option1.midW ? rollData.option1.midW : "";
                templateData.endWords = rollData.option1.endW ? rollData.option1.endW : "";
                chatData.content = await renderTemplate(CONFIG.DW.template, templateData);
                resolve(rollData.option1.ret);
            }

        }
    }
    if (rollData.option2.label) {
        buttonData.opt3 = {
            icon: rollData.option2.icon,
            label: rollData.option2.label,
            callback: async () => {
                templateData.startingWords = rollData.option2.startW ? rollData.option2.startW : "";
                templateData.middleWords = rollData.option2.midW ? rollData.option2.midW : "";
                templateData.endWords = rollData.option2.endW ? rollData.option2.endW : "";
                chatData.content = await renderTemplate(CONFIG.DW.template, templateData);
                resolve(rollData.option2.ret);
            }

        }
    }
    if (rollData.option3.label) {
        buttonData.opt4 = {
            icon: rollData.option3.icon,
            label: rollData.option3.label,
            callback: async () => {
                templateData.startingWords = rollData.option3.startW ? rollData.option3.startW : "";
                templateData.middleWords = rollData.option3.midW ? rollData.option3.midW : "";
                templateData.endWords = rollData.option3.endW ? rollData.option3.endW : "";
                chatData.content = await renderTemplate(CONFIG.DW.template, templateData);
                resolve(rollData.option3.ret);
            }

        }
    }
    return buttonData;
}

/**
 * RENDER DICE RESULTS
 * @param options
 * @param template
 * @param templateData
 * @param speaker
 * @param flavor
 * @param title
 * @returns {Promise<*>}
 */
export async function renderDiceResults({
                                            options = {},
                                            template = "",
                                            templateData = {},
                                            speaker = null,
                                            flavor = "",
                                            title: title
                                        }) {

    speaker = speaker || ChatMessage.getSpeaker();
    let chatData = {
        speaker: speaker,
    }

    let details = options.details;
    templateData.dialogType = options.dialogType;

    if (options.result instanceof Array) {
        return await processChoice({
            options: options.result,
            flavor: flavor,
            templateData: templateData,
            template: template,
            title: title,
            chatData: chatData
        });
    } else {
        templateData.startingWords = details.startingWords ? details.startingWords : "";
        templateData.middleWords = details.middleWords ? details.middleWords : "";
        templateData.endWords = details.endWords ? details.endWords : "";
        chatData.content = await renderTemplate(template, templateData);
        await ChatMessage.create(chatData);
        return options.result;
    }
}

export async function renderDiceResults2({
                                             title = "",
                                             total = 0,
                                             itemData = {},
                                             templateData = {},
                                         }) {

    let chatData = {
        speaker: ChatMessage.getSpeaker(),
    }

    let rollData;
    if (total >= 10) {
        rollData = itemData.data.details.success;
        templateData.dialogType = DW.dialogTypes.success;
    } else if (total <= 6) {
        rollData = itemData.data.details.failure;
        templateData.dialogType = DW.dialogTypes.fail;
    } else {
        rollData = itemData.data.details.partial;
        templateData.dialogType = DW.dialogTypes.partial;
    }


    if (rollData.choice) {
        return await processChoice({
            title: title,
            rollData: rollData,
            templateData: templateData,
            chatData: chatData
        });
    } else {
        templateData.startingWords = rollData.startW ? rollData.startW : "";
        templateData.middleWords = rollData.midW ? rollData.midW : "";
        templateData.endWords = rollData.endW ? rollData.endW : "";
        chatData.content = await renderTemplate(CONFIG.DW.template, templateData);
        await ChatMessage.create(chatData);
        return rollData.ret;
    }
}

/**
 * VALIDATE MOVE
 * Determine if the user has the move in question
 * @param actor
 * @param move
 * @param target
 * @returns {Promise<boolean>}
 */
export async function validateMove({actor: actor, move: move, target: target}) {
    if (!actor) {
        ui.notifications.warn("Please select a character");
        return false;
    }
    let actorData = actor.data;
    let hasMove = actorData.items.find(i => i.name.toLowerCase() === move.toLowerCase());
    if (hasMove === null) {
        ui.notifications.warn(`${actorData.name} does not know ${move}`);
        return false;
    }
    return true;
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
export async function doDamage({actor = null, targetData = null, damageMod = null, title = "", verb = null}) {

    let actorData = actor.data;
    let base = actorData.data.attributes.damage.value;
    let formula = base;
    let misc = "";
    if (actorData.data.attributes.damage.misc) {
        misc = actorData.data.attributes.damage.misc;
        formula += `+${misc}`;
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
            dialogType: CONFIG.DW.dialogTypes.damage,
            sourceColor: gColors.source,
            sourceName: sName,
            targetColor: gColors.target,
            targetName: tName,
            middleWords: verb || "hits",
            endWords: `for ${damage} damage`,
            title: title + " Damage",
            base: base,
            misc: misc,
            bonus: damageMod,
            rollDw: rolled
        }

        let params =
            [{
                filterType: "adjustment",
                autoDestroy: true,
                saturation: 1,
                brightness: .5,
                contrast: 1,
                gamma: 1,
                red: 4,
                green: 0.5,
                blue: 0.5,
                alpha: 0.5,
                animated:
                    {
                        alpha:
                            {
                                active: true,
                                loopDuration: 250,
                                loops: 1,
                                animType: "syncCosOscillation",
                                val1: 1,
                                val2: 1
                            }
                    }
            }];

        await TokenMagic.addFiltersOnTargeted(params);
        renderTemplate(CONFIG.DW.template, templateData).then(content => {
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