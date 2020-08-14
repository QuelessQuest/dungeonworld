import * as util from './dwUtils.js'
import * as basic from './basicMoves.js'

/**
 * Process results of casting the spell, e.g. un-prepare spell if necessary, do damage, heal
 * @param actor
 * @param spell
 * @param cast
 * @returns {Promise<unknown>}
 */
export async function resolveCasting(actor, spell, cast) {
    let success = false;
    switch (cast) {
        case "FAILED":
            if (spell.details.target) {
                let targetData = util.getTargets(actor);
                if (TokenMagic.hasFilterId(targetData.targetToken, spell.data.details.effect.name))
                    await TokenMagic.deleteFilters(targetData.targetToken, spell.data.details.effect.name);
            }
            break;
        case "DISTANCED":
            await setOngoing(actor, -1);
            success = true;
            break;
        case "REVOKED":
            let updatedSpell = duplicate(spell);
            updatedSpell.data.prepared = false;
            await actor.updateOwnedItem(updatedSpell);
            success = true;
            break;
        default:
            success = true;
    }

    if (success) {
        if (spell.details.damage) {
            await util.doDamage({
                actor: actor,
                targetData: util.getTargets(actor),
                baseDamage: spell.details.damage.amt,
                effect: spell.details.damage.effect,
                title: spell.name
            });
        }
        if (spell.details.heal) {

        }
    }

    return new Promise(resolve => {
        resolve(success);
    });
}

/**
 * CAST SPELL
 * @param actor
 * @param targetActor
 * @param flavor
 * @param spellName
 * @param move
 * @param options
 * @returns {Promise<unknown>}
 */
export async function castSpell({actor = {}, targetActor = {}, flavor = null, spellName = "", move = "", options = {}}) {

    let cast = await basic.basicMove({
        actor: actor,
        targetActor: targetActor,
        flavor: flavor,
        title: spellName,
        move: move,
        options: options
    });

    let success = false;
    switch (cast) {
        case "FAILED":
            let targetData = util.getTargets(actor);
            await TokenMagic.deleteFilters(targetData.targetToken);
            break;
        case "DISTANCED":
            await setOngoing(actor, -1);
            success = true;
            break;
        case "REVOKED":
            let spell = actor.data.data.items.find(i => i.name.toLowerCase() === move.toLowerCase());
            let sId = spell._id;
            const item = actor.getOwnedItem(sId);
            if (item) {
                let updatedItem = duplicate(item);
                updatedItem.data.prepared = true;
                await actor.updateOwnedItem(updatedItem);
            }
            success = true;
            break;
        default:
            success = true;
    }
    return new Promise(resolve => {
        resolve(success);
    });
}

/**
 * DROP SPELL
 * Will cancel the selected active spell according to the spells cancel function
 * @param actor
 * @returns {Promise<void>}
 */
export async function dropSpell(actor) {
    let activeSpells = actor.getFlag("world", "activeSpells");
    let templateData = {
        activeSpells: activeSpells
    }
    const content = await renderTemplate("systems/dungeonworld/templates/dialog/cancel-spell.html", templateData);
    let spell = await new Promise((resolve, reject) => {
        new Dialog({
            title: "Cancel An Active Spell",
            content: content,
            default: 'ok',
            buttons: {
                use: {
                    icon: '<i class="fas fa-ban"></i>',
                    label: "Cancel Spell",
                    callback: html => {
                        resolve(
                            html.find('.dw-cancel-spell.dialog [name="activeSpells"]')[0].value);
                    }
                },
                cancel: {
                    icon: '<i class="fas fa-times"></i>',
                    label: "Abort Cancel",
                }
            }
        }).render(true);
    });


    // spell = spellName,targetName
    // Remove from active list
    let info = spell.split(',');
    await removeActiveSpell(actor, {spell: info[0], targetName: info[1]});
}

/**
 * SET SUSTAINED
 * Sets a penalty that will be applied to all other casting rolls made by this actor
 * @param actor
 * @param data
 * @returns {Promise<void>}
 */
export async function setSustained(actor, data) {
    await setSpellFlag(actor, "sustained", data)
}

/**
 * REMOVE SPELL FLAG
 * @param actor
 * @param flag
 * @param spell
 * @param targetName
 * @returns {Promise<{data: null, actorData: *}>}
 */
async function removeSpellFlag(actor, flag, {spell = "", targetName = ""}) {
    let flagItem = actor.getFlag("world", flag);
    let filtered = [];
    let theItem = null;

    flagItem.forEach(item => {
        if (item.spell === spell) {
            if (item.data.targetName === targetName) {
                theItem = item;
            } else {
                filtered.push(item);
            }
        } else {
            filtered.push(item);
        }
    });

    await actor.setFlag("world", flag, filtered);
    return {actor: actor, data: theItem};
}

