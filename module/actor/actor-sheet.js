import {DwClassList} from "../config.js";
import {DwUtility} from "../utility.js";
import {resolveCasting} from "../actions/spellHelper.js";
import {resolveMove, move} from "../actions/moves.js";
import {consume} from "../actions/items.js";

/**
 * Extend the basic ActorSheet with some very simple modifications
 * @extends {ActorSheet}
 */
export class DwActorSheet extends ActorSheet {

    /** @override */
    static get defaultOptions() {
        return mergeObject(super.defaultOptions, {
            classes: ["dungeonworld", "sheet", "actor"],
            width: 840,
            height: 780,
            tabs: [{navSelector: ".sheet-tabs", contentSelector: ".sheet-body", initial: "moves"}]
        });
    }

    /* -------------------------------------------- */

    /** @override */
    get template() {
        const path = "systems/dungeonworld/templates/sheet";
        return `${path}/${this.actor.data.type}-sheet.html`;
    }

    /* -------------------------------------------- */

    /** @override */
    async getData() {
        const data = super.getData();
        data.dtypes = ["String", "Number", "Boolean"];
        for (let attr of Object.values(data.data.attributes)) {
            attr.isCheckbox = attr.dtype === "Boolean";
        }
        // Prepare items.
        this._prepareCharacterItems(data);
        this._prepareNpcItems(data);

        // Add classlist.
        if (this.actor.data.type === 'character') {
            data.data.classlist = await DwClassList.getClasses();

            let xpSvg = {
                radius: 16,
                circumference: 100,
                offset: 100,
            };

            // Set a warning for tokens.
            data.data.isToken = this.actor.token != null;
            if (!data.data.isToken) {
                // Add levelup choice.
                let levelup = (Number(data.data.attributes.xp.value) >= Number(data.data.attributes.level.value) + 7) && Number(data.data.attributes.level.value) < 10;

                // Handle the first level (special case).
                if (Number(data.data.attributes.level.value) === 1) {
                    let hasStarting = false;
                    for (let i = 0; i < data.items.length; i++) {
                        if (data.items[i].type === 'move' && data.items[i].data.moveType === 'starting') {
                            hasStarting = true;
                            break;
                        }
                    }
                    ;

                    if (!hasStarting) {
                        levelup = true;
                    }
                }
                // Set the template variable.
                data.data.levelup = levelup && data.data.classlist.includes(data.data.details.class);

                // Calculate xp bar length.
                let currentXp = Number(data.data.attributes.xp.value);
                let nextLevel = Number(data.data.attributes.level.value) + 7;
                xpSvg = DwUtility.getProgressCircle({current: currentXp, max: nextLevel, radius: 16});
            } else {
                data.data.levelup = false;
            }

            data.data.xpSvg = xpSvg;
        }

        // Return data to the sheet
        return data;
    }

    /**
     * Organize and classify Items for Character sheets.
     *
     * @param {Object} sheetData The actor to prepare.
     *
     * @return {undefined}
     */
    _prepareCharacterItems(sheetData) {
        const actorData = sheetData.actor;

        // Initialize containers.
        const moves = [];
        const basicMoves = [];
        const startingMoves = [];
        const advancedMoves = [];
        const equipment = [];
        const bonds = [];
        const spells = {
            0: [],
            1: [],
            3: [],
            5: [],
            7: [],
            9: []
        };

        // Iterate through items, allocating to containers
        // let totalWeight = 0;
        for (let i of sheetData.items) {
            let item = i.data;
            i.img = i.img || DEFAULT_TOKEN;
            // If this is a move, sort into various arrays.
            if (i.type === 'move') {
                switch (i.data.moveType) {
                    // TODO: Basic moves.
                    // case 'basic':
                    //   basicMoves.push(i);
                    //   break;

                    case 'starting':
                        startingMoves.push(i);
                        break;

                    case 'advanced':
                        advancedMoves.push(i);
                        break;

                    default:
                        moves.push(i);
                        break;
                }
            } else if (i.type === 'spell') {
                if (i.data.spellLevel !== undefined) {
                    spells[i.data.spellLevel].push(i);
                }
            }
            // If this is equipment, we currently lump it together.
            else if (i.type === 'equipment') {
                equipment.push(i);
            } else if (i.type === 'bond') {
                bonds.push(i);
            }
        }

        // Assign and return
        actorData.moves = moves;
        actorData.basicMoves = basicMoves;
        actorData.startingMoves = startingMoves;
        actorData.advancedMoves = advancedMoves;
        // Spells
        actorData.spells = spells;
        actorData.hasSpells = spells[0].length > 0;
        // Equipment
        actorData.equipment = equipment;
        // Bonds
        actorData.bonds = bonds;
    }

