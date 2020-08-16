export async function torch(actor, item) {

    let itemData = item.data.data;
    let updatedItem = duplicate(item);

    if (itemData.details) {
        if (itemData.details.on === undefined || itemData.details.on === null) {
            updatedItem.data.details = {...updatedItem.data.details, ...{on: true}};
        } else {
            updatedItem.data.details.on = !itemData.details.on;
        }
    }

    let dimLight, brightLight;
    if (updatedItem.data.details.on) {
        dimLight = 40;
        brightLight = 20;
    } else {
        dimLight = null;
        brightLight = null;
    }

    let actorToken = canvas.tokens.controlled[0];
    actorToken.update(
        {
            "dimLight": dimLight,
            "brightLight": brightLight,
            "lightAngle": 360,
            "lightColor": "#ffddbb"
        });

    await actor.updateOwnedItem(updatedItem);
}