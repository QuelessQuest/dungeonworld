export const NamedFilters = [
    {
        name: "Default Damage",
        data: [
            {
                filterType: "adjustment",
                autoDestroy: true,
                saturation: 1,
                brightness: .5,
                contrast: 1,
                gamma: 1,
                red: 4,
                green: 0.5,
                blue: 0.5,
                alpha: 0.5,
                animated:
                    {
                        alpha:
                            {
                                active: true,
                                loopDuration: 250,
                                loops: 1,
                                animType: "syncCosOscillation",
                                val1: 1,
                                val2: 1
                            }
                    }
            }]
    },
    {
        name: "Electric Damage",
        data: [
            {
            filterType: "electric",
            color: 0xFFFFFF,
            time: 0,
            blend: 1,
            intensity: 5,
            autoDestroy: true,
            animated: {
                time: {
                    active: true,
                    speed: 0.0020,
                    loopDuration: 1500,
                    loops: 1,
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