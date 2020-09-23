import { Component } from "preact";

export class InteractiveComponent extends Component {
    // example: get bound methods
    illuminate() {
        var template = this.constructor.template;
        this.innerHTML = template;
        var manuscript = {};
        var landmarks = document.body.querySelectorAll("[data-as]");
        for (var l of landmarks) {
            var key = l.dataset.as;
            manuscript[key] = l;
        }
        this.illuminate = () => manuscript;
        return manuscript;
    }
}
