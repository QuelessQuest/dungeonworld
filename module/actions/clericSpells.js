import * as sh from './spellHelper.js'
import * as util from './dwUtils.js'

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