import { Component, OnInit, ElementRef } from '@angular/core';
import { PerfectScrollbarConfigInterface } from 'ngx-perfect-scrollbar';
import { flatten, filter, compose, map, addIndex, clone } from 'ramda';

import { saveAs } from 'file-saver/dist/FileSaver';
import * as JSZip from 'jszip';

import { LocalStorageService } from 'ngx-store';

import * as helper from '../../../helpers/helpers';

declare var swal: any;
declare var Crunker: any;
declare var audioBufferToWav: any;

@Component({
    selector: 'app-home',
    templateUrl: './home.component.html',
    styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit {

    configScroll: PerfectScrollbarConfigInterface = {
        suppressScrollX: false,
        suppressScrollY: true
    };

    listAudios: any;
    audioPlayer: any;

    soundConcat: any;
    workerConvert: any;

    loader: Boolean = false;
    audioConcatFinal: any;

    constructor(
        private elementRef: ElementRef,
        public localStorage: LocalStorageService
    ) {
        this.audioPlayer = new Audio();
        this.workerConvert = new Worker('./assets/workers/workerConvert.js');
        this.soundConcat = new Crunker({
            sampleRate: 44100
        });

        // Setear listaAudios
        if (localStorage.get('listaAudio_gamma') != null) {
            const temp = JSON.parse(localStorage.get('listaAudio_gamma'));
            this.listAudios = temp.map((x, i) => {
                return {
                    id: i,
                    name: x.name,
                    buffer: helper._base64ToArrayBuffer(x.base64),
                    type: x.type,
                    url: helper.urlBlob(helper._base64ToArrayBuffer(x.base64), x.type),
                    base64: x.base64
                };
            });
            localStorage.remove('listaAudio_gamma');
        } else {
            this.listAudios = [];
        }
    }

    async uploadAudios(event) {
        this.loader = true;
        const files = clone(Array.from(event.target.files));

        const temp = await helper.fileConstruct(files);
        this.listAudios.push(...temp);
        this.listAudios = this.listAudios.map((xi, i) => (xi.id = i, xi));
        this.loader = false;
    }

    delete(id) {
        // this.stop();
        swal({
            title: 'Are you sure?',
            text: 'You won\'t be able to revert this!',
            type: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#3085d6',
            cancelButtonColor: '#d33',
            confirmButtonText: 'Yes, delete it!'
        }).then((result) => {
            if (result.value) {
                const temp = this.listAudios.filter((x) => x.id !== id);
                this.listAudios = temp;
            }
        });
    }

    changeName(id) {
        this.stop();
        swal({
            title: 'Change name',
            input: 'text',
            inputPlaceholder: 'Name',
        }).then((result) => {
            if (result.value) {
                if (this.listAudios.some((x) => x.name === result.value)) {
                    swal({
                        title: 'The name already exists!',
                        text: 'Sorry :( the name already exists!',
                        type: 'warning',
                        confirmButtonText: 'Ok'
                    });
                } else {
                    const temp = this.listAudios.map((x) => (x.id === id) ? (x.name = result.value, x) : x);
                    this.listAudios = temp;
                }
            }
        });
    }

    play(url) {
        this.audioPlayer.src = url;
        this.audioPlayer.play();
    }

    stop() {
        this.audioPlayer.pause();
        this.audioPlayer.currentTime = 0;
    }

    onItemDrop(event, llega) {
        const entra = event.dragData;
        const actual = llega;
        const temp = compose(
            addIndex(map)((x, i) => (x.id = i, x)),
            flatten,
            map((x) => (x.id === actual.id) ? [entra, x] : x),
            filter((x) => entra.id !== x.id)
        );
        this.listAudios = temp(this.listAudios);

    }

    async concatAudio() {
        const tempListAudio = clone(this.listAudios);

        const { value: format } = await swal({
            title: 'Choose format',
            input: 'select',
            inputOptions: {
                'MP3': 'MP3',
                'OGG': 'OGG',
                'MP4': 'ACC',
                'ASF': 'WMA',
                'BANANA': 'Banana'
            },
            inputPlaceholder: 'Choose format',
            showCancelButton: true,
            inputValidator: (value) => {
                return new Promise((resolve) => {
                    if (value === 'BANANA') {
                        resolve('Sorry, the banana format does not exist (yet) :)');
                    } if (value === '') {
                        resolve('Sorry, you need choose one format');
                    } else {
                        this.loader = true;
                        resolve();
                    }
                });
            }
        });

        if (format) {
            let spriteJSON = {};
            this.soundConcat.fetchAudio(tempListAudio).then((x) => {
                spriteJSON = helper.getSpriteJSON(x);
                const buffers = x.map((b) => b.audioBuffer);
                return this.soundConcat.concatAudio(buffers);
            }, (error) => {
                // TODO: Corregir el error del audioBuffer
                // console.log('Setea la lista');
                // this.localStorage.set('listaAudio_gamma', JSON.stringify(this.listAudios));
                // window.location.reload();

            }).then((merged) => {
                const wav = audioBufferToWav(merged);
                const Module = helper.getArguments('gammafpD', format, wav);

                this.workerConvert.addEventListener('message', (event) => {
                    const message = event.data;
                    const outputName = `out.${format.toLowerCase()}`;
                    const dates = message.data.outputFiles[outputName];
                    const blobs = new Blob([dates], {type: 'audio/mp3'});

                    const zip = new JSZip();
                    zip.file(`spriteAudioGamma.json`, spriteJSON);
                    zip.file(`spriteAudioGamma.${format.toLowerCase()}`, blobs),
                    zip.generateAsync({ type: 'blob' })
                        .then(function (content) {
                            saveAs(content, `AudioSpriteGamma.zip`);
                        });

                    this.loader = false;
                });

                this.workerConvert.postMessage(Module);
            });
        }

    }

    ngOnInit() {
        this.elementRef.nativeElement.ownerDocument.body.style.backgroundColor = '#1A2226';
        // const ps = new PerfectScrollbar('.list-audio');
    }

}
