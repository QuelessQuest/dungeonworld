import * as sh from './actions/spellHelper.js'
import * as cs from './actions/clericSpells.js'
import * as ws from './actions/wizardSpells.js'
import * as cmn from './actions/commonSpells.js'
import * as dm from './actions/druidMoves.js'
import * as basic from './actions/basicMoves.js'
import * as tm from './actions/thiefMoves.js'

export function Base() {

    async function castClericLight(actorData) {
        return cmn.light(actorData, cs.clericSpell);
    }

    async function castWizardLight(actorData) {
        return cmn.light(actorData, ws.wizardSpell);
    }

    /**
     * CLERIC SPELLS ========================================
     */
    async function castGuidance(actorData) {
        return cs.guidance(actorData);
    }

    async function castSanctify(actorData) {
        return cs.sanctify(actorData);
    }

    async function castBless(actorData) {
        return cs.bless(actorData);
    }

    async function castCauseFear(actorData) {
        return cs.causeFear(actorData);
    }

    async function castCureLightWounds(actorData) {
        return cs.cureLightWounds(actorData);
    }

    async function castDetectAlignment(actorData) {
        return cs.detectAlignment(actorData);
    }

    async function castMagicWeapon(actorData) {
        return cs.magicWeapon(actorData);
    }

    async function castSanctuary(actorData) {
        return cs.sanctuary(actorData);
    }

    async function castSpeakWithDead(actorData) {
        return cs.speakWithDead(actorData);
    }


    /**
     * WIZARD SPELLS ========================================
     */

    async function castAlarm(actorData) {
        return ws.alarm(actorData);
    }

    async function castCharmPerson(actorData) {
        return ws.charmPerson(actorData);
    }

    async function castContactSpirits(actorDaa) {
        return ws.contactSpirits(actorDaa);
    }

    async function castDetectMagic(actorDaa) {
        return ws.detectMagic(actorDaa);
    }

    async function castMagicMissile(actorDaa) {
        return ws.magicMissile(actorDaa);
    }

    async function castInvisibility(actorData) {
        return ws.invisibility(actorData);
    }

    async function castPrestidigitation(actorData) {
        return ws.prestidigitation(actorData);
    }

    async function castTelepathy(actorData) {
        return ws.telepathy(actorData);
    }

    async function castUnseenServant(actorData) {
        return ws.unseenServant(actorData);
    }

    /**
     * HELPERS ========================================
     */
    async function cancelSpell(actorData) {
        return sh.dropSpell(actorData);
    }

    async function prepareSpells(actorData) {
        return sh.setSpells(actorData);
    }

    async function notDead() {
        await canvas.tokens.controlled[0].toggleOverlay(null);
    }

    /**
     * BASIC MOVES ========================================
     */

    async function doHackAndSlash(actor) {
        return basic.hackAndSlash(actor);
    }

    async function doVolley(actor) {
        return basic.volley(actor);
    }

    /**
     * CLASS MOVES ========================================
     */
    async function doShapeshifter(actor) {
        return dm.shapeshift(actor);
    }

    async function thiefBackstab(actor) {
        return tm.backstab(actor);
    }


    async function showActor(actor) {
        console.log(actor);
    }

    async function showToken() {
        console.log(canvas.tokens.controlled[0]);
    }

    return {
        cancelSpell: cancelSpell,
        castClericLight: castClericLight,
        castWizardLight: castWizardLight,
        castGuidance: castGuidance,
        castSanctify: castSanctify,
        castBless: castBless,
        castCauseFear: castCauseFear,
        castCureLightWounds: castCureLightWounds,
        castDetectAlignment: castDetectAlignment,
        castMagicWeapon: castMagicWeapon,
        castSanctuary: castSanctuary,
        castSpeakWithDead: castSpeakWithDead,
        castPrestidigitation: castPrestidigitation,
        castUnseenServant: castUnseenServant,
        castContactSpirits: castContactSpirits,
        castDetectMagic: castDetectMagic,
        castCharmPerson: castCharmPerson,
        castTelepathy: castTelepathy,
        castInvisibility: castInvisibility,
        castAlarm: castAlarm,
        doHackAndSlash: doHackAndSlash,
        doVolley: doVolley,
        doShapeshifter: doShapeshifter,
        thiefBackstab: thiefBackstab,
        castMagicMissile: castMagicMissile,
        prepareSpells: prepareSpells,
        showToken: showToken,
        showActor: showActor,
        notDead: notDead
    }
}

Hooks.on('renderChatMessage', (data, html, options) => {
    const type = html.find(".dialogType")
    let dieClass = "";
    for (const dType in CONFIG.DW.dialogTypes) {
        const dd = CONFIG.DW.dialogTypes[dType];
        if (type.hasClass(dd)) {
            dieClass = CONFIG.DW.dialogClasses[dd];
            html.find(".dice-formula").addClass(dieClass);
            html.find(".dice-total").addClass(dieClass);
        }
    }
});