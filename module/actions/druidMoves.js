/**
 * Provides a dialog to chose a new shape. Token image will be updated to reflect the selection.
 * @returns {Promise<void>}
 */
export async function shapeshifter(actor) {
    let token = canvas.tokens.controlled[0];
    return new Promise(resolve => {
        const dialog = new Dialog({
            title: 'Shapeshift',
            content: "<p>Select a form</p>" +
                "<select name='token' id='token'>" +
                "<option value='_Nimue.png'>Self</option>" +
                "<option value='_Alligator.png'>Alligator</option>" +
                "<option value='_Badger.png'>Badger</option>" +
                "<option value='_Bat.png'>Bat</option>" +
                "<option value='_BrownBear.png'>Bear</option>" +
                "<option value='_Boar.png'>Boar</option>" +
                "<option value='_Bull.png'>Bull</option>" +
                "<option value='_Bunny.png'>Bunny</option>" +
                "<option value='_Cat.png'>Cat</option>" +
                "<option value='_Cow.png'>Cow</option>" +
                "<option value='_Crab.png'>Crab</option>" +
                "<option value='_Crocodile.png'>Crocodile</option>" +
                "<option value='_Dog.png'>Dog</option>" +
                "<option value='_Dolphin.png'>Dolphin</option>" +
                "<option value='_Donkey.png'>Donkey</option>" +
                "<option value='_Eagle.png'>Eagle</option>" +
                "<option value='_Elephant.png'>Elephant</option>" +
                "<option value='_Elk.png'>Eld</option>" +
                "<option value='_Fish.png'>Fish</option>" +
                "<option value='_Frog.png'>Frog</option>" +
                "<option value='_Goat.png'>Goat</option>" +
                "<option value='_Horse.png'>Horse</option>" +
                "<option value='_Leopard.png'>Leopard</option>" +
                "<option value='_Lion.png'>Lion</option>" +
                "<option value='_Lizard.png'>Lizard</option>" +
                "<option value='_Lynx.png'>Lynx</option>" +
                "<option value='_Monkey.png'>Monkey</option>" +
                "<option value='_Octopus.png'>Octopus</option>" +
                "<option value='_Owl.png'>Owl</option>" +
                "<option value='_Panther.png'>Panther</option>" +
                "<option value='_Rat.png'>Rat</option>" +
                "<option value='_Raven.png'>Raven</option>" +
                "<option value='_Shark.png'>Shark</option>" +
                "<option value='_Snake.png'>Snake</option>" +
                "<option value='_Turtle.png'>Turtle</option>" +
                "<option value='_Wolf.png'>Wolf</option>" +
                "</select>",
            buttons: {
                ok: {
                    icon: '<i class="fas fa-paw"></i>',
                    label: "Shift",
                    callback: () => {
                        token.update({
                            img: token.data.img.slice(0, token.data.img.lastIndexOf('_')) + document.getElementById("token").value
                        });
                        resolve("shift");
                    }
                },
                cancel: {
                    icon: '<i class="fas fa-times"></i>',
                    label: "Cancel",
                    callback: () => {
                        resolve("cancel");
                    }
                }
            }
        });
        dialog.render(true);
    });
}