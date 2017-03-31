F.module('js/dom', function () {
    var $ = function (selector) {
        $.dom = document.getElementById(selector);
        // 返回构造函数对象
        return $;
    };

    $.html = function (html) {
        // 如果传参数，则设置内容，否则获取内容
        if (html) {
            this.dom.innerHTML = html;
            // 方便链式调用
            return this;
        } else {
            return this.dom.innerHTML;
        }
    };

    $.get = function () {
        return this.dom;
    }

    $.addClass = function (className) {
        if (this.dom.className.indexOf(className) == -1) {
            if (this.dom.className === "") {
                this.dom.className += className;
            } else {
                this.dom.className += ' ' + className;
            }
        }
        return this;
    }

    // 返回构造函数
    return $;
});