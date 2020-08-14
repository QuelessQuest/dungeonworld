import * as sh from './actions/spellHelper.js'
import * as cs from './actions/clericSpells.js'
import * as ws from './actions/wizardSpells.js'
import * as cmn from './actions/commonSpells.js'
import * as dm from './actions/druidMoves.js'
import * as basic from './actions/basicMoves.js'
import * as tm from './actions/thiefMoves.js'
import {DwFilters} from "./filters.js";

export function Base() {

    async function doClericLight(actor) {
        return cmn.light(actor, cs.clericSpell);
    }

    async function doWizardLight(actor) {
        return cmn.light(actor, ws.wizardSpell);
    }

    /**
     * CLERIC MOVES ========================================
     */

    async function doCommune(actor) {
        return sh.setSpells(actor, "Commune");
    }

    /**
     * CLERIC SPELLS ========================================
     */
    async function doGuidance(actor) {
        return cs.guidance(actor);
    }

    async function doSanctify(actor) {
        return cs.sanctify(actor);
    }

    async function doBless(actor) {
        return cs.bless(actor);
    }

    async function doCauseFear(actor) {
        return cs.causeFear(actor);
    }

    async function doCureLightWounds(actor) {
        return cs.cureLightWounds(actor);
    }

    async function doDetectAlignment(actor) {
        return cs.detectAlignment(actor);
    }

    async function doMagicWeapon(actor) {
        return cs.magicWeapon(actor);
    }

    async function doSanctuary(actor) {
        return cs.sanctuary(actor);
    }

    async function doSpeakWithDead(actor) {
        return cs.speakWithDead(actor);
    }

    /**
     * WIZARD MOVES ========================================
     */

    async function doPrepareSpells(actor) {
        return sh.setSpells(actor, "Prepare Spells");
    }

    /**
     * WIZARD SPELLS ========================================
     */

    async function doAlarm(actor) {
        return ws.alarm(actor);
    }

    async function doCharmPerson(actor) {
        return ws.charmPerson(actor);
    }

    async function doContactSpirits(actor) {
        return ws.contactSpirits(actor);
    }

    async function doDetectMagic(actor) {
        return ws.detectMagic(actor);
    }

    async function doMagicMissile(actor) {
        return ws.magicMissile(actor);
    }

    async function doInvisibility(actor) {
        return ws.invisibility(actor);
    }

    async function doPrestidigitation(actor) {
        return ws.prestidigitation(actor);
    }

    async function doTelepathy(actor) {
        return ws.telepathy(actor);
    }

    async function doUnseenServant(actor) {
        return ws.unseenServant(actor);
    }

    /**
     * HELPERS ========================================
     */

    async function showActor(actor) {
        console.log(actor);
    }

    async function showToken() {
        console.log(canvas.tokens.controlled[0]);
    }

    async function cancelSpell(actor) {
        return sh.dropSpell(actor);
    }

    async function notDead() {
        await canvas.tokens.controlled[0].toggleOverlay(null);
    }

    async function createFilters() {
        await DwFilters.createFilters();
    }

    async function exportFilters() {
        await DwFilters.exportFilters();
    }

    async function importFilters() {
        await DwFilters.importFilters();
    }

    async function getFilters() {
        await DwFilters.getFilters();
    }

    /**
     * BASIC MOVES ========================================
     */

    async function doMove(actor, item) {
        return basic.move(actor, item);
    }

    async function doHackAndSlash(actor) {
        return basic.hackAndSlash(actor);
    }

    async function doVolley(actor) {
        return basic.volley(actor);
    }

    async function doCarouse(actor) {
        return basic.carouse(actor);
    }

    async function doDefyDanger(actor) {
        return basic.defyDanger(actor);
    }

    async function doDefend(actor) {
        return basic.defend(actor);
    }

    async function doSpoutLore(actor) {
        return basic.spoutLore(actor);
    }

    async function doDiscernRealities(actor) {
        return basic.discernRealities(actor);
    }

    async function doParley(actor) {
        return basic.parley(actor);
    }

    async function doAidOrInterfere(actor) {
        return basic.aidOrInterfere(actor);
    }

    /**
     * DRUID MOVES ========================================
     */
    async function doShapeshifter(actor) {
        return dm.shapeshift(actor);
    }

    /**
     * THIEF MOVES ========================================
     */

    async function doBackstab(actor) {
        return tm.backstab(actor);
    }

    return {
        cancelSpell: cancelSpell,
        doClericLight: doClericLight,
        doWizardLight: doWizardLight,
        doGuidance: doGuidance,
        doSanctify: doSanctify,
        doBless: doBless,
        doCauseFear: doCauseFear,
        doCureLightWounds: doCureLightWounds,
        doDetectAlignment: doDetectAlignment,
        doMagicWeapon: doMagicWeapon,
        doSanctuary: doSanctuary,
        doSpeakWithDead: doSpeakWithDead,
        doPrestidigitation: doPrestidigitation,
        doUnseenServant: doUnseenServant,
        doContactSpirits: doContactSpirits,
        doDetectMagic: doDetectMagic,
        doCharmPerson: doCharmPerson,
        doTelepathy: doTelepathy,
        doInvisibility: doInvisibility,
        doAlarm: doAlarm,
        doHackAndSlash: doHackAndSlash,
        doVolley: doVolley,
        doCarouse: doCarouse,
        doDefyDanger: doDefyDanger,
        doDefend: doDefend,
        doSpoutLore: doSpoutLore,
        doDiscernRealities: doDiscernRealities,
        doParley: doParley,
        doAidOrInterfere: doAidOrInterfere,
        doShapeshifter: doShapeshifter,
        doCommune: doCommune,
        doBackstab: doBackstab,
        doMagicMissile: doMagicMissile,
        doPrepareSpells: doPrepareSpells,
        showToken: showToken,
        showActor: showActor,
        notDead: notDead,
        doMove: doMove,
        createFilters: createFilters,
        exportFilters: exportFilters,
        importFilters: importFilters,
        getFilters: getFilters
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