import * as sh from './spellHelper.js'
import * as util from './dwUtils.js'
import {getColors} from "./dwUtils.js";

/**
 * ClericSpell
 * Used to cast all Cleric Spells. Provides the Success with Consequences dialog if necessary
 * @param actor
 * @param spellName
 * @param move
 * @param target
 * @returns {Promise<*>}
 */
export async function clericSpell({actor: actor, spellName: spellName, move: move, target: target = false}) {
    if (actor) {
        if (target) {
            if (game.user.targets.size === 0) {
                ui.notifications.warn("Spell requires a target.");
                return;
            }
        }

        let targetData = util.getTargets(actor);
        let flavor = "Your casting succeeds, however you must select one of the following options.";
        let options = {
            success: {
                details: {
                    middleWords: `Successfully Casts ${spellName} on`
                },
                dialogType: CONFIG.DW.dialogTypes.success,
                result: "NORMAL"
            },
            fail: {
                details: {
                    middleWords: `Failed to Cast ${spellName}`
                },
                dialogType: CONFIG.DW.dialogTypes.fail,
                result: "FAILED"
            },
            pSuccess: {
                dialogType: CONFIG.DW.dialogTypes.partial,
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
            actor: actor,
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
 * @param actor
 * @returns {Promise<void>}
 */
export async function guidance(actor) {
    let valid = await sh.validateSpell({actor: actor, spell: "Guidance"});
    if (!valid) return;

    let cast = await clericSpell({actor: actor, spellName: "Guidance", move: "Cast A Spell"});
    if (!cast) return;

    await util.coloredChat({
        actor: actor,
        middleWords: "asks for guidance"
    });
}

/**
 * SANCTIFY
 * @param actor
 * @returns {Promise<void>}
 */
export async function sanctify(actor) {
    let valid = await sh.validateSpell({actorData: actor, spell: "Sanctify"});
    if (!valid) return;

    let cast = await clericSpell({actor: actor, spellName: "Sanctify", move: "Cast A Spell"});
    if (!cast) return;

    await util.coloredChat({
        actor: actor,
        middleWords: "sanctifies some food and water"
    });
}

// FIRST LEVEL =======================================================================================

/**
 * BLESS
 * @param actor
 * @returns {Promise<void>}
 */
export async function bless(actor) {
    let valid = await sh.validateSpell({actor: actor, spell: "Bless"});
    if (!valid) return;

    let cast = await clericSpell({actor: actor, spellName: "Bless", move: "Cast A Spell"});
    if (!cast) return;

    let targetData = util.getTargets(actor);

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

    await sh.setActiveSpell(actor, blessFlag);
    await sh.setSustained(actor, {spell: "Bless", data: {targetName: targetData.targetActor.name, value: 1}});
    await sh.setForward(targetData.targetActor, {type: "Bless", value: 1});

    await util.coloredChat({
        actor: actor,
        target: targetData.targetActor,
        middleWords: "has Blessed"
    });
}

/**
 * CURE LIGHT WOUNDS
 * @param actor
 * @returns {Promise<void>}
 */
export async function cureLightWounds(actor) {

    let valid = await sh.validateSpell({actor: actor, spell: "Cure Light Wounds", target: true});
    if (!valid) return;

    let cast = await clericSpell({actor: actor, spellName: "Cure Light Wounds", move: "Cast A Spell", target: true})
    if (!cast) return;

    let targetData = util.getTargets(actor);
    let actorData = actor.data;
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
 * @param actor
 * @returns {Promise<void>}
 */
export async function causeFear(actor) {
    let valid = await sh.validateSpell({actor: actor, spell: "Cause Fear", target: true});
    if (!valid) return;

    let cast = await clericSpell({actor: actor, spellName: "Cause Fear", move: "Cast A Spell", target: true});
    if (!cast) return;

    await util.coloredChat({
        actor: actor,
        middleWords: "causes",
        endWords: "to recoil in fear"
    });
}

/**
 * DETECT ALIGNMENT
 * @param actor
 * @returns {Promise<void>}
 */
export async function detectAlignment(actor) {
    let valid = await sh.validateSpell({actor: actor, spell: "Detect Alignment", target: true});
    if (!valid) return;

    let cast = await clericSpell({actor: actor, spellName: "Detect Alignment", move: "Cast A Spell", target: true});
    if (!cast) return;

    let targetData = util.getTargets(actorData);

    await util.coloredChat({
        actor: actor,
        target: targetData.targetActor,
        middleWords: "detects the alignment of"
    });
}

/**
 * MAGIC WEAPON
 * @param actor
 * @returns {Promise<void>}
 */
export async function magicWeapon(actor) {
    let valid = await sh.validateSpell({actor: actor, spell: "Magic Weapon"});
    if (!valid) return;

    let cast = await clericSpell({actor: actor, spellName: "Magic Weapon", move: "Cast A Spell"});
    if (!cast) return;

    let actorData = actor.data;
    let currentMisc = actorData.data.attributes.damage.misc;

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
    await sh.setActiveSpell(actor, flag);
    await sh.setSustained(actor, {spell: "Magic Weapon", data: {targetName: actorData.name, value: 1}});
    await actor.update({"data": {"attributes": {"damage": {"misc": currentMisc}}}});
    await util.coloredChat({
        actor: actor,
        middleWords: "casts Magic Weapon"
    });
}

/**
 * SANCTUARY
 * @param actor
 * @returns {Promise<void>}
 */
export async function sanctuary(actor) {
    let valid = await sh.validateSpell({actor: actor, spell: "Sanctuary"});
    if (!valid) return;

    let cast = await clericSpell({actor: actor, spellName: "Sanctuary", move: "Cast A Spell"});
    if (!cast) return;

    await util.coloredChat({
        actor: actor,
        middleWords: "creates a Sanctuary"
    });
}

/**
 * SPEAK WITH DEAD
 * @param actor
 * @returns {Promise<void>}
 */
export async function speakWithDead(actor) {
    let valid = await sh.validateSpell({actor: actor, spell: "Speak With Dead"});
    if (!valid) return;

    let cast = await clericSpell({actor: actor, spellName: "Speak With Dead", move: "Cast A Spell"});
    if (!cast) return;

    await util.coloredChat({
        actor: actor,
        middleWords: "speaks with the dead"
    });
}