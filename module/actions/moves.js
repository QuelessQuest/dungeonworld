import {doDamage, doHeal, getColors, getTargets, renderDiceResults} from "./dwUtils.js";
import { barredFromCasting } from "./spellHelper.js";

/**
 * MOVE
 * @param actor
 * @param item
 * @param spell
 * @returns {Promise<*>}
 */
export async function move(actor, item, spell = "") {

    let itemData = item.data.data;
    if (itemData.details.target) {
        if (game.user.targets.size === 0) {
            ui.notifications.warn("Action requires a target.");
            return "abort";
        }
    }

    let targetData = getTargets(actor);

    if (itemData.details.effect.enabled) {
        if (itemData.details.effect.self) {
            await TokenMagic.addFiltersOnSelected(itemData.details.effect.name);
        }
        if (itemData.details.effect.target) {
            await TokenMagic.addFiltersOnTargeted(itemData.details.effect.name);
        }
    }

    let baseFormula = '2d6';
    let actorData = actor.data;
    let ability = itemData.rollType.toLowerCase();
    let mod = itemData.rollMod;
    let abilityMod = 0;
    switch (ability) {
        case "bond":
            break;
        case "ask":
            break;
        default:
            abilityMod = actorData.data.abilities[ability].mod;
            break;
    }
    let formula = `${baseFormula}+${abilityMod}`;
    let forward = actor.getFlag("world", "forward");
    let frw = 0;
    if (forward) {
        frw = forward.reduce(function (a, b) {
            return a + b;
        }, 0);
    }
    if (frw) {
        formula += `+${frw}`;
    }
    let sus = 0;
    let ongoing = 0;

    // This is a spell. Handle special spell processing
    if (item.name.toLowerCase() === "cast a spell") {
        let ok = await barredFromCasting(actor);
        if ("ok" !== ok) {
            ui.notifications.warn(ok);
            return "abort";
        }

        let sustained = actor.getFlag("world", "sustained");
        if (sustained) {
            for (let sSpell of sustained) {
                sus += sSpell.data.value;
            }
        }
        if (sus) {
            formula += `-${sus}`;
        }
        ongoing = actor.getFlag("world", "ongoing");
        if (ongoing) {
            formula += `+${ongoing}`;
        }
    }

    if (mod && mod !== 0) {
        formula += `+${mod}`;
    }
    let cRoll = new Roll(`${formula}`);
    cRoll.roll();
    let rolled = await cRoll.render();
    let gColors = getColors(actor, targetData.targetActor);

    let targetName;
    if (targetData.targetActor && actor) {
        targetName = targetData.targetActor.name === actor.name ? "self" : targetData.targetActor.name;
    }

    let templateData = {
        title: spell ? item.name + " - " + spell : item.name,
        ability: ability.charAt(0).toUpperCase() + ability.slice(1),
        mod: abilityMod,
        ongoing: ongoing,
        sustained: sus ? `-${sus}` : 0,
        forward: frw ? `+${frw}` : 0,
        rollDw: rolled,
        sourceColor: gColors.source,
        targetColor: gColors.target,
        sourceName: actor ? actor.name : "",
        targetName: targetName,
        startingWords: "",
        middleWords: "",
        endWords: ""
    }

    await game.dice3d.showForRoll(cRoll);
    return await renderDiceResults({
        title: item.name,
        total: cRoll.total,
        itemData: itemData,
        templateData: templateData,
        spell: spell
    });
}

/**
 * RESOLVE MOVE
 * @param actor
 * @param move
 * @param result
 * @returns {Promise<void>}
 */
export async function resolveMove(actor, move, result) {
    let moveData = move.data.data;

    if (moveData.details.script) {
        await DWBase[moveData.details.script](actor);
    }
    if (moveData.details.damage.enabled) {
        await doDamage({
            item: move,
            damageMod: result,
            actor: actor,
            targetData: getTargets(actor),
            title: move.name
        })
    }
    if (moveData.details.heal.enabled) {
        await doHeal({
            item: move,
            actor: actor,
            targetData: getTargets(actor),
            baseHeal: result,
            title: spell.name
        });
    }
    if (moveData.details.effect.enabled) {
        if (moveData.details.effect.self) {
            await TokenMagic.deleteFiltersOnSelected();
        }
        if (moveData.details.effect.target) {
            await TokenMagic.deleteFiltersOnTargeted();
        }
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