    /**
     * Prepare tagging.
     *
     * @param {Object} data The actor to prepare.
     */
    _prepareNpcItems(data) {
        // Handle preprocessing for tagify data.
        if (data.entity.type === 'npc') {
            // If there are tags, convert it into a string.
            if (data.data.tags !== undefined && data.data.tags !== '') {
                let tagArray = [];
                try {
                    tagArray = JSON.parse(data.data.tags);
                } catch (e) {
                    tagArray = [data.data.tags];
                }
                data.data.tagsString = tagArray.map((item) => {
                    return item.value;
                }).join(', ');
            }
            // Otherwise, set tags equal to the string.
            else {
                data.data.tags = data.data.tagsString;
            }
        }
    }

    /* -------------------------------------------- */

    /** @override */
    activateListeners(html) {
        super.activateListeners(html);

        // Rollables.
        html.find('.rollable').on('click', this._onRollable.bind(this));

        // Toggle look.
        html.find('.toggle--look').on('click', this._toggleLook.bind(this, html));

        // Owned Item management
        html.find('.item-create').click(this._onItemCreate.bind(this));
        html.find('.item-edit').click(this._onItemEdit.bind(this));
        html.find('.item-delete').click(this._onItemDelete.bind(this));

        // Moves
        html.find('.item-label').click(this._showItemDetails.bind(this));

        // Spells.
        html.find('.prepared').click(this._onPrepareSpell.bind(this));

        // Adjust weight.
        this._adjustWeight(html);

        // Character builder dialog.
        html.find('.clickable-level-up').on('click', this._onLevelUp.bind(this));

        if (this.actor.owner) {
            let handler = ev => this._onDragItemStart(ev);
            html.find('li.item').each((i, li) => {
                if (li.classList.contains("inventory-header")) return;
                li.setAttribute("draggable", true);
                li.addEventListener("dragstart", handler, false);
            });
        }

        if (this.actor.data.type === 'npc') {
            this._activateTagging(html);
        }
    }

    /* -------------------------------------------- */

    _adjustWeight(html) {
        // Adjust weight.
        let $weight = html.find('[name="data.attributes.weight.value"]');
        let $weight_cell = html.find('.cell--weight');
        if ($weight.length > 0) {
            let weight = {
                current: Number($weight.val()),
                max: Number(html.find('[name="data.attributes.weight.max"]').val())
            };
            if (weight.current > weight.max) {
                $weight_cell.addClass('encumbered');

                if (weight.current > weight.max + 2) {
                    $weight_cell.addClass('overencumbered');
                } else {
                    $weight_cell.removeClass('overencumbered');
                }
            } else {
                $weight.removeClass('encumbered');
            }
        }
    }

    _showItemDetails(event) {
        event.preventDefault();
        const toggler = $(event.currentTarget);
        const toggleIcon = toggler.find('i');
        const item = toggler.parents('.item');
        const description = item.find('.item-description');

        toggler.toggleClass('open');

        // if (toggleIcon.hasClass('fa-caret-right')) {
        //   toggleIcon.removeClass('fa-caret-right').addClass('fa-caret-down');
        // } else {
        //   toggleIcon.removeClass('fa-caret-down').addClass('fa-caret-right');
        // }
        description.slideToggle();
    }

