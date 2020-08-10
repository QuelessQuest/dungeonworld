import * as sh from './spellHelper.js'
import * as util from './dwUtils.js'
import {getColors} from "./dwUtils.js";

/**
 * WizardSpell
 * Used to cast all Wizard Spells. Provides the Success with Consequences dialog if necessary
 * @param actor
 * @param spellName
 * @param move
 * @param target
 * @returns {Promise<*>}
 */
export async function wizardSpell({actor: actor, spellName: spellName, move: move, target: target = false}) {
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
                        icon: `<i class="fas fa-bong"></i>`,
                        label: "The spell disturbs the fabric of reality as it is cast",
                        details: {
                            middleWords: `Successfully Casts ${spellName} on`,
                            endWords: ", but disturbs the fabric of reality"
                        },
                        result: "DISTANCED"
                    },
                    {
                        key: "opt3",
                        icon: `<i class="fas fa-ban"></i>`,
                        label: "After it is cast, the spell is forgotten",
                        details: {
                            middleWords: `Successfully Casts ${spellName} on`,
                            endWords: ", but the spell has been forgotten"
                        },
                        result: "REVOKED"
                    }]
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

// CANTRIPS =======================================================================================

export async function prestidigitation(actor) {
    let valid = await sh.validateSpell({actor: actor, spell: "Prestidigitation", target: true});
    if (!valid) return;

    let cast = await clericSpell({actor: actor, spellName: "Prestidigitation", move: "Cast A Spell", target: true});
    if (!cast) return;

    await util.coloredChat({
        actor: actor,
        middleWords: "prestidigitates",
    });
}

export async function unseenServant(actor) {
    let valid = await sh.validateSpell({actor: actor, spell: "Unseen Servant", target: true});
    if (!valid) return;

    let cast = await clericSpell({actor: actor, spellName: "Unseen Servant", move: "Cast A Spell", target: true});
    if (!cast) return;

    await util.coloredChat({
        actor: actor,
        middleWords: "summons an unseen servant",
    });
}

// FIRST LEVEL =======================================================================================

export async function alarm(actor) {
    let valid = await sh.validateSpell({actor: actor, spell: "Alarm"});
    if (!valid) return;

    let cast = await wizardSpell({actor: actor, spellName: "Alarm", move: "Cast A Spell"});
    if (!cast) return;

    await util.coloredChat({
        actor: actor,
        middleWords: "sets and alarm"
    });
}

export async function charmPerson(actor) {
    let valid = await sh.validateSpell({actor: actor, spell: "Charm Person", target: true});
    if (!valid) return;

    let cast = await wizardSpell({actor: actor, spellName: "Charm Person", move: "Cast A Spell", target: true});
    if (!cast) return;

    let targetData = util.getTargets(actor);

    await util.coloredChat({
        actor: actor,
        target: targetData.targetActor,
        middleWords: "charms"
    });
}

export async function contactSpirits(actor) {
    let valid = await sh.validateSpell({actor: actor, spell: "Contact Spirits"});
    if (!valid) return;

    let cast = await wizardSpell({actor: actor, spellName: "Contact Spirits", move: "Cast A Spell"});
    if (!cast) return;

    await util.coloredChat({
        actor: actor,
        middleWords: "sets about contacting the spirits"
    });
}

export async function detectMagic(actor) {
    let valid = await sh.validateSpell({actor: actor, spell: "Detect Magic"});
    if (!valid) return;

    let cast = await wizardSpell({actor: actor, spellName: "Detect Magic", move: "Cast A Spell"});
    if (!cast) return;

    await util.coloredChat({
        actor: actor,
        middleWords: "detects magic"
    });
}

export async function telepathy(actor) {
    let valid = await sh.validateSpell({actor: actor, spell: "Telepathy", target: true});
    if (!valid) return;

    let cast = await wizardSpell({actor: actor, spellName: "Telepathy", move: "Cast A Spell", target: true});
    if (!cast) return;

    let targetData = util.getTargets(actor);

    await util.coloredChat({
        actor: actor,
        target: targetData.targetActor,
        middleWords: "establishes a telepathic link with"
    });
}