/**
 * REMOVE SUSTAINED
 * @param actorData
 * @param spell
 * @param targetName
 * @returns {Promise<void>}
 */
export async function removeSustained(actorData, {spell = "", targetName = ""}) {
    await removeSpellFlag(actorData, "sustained", {spell: spell, targetName: targetName});
}

/**
 * SET ONGOING
 * Set an ongoing casting penalty that won't go away until spells are prepared again.
 * @param actorData
 * @param value
 * @returns {Promise<void>}
 */
export async function setOngoing(actorData, value) {
    let ongoing = actorData.getFlag("world", "ongoing");
    if (ongoing) {
        ongoing += value;
    } else {
        ongoing = value;
    }
    await actorData.setFlag("world", "ongoing", ongoing);
}

/**
 * REMOVE ONGOING
 * @param actorData
 * @param spell
 * @param targetName
 * @returns {Promise<void>}
 */
export async function removeOngoing(actorData, {spell = "", targetName = ""}) {
    await removeSpellFlag(actorData, "ongoing", {spell: spell, targetName: targetName});
}

/**
 * SET ACTIVE SPELL
 * Adds the spell to the list of currently active spells. This list is used when a spell is to be canceled.
 * @param actor
 * @param data
 * @returns {Promise<void>}
 */
export async function setActiveSpell(actor, data) {
    await setSpellFlag(actor, "activeSpells", data);
}

/**
 * REMOVE ACTIVE SPELL
 * @param actor
 * @param data
 * @returns {Promise<void>}
 */
export async function removeActiveSpell(actor, {spell = "", targetName = ""}) {
    let stuff = await removeSpellFlag(actor, "activeSpells", {spell: spell, targetName: targetName});

    let targetActor = null;
    let data = stuff.data.data;

    if (data.targetId) {
        targetActor = game.actors.find(a => a._id === data.targetId);
    }
    if (data.sustained) {
        await removeSustained(actor, {spell: spell, targetName: data.targetName});
    }
    if (data.forward) {
        await removeForward(targetActor, spell);
    }

    if (data.filter) {
        let xx = canvas.tokens.placeables.filter(placeable => placeable.id === data.targetToken);
        let targetToken = xx[0];
        await TokenMagic.deleteFilters(targetToken);
    }

    if (data.damage) {
        let dmgMisc = actor.data.data.attributes.damage.misc;
        let newMisc;
        if (dmgMisc === "1d4") {
            newMisc = "";
        } else {
            let idx = dmgMisc.indexOf("+1d4");
            newMisc = dmgMisc.substring(0, idx);
            if (idx + 4 < dmgMisc.length) {
                newMisc += dmgMisc.substring(idx + 4);
            }
        }

        await actor.update({"data": {"attributes": {"damage": {"misc": newMisc}}}});
    }

    if (data.updateData) {
        switch (data.updateType) {
            case "Token":
                let xx = canvas.tokens.placeables.filter(placeable => placeable.id === data.targetToken);
                let targetToken = xx[0];
                await targetToken.update(data.updateData);
                break;
            case "Actor":
                break;
        }
    }

    await util.coloredChat({
        actor: actor,
        target: targetActor,
        startingWords: data.startingWords,
        middleWords: data.middleWords,
        endWords: data.endWords
    });
}

/**
 * SET SPELL FLAG
 * @param actor
 * @param flag
 * @param data
 * @returns {Promise<void>}
 */
async function setSpellFlag(actor, flag, data) {
    let currentFlag = actor.getFlag("world", flag);
    if (currentFlag) {
        currentFlag.push(data);
    } else {
        currentFlag = [data];
    }
    await actor.setFlag("world", flag, currentFlag);
}

/**
 * SET FORWARD
 * Set the 'going forward' bonus for an actor
 * @param target
 * @param data
 * @returns {Promise<void>}
 */
export async function setForward(target, data) {
    await setSpellFlag(target, "forward", data);
}

/**
 * REMOVE FORWARD
 * @param target
 * @param spell
 * @returns {Promise<void>}
 */
export async function removeForward(target, spell) {
    let ff = target.getFlag("world", "forward");
    let fFiltered = ff.filter(f => f.type !== spell);
    await target.setFlag("world", "forward", fFiltered);
}

/**
 * VALIDATE SPELL
 * Checks: Is the spell known? Is the spell prepared? Are they barred from any casting?
 * @param actor
 * @param spell
 * @param target
 * @returns {Promise<boolean>}
 */
