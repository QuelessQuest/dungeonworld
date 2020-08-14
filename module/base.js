import * as sh from './actions/spellHelper.js'
import * as dm from './actions/druidMoves.js'
import * as basic from './actions/basicMoves.js'
import {DwFilters} from "./filters.js";

export function Base() {

    /**
     * CLERIC MOVES ========================================
     */

    async function doCommune(actor) {
        return sh.setSpells(actor, "Commune");
    }

    /**
     * SPELL SCRIPTS ========================================
     */

    async function magicMissile(actor) {
        return sh.magicMissile(actor);
    }

    /**
     * WIZARD MOVES ========================================
     */

    async function doPrepareSpells(actor) {
        return sh.setSpells(actor, "Prepare Spells");
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

    async function doMove(actor, item, spell) {
        return basic.move(actor, item, spell);
    }

    /**
     * DRUID MOVES ========================================
     */
    async function doShapeshifter(actor) {
        return dm.shapeshift(actor);
    }

    return {
        cancelSpell: cancelSpell,
        doPrepareSpells: doPrepareSpells,
        showToken: showToken,
        showActor: showActor,
        notDead: notDead,
        doMove: doMove,
        createFilters: createFilters,
        exportFilters: exportFilters,
        importFilters: importFilters,
        getFilters: getFilters,
        magicMissile: magicMissile
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