(function (factory) {
    var framework = factory(typeof require !== 'undefined' ? require : null);
    if (typeof module === "object" && typeof module.exports === "object") { //node module
        module.exports = framework;
    } else {
        vomit = framework;
    }

    if (typeof define === 'function' && define.amd) { //amd module loader
        define([], function () {
            return framework;
        });
    }

}(function (originalRequire) {
//#FACTORY_PLACEHOLDER#
}));
