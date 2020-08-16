/**
 * A simple and flexible system for world-building using an arbitrary collection of character and item attributes
 * Author: Atropos
 * Software License: GNU GPLv3
 */

// Import Modules
import {DW} from "./config.js";
import {Base} from "./base.js";
import {DwClassList} from "./config.js";
import {DwFilters} from "./filters.js";
import {ActorDw} from "./actor/actor.js";
import {ItemDw} from "./item/item.js";
import {DwItemSheet} from "./item/item-sheet.js";
import {DwActorSheet} from "./actor/actor-sheet.js";
import {DwActorNpcSheet} from "./actor/actor-npc-sheet.js";
import {DwClassItemSheet} from "./item/class-item-sheet.js";
import {DwRegisterHelpers} from "./handlebars.js";
import {DwUtility} from "./utility.js";
import {CombatSidebarDw} from "./combat/combat.js";
import * as sh from "./actions/spellHelper.js";
import {move, resolveMove} from "./actions/moves.js";

/* -------------------------------------------- */
/*  Foundry VTT Initialization                  */
/* -------------------------------------------- */

export const DWBase = Base();

Hooks.once("init", async function () {
    console.log(`Initializing Dungeon World!`);

    game.dungeonworld = {
        ActorDw,
        ItemDw,
        rollItemMacro,
        DwUtility,
    };

    // TODO: Extend the combat class.
    // CONFIG.Combat.entityClass = CombatDw;

    CONFIG.DW = DW;
    CONFIG.Actor.entityClass = ActorDw;
    CONFIG.Item.entityClass = ItemDw;

    // Register sheet application classes
    Actors.unregisterSheet("core", ActorSheet);
    Actors.registerSheet("dungeonworld", DwActorSheet, {
        types: ['character'],
        makeDefault: true
    });
    Actors.registerSheet("dungeonworld", DwActorNpcSheet, {
        types: ['npc'],
        makeDefault: true
    });
    Items.unregisterSheet("core", ItemSheet);
    Items.registerSheet("dungeonworld", DwItemSheet, {makeDefault: false});
    Items.registerSheet("dungeonworld", DwClassItemSheet, {
        types: ['class'],
        makeDefault: true
    });

    DwRegisterHelpers.init();

    let combatDw = new CombatSidebarDw();
    combatDw.startup();
});

Hooks.once("ready", async function () {
    // Wait to register hotbar drop hook on ready so that modules could register earlier if they want to
    Hooks.on("hotbarDrop", (bar, data, slot) => createDwMacro(data, slot));

    window.DWBase = DWBase;
    DW.classlist = await DwClassList.getClasses();
    CONFIG.DW = DW;
    CONFIG.DWBase = DWBase;

    // Import Filters
    await DwFilters.importFilters();

    // Add a lang class to the body.
    const lang = game.settings.get('core', 'language');
    $('html').addClass(`lang-${lang}`);
});

Hooks.on('renderChatMessage', (data, html, options) => {
    // Determine visibility.
    let chatData = data.data;
    const whisper = chatData.whisper || [];
    const isBlind = whisper.length && chatData.blind;
    const isVisible = (whisper.length) ? game.user.isGM || whisper.includes(game.user._id) || (!isBlind) : true;
    if (!isVisible) {
        html.find('.dice-formula').text('???');
        html.find('.dice-total').text('?');
        html.find('.dice-tooltip').remove();
    }
});

/* -------------------------------------------- */
/*  Foundry VTT Setup                           */
/* -------------------------------------------- */

/**
 * This function runs after game data has been requested and loaded from the servers, so entities exist
 */
Hooks.once("setup", function () {

    // Localize CONFIG objects once up-front
    const toLocalize = [
        "abilities", "debilities"
    ];
    for (let o of toLocalize) {
        CONFIG.DW[o] = Object.entries(CONFIG.DW[o]).reduce((obj, e) => {
            obj[e[0]] = game.i18n.localize(e[1]);
            return obj;
        }, {});
    }
});

