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