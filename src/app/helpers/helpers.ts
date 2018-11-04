interface FileReaderEventTarget extends EventTarget {
    result: string;
}

interface FileReaderEvent extends Event {
    target: FileReaderEventTarget;
    getMessage(): string;
}

const fileConstruct = async (files) => {
    const outputFiles = files.map(async (x, i) => {
        return await readerFile(x, i);
    });
    return await Promise.all(outputFiles);
};

const base64String = (x) => btoa([].reduce.call(new Uint8Array(x), (p, c) => p + String.fromCharCode(c), ''));

const _base64ToArrayBuffer = (base64) => {
    const binary_string =  window.atob(base64);
    const len = binary_string.length;
    const bytes = new Uint8Array( len );
    for (let i = 0; i < len; i++)        {
        bytes[i] = binary_string.charCodeAt(i);
    }
    return bytes.buffer;
};

const readerFile = (x, i) => {
    return new Promise((resolve, reject) => {
        const fileReader = new FileReader();
        fileReader.addEventListener('load', (fx: FileReaderEvent) => {
            const blob = new Blob([fx.target.result], { type: x.type });
            resolve({
                'id': i,
                'name': cleanFormat(x.name),
                'type': x.type,
                'buffer': fx.target.result,
                'base64': base64String(fx.target.result),
                'url': window.URL.createObjectURL(blob),
            });
        });
        fileReader.readAsArrayBuffer(x);
    });
};

const getArguments = (name = 'gamma', format = 'mp3', aBuffer) => {
    const Module = {
        files: [{'name': `${name}.wav`, 'buffer': aBuffer}],
        arguments: ['-i', `${name}.wav`, '-b:a', '128k']
    };

    if (format.toLowerCase() === 'mp3') {
        Module.arguments.push('-acodec');
        Module.arguments.push('libmp3lame');
    }

    if (format.toLowerCase() === 'ogg') {
        Module.arguments.push('-acodec');
        Module.arguments.push('libvorbis');
    }

    if (format.toLowerCase() === 'mp4') {
        Module.arguments.push('-acodec');
        Module.arguments.push('libfdk_aac');
    }

    if (format.toLowerCase() === 'asf') {
        Module.arguments.push('-acodec');
        Module.arguments.push('wmav1');
    }

    Module.arguments.push(`out.${format.toLowerCase()}`);
    return Module;
};

const getSpriteJSON = (x) => {
    const spriteMapJSON = {
        'spritemap': {}
    };

    for (let i = 0; i < x.length; i++) {

        spriteMapJSON.spritemap[x[i].name] = {
            'start': (typeof(x[i - 1]) !== 'undefined') ? roundTwoDecimals(spriteMapJSON.spritemap[x[i - 1].name].end) : 0,
            'end': (typeof(x[i - 1]) !== 'undefined') ?
                roundTwoDecimals(spriteMapJSON.spritemap[x[i - 1].name].end + x[i].duration) : roundTwoDecimals(x[i].duration),
            'loop': false
        };
    }
    return JSON.stringify(spriteMapJSON, null, '    ');
};

const urlBlob = (x, type = 'mp3') => {
    const blob = new Blob([x], { type: type });
    return window.URL.createObjectURL(blob);
};

const roundTwoDecimals = (x) => Math.round(x * 1000) / 1000;
const cleanFormat = (x) => x.replace(/(.mp3|.wav|.mp4|.ogg|.asf)$/, '');

export {
    fileConstruct,
    readerFile,
    getArguments,
    getSpriteJSON,
    _base64ToArrayBuffer,
    base64String,
    urlBlob,
    cleanFormat
};
