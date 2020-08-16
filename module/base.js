import * as sh from './actions/spellHelper.js';
import * as dm from './actions/druidMoves.js';
import * as it from './actions/items.js';
import {DwFilters} from "./filters.js";

export function Base() {

    /**
     * CLERIC MOVES ========================================
     */

    async function commune(actor) {
        return sh.setSpells(actor, "Commune");
    }

    /**
     * SPELL SCRIPTS ========================================
     */

    async function invisibility(actor) {
        return sh.invisibility(actor);
    }
    async function light(actor) {
        return sh.light(actor);
    }
    async function magicMissile(actor) {
        return sh.magicMissile(actor);
    }
    async function magicWeapon(actor) {
        return sh.magicWeapon(actor);
    }

    /**
     * DRUID MOVES ========================================
     */
    async function shapeshifter(actor) {
        return dm.shapeshifter(actor);
    }

    /**
     * WIZARD MOVES ========================================
     */

    async function prepareSpells(actor) {
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

    async function deleteFilter(filter) {
        await DwFilters.deleteFilter(filter);
    }

    async function getFilters() {
        await DwFilters.getFilters();
    }

    /**
     * ITEMS ========================================
     */

    async function torch(actor, item) {
        await it.torch(actor, item);
    }

    return {
        cancelSpell: cancelSpell,
        prepareSpells: prepareSpells,
        commune: commune,
        showToken: showToken,
        showActor: showActor,
        notDead: notDead,
        createFilters: createFilters,
        exportFilters: exportFilters,
        importFilters: importFilters,
        getFilters: getFilters,
        invisibility: invisibility,
        light: light,
        magicMissile: magicMissile,
        magicWeapon: magicWeapon,
        shapeshifter: shapeshifter,
        deleteFilter: deleteFilter,
        torch: torch
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