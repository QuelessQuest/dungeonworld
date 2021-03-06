export const DW = {};

DW.template = "systems/dungeonworld/templates/chat/common-dialog.html";

DW.dialogTypes = {
    normal: "",
    damage: "damage",
    success: "success",
    fail: "fail",
    partial: "partial",
    heal: "heal"
}

DW.adventuringGear = [
    "Torch",
    "Mirror",
    "Pick-Axe",
    "Needle And Thread",
    "Paper",
    "Quill And Ink",
    "Bell",
    "Grapple",
    "Rope",
    "Hammer And Nails",
    "Marbles"
]

DW.dialogClasses = {
    damage: "dieDamage",
    success: "dieSuccess",
    fail: "dieFail",
    partial: "diePartial",
    heal: "dieHeal"
}

DW.abilities = {
    "str": "DW.AbilityStr",
    "dex": "DW.AbilityDex",
    "con": "DW.AbilityCon",
    "int": "DW.AbilityInt",
    "wis": "DW.AbilityWis",
    "cha": "DW.AbilityCha"
};

DW.debilities = {
    "str": "DW.DebilityStr",
    "dex": "DW.DebilityDex",
    "con": "DW.DebilityCon",
    "int": "DW.DebilityInt",
    "wis": "DW.DebilityWis",
    "cha": "DW.DebilityCha"
};

export class DwClassList {
    static async getClasses(labels_only = true) {
        // First, retrieve any custom or overridden classes so that we can
        // prioritize those.
        let classes = game.items.entities.filter(item => item.type == 'class');
        // Next, retrieve compendium classes and merge them in.
        for (let c of game.packs) {
            if (c.metadata.entity && c.metadata.entity == 'Item' && c.metadata.name == 'classes') {
                let items = c ? await c.getContent() : [];
                classes = classes.concat(items);
            }
        }
        // Reduce duplicates. Because item classes happen first, this will prevent
        // duplicate compendium entries from overriding the items.
        let charClassNames = [];
        for (let charClass of classes) {
            let charClassName = charClass.data.name;
            if (charClassNames.includes(charClassName) !== false) {
                classes = classes.filter(item => item._id != charClass._id);
            } else {
                charClassNames.push(charClassName);
            }
        }

        // Sort the charClassNames list.
        if (labels_only) {
            charClassNames.sort((a, b) => {
                const aSort = a.toLowerCase();
                const bSort = b.toLowerCase();
                if (aSort < bSort) {
                    return -1;
                }
                if (aSort > bSort) {
                    return 1;
                }
                return 0;
            });

            return charClassNames;
        }
        // Sort the class objects list.
        else {
            classes.sort((a, b) => {
                const aSort = a.data.name.toLowerCase();
                const bSort = b.data.name.toLowerCase();
                if (aSort < bSort) {
                    return -1;
                }
                if (aSort > bSort) {
                    return 1;
                }
                return 0;
            });

            return classes;
        }
    }
}