export async function validateSpell({actor: actor, spell: spell, target: target}) {
    if (!actor) {
        ui.notifications.warn("Please select the caster");
        return false;
    }
    let actorData = actor.data;
    let hasSpell = actorData.items.find(i => i.name.toLowerCase() === spell.toLowerCase());
    if (hasSpell === null) {
        ui.notifications.warn(`${actorData.name} does not know how to cast ${spell}`);
        return false;
    }
    if (hasSpell.data.data.prepared) {
        if (target) {
            if (game.user.targets.size === 0) {
                ui.notifications.warn("Spell requires a target.");
                return false;
            }
        }
        let message = await barredFromCasting(actorData);
        if (message === "ok") {
            return true;
        } else {
            ui.notifications.warn(message);
            return false;
        }
    } else {
        ui.notifications.warn(`${actorData.name} does not have ${spell} prepared`);
        return false;
    }
}

/**
 * BARRED FROM CASTING
 * Determines if any spells can be cast (e.g. if invisibility is currently active)
 * @param actor
 * @returns {Promise<string>}
 */
async function barredFromCasting(actor) {
    let as = actor.getFlag("world", "activeSpells");
    if (as) {
        if (as.find(x => x.spell === "invisibility")) {
            return "Cannot cast a spell while Invisibility is being maintained";
        }
    }
    return "ok";
}

/**
 * SET SPELLS
 * Provides a dialog that allows for selecting prepared spells.
 * @param actor
 * @returns {Promise<void>}
 */
export async function setSpells(actor, title) {

    let actorData = actor.data;
    let spellItems = actorData.items.filter(i => i.type === "spell");
    let lvlTotal = parseInt(actorData.data.attributes.level.value) + 1;
    let idx = 0;
    let templateData = {
        rotes: [],
        spellData: []
    };

    for (idx = 0; idx < 10; idx++) {
        let spells = spellItems.filter(l => l.data.spellLevel === idx).map(n => n.name)
        if (idx === 0) {
            templateData.rotes = spells;
        } else if (spells.length > 0) {
            templateData.spellData.push({lvl: idx, spells: spells});
        }
    }

    const content = await renderTemplate("systems/dungeonworld/templates/dialog/prepare-spells.html", templateData);
    let p = await new Promise(resolve => {
        new Dialog({
            title: title,
            content: content,
            buttons: {
                prepare: {
                    icon: `<i class="fas fa-scroll"></i>`,
                    label: "Prepare",
                    callback: html => {
                        resolve(
                            html.find('input'));
                    }
                },
                cancel: {
                    icon: '<i class="fas fa-times"></i>',
                    label: "Cancel",
                    callback: resolve
                },
            },
            close: resolve
        }).render(true);
    });
    let pLevels = 0;
    let pSpells = [];
    let upSpells = [];
    for (let idx = 0; idx < p.length; idx++) {
        if (p[idx].checked) {
            pSpells.push(p[idx].name);
            pLevels += parseInt(p[idx].value);
        } else {
            upSpells.push(p[idx].name);
        }

    }
    console.log("A");
    console.log(upSpells);
    console.log(pSpells);
    if (pLevels > lvlTotal) {
        ui.notifications.warn(`${actorData.name} can only prepare ${lvlTotal} levels of spells`);
    } else {
        pSpells.forEach(ps => {
            console.log("SPE");
            console.log(actorData);
            console.log(ps);
            let spell = actorData.items.find(i => i.name === ps);
            let sId = spell._id;
            const item = actor.getOwnedItem(sId);
            if (item) {
                let updatedItem = duplicate(item);
                updatedItem.data.prepared = true;
                actor.updateOwnedItem(updatedItem);
            }
        });
        upSpells.forEach(ups => {
            console.log("SPE");
            console.log(actorData);
            console.log(ups);
            console.log(actorData.items)
            let spell = actorData.items.find(i => i.name === ups);
            let sId = spell._id;
            const item = actor.getOwnedItem(sId);
            if (item) {
                let updatedItem = duplicate(item);
                updatedItem.data.prepared = false;
                actor.updateOwnedItem(updatedItem);
            }
        });
        await actor.setFlag("world", "ongoing", null);
        await util.coloredChat({
            actor: actor,
            middleWords: "has finished preparing spells",
        });
    }
}

/**
 * LAUNCH PROJECTILE
 * Provides an animation of the provided image from the caster to the target.
 * @param sourceToken
 * @param targetToken
 * @param img
 * @returns {Promise<void>}
 */
export async function launchProjectile(sourceToken, targetToken, img) {
    let projectile = await Token.create({
        name: "pp",
        img: img,
        scale: 0.5,
        x: sourceToken.x,
        y: sourceToken.y,
        elevation: 0,
        lockRotation: false,
        rotation: 0,
        effects: [],
        vision: false
    });
    await projectile.setPosition(sourceToken.x, sourceToken.y, {animate: false});
    await projectile.setPosition(targetToken.x, targetToken.y);
    projectile.delete();
}