    async _onLevelUp(event) {
        event.preventDefault();

        if ($(event.currentTarget).hasClass('disabled-level-up')) {
            return;
        }

        const actor = this.actor.data;
        const actorData = this.actor.data.data;

        let char_class_name = actorData.details.class;
        let orig_class_name = char_class_name;
        let class_list = await DwClassList.getClasses();
        let class_list_items = await DwClassList.getClasses(false);

        let char_class = DwUtility.cleanClass(char_class_name);
        let char_level = Number(actorData.attributes.level.value);

        // Handle level 1 > 2.
        if (actorData.attributes.xp.value !== 0) {
            char_level = char_level + 1;
        }

        // Get the original class name if this was a translation.
        if (game.babele) {
            let babele_classes = game.babele.translations.find(p => p.collection === 'dungeonworld.classes');
            if (babele_classes) {
                let babele_pack = babele_classes.entries.find(p => p.name === char_class_name);
                if (babele_pack) {
                    char_class_name = babele_pack.id;
                    char_class = DwUtility.cleanClass(babele_pack.id);
                }
            }
        }

        if (!class_list.includes(orig_class_name) && !class_list.includes(char_class_name)) {
            return;
        }

        let pack_id = `dungeonworld.${char_class}-moves`;
        let pack = game.packs.get(pack_id);

        console.log("GOT MOVES");

        let compendium = pack ? await pack.getContent() : [];
        console.log(compendium);

        let class_item = class_list_items.find(i => i.data.name === orig_class_name);
        let blurb = class_item ? class_item.data.data.description : null;

        // Get races.
        let races = [];
        if (!this.actor.data.data.details.race.value || !this.actor.data.data.details.race.description) {
            races = class_item.data.data.races;
            if (typeof races == 'object') {
                races = Object.entries(races).map(r => {
                    return {
                        key: r[0],
                        label: r[1]['label'],
                        description: r[1]['description']
                    };
                });
            }
        }

        // Get alignments.
        let alignments = [];
        if (!this.actor.data.data.details.alignment.value || !this.actor.data.data.details.alignment.description) {
            alignments = class_item.data.data.alignments;
            if (typeof alignments == 'object') {
                alignments = Object.entries(alignments).map(a => {
                    return {
                        key: a[0],
                        label: a[1]['label'],
                        description: a[1]['description']
                    };
                });
            }
        }

        // Get equipment.
        let equipment = null;
        let equipment_list = [];
        if (actorData.attributes.xp.value === 0) {
            if (typeof class_item.data.data.equipment == 'object') {
                let equipmentObjects = await class_item._getEquipmentObjects();
                for (let [group, group_items] of Object.entries(equipmentObjects)) {
                    class_item.data.data.equipment[group]['objects'] = group_items;
                    equipment_list = equipment_list.concat(group_items);
                }
                equipment = duplicate(class_item.data.data.equipment);
            }
        }

        // Get ability scores.
        let ability_scores = [16, 15, 13, 12, 9, 8];
        let ability_labels = Object.entries(CONFIG.DW.abilities).map(a => {
            return {
                short: a[0],
                long: a[1],
                disabled: Number(this.actor.data.data.abilities[a[0]].value) > 17
            }
        });

        console.log("GOT MORE STUFF");
        // Retrieve the actor's current moves so that we can hide them.
        const actorMoves = this.actor.data.items.filter(i => i.type === 'move');

        // Get the item moves as the priority.
        let moves = game.items.entities.filter(i => i.type === 'move' && i.data.data.class === char_class_name);
        // Get the compendium moves next.
        let moves_compendium = compendium.filter(m => {
            const available_level = m.data.data.requiresLevel <= char_level;
            // TODO: Babele: `const not_taken = actorMoves.filter(i => i.name == m.data.name || i.name === m.data.originalName);`
            const not_taken = actorMoves.filter(i => i.name === m.data.name);
            return available_level && not_taken.length < 1;
        });

        // Append compendium moves to the item moves.
        let moves_list = moves.map(m => {
            return m.data.name;
        })
        for (let move of moves_compendium) {
            if (!moves_list.includes(move.data.name)) {
                moves.push(move);
            }
        }

        // Sort the moves and build our groups.
        moves.sort((a, b) => {
            return a.data.data.requiresLevel - b.data.data.requiresLevel;
        });

        console.log("THE MOVES");
        console.log(moves);

        let starting_moves = [];
        let starting_move_groups = [];
        if (char_level < 2) {
            starting_moves = moves.filter(m => {
                return m.data.data.requiresLevel < 2;
            });

            starting_move_groups = starting_moves.reduce((groups, move) => {
                // Assign the undefined group to all Z's so that it's last.
                let group = move.data.data.moveGroup ? move.data.data.moveGroup : 'ZZZZZZZ';
                if (!groups[group]) {
                    groups[group] = [];
                }

                groups[group].push(move);
                return groups;
            }, {});
        }

        let advanced_moves_2 = moves.filter(m => {
            return m.data.data.requiresLevel >= 2 && m.data.data.requiresLevel < 6;
        });

        let advanced_moves_6 = moves.filter(m => {
            return m.data.data.requiresLevel >= 6;
        });

        // Determine if spells can be cast.
        let cast_spells = [];
        let spells = null;
        if (char_class === 'the-wizard') {
            cast_spells.push('wizard');
        } else if (char_class === 'the-cleric') {
            cast_spells.push('cleric');
        } else {
            cast_spells.push(char_class);
        }

        if (cast_spells.length > 0) {
            // Retrieve the actor's current moves so that we can hide them.
            const actorSpells = this.actor.data.items.filter(i => i.type === 'spell');
            let caster_level = char_level;
            let spell_preparation_type = null;
            spells = [];
            for (let caster_class of cast_spells) {
                // Get the item spells as the priority.
                let spells_items = game.items.entities.filter(i => {
                    // Return true for custom spell items that have a class.
                    console.log("A");
                    return i.type === 'spell'
                        && i.data.data.class
                        // Check if this spell has either `classname` or `the classname` as its class.
                        && [caster_class, `the ${caster_class}`].includes(i.data.data.class.toLowerCase());
                });
                let spells_pack = game.packs.get(`dungeonworld.${char_class}-spells`);
                let spells_compendium = spells_pack ? await spells_pack.getContent() : [];
                // Get the compendium spells next.
                let spells_compendium_items = spells_compendium.filter(s => {
                    const available_level = s.data.data.spellLevel <= caster_level;
                    const not_taken = actorSpells.filter(i => i.name === s.data.name);
                    return available_level && not_taken.length < 1;
                });

                // Append compendium spells to the item spells.
                let spells_list = spells.map(s => {
                    return s.data.name;
                })
                // Add to the array, and also add to a sorted by level array.
                for (let spell of spells_compendium_items) {
                    if (!spells_list.includes(spell.data.name)) {
                        spells_items.push(spell);
                    }
                }

                // Sort the spells and build our groups.
                spells_items.sort((a, b) => {
                    return a.data.data.spellLevel - b.data.data.spellLevel;
                });

                let spell_groups = spells_items.reduce((groups, spell) => {
                    // Default to rotes.
                    let group = spell.data.data.spellLevel ? spell.data.data.spellLevel : 0;
                    if (!groups[group]) {
                        groups[group] = [];
                    }

                    groups[group].push(spell);
                    return groups;
                }, {});

                // Get the description for how to prepare spells for this class.
                if (caster_class === 'wizard') {
                    let move = moves.filter(m => m.name === 'Spellbook');
                    if (move && move.length > 0) {
                        spell_preparation_type = move[0].data.data.description;
                    } else {
                        move = actorMoves.filter(m => m.name === 'Spellbook');
                        if (move && move.length > 0) {
                            spell_preparation_type = move[0].data.description;
                        }
                    }
                } else if (caster_class === 'cleric') {
                    let move = moves.filter(m => m.name === 'Commune');
                    if (move && move.length > 0) {
                        spell_preparation_type = move[0].data.data.description;
                    } else {
                        move = actorMoves.filter(m => m.name === 'Commune');
                        if (move && move.length > 0) {
                            spell_preparation_type = move[0].data.description;
                        }
                    }
                }

                spells.push({
                    description: spell_preparation_type,
                    spells: spell_groups
                });
            }
        }

        // Build the content.
        const template = 'systems/dungeonworld/templates/dialog/level-up.html';
        const templateData = {
            char_class: char_class,
            char_class_name: orig_class_name,
            blurb: blurb.length > 0 ? blurb : null,
            races: races.length > 0 ? races : null,
            alignments: alignments.length > 0 ? alignments : null,
            equipment: equipment ? equipment : null,
            ability_scores: actorData.attributes.xp.value === 0 ? ability_scores : null,
            ability_labels: ability_labels ? ability_labels : null,
            starting_moves: starting_moves.length > 0 ? starting_moves : null,
            starting_move_groups: starting_move_groups,
            advanced_moves_2: advanced_moves_2.length > 0 ? advanced_moves_2 : null,
            advanced_moves_6: advanced_moves_6.length > 0 ? advanced_moves_6 : null,
            cast_spells: cast_spells.length > 0,
            spells: spells ? spells : null,
        };
        const html = await renderTemplate(template, templateData);

        const itemData = {
            moves: moves,
            races: races,
            alignments: alignments,
            equipment: equipment_list,
            class_item: class_item,
            spells: spells,
        };

        // Initialize dialog options.
        const dlg_options = {
            width: 920,
            height: 640,
            classes: ['dw-level-up', 'dungeonworld', 'sheet'],
            resizable: true
        };

        // Render the dialog.
        let d = new Dialog({
            title: 'Level Up',
            content: html,
            id: 'level-up',
            buttons: {
                cancel: {
                    icon: '<i class="fas fa-times"></i>',
                    label: game.i18n.localize("DW.Cancel"),
                    callback: () => null
                },
                submit: {
                    icon: '<i class="fas fa-check"></i>',
                    label: game.i18n.localize("DW.Confirm"),
                    callback: dlg => this._onLevelUpSave(dlg, this.actor, itemData, this)
                    // callback: dlg => _onImportPower(dlg, this.actor)
                }
            }
        }, dlg_options);
        d.render(true);
    }

