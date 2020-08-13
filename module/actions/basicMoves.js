import * as util from './dwUtils.js';

export async function basicMove({
                                    actor = {},
                                    targetActor = {},
                                    flavor = null,
                                    title = null,
                                    move = null,
                                    speaker = null,
                                    options = []
                                }) {
    let baseFormula = '2d6';
    let actorData = actor.data;
    let moveData = actorData.items.find(i => i.name.toLowerCase() === move.toLowerCase());
    let ability = moveData.data.rollType.toLowerCase();
    let mod = moveData.data.rollMod;
    let abilityMod = 0;
    switch (ability) {
        case "bond":
            break;
        case "ask":
            break;
        default:
            abilityMod = actorData.data.abilities[ability].mod;
            break;
    }
    let formula = `${baseFormula}+${abilityMod}`;
    let forward = actor.getFlag("world", "forward");
    let frw = 0;
    if (forward) {
        frw = forward.reduce(function (a, b) {
            return a + b;
        }, 0);
    }
    if (frw) {
        formula += `+${frw}`;
    }
    let sus = 0;
    let ongoing = 0;
    if (move.toLowerCase() === "cast a spell") {
        let sustained = actorData.getFlag("world", "sustained");
        if (sustained) {
            for (let sSpell of sustained) {
                sus += sSpell.data.value;
            }
        }
        if (sus) {
            formula += `-${sus}`;
        }
        ongoing = actorData.getFlag("world", "ongoing");
        if (ongoing) {
            formula += `+${ongoing}`;
        }
    }
    if (mod && mod !== 0) {
        formula += `+${mod}`;
    }
    let cRoll = new Roll(`${formula}`);
    cRoll.roll();
    let rolled = await cRoll.render();
    let gColors = util.getColors(actorData, targetActor);

    let templateData = {
        title: title,
        ability: ability.charAt(0).toUpperCase() + ability.slice(1),
        mod: abilityMod,
        ongoing: ongoing,
        sustained: sus ? `-${sus}` : 0,
        forward: frw ? `+${frw}` : 0,
        rollDw: rolled,
        sourceColor: gColors.source,
        targetColor: gColors.target,
        sourceName: actorData ? actorData.name : "",
        targetName: targetActor ? targetActor.name : "",
        startingWords: "",
        middleWords: "",
        endWords: ""
    }

    await game.dice3d.showForRoll(cRoll);
    if (cRoll.total >= 10) {
        return await util.renderDiceResults({
            options: options.success,
            template: CONFIG.DW.template,
            templateData: templateData,
            speaker: speaker,
            flavor: flavor,
            title: title
        });
    } else if (cRoll.total <= 6) {
        return await util.renderDiceResults({
            options: options.fail,
            template: CONFIG.DW.template,
            templateData: templateData,
            speaker: speaker,
            flavor: flavor,
            title: title
        });
    } else {
        return await util.renderDiceResults({
            options: options.pSuccess,
            template: CONFIG.DW.template,
            templateData: templateData,
            speaker: speaker,
            flavor: flavor,
            title: title
        });
    }
}

export async function move(actor, item) {
    let itemData = item.data;
    let targetData;
    if (itemData.data.target) {
        if (game.user.targets.size === 0) {
            ui.notifications.warn("Action requires a target.");
            return;
        }
        targetData = util.getTargets(actor);
    }

    let baseFormula = '2d6';
    let actorData = actor.data;
    let ability = itemData.data.rollType.toLowerCase();
    let mod = itemData.data.rollMod;
    let abilityMod = 0;
    switch (ability) {
        case "bond":
            break;
        case "ask":
            break;
        default:
            abilityMod = actorData.data.abilities[ability].mod;
            break;
    }
    let formula = `${baseFormula}+${abilityMod}`;
    let forward = actor.getFlag("world", "forward");
    let frw = 0;
    if (forward) {
        frw = forward.reduce(function (a, b) {
            return a + b;
        }, 0);
    }
    if (frw) {
        formula += `+${frw}`;
    }
    let sus = 0;
    let ongoing = 0;
    if (item.name.toLowerCase() === "cast a spell") {
        let sustained = actor.getFlag("world", "sustained");
        if (sustained) {
            for (let sSpell of sustained) {
                sus += sSpell.data.value;
            }
        }
        if (sus) {
            formula += `-${sus}`;
        }
        ongoing = actor.getFlag("world", "ongoing");
        if (ongoing) {
            formula += `+${ongoing}`;
        }
    }
    if (mod && mod !== 0) {
        formula += `+${mod}`;
    }
    let cRoll = new Roll(`${formula}`);
    cRoll.roll();
    let rolled = await cRoll.render();
    let gColors = util.getColors(actor, targetData.targetActor);

    let templateData = {
        title: item.name,
        ability: ability.charAt(0).toUpperCase() + ability.slice(1),
        mod: abilityMod,
        ongoing: ongoing,
        sustained: sus ? `-${sus}` : 0,
        forward: frw ? `+${frw}` : 0,
        rollDw: rolled,
        sourceColor: gColors.source,
        targetColor: gColors.target,
        sourceName: actor ? actor.name : "",
        targetName: targetData.targetActor ? targetData.targetActor.name : "",
        startingWords: "",
        middleWords: "",
        endWords: ""
    }

    await game.dice3d.showForRoll(cRoll);
    let amount =  await util.renderDiceResults2({
        title: item.name,
        total: cRoll.total,
        itemData: itemData,
        templateData: templateData
    });
    console.log("DAMAGE");
    console.log(damage);
    console.log(itemData.data);
    if (itemData.data.details.attack && amount) {
        await util.doDamage({actor: actor, targetData: targetData, damageMod: amount, title: item.name});
    }
}

