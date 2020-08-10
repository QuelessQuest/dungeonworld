import {DWMacrosConfig} from './DWMacrosConfig.js'

/**
 * GET COLORS
 * If the actor and or target are characters, return the player color
 * @param actorData
 * @param target
 * @returns {{source: string, target: string}}
 */
export function getColors(actorData, target) {

    let gColors = {
        source: "#000000",
        target: "#000000"
    }

    if (actorData) {
        let sourceUser = game.users.find(u => u.data.character === actorData._id);
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
 * @param actorData
 * @param target
 * @param startingWords
 * @param middleWords
 * @param endWords
 * @param showChat
 * @returns {Promise<void>}
 */
export async function coloredChat({
                                      actorData = null,
                                      target = null,
                                      startingWords = "",
                                      middleWords = "",
                                      endWords = ""
                                  }) {
    let template = "modules/dwmacros/templates/chat/defaultWithColor.html";

    let gColors = getColors(actorData, target);

    let sName = actorData ? actorData.name : "";
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
 * @param actorData
 * @returns {{targetActor: *, targetToken: PlaceableObject}}
 */
export function getTargets(actorData) {
    let targetActor;
    let targetToken;
    if (game.user.targets.size > 0) {
        targetActor = game.user.targets.values().next().value.actor;
        let xx = canvas.tokens.placeables.filter(placeable => placeable.isTargeted);
        targetToken = xx[0];
    } else {
        targetActor = actorData;
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
                                        options = {},
                                        flavor = null,
                                        templateData = {},
                                        title = null,
                                        template = null,
                                        chatData = {}
                                    }) {

    return new Promise(resolve => {
        const dialog = new Dialog({
            title: title,
            content: flavor,
            buttons: getButtons(options, template, templateData, chatData, resolve),
        }, {width: 450, classes: ["dwmacros", "dialog"]});
        dialog.render(true);
    });
}

/**
 * GET BUTTONS
 * @param options
 * @param template
 * @param templateData
 * @param chatData
 * @param resolve
 * @returns {{}}
 */
function getButtons(options, template, templateData, chatData, resolve) {
    let buttonData = {};
    for (let opt of options) {
        buttonData[opt.key] = {
            icon: opt.icon,
            label: opt.label,
            callback: async () => {
                templateData.startingWords = opt.details.startingWords ? opt.details.startingWords : "";
                templateData.middleWords = opt.details.middleWords ? opt.details.middleWords : "";
                templateData.endWords = opt.details.endWords ? opt.details.endWords : "";
                chatData.content = await renderTemplate(template, templateData);
                await ChatMessage.create(chatData);
                resolve(opt.result);
            }
        };
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
        console.log("TEMPLATE DATA");
        console.log(templateData);
        chatData.content = await renderTemplate(template, templateData);
        await ChatMessage.create(chatData);
        return options.result;
    }
}

/**
 * VALIDATE MOVE
 * Determine if the user has the move in question
 * @param actorData
 * @param move
 * @param target
 * @returns {Promise<boolean>}
 */
export async function validateMove({actorData: actorData, move: move, target: target}) {
    if (!actorData) {
        ui.notifications.warn("Please select a character");
        return false;
    }
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
export async function doDamage({actorData = null, targetData = null, damageMod = null, title = "", verb = null}) {

    let base = actorData.data.data.attributes.damage.value;
    let formula = base;
    let misc = "";
    if (actorData.data.data.attributes.damage.misc) {
        misc = actorData.data.data.attributes.damage.misc;
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
            dialogType: CONFIG.DWMacros.dialogTypes.damage,
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
                                val2: 1 }
                    }
            }];

        await TokenMagic.addFiltersOnTargeted(params);
        renderTemplate(DWMacrosConfig.template, templateData).then(content => {
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