define([], function () {
    function Result() {
    }

    Result.skipAttrs = {};

    Result.prototype = [];
    Result.prototype.add = function (text) {
        this.push(text);
    };
    Result.prototype.addWrite = function (text, isCode) {
        if (isCode) {
            text = '__w(' + text + ');';
        } else {
            text = text.replace(/\n/g, '\\n');
            text = text.replace(/\'/g, '\\\'');
            text = '__w(\'' + text + '\');';
        }
        this.push(text);
    };
    Result.prototype.addOpen = function (node) {
        this.addWrite('<' + node.tagName.toLowerCase() + attrs(node) + '>');
    };

    Result.prototype.addClose = function (node) {
        this.addWrite('</' + node.tagName.toLowerCase() + '>');
    };

    Result.prototype.addVoid = function (node) {
        this.addWrite('<' + node.tagName.toLowerCase() + attrs(node) + '/>');
    };

    Result.prototype.addDoctype = function (doctype) {
        this.addWrite('<!DOCTYPE '
            + doctype.name
            + (doctype.publicId ? ' PUBLIC "' + doctype.publicId + '"' : '')
            + (!doctype.publicId && doctype.systemId ? ' SYSTEM' : '')
            + (doctype.systemId ? ' "' + doctype.systemId + '"' : '')
            + '>');
    };

    var entityMap = {
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': '&quot;',
        "'": '&#39;',
        "/": '&#x2F;'
    };

    function escape(string) {
        return String(string).replace(/[&<>"'\/]/g, function (s) {
            return entityMap[s];
        });
    }

    function attrs(node) {
        var result = '';
        for (var i = 0; i < node.attributes.length; i++) {
            var attr = node.attributes[i];
            if (!Result.skipAttrs[attr.name]) {
                result += ' ' + attr.name + (attr.value ? '="' + escape(attr.value) + '"' : '');
            }
        }
        return result;
    }

    return Result;

});