    /**
     * Import moves.
     */
    async _onLevelUpSave(dlg, actor, itemData) {
        let $selected = $(dlg[0]).find('input:checked,select');

        if ($selected.length <= 0) {
            return;
        }

        let move_ids = [];
        let equipment_ids = [];
        let spell_ids = [];
        let abilities = [];
        let race = null;
        let alignment = null;
        for (let input of $selected) {
            if (input.dataset.itemId) {
                if (input.dataset.type === 'move') {
                    move_ids.push(input.dataset.itemId);
                } else if (input.dataset.type === 'equipment') {
                    equipment_ids.push(input.dataset.itemId);
                } else if (input.dataset.type === 'spell') {
                    spell_ids.push(input.dataset.itemId);
                }
            } else if (input.dataset.race) {
                race = itemData.races[input.dataset.race];
            } else if (input.dataset.alignment) {
                alignment = itemData.alignments[input.dataset.alignment];
            } else if (input.dataset.ability) {
                let val = $(input).val();
                let abl = input.dataset.ability;
                if (val) {
                    abilities[`abilities.${abl}.value`] = val;
                }
            } else if (input.dataset.type === 'ability-increase') {
                let abl = $(input).val();
                abilities[`abilities.${abl}.value`] = Number(actor.data.data.abilities[abl].value) + 1;
            }
        }

        // Add selected moves.
        let new_moves = null;
        if (move_ids.length > 0) {
            let moves = itemData.moves.filter(m => move_ids.includes(m.data._id));

            // Prepare moves for saving.
            new_moves = moves.map(m => {
                return duplicate(m);
            });
        }

        // Add selected equipment.
        let new_equipment = null;
        if (equipment_ids.length > 0) {
            let equipment = itemData.equipment.filter(e => equipment_ids.includes(e.data._id));
            new_equipment = equipment.map(e => {
                return duplicate(e);
            });
        }

        // Add selected spell.
        let new_spells = null;
        if (spell_ids.length > 0) {
            let spells = [];
            if (typeof itemData.spells == 'object') {
                // Loop over casting classes.
                for (let [key, obj] of Object.entries(itemData.spells)) {
                    // Loop over spells by level.
                    for (let [spellLevel, spellsByLevel] of Object.entries(obj.spells)) {
                        spells = spells.concat(spellsByLevel.filter(s => spell_ids.includes(s.data._id)));
                    }
                }
                // Append to the update array.
                new_spells = spells.map(s => {
                    return duplicate(s);
                });
            }
        }

        const data = {};
        if (race) {
            data['details.race'] = {
                value: race.label,
                description: race.description
            };
        }
        if (alignment) {
            data['details.alignment'] = {
                value: alignment.label,
                description: alignment.description
            }
        }
        if (abilities !== []) {
            for (let [key, update] of Object.entries(abilities)) {
                data[key] = update;
            }
        }

        // Adjust level.
        if (Number(actor.data.data.attributes.xp.value) > 0) {
            let xp = Number(actor.data.data.attributes.xp.value) - Number(actor.data.data.attributes.level.value) - 7;
            data['attributes.xp.value'] = xp > -1 ? xp : 0;
            data['attributes.level.value'] = Number(actor.data.data.attributes.level.value) + 1;
        }

        // Adjust hp.
        if (itemData.class_item.data.data.hp) {
            let constitution = actor.data.data.abilities.con.value;
            if (data['abilities.con.value']) {
                constitution = data['abilities.con.value'];
            }
            data['attributes.hp.max'] = Number(itemData.class_item.data.data.hp) + Number(constitution);
            data['attributes.hp.value'] = data['attributes.hp.max'];
        }

        // Adjust load.
        if (itemData.class_item.data.data.load) {
            let strength = actor.data.data.abilities.str.value;
            if (data['abilities.str.value']) {
                strength = data['abilities.str.value'];
            }
            data['attributes.weight.max'] = Number(itemData.class_item.data.data.load) + Number(DwUtility.getAbilityMod(strength));
        }

        if (new_moves) {
            await actor.createEmbeddedEntity('OwnedItem', new_moves);
        }
        if (new_equipment) {
            await actor.createEmbeddedEntity('OwnedItem', new_equipment);
        }
        if (new_spells) {
            await actor.createEmbeddedEntity('OwnedItem', new_spells);
        }
        await actor.update({data: data});
        await actor.setFlag('dungeonworld', 'levelup', false);
        // actor.render(true);
    }

