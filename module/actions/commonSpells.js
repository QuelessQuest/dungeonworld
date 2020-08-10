import * as sh from './spellHelper.js'
import * as util from './dwUtils.js'
import {getTargets} from "./dwUtils.js";

/**
 * LIGHT
 * @param actor
 * @param spellType
 * @returns {Promise<void>}
 */
export async function light(actor, spellType) {

    let valid = await sh.validateSpell({actor: actor, spell: "Light"});
    if (!valid) return;

    let cast = await spellType({actor: actor, spellName: "Light", move: "Cast A Spell"});
    if (!cast) return;

    let targetData = getTargets(actor);

    let lightFlag = {
        spell: "Light",
        data: {
            targetName: targetData.targetActor.name,
            targetId: targetData.targetActor._id,
            targetToken: targetData.targetToken.id,
            updateData: {"dimLight": null, "brightLight": null},
            updateType: "Token",
            middleWords: "has canceled Light"
        }
    };
    await new Dialog({
        title: 'Light',
        content:
            "<input type='text' name='alwaysOn' is='colorpicker-input' id='permanent'>",
        buttons: {
            ok: {
                icon: '<i class="fas fa-sun"></i>',
                label: "Cast",
                callback: () => {
                    let targetData = util.getTargets(actorData);
                    targetData.targetToken.update({"dimLight": 40, "brightLight": 20, "lightAngle": 360, "lightColor": document.getElementById("permanent").value.substring(0, 7)});
                    sh.setActiveSpell(actor, lightFlag);
                }
            },
            cancel: {
                icon: '<i class="fas fa-times"></i>',
                label: "Cancel",
                callback: () => {
                }
            }
        }
    }).render(true);
}