/**
 * INVISIBILITY
 * @param actor
 * @returns {Promise<void>}
 */
export async function invisibility(actor) {

    let valid = await sh.validateSpell({actor: actor, spell: "Invisibility"});
    if (!valid) return;

    let cast = await wizardSpell({actor: actor, spellName: "Invisibility", move: "Cast A Spell"});
    if (!cast) {
        return;
    }

    let targetData = util.getTargets(actor);

    let params =
        [{
            filterType: "distortion",
            maskPath: "/modules/tokenmagic/fx/assets/waves-2.png",
            maskSpriteScaleX: 7,
            maskSpriteScaleY: 7,
            padding: 50,
            animated:
                {
                    maskSpriteX: {active: true, speed: 0.05, animType: "move"},
                    maskSpriteY: {active: true, speed: 0.07, animType: "move"}
                }
        },
            {
                filterType: "glow",
                distance: 10,
                outerStrength: 8,
                innerStrength: 0,
                color: 0xBA91D7,
                quality: 0.5,
                animated:
                    {
                        color:
                            {
                                active: true,
                                loopDuration: 3000,
                                animType: "colorOscillation",
                                val1: 0xD6E6C3,
                                val2: 0xCDCFB7
                            }
                    }
            }
        ];

    await TokenMagic.addFilters(targetData.targetToken, params);

    let invFlag = {
        spell: "Invisibility",
        data: {
            targetName: targetData.targetActor.name,
            targetId: targetData.targetActor._id,
            targetToken: targetData.targetToken.id,
            updateData: {"hidden": false},
            updateType: "Token",
            startingWords: "",
            middleWords: "has canceled the Invisibility on",
            endWords: ""
        }
    };

    await targetData.targetToken.update({"hidden": true});
    await sh.setActiveSpell(actor, invFlag);
    await TokenMagic.deleteFilters(targetData.targetToken);

    await util.coloredChat({
        actor: actor,
        target: targetData.targetActor,
        middleWords: "casts Invisibility on"
    });
}

/**
 * MAGIC MISSILE
 * @param actorData
 * @returns {Promise<void>}
 */
export async function magicMissile(actor) {

    let valid = await sh.validateSpell({actor: actor, spell: "Magic Missile", target: true});
    if (!valid) return;

    let cast = await wizardSpell({actor: actor, spellName: "Magic Missile", move: "Cast A Spell", target: true});
    if (!cast) return;

    let targetData = util.getTargets(actor);
    let token = canvas.tokens.controlled[0];

    let missile =
        [{
            filterType: "electric",
            color: 0xFFFFFF,
            time: 0,
            blend: 1,
            intensity: 5,
            autoDestroy: true,
            animated: {
                time: {
                    active: true,
                    speed: 0.0020,
                    loopDuration: 1500,
                    loops: 1,
                    animType: "move"
                }
            }
        }];

    let roll = new Roll("2d4", {});
    roll.roll();
    let rolled = await roll.render();
    await game.dice3d.showForRoll(roll);


    await sh.launchProjectile(token, targetData.targetToken, "modules/dwmacros/assets/mm.png");
    await TokenMagic.addFiltersOnTargeted(missile);

    let actorData = actor.data;
    if (targetData.targetActor.permission !== CONST.ENTITY_PERMISSIONS.OWNER)
        roll.toMessage({
            speaker: ChatMessage.getSpeaker(),
            flavor: `${actorData.name} casts Magic Missile on ${targetData.targetActor.data.name}.<br>
                    <p><em>Manually apply ${roll.total} damage to ${targetData.targetActor.data.name}</em></p>`
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
            middleWords: "casts Magic Missile at",
            endWords: `for ${roll.total} damage`,
            title: "Damage",
            base: "2d4",
            rollDw: rolled
        }
        renderTemplate(DWMacrosConfig.template, templateData).then(content => {
            let chatData = {
                speaker: ChatMessage.getSpeaker(),
                content: content
            };
            ChatMessage.create(chatData);
            targetData.targetActor.update({
                "data.attributes.hp.value": targetData.targetActor.data.data.attributes.hp.value - roll.total
            })
        });
    }
}