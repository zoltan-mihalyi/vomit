define(['./result'], function (Result) {

    var commandsByPrecedence = [];
    var commands = Result.skipAttrs = {};

    function split(str) {
        var spl = str.split(':');
        return [spl[0].trim(), spl.slice(1).join(':').trim()];
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

    addCommand(1, 'v-onerror', {
        before: function () {
            this.add('try{');
        },
        after: function (value) {
            this.add('}catch(error){' + value + '}');
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
            var spl = split(value);
            var variable = spl[0];
            var expr = spl[1];
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
    addCommand(4, 'v-code', {
        addNode: function (value) {
            this.add(value, true);
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
    addCommand(5, 'v-include', {
        addInner: function (value) {
            var spl = split(value);
            var name = spl[0];
            var ctx = spl[1];
            ctx = ctx || '{}';
            this.addWrite('vomit.fromFile(\'' + name + '\')(' + ctx + ')', true);
        }
    });

    return {
        getCommandsByPrecedence: function () {
            var i, j, commandList, commandName,
                result = [];
            for (i = 0; i < commandsByPrecedence.length; i++) {
                commandList = commandsByPrecedence[i];
                if (!commandList) {
                    continue;
                }
                for (j = 0; j < commandList.length; j++) {
                    commandName = commandList[j];
                    result.push(commandName);
                }
            }
            return result;
        },
        getCommand: function (name) {
            return commands[name];
        },
        addCommand: addCommand
    }
});