import * as sh from './spellHelper.js'
import * as util from './dwUtils.js'
import {getColors} from "./dwUtils.js";
import {DWMacrosConfig} from './DWMacrosConfig.js'

/**
 * ClericSpell
 * Used to cast all Cleric Spells. Provides the Success with Consequences dialog if necessary
 * @param actorData
 * @param spellName
 * @param move
 * @param target
 * @returns {Promise<*>}
 */
export async function clericSpell({actorData: actorData, spellName: spellName, move: move, target: target = false}) {
    if (actorData) {
        if (target) {
            if (game.user.targets.size === 0) {
                ui.notifications.warn("Spell requires a target.");
                return;
            }
        }

        let targetData = util.getTargets(actorData);
        let flavor = "Your casting succeeds, however you must select one of the following options.";
        let options = {
            success: {
                details: {
                    middleWords: `Successfully Casts ${spellName} on`
                },
                dialogType: CONFIG.DWMacros.dialogTypes.success,
                result: "NORMAL"
            },
            fail: {
                details: {
                    middleWords: `Failed to Cast ${spellName}`
                },
                dialogType: CONFIG.DWMacros.dialogTypes.fail,
                result: "FAILED"
            },
            pSuccess: {
                dialogType: CONFIG.DWMacros.dialogTypes.partial,
                result: [
                    {
                        key: "opt1",
                        icon: `<i class="fas fa-eye"></i>`,
                        label: "You draw unwelcome attention or put yourself in a spot",
                        details: {
                            middleWords: `Successfully Casts ${spellName} on`,
                            endWords: ", but draws unwelcome attention or is put in a spot"
                        },
                        result: "NORMAL"
                    },
                    {
                        key: "opt2",
                        icon: `<i class="fas fa-angry"></i>`,
                        label: "Your casting distances you from your deity",
                        details: {
                            middleWords: `Successfully Casts ${spellName} on`,
                            endWords: ", but distances themselves from their deity"
                        },
                        result: "DISTANCED"
                    },
                    {
                        key: "opt3",
                        icon: `<i class="fas fa-ban"></i>`,
                        label: "After it is cast, the spell is revoked by your deity",
                        details: {
                            middleWords: `Successfully Casts ${spellName} on`,
                            endWords: ", but has the spell revoked by their deity"
                        },
                        result: "REVOKED"
                    }
                ]
            }
        };

        return await sh.castSpell({
            actorData: actorData,
            targetActor: targetData.targetActor,
            flavor: flavor,
            spellName: spellName,
            move: move,
            options: options
        });
    } else {
        ui.notifications.warn("Please select a token.");
    }
}

// ROTES =======================================================================================

/**
 * GUIDANCE
 * @param actorData
 * @returns {Promise<void>}
 */
export async function guidance(actorData) {
    let valid = await sh.validateSpell({actorData: actorData, spell: "Guidance"});
    if (!valid) return;

    let cast = await clericSpell({actorData: actorData, spellName: "Guidance", move: "Cast A Spell"});
    if (!cast) return;

    await util.coloredChat({
        actorData: actorData,
        middleWords: "asks for guidance"
    });
}

/**
 * SANCTIFY
 * @param actorData
 * @returns {Promise<void>}
 */
export async function sanctify(actorData) {
    let valid = await sh.validateSpell({actorData: actorData, spell: "Sanctify"});
    if (!valid) return;

    let cast = await clericSpell({actorData: actorData, spellName: "Sanctify", move: "Cast A Spell"});
    if (!cast) return;

    await util.coloredChat({
        actorData: actorData,
        middleWords: "sanctifies some food and water"
    });
}

// FIRST LEVEL =======================================================================================

/**
 * BLESS
 * @param actorData
 * @returns {Promise<void>}
 */