    /**
     * Listen for click events on spells.
     * @param {MouseEvent} event
     */
    async _onPrepareSpell(event) {
        event.preventDefault();
        const a = event.currentTarget;
        const data = a.dataset;
        const actorData = this.actor.data.data;
        const itemId = $(a).parents('.item').attr('data-item-id');
        const item = this.actor.getOwnedItem(itemId);

        if (item) {
            let $self = $(a);
            $self.toggleClass('unprepared');

            let updatedItem = duplicate(item);
            updatedItem.data.prepared = !updatedItem.data.prepared;

            this.actor.updateOwnedItem(updatedItem);
            this.render();
        }
    }

    /**
     * Listen for click events on rollables.
     * @param {MouseEvent} event
     */
    async _onRollable(event) {
        // Initialize variables.
        event.preventDefault();
        const a = event.currentTarget;
        const itemId = $(a).parents('.item').attr('data-item-id');
        const item = this.actor.getOwnedItem(itemId);

        // This is a spell
        if (item.data.type === "spell") {
            let castASpell = this.actor.data.items.find(i => i.name.toLowerCase() === "cast a spell");
            let z = this.actor.getOwnedItem(castASpell._id);
            let rst = await move(this.actor, z, item.name);
            if (rst !== "abort")
                await resolveCasting(this.actor, item, rst);
            return;
        }

        // This is a move that requires a roll
        if (item.data.data.rollType) {
            let rst = await move(this.actor, item);
            if (rst !== "abort")
                await resolveMove(this.actor, item, rst);
        } else {

            // This is an item with a script
            if (item.data.data.details.script)  {
                let rst = await DWBase[item.data.data.details.script](this.actor, item);
                if (rst) await consume(this.actor, item);

            } else if (item.data.data.details.move) {

                // I dont' remember......
                console.log("MOVE");
                console.log("->"+ item.data.data.details.move + "<-");
                let theMove = this.actor.data.items.find(i => i.name.toLowerCase() === item.data.data.details.move.toLowerCase());
                console.log(theMove);
                let moveItem = this.actor.getOwnedItem(theMove._id);
                let rst = await move(this.actor, moveItem, item.name);
                if (rst !== "abort")
                    await resolveMove(this.actor, item, rst);
            } else {

                // This is just text
                let template = 'systems/dungeonworld/templates/chat/chat-move.html';
                let templateData = {
                    title: item.name,
                    details: item.data.data.description
                }
                let chatData = {
                    user: game.user._id,
                    speaker: ChatMessage.getSpeaker({actor: this.actor})
                };
                renderTemplate(template, templateData).then(content => {
                    chatData.content = content;
                    ChatMessage.create(chatData);
                });
            }
        }
    }

