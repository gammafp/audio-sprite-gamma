importScripts('./ffmpeg.js');

self.addEventListener('message', (message) => {
    const Module = {
        print: print,
        printErr: printErr,
        files: message.data.files || [],
        arguments: message.data.arguments || []
    };

    const result = ffmpeg_run(Module);
    const buffers = Array.from(result.outputFiles);

    self.postMessage({
        data: result
    });
}, false);


const print = (x) => {
    // console.log(x);
};
const printErr = (x) => {
    // console.log(x);
};
