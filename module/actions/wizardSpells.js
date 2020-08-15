import * as sh from './spellHelper.js'
import * as util from './dwUtils.js'

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