export async function bless(actorData) {
    let valid = await sh.validateSpell({actorData: actorData, spell: "Bless"});
    if (!valid) return;

    let cast = await clericSpell({actorData: actorData, spellName: "Bless", move: "Cast A Spell"});
    if (!cast) return;

    let targetData = util.getTargets(actorData);

    let bGlow =
        [{
            filterType: "zapshadow",
            alphaTolerance: 0.50
        },
            {
                filterType: "xglow",
                auraType: 1,
                color: 0x70BBFF,
                thickness: 2,
                scale: 0.25,
                time: 0,
                auraIntensity: 0.5,
                subAuraIntensity: 2,
                threshold: 0.25,
                discard: false,
                animated:
                    {
                        time:
                            {
                                active: true,
                                speed: 0.0006,
                                animType: "move"
                            }
                    }
            }];

    await TokenMagic.addFilters(targetData.targetToken, bGlow);

    let blessFlag = {
        spell: "Bless",
        data: {
            targetName: targetData.targetActor.name,
            targetId: targetData.targetActor._id,
            targetToken: targetData.targetToken.id,
            sustained: true,
            forward: true,
            filter: true,
            startingWords: "",
            middleWords: "has canceled the Bless on",
            endWords: ""
        }
    };

    await sh.setActiveSpell(actorData, blessFlag);
    await sh.setSustained(actorData, {spell: "Bless", data: {targetName: targetData.targetActor.name, value: 1}});
    await sh.setForward(targetData.targetActor, {type: "Bless", value: 1});

    await util.coloredChat({
        actorData: actorData,
        target: targetData.targetActor,
        middleWords: "has Blessed"
    });
}

/**
 * CURE LIGHT WOUNDS
 * @param actorData
 * @returns {Promise<void>}
 */
export async function cureLightWounds(actorData) {

    let valid = await sh.validateSpell({actorData: actorData, spell: "Cure Light Wounds", target: true});
    if (!valid) return;

    let cast = await clericSpell({actorData: actorData, spellName: "Cure Light Wounds", move: "Cast A Spell", target: true})
    if (!cast) return;

    let targetData = util.getTargets(actorData);
    let glow = [
        {
            filterType: "zapshadow",
            alphaTolerance: 0.50
        },
        {
            filterType: "outline",
            autoDestroy: true,
            padding: 10,
            color: 0xFFFFFF,
            thickness: 1,
            quality: 10,
            animated:
                {
                    thickness:
                        {
                            active: true,
                            loopDuration: 4000,
                            loops: 1,
                            animType: "syncCosOscillation",
                            val1: 1,
                            val2: 8
                        }
                }
        }];

    await TokenMagic.addFiltersOnTargeted(glow);
    let roll = new Roll("1d8", {});
    roll.roll();
    let rolled = await roll.render();
    await game.dice3d.showForRoll(roll);

    let maxHeal = Math.clamped(roll.result, 0,
        targetData.targetActor.data.data.attributes.hp.max - targetData.targetActor.data.data.attributes.hp.value);

    if (targetData.targetActor.permission !== CONST.ENTITY_PERMISSIONS.OWNER)
        roll.toMessage({
            speaker: ChatMessage.getSpeaker(),
            flavor: `${actorData.name} casts Cure Light Wounds on ${targetData.targetActor.data.name}.<br>
                            <p><em>Manually apply ${maxHeal} HP of healing to ${targetData.targetActor.data.name}</em></p>`
        });
    else {
        let gColors = getColors(actorData, targetData.targetActor);
        let sName = actorData ? actorData.name : "";
        let tName = targetData.targetActor ? targetData.targetActor.name : "";
        let templateData = {
            sourceColor: gColors.source,
            sourceName: sName,
            targetColor: gColors.target,
            targetName: tName,
            middleWords: "casts Cure Light Wounds on",
            endWords: `for ${maxHeal} HP`,
            title: "Healing",
            base: "1d8",
            rollDw: rolled
        }
        renderTemplate(DWMacrosConfig.template, templateData).then(content => {
            let chatData = {
                speaker: ChatMessage.getSpeaker(),
                content: content
            };
            ChatMessage.create(chatData);
            targetData.targetActor.update({
                "data.attributes.hp.value": targetData.targetActor.data.data.attributes.hp.value + maxHeal
            })
        });
    }
}

