var BaseJs = function BaseJs(param) {
    if (typeof param !== 'object') return;
    if (param.init) {
        this.initialize = param.init;
        delete param.init
    }
    if (param.inits) {
        this.inits = $.extend({}, this.inits, param.inits);
        delete param.inits
    }
    if (param.pool) {
        this.pool = $.extend({}, this.pool, param.pool);
        this.pool.element = {};
        delete param.pool
    }
    $.extend(this, param);
};
BaseJs.prototype = {
    constructor: BaseJs,
    pool: {
        containerName: "",
        containerNameKey: "data-container",
        element: {}
    },
    setEle: function (key, ele) {
        var that = this
            , data;
        if (typeof key === "string") {
            data = {};
            data[key] = ele;
        } else if (typeof key === "object") {
            data = key
        } else {
            return that;
        }
        var keys = _.keys(data), key;
        for (var i = 0, len = keys.length; i < len; i++) {
            key = keys[i];
            that.pool.element[key] = data[key];
        }
        return that;
    },
    getEle: function (key) {
        var that = this
            , keys;
        if (typeof key === "string") {
            return that.pool.element[key];
        } else if (typeof key === "object") {
            keys = key
        } else {
            return that;
        }
        var $es = $(), k;
        for (var i = 0, len = keys.length; i < len; i++) {
            k = keys[i];
            $es = $es.add(that.pool.element[k]);
        }
        return $es;
    },
    init: function () {
        var that = this;
        that.inits.base(that);
        typeof that.initialize == 'function' && that.initialize.apply(that, arguments);
    },
    inits: {
        base: function (that) {
            var $container = $('[' + that.pool.containerNameKey + '="' + that.pool.containerName + '"]');
            if ($container.size() == 0) return;
            that.setEle("$container", $container);
            that.getEle("$container").on('click', '[data-click-fn]', function (e) {
                var $e = $(this)
                    , fn = that[$e.attr('data-click-fn')];
                typeof fn === "function" && fn.apply(this, [e]);
            });
        }
    },
    runInits:function(){
        var that = this;
        $.each(that.inits, function (i, initFn) {
            initFn.name != 'base' && initFn();
        });
    }
};