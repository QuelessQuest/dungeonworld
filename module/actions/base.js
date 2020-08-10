import * as sh from './spellHelper.js'
import * as cs from './clericSpells.js'
import * as ws from './wizardSpells.js'
import * as cmn from './commonSpells.js'
import * as dm from './druidMoves.js'
import * as basic from './basicMoves.js'
import * as tm from './thiefMoves.js'

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

    async function doHackAndSlash(actorData) {
        return basic.hackAndSlash(actorData);
    }

    async function doVolley(actorData) {
        return basic.volley(actorData);
    }

    /**
     * CLASS MOVES ========================================
     */
    async function druidShapeshift(actorData) {
        return dm.shapeshift(actorData);
    }

    async function thiefBackstab(actorData) {
        return tm.backstab(actorData);
    }


    async function showActor(actorData) {
        console.log(actorData);
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
        druidShapeshift: druidShapeshift,
        thiefBackstab: thiefBackstab,
        castMagicMissile: castMagicMissile,
        prepareSpells: prepareSpells,
        showToken: showToken,
        showActor: showActor,
        notDead: notDead
    }
}

export const DWM = Base();

Hooks.on("ready", () => {
    console.log("DW Hook -> ready");
    window.DWMacros = DWM;
});

Hooks.on("canvasReady", (canvas) => {
    if (!window.hasOwnProperty("DWM")) {
        window.DWMacros = DWM;
    }
});

Hooks.on('renderChatMessage', (data, html, options) => {
    const type = html.find(".dialogType")
    let dieClass = "";
    for (const dType in CONFIG.DWMacros.dialogTypes) {
        const dd = CONFIG.DWMacros.dialogTypes[dType];
        if (type.hasClass(dd)) {
            dieClass = CONFIG.DWMacros.dialogClasses[dd];
            html.find(".dice-formula").addClass(dieClass);
            html.find(".dice-total").addClass(dieClass);
        }
    }
});