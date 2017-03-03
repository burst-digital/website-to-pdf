
export function slug(string) {
    return string.toLowerCase().replace(/ /g,'-').replace(/[-]+/g, '-').replace(/[^\w-]+/g,'');
}

let fileSystem;

export async function saveFile(name, dataURI) {
    if(!fileSystem){
        fileSystem = await new Promise(r => window.webkitRequestFileSystem(window.TEMPORARY, 10 * 1024 * 1024 * 1024, r));
    }

    console.log({fileSystem});

    const file = await new Promise(r => fileSystem.root.getFile(name, {create: true}, r));

    console.log({file});

    const writer = await new Promise(r => file.createWriter(r));

    console.log({writer});
    const writeEnd = new Promise(r => writer.onwriteend = r);
    writer.write(dataURItoBlob(dataURI));
    await writeEnd;
    return `filesystem:chrome-extension://${chrome.i18n.getMessage('@@extension_id')}/temporary/${name}`;
}

/**
 * Copied from http://stackoverflow.com/a/12300351
 */
function dataURItoBlob(dataURI) {
    var byteString = atob(dataURI.split(',')[1]);
    var mimeString = dataURI.split(',')[0].split(':')[1].split(';')[0];
    var ab = new ArrayBuffer(byteString.length);
    var ia = new Uint8Array(ab);
    for (var i = 0; i < byteString.length; i++) {
        ia[i] = byteString.charCodeAt(i);
    }
    var blob = new Blob([ab], {type: mimeString});
    return blob;
}