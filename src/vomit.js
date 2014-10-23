var jsdom = require('jsdom');
var Result = require('./result');

var commandsByPrecedence = [];
var commands = Result.skipAttrs = {};


function doctypeToString(doctype) {
    return '<!DOCTYPE '
        + doctype.name
        + (doctype.publicId ? ' PUBLIC "' + doctype.publicId + '"' : '')
        + (!doctype.publicId && doctype.systemId ? ' SYSTEM' : '')
        + (doctype.systemId ? ' "' + doctype.systemId + '"' : '')
        + '>';
}

function findRoot(node) {
    if (!node.tagName) {
        return;
    }
    if (node.hasAttribute('v-root')) {
        return node;
    }
    for (var i = 0; i < node.childNodes.length; i++) {
        var root = findRoot(node.childNodes[i]);
        if (root) {
            return root;
        }
    }
}

function compile(html) {
    var document = jsdom.jsdom(html);
    var result = new Result();
    result.add('var __r=[];\nvar __w=function(x){__r.push(x);};\nwith(__c){');
    var root = findRoot(document.documentElement);
    if (!root) {
        root = document.documentElement;
        if (document.doctype) {
            result.addWrite(doctypeToString(document.doctype));
        }
    }
    comp(result, root);
    result.add('\n}\nreturn __r.join(\'\')');
    return new Function('__c', result.join('\n'));
}

function comp(result, node) {
    var i, j, commandList, commandName, command, value,
        addNode=true,
        addInner=true,
        commandsProcessed=[];

    if (!node.tagName) { //Text node
        result.addWrite(node.textContent);
        return;
    }

    for (i = 0; i < commandsByPrecedence.length; i++) {
        commandList = commandsByPrecedence[i];
        if (!commandList) {
            continue;
        }
        for (j = 0; j < commandList.length; j++) {
            commandName = commandList[j];
            if (node.hasAttribute(commandName)) {
                command = commands[commandName];
                value = node.getAttribute(commandName);
                commandsProcessed.push({
                    callEvent: (function (command, value) {
                        return function (event) {
                            return command[event].call(result, value);
                        }
                    })(command, value)
                });
            }
        }
    }


    for (i = 0; i < commandsProcessed.length; i++) {
        if (commandsProcessed[i].callEvent('before') === false) {
            return;
        }
    }

    for (i = 0; i < commandsProcessed.length; i++) {
        if (commandsProcessed[i].callEvent('addNode') === false) {
            addNode = false;
        }
    }

    if (addNode) {
        result.addOpen(node);
    }

    for (i = 0; i < commandsProcessed.length; i++) {
        if (commandsProcessed[i].callEvent('addInner') === false) {
            addInner = false;
        }
    }
    if (addInner) {
        for (i = 0; i < node.childNodes.length; i++) {
            comp(result, node.childNodes[i]);
        }
    }
    if (addNode) {
        result.addClose(node);
    }

    for (i = commandsProcessed.length - 1; i >= 0; i--) {
        commandsProcessed[i].callEvent('after');
    }
}

function addCommand(precedence, name, events) {
    events = events || {};
    function empty() {
    }

    var normalizedEvents = {
        before: events.before || empty,
        after: events.after || empty,
        addNode: events.addNode || empty,
        addInner: events.addInner || empty
    };
    if (commands[name]) {
        throw new Error('duplicated name');
    }
    if (!commandsByPrecedence[precedence]) {
        commandsByPrecedence[precedence] = [];
    }
    commandsByPrecedence[precedence].push(name);
    commands[name] = normalizedEvents;
}

addCommand(1, 'v-remove', {
    before: function () {
        return false;
    }
});
addCommand(2, 'v-if', {
    before: function (value) {
        this.add('if(' + value + '){');
    },
    after: function () {
        this.add('}');
    }
});
addCommand(3, 'v-foreach', {
    before: function (value) {
        var split = value.split(':');
        var variable = split[0].trim();
        var expr = split.slice(1).join(':').trim();
        if (variable.indexOf(',') !== -1) {
            var index = variable.split(',')[0].trim();
            variable = variable.split(',')[1].trim();
        }

        this.add(expr + '.forEach(function(' + variable + (index ? ', ' + index : '') + '){', true);
    },
    after: function () {
        this.add('});', true);
    }
});
addCommand(4, 'v-removeouter', {
    addNode: function () {
        return false;
    }
});
addCommand(5, 'v-removeinner', {
    addInner: function () {
        return false;
    }
});
addCommand(5, 'v-html', {
    addInner: function (value) {
        this.addWrite(value, true);
        return false;
    }
});
//todo iterStat
//todo mark error line
//todo v-attr, v-for
/**
 * v-for
 * v-attr
 */
//TODO include, v-text, v-html diff
//todo refactor
module.exports = {
    compile: compile
};