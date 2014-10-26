define(['./result', './commands', './helpers'], function (Result, Commands, Helpers) {
    var conf = {
        prefix: '',
        suffix: '.html'
    };

    function parse(html) {
        if (typeof document === 'object') {
            return (new DOMParser()).parseFromString(html, 'text/html');
        } else {
            return originalRequire('jsdom').jsdom(html);
        }
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
        var document = parse(html);
        var result = new Result(); //TODO no root?
        result.add('var __r=[];\n' +
        'var __w=function(x){__r.push(x);};\n' +
        'with(vomit.helpers){with(__c){');
        var root = findRoot(document.documentElement);
        if (!root) {
            root = document.documentElement;
            if (document.doctype) {
                result.addDoctype(document.doctype);
            }
        }
        compileNode(result, root);
        result.add('\n}\n}\n' +
        'return __r.join(\'\')');
        var resultJoin = result.join('\n');
        try {
            return new Function('__c', resultJoin);
        } catch (e) {
            if (typeof JSHINT !== 'undefined') {
                JSLINT(resultJoin);
                for (var i = 0; i < JSLINT.errors.length; i++) {
                    var error = JSLINT.errors[i];
                    if (error.reason != "Unnecessary semicolon.") {
                        error.line++;
                        var err = new Error();
                        err.lineNumber = error.line;
                        err.message = error.reason;
//                        if(options.view)
//                            e.fileName = options.view;
                        throw err;
                    }
                }
            } else {
                throw e;
            }
        }
    }

    function compileNode(result, node) {
        var i, commandList, commandName, command, value,
            addNode = true,
            addInner = true,
            commandsProcessed = [];

        if (!node.tagName) { //Text node
            result.addWrite(node.textContent);
            return;
        }

        commandList = Commands.getCommandsByPrecedence();

        for (i = 0; i < commandList.length; i++) {
            commandName = commandList[i];
            if (node.hasAttribute(commandName)) {
                command = Commands.getCommand(commandName);
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
                compileNode(result, node.childNodes[i]);
            }
        }
        if (addNode) {
            result.addClose(node);
        }

        for (i = commandsProcessed.length - 1; i >= 0; i--) {
            commandsProcessed[i].callEvent('after');
        }
    }

    var fileCache = {};

    function fromFile(src) {
        src = conf.prefix + src + conf.suffix;
        if (fileCache[src]) {
            return fileCache[src];
        }
        var xhr = new XMLHttpRequest();
        xhr.open("GET", src, false);
        xhr.send(null);
        var result = compile(xhr.responseText);
        fileCache[src] = result;
        return result;
    }

    function config(opts) {
        for (var i in opts) {
            conf[i] = opts[i];
        }
    }

    function registerToExpress(app) {
        app.engine('vomit', function (filePath, options, callback) {
            return callback(null, fromFile(filePath)(options));
        });
    }

    compile.addCommand = Commands.addCommand;

    compile.fromFile = fromFile;

    compile.config = config;

    compile.helpers = Helpers;

    compile.registerToExpress = registerToExpress;

    return compile;
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

//TODO v-substitute, v-code

//todo helpers, messages
//todo async?
//todo debug compile, debug run

//todo <html> file or not?