    /**
     * Roll a move and use the chat card template.
     * @param roll
     * @param actorData
     * @param dataset
     * @param templateData
     * @param form
     */
    rollMove(roll, actorData, dataset, templateData, form = null) {
        // Render the roll.
        let template = 'systems/dungeonworld/templates/chat/chat-move.html';
        // GM rolls.
        let chatData = {
            user: game.user._id,
            speaker: ChatMessage.getSpeaker({actor: this.actor})
        };
        let rollMode = game.settings.get("core", "rollMode");
        if (["gmroll", "blindroll"].includes(rollMode)) chatData["whisper"] = ChatMessage.getWhisperRecipients("GM");
        if (rollMode === "selfroll") chatData["whisper"] = [game.user._id];
        if (rollMode === "blindroll") chatData["blind"] = true;
        // Handle dice rolls.
        if (roll) {
            // Roll can be either a formula like `2d6+3` or a raw stat like `str`.
            let formula = '';
            // Handle bond (user input).
            if (roll === 'BOND') {
                formula = form.bond.value ? `2d6+${form.bond.value}` : '2d6';
                if (dataset.mod && dataset.mod !== 0) {
                    formula += `+${dataset.mod}`;
                }
            }
            // Handle ability scores (no input).
            else if (roll.match(/(\d*)d\d+/g)) {
                formula = roll;
            }
            // Handle moves.
            else {
                formula = `2d6+${actorData.abilities[roll].mod}`;
                if (dataset.mod && dataset.mod !== 0) {
                    formula += `+${dataset.mod}`;
                }
            }
            if (formula != null) {
                // Do the roll.
                let roll = new Roll(`${formula}`);
                roll.roll();
                // Render it.
                roll.render().then(r => {
                    templateData.rollDw = r;
                    renderTemplate(template, templateData).then(content => {
                        chatData.content = content;
                        if (game.dice3d) {
                            game.dice3d.showForRoll(roll, game.user, true, chatData.whisper, chatData.blind).then(displayed => ChatMessage.create(chatData));
                        } else {
                            chatData.sound = CONFIG.sounds.dice;
                            ChatMessage.create(chatData);
                        }
                    });
                });
            }
        } else {
            renderTemplate(template, templateData).then(content => {
                chatData.content = content;
                ChatMessage.create(chatData);
            });
        }
    }