/**
 * HACK AND SLASH
 * @param actor
 * @returns {Promise<void>}
 */
export async function hackAndSlash(actor) {
    if (actor) {
        if (game.user.targets.size === 0) {
            ui.notifications.warn("Action requires a target.");
            return;
        }

        let targetData = util.getTargets(actor);
        let flavor = "Your attack is successful, chose an option.";
        let options = {
            fail: {
                dialogType: CONFIG.DW.dialogTypes.fail,
                details: {
                    middleWords: "Failed to Attack"
                },
                result: null
            },
            pSuccess: {
                dialogType: CONFIG.DW.dialogTypes.partial,
                details: {
                    middleWords: "Successfully Attacks, but opens themselves up to Attacks from"
                },
                result: "0"
            },
            success: {
                dialogType: CONFIG.DW.dialogTypes.success,
                result: [
                    {
                        key: "opt1",
                        icon: `<i class="fas fa-dice-d6"></i>`,
                        label: "Your Attack deals +1d6 Damage, but you open yourself up to attack.",
                        details: {
                            middleWords: "Successfully Attacks",
                            endWords: "and deals an additional +1d6 damage"
                        },
                        result: "1d6"
                    },
                    {
                        key: "opt2",
                        icon: `<i class="fas fa-bacon"></i>`,
                        label: "Deal your damage to the enemy and avoid their attack",
                        details: {
                            middleWords: "Successfully Attacks",
                            endWords: "and avoids the enemy attack"
                        },
                        result: "0"
                    }
                ]
            }
        };

        let attack = await basicMove(({actor: actor, targetActor: targetData.targetActor, flavor: flavor, options: options, title: "Hack And Slash", move: "Hack And Slash"}));
        if (attack) {
            await util.doDamage({actor: actor, targetData: targetData, damageMod: attack, title: "Hack And Slash"});
        }
    } else {
        ui.notifications.warn("Please select a token.");
    }
}

export async function volley(actorData) {
    if (actorData) {
        if (game.user.targets.size === 0) {
            ui.notifications.warn("Action requires a target.");
            return;
        }

        let targetData = util.getTargets(actorData);
        let flavor = "Your attack is successful, chose an option.";
        let options = {
            fail: {
                details: {
                    middleWords: "Failed to Attack"
                },
                dialogType: CONFIG.DW.dialogTypes.fail,
                result: null
            },
            success: {
                details: {
                    middleWords: "Successfully Attacks"
                },
                dialogType: CONFIG.DW.dialogTypes.success,
                result: "0"
            },
            pSuccess: {
                dialogType: CONFIG.DW.dialogTypes.partial,
                result: [
                    {
                        key: "opt1",
                        icon: `<i class="fas fa-shoe-prints"></i>`,
                        label: "You have to move to get the shot, placing you in danger",
                        details: {
                            middleWords: "Successfully Attacks",
                            endWords: ", but moves and places themselves in danger."
                        },
                        result: "0"
                    },
                    {
                        key: "opt2",
                        icon: `<i class="fas fa-wind"></i>`,
                        label: "You have to take what you can get",
                        details: {
                            middleWords: "Successfully Attacks",
                            endWords: ", but takes the shot that was offered"
                        },
                        result: "-1d6"
                    },
                    {
                        key: "opt3",
                        icon: `<i class="fas fa-compress-arrows-alt"></i>`,
                        label: "You have to take several shots",
                        details: {
                            middleWords: "Successfully Attacks",
                            endWords: ", but it takes more than one shot"
                        },
                        result: "0"
                    }
                ]
            }
        };

        let attack = await basicMove(({actor: actor, targetActor: targetData.targetActor, flavor: flavor, options: options, title: "Volley", move: "Volley"}));
        if (attack) {
            await util.doDamage({actor: actor, targetData: targetData, damageMod: attack, title: "Volley"});
        }
    } else {
        ui.notifications.warn("Please select a token.");
    }
}

