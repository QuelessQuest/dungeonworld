import * as util from './dwUtils.js'
import {basicMove} from "./basicMoves.js";

/**
 * Provides a dialog to chose a new shape. Token image will be updated to reflect the selection.
 * @returns {Promise<void>}
 */
export async function backstab(actor) {
    let canDo = await util.validateMove({actor: actor, move: "Backstab", target: true});
    if (!canDo) {
        return;
    }

    if (game.user.targets.size <= 0) {
        ui.notifications.warn("Backstab needs a target");
        return;
    }

    let targetData = util.getTargets(actorData);
    await new Dialog({
        title: 'Backstab',
        content: `<p>You are attempting to Backstab ${targetData.targetActor.name}. Do you</p>`,
        buttons: {
            dmg: {
                icon: '<i class="fas fa-bullseye"></i>',
                label: "Deal Your Damage",
                callback: () => {
                    util.doDamage({actor: actor, targetData: targetData, title: "Backstab", verb: "backstabs"});
                }
            },
            rr: {
                icon: '<i class="fas fa-dice-d6"></i>',
                label: "Roll",
                callback: () => {
                    backstabRoll({actor: actor, targetData: targetData});
                }
            }
        }
    }).render(true);
}

async function backstabRoll({actor = {}, targetData = {}}) {
    let result = [
        {
            key: "opt1",
            icon: `<i class="fas fa-bacon"></i>`,
            label: "You don’t get into melee",
            details: {
                middleWords: "Successfully Backstabs",
                endWords: "and avoid melee"
            },
            result: "0"
        },
        {
            key: "opt2",
            icon: `<i class="fas fa-dice-d6"></i>`,
            label: "You deal your damage +1d6",
            details: {
                middleWords: "Successfully Backstabs",
                endWords: "and deals an addition d6 damage"
            },
            result: "+1d6"
        },
        {
            key: "opt3",
            icon: `<i class="fas fa-crosshairs"></i>`,
            label: "You create an advantage",
            details: {
                middleWords: "Successfully Backstabs",
                endWords: "and creates and advantage"
            },
            result: "0"
        },
        {
            key: "opt4",
            icon: `<i class="fas fa-shield-alt"></i>`,
            label: "Reduce their armor by 1",
            details: {
                middleWords: "Successfully Backstabs",
                endWords: "and reduces their armor"
            },
            result: "0"
        }
    ];
    let flavor = "Your attack is successful, chose an option.";
    let options = {
        fail: {
            dialogType: CONFIG.DW.dialogTypes.fail,
            details: {
                middleWords: "Failed to Backstab"
            },
            result: null
        },
        pSuccess: {
            dialogType: CONFIG.DW.dialogTypes.partial,
            details: {
                middleWords: "Successfully Backstabs"
            },
            result: result
        },
        success: {
            dialogType: CONFIG.DW.dialogTypes.success,
            result: "0"
        }
    };
    let attack = await basicMove(({actor: actor, targetActor: targetData.targetActor, flavor: flavor, options: options, title: "Backstab", move: "Backstab"}));
    if (attack) {
        await util.doDamage({actor: actor, targetData: targetData, damageMod: attack, title: "Backstab", verb: "backstabs"});
    }
}