    /**
     * Listen for toggling the look column.
     * @param {MouseEvent} event
     */
    _toggleLook(html, event) {
        // Add a class to the sidebar.
        html.find('.sheet-look').toggleClass('closed');

        // Add a class to the toggle button.
        let $look = html.find('.toggle--look');
        $look.toggleClass('closed');
    }

    /* -------------------------------------------- */
    /**
     * Handle creating a new Owned Item for the actor using initial data defined in the HTML dataset
     * @param {Event} event   The originating click event
     * @private
     */
    _onItemCreate(event) {
        event.preventDefault();
        const header = event.currentTarget;
        const type = header.dataset.type;
        const data = duplicate(header.dataset);
        data.moveType = data.movetype;
        data.spellLevel = data.level;
        const name = type === 'bond' ? game.i18n.localize("DW.BondDefault") : `New ${type.capitalize()}`;
        const itemData = {
            name: name,
            type: type,
            data: data
        };
        delete itemData.data["type"];
        return this.actor.createOwnedItem(itemData);
    }

    /* -------------------------------------------- */

    /**
     * Handle editing an existing Owned Item for the Actor
     * @param {Event} event   The originating click event
     * @private
     */
    _onItemEdit(event) {
        event.preventDefault();
        const li = event.currentTarget.closest(".item");
        const item = this.actor.getOwnedItem(li.dataset.itemId);
        item.sheet.render(true);
    }

