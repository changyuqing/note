F.module('js/event', ['js/dom'], function ($) {
    return {
        on: function (id, type, fn) {
            $(id).get().addEventListener(type, fn, false);
        }
    }
});