export async function carouse(actor) {
    let options = {
        fail: {
            dialogType: CONFIG.DW.dialogTypes.fail,
            details: {
                middleWords: "Chooses 1 and things get out of hand"
            },
            result: "1"
        },
        pSuccess: {
            dialogType: CONFIG.DW.dialogTypes.partial,
            details: {
                middleWords: "Chooses 1"
            },
            result: "1"
        },
        success: {
            dialogType: CONFIG.DW.dialogTypes.success,
            details: {
                middleWords: "Chooses 3"
            },
            result: "3"
        }
    };

    await basicMove(({actor: actor, options: options, title: "Carouse", move: "Carouse"}));
}

export async function defyDanger(actor) {
    let options = {
        fail: {
            dialogType: CONFIG.DW.dialogTypes.fail,
            details: {
                middleWords: "Chooses 1 and things get out of hand"
            },
            result: "1"
        },
        pSuccess: {
            dialogType: CONFIG.DW.dialogTypes.partial,
            details: {
                middleWords: "Chooses 1"
            },
            result: "1"
        },
        success: {
            dialogType: CONFIG.DW.dialogTypes.success,
            details: {
                middleWords: "Chooses 3"
            },
            result: "3"
        }
    };

    await basicMove(({actor: actor, options: options, title: "Carouse", move: "Carouse"}));
}

export async function defend(actor) {
    let options = {
        fail: {
            dialogType: CONFIG.DW.dialogTypes.fail,
            details: {
                middleWords: "Not today"
            },
            result: "0"
        },
        pSuccess: {
            dialogType: CONFIG.DW.dialogTypes.partial,
            details: {
                middleWords: "Hold 1"
            },
            result: "1"
        },
        success: {
            dialogType: CONFIG.DW.dialogTypes.success,
            details: {
                middleWords: "Hold 3"
            },
            result: "3"
        }
    };

    await basicMove(({actor: actor, options: options, title: "Carouse", move: "Carouse"}));
}

export async function spoutLore(actor) {
    let options = {
        fail: {
            dialogType: CONFIG.DW.dialogTypes.fail,
            details: {
                middleWords: "Doesn't know as much as they think they do"
            },
            result: "0"
        },
        pSuccess: {
            dialogType: CONFIG.DW.dialogTypes.partial,
            details: {
                middleWords: "Discovers something interesting"
            },
            result: "1"
        },
        success: {
            dialogType: CONFIG.DW.dialogTypes.success,
            details: {
                middleWords: "Discovers something interesting and useful"
            },
            result: "3"
        }
    };

    await basicMove(({actor: actor, options: options, title: "Carouse", move: "Carouse"}));
}

export async function discernRealities(actor) {
    let options = {
        fail: {
            dialogType: CONFIG.DW.dialogTypes.fail,
            details: {
                middleWords: "Looks around"
            },
            result: "0"
        },
        pSuccess: {
            dialogType: CONFIG.DW.dialogTypes.partial,
            details: {
                middleWords: "Asks a question"
            },
            result: "1"
        },
        success: {
            dialogType: CONFIG.DW.dialogTypes.success,
            details: {
                middleWords: "Asks questions 3"
            },
            result: "3"
        }
    };

    await basicMove(({actor: actor, options: options, title: "Carouse", move: "Carouse"}));
}

export async function parley(actor) {
    let options = {
        fail: {
            dialogType: CONFIG.DW.dialogTypes.fail,
            details: {
                middleWords: "Looks around"
            },
            result: "0"
        },
        pSuccess: {
            dialogType: CONFIG.DW.dialogTypes.partial,
            details: {
                middleWords: "Is mostly convincing, but proof should be offered"
            },
            result: "1"
        },
        success: {
            dialogType: CONFIG.DW.dialogTypes.success,
            details: {
                middleWords: "Is convincing"
            },
            result: "3"
        }
    };

    await basicMove(({actor: actor, options: options, title: "Carouse", move: "Carouse"}));
}

export async function aidOrInterfere(actor) {
    let options = {
        fail: {
            dialogType: CONFIG.DW.dialogTypes.fail,
            details: {
                middleWords: "Ugly"
            },
            result: "0"
        },
        pSuccess: {
            dialogType: CONFIG.DW.dialogTypes.partial,
            details: {
                middleWords: "OK"
            },
            result: "1"
        },
        success: {
            dialogType: CONFIG.DW.dialogTypes.success,
            details: {
                middleWords: "Good"
            },
            result: "3"
        }
    };

    await basicMove(({actor: actor, options: options, title: "Carouse", move: "Carouse"}));
}