define('js/event', ['js/dom'], function ($) {
    console.log("event加载完毕");
    return {
        on: function (id, type, fn) {
            $(id).get().addEventListener(type, fn, false);
        }
    }
});