/**
 * CAUSE FEAR
 * @param actorData
 * @returns {Promise<void>}
 */
export async function causeFear(actorData) {
    let valid = await sh.validateSpell({actorData: actorData, spell: "Cause Fear", target: true});
    if (!valid) return;

    let cast = await clericSpell({actorData: actorData, spellName: "Cause Fear", move: "Cast A Spell", target: true});
    if (!cast) return;

    await util.coloredChat({
        actorData: actorData,
        middleWords: "causes",
        endWords: "to recoil in fear"
    });
}

/**
 * DETECT ALIGNMENT
 * @param actorData
 * @returns {Promise<void>}
 */
export async function detectAlignment(actorData) {
    let valid = await sh.validateSpell({actorData: actorData, spell: "Detect Alignment", target: true});
    if (!valid) return;

    let cast = await clericSpell({actorData: actorData, spellName: "Detect Alignment", move: "Cast A Spell", target: true});
    if (!cast) return;

    let targetData = util.getTargets(actorData);

    await util.coloredChat({
        actorData: actorData,
        target: targetData.targetActor,
        middleWords: "detects the alignment of"
    });
}

/**
 * MAGIC WEAPON
 * @param actorData
 * @returns {Promise<void>}
 */
export async function magicWeapon(actorData) {
    let valid = await sh.validateSpell({actorData: actorData, spell: "Magic Weapon"});
    if (!valid) return;

    let cast = await clericSpell({actorData: actorData, spellName: "Magic Weapon", move: "Cast A Spell"});
    if (!cast) return;

    let currentMisc = actorData.data.data.attributes.damage.misc;

    let params =
        [
            {
                filterType: "ray",
                time: 0,
                color: 0x70BBFF,
                alpha: 0.25,
                divisor: 32,
                anchorY: 0,
                animated:
                    {
                        time:
                            {
                                active: true,
                                speed: 0.0005,
                                animType: "move"
                            }
                    }
            }
        ];

    await TokenMagic.addFiltersOnSelected(params);
    let flag = {
        spell: "Magic Weapon",
        data: {
            targetName: actorData.name,
            sustained: true,
            filter: true,
            targetId: canvas.tokens.controlled[0].id,
            targetToken: canvas.tokens.controlled[0].id,
            damage: "1d4",
            middleWords: "cancels Magic Weapon"
        }
    };

    if (currentMisc) {
        currentMisc += "+1d4";
    } else {
        currentMisc = "1d4";
    }
    await sh.setActiveSpell(actorData, flag);
    await sh.setSustained(actorData, {spell: "Magic Weapon", data: {targetName: actorData.name, value: 1}});
    await actorData.update({"data": {"attributes": {"damage": {"misc": currentMisc}}}});
    await util.coloredChat({
        actorData: actorData,
        middleWords: "casts Magic Weapon"
    });
}

/**
 * SANCTUARY
 * @param actorData
 * @returns {Promise<void>}
 */
export async function sanctuary(actorData) {
    let valid = await sh.validateSpell({actorData: actorData, spell: "Sanctuary"});
    if (!valid) return;

    let cast = await clericSpell({actorData: actorData, spellName: "Sanctuary", move: "Cast A Spell"});
    if (!cast) return;

    await util.coloredChat({
        actorData: actorData,
        middleWords: "creates a Sanctuary"
    });
}

/**
 * SPEAK WITH DEAD
 * @param actorData
 * @returns {Promise<void>}
 */
export async function speakWithDead(actorData) {
    let valid = await sh.validateSpell({actorData: actorData, spell: "Speak With Dead"});
    if (!valid) return;

    let cast = await clericSpell({actorData: actorData, spellName: "Speak With Dead", move: "Cast A Spell"});
    if (!cast) return;

    await util.coloredChat({
        actorData: actorData,
        middleWords: "speaks with the dead"
    });
}