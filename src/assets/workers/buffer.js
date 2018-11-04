class Crunker {
    constructor({
        sampleRate = 44100
    } = {}) {
        this._sampleRate = sampleRate;
        this._createContext();
    }

    _createContext() {
        window.AudioContext =
            window.AudioContext ||
            window.webkitAudioContext ||
            window.mozAudioContext;
        this._context =  new AudioContext();
    }

    async fetchAudio(filepaths) {


        const files = filepaths.map(async buffer => {
            const AudioBuffer = await this._context.decodeAudioData(buffer.buffer);
            buffer['duration'] = AudioBuffer.duration;
            buffer['audioBuffer'] = AudioBuffer;
            return buffer;
        });
        // this.close();
        return await Promise.all(files);
    }

    concatAudio(buffers) {
        let output = this._context.createBuffer(
                2,
                this._totalLength(buffers),
                this._sampleRate
            ),
            offset = 0;
        buffers.map(buffer => {
            output.getChannelData(0).set(buffer.getChannelData(0), offset);
            output.getChannelData(1).set(buffer.getChannelData(1), offset);
            offset += buffer.length;
        });
        return output;
    }

    play(buffer) {
        const source = this._context.createBufferSource();
        source.buffer = buffer;
        source.connect(this._context.destination);
        source.start();
        return source;
    }

    download(blob, filename) {
        const name = filename || "gammafp";
        const a = document.createElement("a");
        a.style = "display: none";
        a.href = this._renderURL(blob);
        a.download = `${name}.${blob.type.split("/")[1]}`;
        a.click();
        return a;
    }

    _totalLength(buffers) {
        return buffers.map(buffer => buffer.length).reduce((a, b) => a + b, 0);
    }

    close() {
        this._context.close();
        return this;
    }
}
