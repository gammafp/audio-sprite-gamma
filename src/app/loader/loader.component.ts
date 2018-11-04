import { Component, OnInit } from '@angular/core';
declare var Typed: any;

@Component({
    selector: 'app-loader',
    templateUrl: './loader.component.html',
    styleUrls: ['./loader.component.scss']
})
export class LoaderComponent implements OnInit {

    constructor() { }

    ngOnInit() {
        const options = {
            strings: ['^1000.^1000.^1000.'],
            loop: true
        };
        const typed = new Typed('.loader-label-typed', options);
    }

}
