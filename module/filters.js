export const NamedFilters = [
    {
        name: "Invisibility",
        data:
            [{
                filterType: "zapshadow",
                filterId: "myZap",
                alphaTolerance: 0,
                autoDestroy: true,
                animated:
                    {
                        alphaTolerance: {
                            loops: 1,
                            active: true,
                            speed: 0.001,
                            animType: "move"
                        }
                    }
            }]
    }
];

export class DwFilters {
    static async getFilters() {
        let filters = [];
        var pst = game.settings.get("tokenmagic", "presets");
        for (let f of pst) {
            filters.push(f.name);
        }
        filters.sort();
        return filters;
    }

    /**
     * Create the filters provided above into the TokenMagic preset list
     * Do this manually when creating new filters.
     */
    static async createFilters() {
        for (let f of NamedFilters) {
            await TokenMagic.addPreset(f.name, f.data);
        }
    }

    /**
     * Export all existing TokenMagic presets to a file
     * @returns {Promise<void>}
     */
    static async exportFilters() {
        await TokenMagic.exportPresetLibrary();
    }

    /**
     * Import, if exists, TokenMagic preset library.
     * NOTES: Enable overwrite in TokenMagic configuration to allow for the saving
     * of updated filters.
     * @returns {Promise<void>}
     */
    static async importFilters() {
        await TokenMagic.importPresetLibraryFromPath("/systems/dungeonworld/assets/dwFilters.json");
    }

    static async deleteFilter(filter) {
        await TokenMagic.deletePreset(filter);
    }
}