/* -------------------------------------------- */
/*  Actor Updates                               */
/* -------------------------------------------- */
Hooks.on('createActor', async (actor, options, id) => {
    // Allow the character to levelup up when their level changes.
    if (actor.data.type === 'character') {
        actor.setFlag('dungeonworld', 'levelup', true);

        // Get the item moves as the priority.
        let moves = game.items.entities.filter(i => i.type === 'move' && i.data.data.moveType === 'basic');
        let pack = game.packs.get(`dungeonworld.basic-moves`);
        let compendium = pack ? await pack.getContent() : [];
        const actorMoves = actor.data.items.filter(i => i.type === 'move');
        // Get the compendium moves next.
        let moves_compendium = compendium.filter(m => {
            const notTaken = actorMoves.filter(i => i.name === m.data.name);
            return notTaken.length < 1;
        });
        // Append compendium moves to the item moves.
        let moves_list = moves.map(m => {
            return m.data.name;
        })
        for (let move of moves_compendium) {
            if (!moves_list.includes(move.data.name)) {
                moves.push(move);
                moves_list.push(move.data.name);
            }
        }

        // Sort the moves and build our groups.
        moves.sort((a, b) => {
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

        // Add to the actor.
        const movesToAdd = moves.map(m => duplicate(m));
        await actor.createEmbeddedEntity('OwnedItem', movesToAdd);
        await actor.update({'data.details.look': game.i18n.localize("DW.DefaultLook")});
    }
});

Hooks.on('preUpdateActor', (actor, data, options, id) => {
    if (actor.data.type === 'character') {
        // Allow the character to levelup up when their level changes.
        if (data.data && data.data.attributes && data.data.attributes.level) {
            if (data.data.attributes.level.value > actor.data.data.attributes.level.value) {
                actor.setFlag('dungeonworld', 'levelup', true);
            }
        }
    }
});

/* -------------------------------------------- */
/*  Level Up Listeners                          */
/* -------------------------------------------- */
Hooks.on('renderDialog', (dialog, html, options) => {

    // If this is the levelup dialog, we need to add listeners to it.
    if (dialog.data.id && dialog.data.id === 'level-up') {
        // If an ability score is chosen, we need to update the available options.
        html.find('.cell--ability-scores select').on('change', () => {
            // Build the list of selected score values.
            let scores = [];
            html.find('.cell--ability-scores select').each((index, item) => {
                let $self = $(item);
                if ($self.val()) {
                    scores.push($self.val());
                }
            });
            // Loop over the list again, disabling invalid options.
            html.find('.cell--ability-scores select').each((index, item) => {
                let $self = $(item);
                // Loop over the options in the select.
                $self.find('option').each((opt_index, opt_item) => {
                    let $opt = $(opt_item);
                    let val = $opt.attr('value');
                    if (val) {
                        if (scores.includes(val) && $self.val() !== val) {
                            $opt.attr('disabled', true);
                        } else {
                            $opt.attr('disabled', false);
                        }
                    }
                });
            });
        })
    }

    if (dialog.data.id && dialog.data.id === 'item-form') {

    }
});

/* -------------------------------------------- */
/*  Hotbar Macros                               */

/* -------------------------------------------- */

/**
 * Create a Macro from an Item drop.
 * Get an existing item macro if one exists, otherwise create a new one.
 * @param {Object} data     The dropped data
 * @param {number} slot     The hotbar slot to use
 * @returns {Promise}
 */
async function createDwMacro(data, slot) {
    if (data.type !== "Item") return;
    if (!("data" in data)) return ui.notifications.warn("You can only create macro buttons for owned Items");
    const item = data.data;

    // Create the macro command
    const command = `game.dungeonworld.rollItemMacro("${item.name}");`;
    let macro = game.macros.entities.find(m => (m.name === item.name) && (m.command === command));
    if (!macro) {
        macro = await Macro.create({
            name: item.name,
            type: "script",
            img: item.img,
            command: command,
            flags: {"dungeonworld.itemMacro": true}
        });
    }
    game.user.assignHotbarMacro(macro, slot);
    return false;
}

/**
 * Create a Macro from an Item drop.
 * Get an existing item macro if one exists, otherwise create a new one.
 * @param {string} itemName
 * @return {Promise}
 */
function rollItemMacro(itemName) {
    const speaker = ChatMessage.getSpeaker();
    let actor;
    if (speaker.token) actor = game.actors.tokens[speaker.token];
    if (!actor) actor = game.actors.get(speaker.actor);
    const item = actor ? actor.items.find(i => i.name === itemName) : null;
    if (!item) return ui.notifications.warn(`Your controlled Actor does not have an item named ${itemName}`);

    if (item.data.type === "spell") {
        let castASpell = actor.data.items.find(i => i.name.toLowerCase() === "cast a spell");
        let z = actor.getOwnedItem(castASpell._id);
        move(actor, z, itemName).then(rst => {
            if (rst !== "abort")
                sh.resolveCasting(actor, item, rst).then();
        });
    }

    if (item.data.data.rollType) {
        move(actor, item).then(rst => {
            if (rst !== "abort")
                resolveMove(actor, item, rst).then();
        });
    } else {
        if (item.data.data.details.script) {
            DWBase[item.data.data.details.script](actor, item);
        } else if (item.data.data.details.move) {
            let theMove = this.actor.data.items.find(i => i.name.toLowerCase() === item.data.data.details.move);
            let moveItem = this.actor.getOwnedItem(theMove._id);
            move(this.actor, moveItem, item.name).then(rst => {
                if (rst !== "abort")
                    resolveMove(this.actor, item, rst).then();
            });
        } else {
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