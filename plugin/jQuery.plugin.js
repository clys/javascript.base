(function ($) {
    var versions = "1.0",
        pluginName = "jQuery.plugin",
        pluginMethodsName = "plugin",
        pluginEleTagName = "plugin-tag",
        methods = {},
        pool = {
            defaultParam: {},
            eleMap: {}
        },
        currentEleObj = null;

    $.fn[pluginMethodsName] = function (method) {
        // Method calling logic
        if (methods[method]) {
            return methods[method].apply(this, Array.prototype.slice.call(arguments, 1));
        } else if (typeof method === "object" || !method) {
            return methods.init.apply(this, arguments);
        } else {
            $.error("方法 " + method + "不存在于" + pluginName);
        }

    };
    /* private methods ------------------------------------------------------ */
    var utils = {
        pool: {
            buoyUID: 0
        },
        getUID: function () {
            return '' + (new Date()).getMilliseconds() + utils.pool.buoyUID++;
        },
        object: {
            isNull: function (obj) {
                return typeof obj === "undefined" || obj === null;
            },
            isNotNull: function (obj) {
                return !this.isNull(obj);
            }
        },
        string: {
            isBlank: function (str) {
                return utils.object.isNull(str) || $.trim(str).length === 0;
            },
            isNotBlank: function (str) {
                return !this.isBlank(str);
            },
            isEmpty: function (str) {
                return utils.object.isNull(str) || str.length === 0;
            },
            isNotEmpty: function (str) {
                return !this.isEmpty(str)
            },
            buildTpl: function (tpl, data) {
                var re = /\{%=?((?!%}).)*%}/g,
                    code = "var r = [];",
                    cursor = 0,
                    match;

                function add(str, mode) {
                    if (utils.string.isEmpty(str)) {
                        return add;
                    }

                    if (mode === 1) {
                        code += str;
                    } else if (mode === 2) {
                        code += "r.push(" + str + ");"
                    } else {
                        code += "r.push('" + str.replace(/'/g, "\\'") + "');"
                    }
                    return add;
                }

                while (match = re.exec(tpl)) {
                    add(tpl.slice(cursor, match.index))(match[0].replace(/(^\{%=|^\{%|%}$)/g, ""), /^(\t| )*\{%=/g.test(match[0]) ? 2 : 1);
                    cursor = match.index + match[0].length;
                }
                add(tpl.substr(cursor));
                code += 'return r.join("");';
                var keys = [], param = [];
                for (var key in data) {
                    if (typeof data[key] === "function") {
                        continue;
                    }
                    keys.push(key);
                    param.push(data[key]);
                }
                return (new Function(keys.join(","), code.replace(/[\r\t\n]/g, ''))).apply(null, param);
            }
        }
    };

    function pushEleObj(ele, param) {
        var $ele = $(ele);
        if (utils.object.isNotNull(pullEleObj($ele))) {
            return false;
        }
        var parameter = $.extend({}, pool.defaultParam, param);
        var uid = utils.getUID();
        $ele.attr(pluginEleTagName, uid);
        var eleObj = {ele: $ele, param: parameter};
        pool.eleMap[uid] = eleObj;
        return eleObj;
    }

    function pullEleObj(ele) {
        var uid = getAttrVal(ele, pluginEleTagName);
        if (utils.string.isEmpty(uid)) {
            return null;
        }
        return pool.eleMap[uid];
    }

    function updateEleObj(eleObj) {
        var uid = getAttrVal(eleObj.ele, pluginEleTagName);
        pool.eleMap[uid] = eleObj;
        return updateEleObj;
    }

    function removeEleObj(eleObj) {
        var uid = getAttrVal(eleObj.ele, pluginEleTagName);
        delete pool.eleMap[uid];
        return removeEleObj;
    }

    function getAttrVal(ele, attrName) {
        var $ele = $(ele);
        return $ele.attr(attrName) || $ele.parents('[' + attrName + ']:first').attr(attrName);
    }

    /* public methods ------------------------------------------------------- */
    methods = {
        init: function (options) {
            var $ele = $(this);
            $ele.each(function () {
                var $currentEle = $(this),
                    eleObj = pushEleObj($currentEle, options),
                    param;
                if (!eleObj) return true;
                currentEleObj = eleObj;
                param = eleObj.param;

            });
            return this;
        },
        ver: function () {
            return versions;
        }
    };
})(jQuery);