    /* -------------------------------------------- */

    /**
     * Handle deleting an existing Owned Item for the Actor
     * @param {Event} event   The originating click event
     * @private
     */
    _onItemDelete(event) {
        event.preventDefault();
        const li = event.currentTarget.closest(".item");
        this.actor.deleteOwnedItem(li.dataset.itemId);
    }

    /* -------------------------------------------- */

    async _activateTagging(html) {
        // Build the tags list.
        let tags = game.items.entities.filter(item => item.type === 'tag');
        for (let c of game.packs) {
            if (c.metadata.entity && c.metadata.entity === 'Item' && c.metadata.name === 'tags') {
                let items = c ? await c.getContent() : [];
                tags = tags.concat(items);
            }
        }
        // Reduce duplicates.
        let tagNames = [];
        for (let tag of tags) {
            console.log("B");
            let tagName = tag.data.name.toLowerCase();
            if (tagNames.includes(tagName) !== false) {
                tags = tags.filter(item => item._id !== tag._id);
            } else {
                tagNames.push(tagName);
            }
        }

        // Sort the tagnames list.
        tagNames.sort((a, b) => {
            console.log("C");
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

        // Tagify!
        var $input = html.find('input[name="data.tags"]');
        if ($input.length > 0) {
            // init Tagify script on the above inputs
            var tagify = new Tagify($input[0], {
                whitelist: tagNames,
                maxTags: 'Infinity',
                dropdown: {
                    maxItems: 20,           // <- mixumum allowed rendered suggestions
                    classname: "tags-look", // <- custom classname for this dropdown, so it could be targeted
                    enabled: 0,             // <- show suggestions on focus
                    closeOnSelect: false    // <- do not hide the suggestions dropdown once an item has been selected
                }
            });
        }
    }
}
