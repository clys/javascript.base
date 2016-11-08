/**
 * Api('config',apiBaseUrl, apiJsPath) 设置api基础url与api的js文件所在路径(不使用自动加载功能可不写)
 * Api(api,param..) 调用api(自动加载需要的js文件)  Api('a.a_json',xxx)
 */
Api = function () {
    if ($.isFunction(ApiUtils[arguments[0]])) {
        return ApiUtils[arguments[0]].apply(ApiUtils, Array.prototype.slice.call(arguments, 1))
    } else {
        return ApiUtils.send.apply(ApiUtils, arguments);
    }
};

/**
 * ApiUtils.config(apiBaseUrl, apiJsPath) 设置api基础url与api的js文件所在路径(不使用自动加载功能可不写)
 * ApiUtils.post/get/ajax(data, fn)
 * fn存在时data.url将会使用fn在Api对象中的路径自动转换(驼峰自动转'/' _自动转.)出的url
 * data:(大体与jQuery中的ajax的相同)
 *  dataType默认为JSON
 *  type默认为GET
 *  dataType为JSON并且type为GET或POST时:(
 *      success预处理返回结果，原回调success接收到的参数为result.result ，result.success为失败时调用 error 第一个入参为result 第二个入参为true
 *      当error不存在时:
 *        会使用预设的error，同时success中的 result.success为失败时 会打印errorMsg与result.message
 *        在此之前如果存在exError会先行调用，exError返回false阻止error不存在时的默认行为
 *
 *      设置pretreated = false 阻止以上行为
 *      )
 * @type {{defaultVer: string, post: Function, get: Function, ajax: Function, sendRequest: Function, handleReturnCode: Function, isSuccess: Function, buildApiUrl: Function, findFn: Function}}
 */
ApiUtils = {
    defaultVer: "v1",
    apiBaseUrl: '',
    apiJsPath: '',
    config: function (apiBaseUrl, apiJsPath) {
        var that = ApiUtils;
        if (typeof apiBaseUrl === 'object') {
            that.apiBaseUrl = apiBaseUrl.apiBaseUrl;
            that.apiJsPath = apiBaseUrl.apiJsPath;
        } else {
            that.apiBaseUrl = apiBaseUrl;
            that.apiJsPath = apiJsPath;
        }
    },
    send: function () {
        var that = ApiUtils, api = arguments[0], apiFn = Api, context = Api, errorMsg = '';
        if (typeof api !== 'string') return;
        api = api.split('.');

        !Api[api[0]] && $.ajax({
            url: that.apiJsPath + api[0] + 'Api.js',
            async: false,
            dataType: 'script',
            success: function (js) {
                eval(js);
            }
            , error: function () {
                errorMsg += api[0] + '加载失败，请确认api字符串是否正确;';
            }
        });


        $.each($(api), function (i, v) {
            context = apiFn;
            apiFn = apiFn[v];
            if (!apiFn) {
                errorMsg += '调用api异常:' + v + '不存在(' + api.join('.') + ');';
                return false;
            }
        });

        if (errorMsg.length > 0) {
            console.error(errorMsg);
            return;
        }

        return apiFn.apply(context, Array.prototype.slice.call(arguments, 1))
    },
    addApi: function (key, o) {
        Api[key] = $.extend(Api[key], o);
    },
    post: function (data, fn) {
        data.type = "POST";
        return ApiUtils.sendRequest(data, fn)
    },
    get: function (data, fn) {
        data.type = "GET";
        return ApiUtils.sendRequest(data, fn)
    },
    ajax: function (data, fn) {
        return ApiUtils.sendRequest(data, fn)
    },
    sendRequest: function (data, fn) {
        var that = ApiUtils;
        if (typeof fn === 'function') {
            data.url = (typeof ApiUtils.apiBaseUrl === 'undefined' ? '' : ApiUtils.apiBaseUrl)
                + ApiUtils.buildApiUrl(fn) + (data.cache == true ? '' : '?_=' + new Date().getTime());
        }
        data.dataType = (data.dataType || 'JSON').toUpperCase();
        data.type = (data.type || 'GET').toUpperCase();

        if (data.pretreated != false && (data.dataType === "JSON" || data.dataType === "JSONP") && (data.type === "GET" || data.type === "POST")) {
            var success = data.success,
                error = data.error;
            data.success = function (XMLHttpRequest) {
                if (ApiUtils.isSuccess(XMLHttpRequest)) {
                    if (typeof success === "function") {
                        success(XMLHttpRequest.result);
                    }
                } else {
                    if (typeof error === "function") {
                        error(XMLHttpRequest, true);
                    } else {
                        if (typeof data.exError === "function" && data.exError(XMLHttpRequest, true) === false) return;
                        if (XMLHttpRequest.message) {
                            that.errorMsg((data.errorMsg ? (data.errorMsg + ":") : "") + XMLHttpRequest.message, 3);
                        } else if (data.errorMsg) {
                            that.errorMsg(data.errorMsg, 3);
                        }
                    }
                }
            };
            data.error = typeof data.error === "function" ? data.error :
                function (XMLHttpRequest) {
                    if (typeof data.exError === "function" && data.exError(XMLHttpRequest, false) === false) return;
                    if (!ApiUtils.handleReturnCode(XMLHttpRequest)) {
                        that.errorMsg("网络或系统出现异常", 3);
                    }
                }
        }
        return $.ajax(data);
    },
    errorMsg: function (msg, m) {
        if (YTMsg) {
            YTDialog && YTDialog.close();
            YTMsg.error(msg, m || 3);
        } else {
            alert(msg);
        }
    },
    handleReturnCode: function (XMLHttpRequest) {
        var that = ApiUtils;
        if (typeof XMLHttpRequest !== "undefined") {
            var status = XMLHttpRequest.status;
            if (typeof status !== "undefined") {
                switch ("" + status) {
                    case '401':
                        setTimeout(function () {
                            location.reload();
                        }, 3000);
                        that.errorMsg('亲~您已经太久没有操作了哦，3秒后自动刷新页面~');
                        return true;
                    case '500':
                        that.errorMsg('系统出现异常', 3);
                        return true;
                }
            }
        }
        return false;
    },
    isSuccess: function (data) {
        if (typeof data === "undefined") {
            return false;
        }
        return typeof data.success !== "undefined" && data.success && data.code === 200;
    },
    buildApiUrl: function (obj) {
        if (typeof obj === "undefined") {
            $.error('在构建ApiUrl时失败:传入了undefined');
            return null;
        }
        var url = 'api/' + ApiUtils.findFn(Api, obj, 0);
        url = url.replace(/_/g, ".");
        url = url.replace(/([A-Z])/g, "/$1").toLowerCase();
        return url;
    },
    findFn: function (obj, Fn, tier) {
        if (typeof Fn !== "function") {
            $.error('查找方法路径时失败:传入的Fn不是一个function')
        }
        if ($.isEmptyObject(obj)) {
            return obj;
        }
        var key;
        var keys = _.keys(obj);
        var ob;
        var ret;
        var ver;
        for (var i in keys) {
            key = keys[i];
            ob = obj[key];
            if (typeof ob === "object") {
                ret = ApiUtils.findFn(ob, Fn, tier + 1);
                if (ret) {
                    ver = '';
                    if (tier == 0) {
                        ver = ApiUtils.defaultVer;
                        if (typeof ob['ver'] !== "undefined") {
                            ver = ob['ver'];
                        }
                    }
                    return ver + '/' + key + ret;
                }
            } else if (typeof ob === "function") {
                if (ob == Fn) {
                    return '/' + key;
                }
            }
        }
        return false;
    }
};