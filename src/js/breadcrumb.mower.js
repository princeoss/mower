/** ========================================================================
 * Mower: breadcrumb.mower.js - v1.0.0
 *
 * breadcrumb with ajax load remote content capability.
 *
 * Dependencies:
 *               fontawsome
 *               bootstrap tooltip
 * Copyright 2011-2014 Infinitus, Inc
 * Licensed under Apache Licence 2.0 (https://github.com/macula-projects/mower/blob/master/LICENSE)
 * ======================================================================== */

;
(function(json, utils, $, window, document, undefined) {

    "use strict"

    var BreadCrumb = function(element, options) {
        this.element = element;
        this.$element = $(element);
        this.options = options;

        //current location in the breadcrumb workspace
        this.current = 0;

        //sequence of panel in the breadcrumb
        this.panelSeq = 1;
    };

    BreadCrumb.DEFAULTS = {
        prefix: "breadcrumb",
        param: '{}',
        home: '<i class="fa fa-home home"></i>',
        divider: '',
        keyboard: false,
        events: {
            command: "command.mu.breadcrumb",
            commanded: "commanded.mu.breadcrumb",
            push: "push.mu.breadcrumb",
            pushed: "pushed.mu.breadcrumb",
            pop: "pop.mu.breadcrumb",
            poped: "poped.mu.breadcrumb",
            reset: "reset.mu.breadcrumb",
            populateError: "error.populate.mu.breadcrumb",
            populateSuccess: "success.populate.mu.breadcrumb"
        }
    };

    BreadCrumb.prototype = {

        constructor: BreadCrumb,

        _init: function(element, options) {
            var $element = $(element);
            this.options = $.extend({}, BreadCrumb.DEFAULTS, $element.data(), typeof options === 'object' && options);
            this.options.param = json.decode(this.options.param || '{}');
        },
        _getXPath: function(elements) {
            var path = new Array();

            for (var i = 0; i < elements.length; i++) {
                path.push(this._getLabel(elements[i]));
            }

            return path;
        },
        _valueof: function(argument, defaultVal) {
            return (typeof argument === 'undefined' ? defaultVal : argument);
        },
        _getLabel: function(element) {
            var $content = $(element).children('a').length ? $(element).children('a:first') : $(element);

            return $content[0].textContent || $content[0].innerText || '';
        },
        _getTarget: function(element) {
            var $content = $(element).children('a').length ? $(element).children('a:first') : $(element);

            return $content.attr('data-target');
        },
        _pushHeader: function(targetId, label, url) {
            var path = this._getXPath(this.$element.children('li'));

            if (path.length > 0) {
                var $last = this.$element.children('li').filter(':last');
                var previousLabel = this._getLabel($last);
                var previousTarget = this._getTarget($last);

                $last.remove();

                var preLi = [
                    '<li>',
                    path.length === 1 ? this.options.home : this.options.divider,
                    '<a href="#" data-toggle="breadcrumb" data-target="',
                    previousTarget,
                    '">',
                    previousLabel,
                    '</a></li>'
                ].join('');

                this.$element.append(preLi);

                var that = this;
                this.$element.children('li').filter(':last')
                    .on('click.mu.breadcrumb', '[data-toggle="breadcrumb"]', function(event) {
                        event.preventDefault();
                        /* Act on the event */
                        var index = path.length - 1;
                        var popCount = that.$element.children('li').length - index;
                        that.pop(popCount);
                    });
            }

            path.push(label);

            var li = [
                '<li ',
                'data-target="',
                targetId,
                '" class="active">',
                path.length === 1 ? this.options.home : this.options.divider,
                label,
                '</li>'
            ].join('');

            this.$element.append(li);
            return;
        },
        _pushContent: function(panelId, url, _callback) {
            if (url) {

                url = url + (url.indexOf('?') > -1 ? '&' : '?') + '_=' + (new Date()).valueOf();

                var ajaxOpt = {
                    data: this.options.param
                };

                var target = this.$element.data('target');
                var $panel = $('<div data-panel="' + panelId + '"></div>');
                $(target).append($panel);

                //hide siblings
                $panel.prev().addClass('hidden');

                //call jquery.fn extend appendcontent defined in utils.mower.js
                url = utils.getAbsoluteUrl(url, this.$element.getContextPath());
                $panel.appendAjaxContents(url, ajaxOpt, _callback, true);
            }
        },
        /**
         * [push add path in the breadcrumb]
         * @param  {[string]} path label
         * @param  {[string]} url ajax request page content url
         * @param  {[string]} relatedTarget trigger original
         */
        push: function(label, url, relatedTarget) {
            if (!label || !url) return;

            var targetId = this.options.prefix + this.panelSeq++;

            var that = this;
            var callback = function(isSuccessLoaded, data) {

                if (isSuccessLoaded) {
                    //move forward
                    that.current++;

                    //trigger populdate success event 
                    var e = $.Event(BreadCrumb.DEFAULTS.events.populateSuccess, {
                        "data": data
                    });
                    that.$element.trigger(e);

                    //update header in breadcrumb
                    that._pushHeader(targetId, label, url);
                    var trigger = relatedTarget || that.element;
                    $(trigger).trigger(BreadCrumb.DEFAULTS.events.pushed, {
                        "path": that._getXPath(that.$element.children('li'))
                    });

                } else {
                    //trigger populdate success event 
                    var e = $.Event(BreadCrumb.DEFAULTS.events.populateError, {
                        "data": data
                    });

                    that.$element.trigger(e);

                    var target = that.$element.data('target');
                    var $panel = $(target).find('[data-panel="' + targetId + '"]');
                    $panel.prev().removeClass('hidden');
                    $panel.remove();
                    //hide siblings

                }
            };

            //update breadcrumb's target content
            this._pushContent(targetId, url, callback);
        },
        _popHeader: function(popCount) {
            var popArray = new Array();

            for (var i = 0; i < this._valueof(popCount, 1); i++) {
                var $li = this.$element.children('li').filter(':last');
                popArray.push($li.attr('data-target'));
                $li.remove();
            }

            var $last = this.$element.children('li').filter(':last');

            if ($last.length > 0) {
                var lastLabel = this._getLabel($last);
                var lastTarget = this._getTarget($last);

                $last.remove();

                var level = (this.$element.children('li').length + 1);
                var divider = (level === 1 ? this.options.home : this.options.divider);

                var li = [
                    '<li ',
                    ' data-target="',
                    lastTarget,
                    '" class="active">',
                    divider,
                    lastLabel,
                    '</li>'
                ].join('');

                this.$element.append(li);

                popArray.push(lastTarget);
            }
            return popArray;
        },
        _popContent: function(popArray) {
            var showPanelId = popArray.pop();

            var that = this;
            $.each(popArray, function(index, val) {
                /* iterate through array or object */
                $(that.$element.data("target")).children()
                    .filter('[data-panel="' + val + '"]').remove();
            });

            //show self
            $(this.$element.data('target'))
                .children('[data-panel="' + showPanelId + '"]')
                .removeClass('hidden');
        },
        pop: function(popCount, relatedTarget) {
            if (parseInt(popCount) <= 0) return;

            //update header in breadcrumb
            var popArray = this._popHeader(popCount);

            //update breadcrumb's target
            this._popContent(popArray);

            //move backward
            this.current -= popArray.length;

            var trigger = relatedTarget || this.element;
            $(trigger).trigger(BreadCrumb.DEFAULTS.events.poped, {
                "path": this._getXPath(this.$element.children('li'))
            });
        },
        reset: function() {
            //remove header
            this.$element.children('li').remove();

            //remove content
            this.$element.data("target").children().remove();

            this.$element.trigger(BreadCrumb.DEFAULTS.events.reset);
        },
        _destory: function() {}
    };

    /* BREADCRUMB PLUGIN DEFINITION
     * ============================ */

    var old = $.fn.breadcrumb;

    $.fn.breadcrumb = function(options) {
        // slice arguments to leave only arguments after function name.
        var args = Array.prototype.slice.call(arguments, 1);

        // Cache any plugin method call, to make it possible to return a value
        var results;

        this.each(function() {
            var element = this,
                $element = $(element),
                pluginKey = 'mu.breadcrumb',
                instance = $.data(element, pluginKey)


            // if there's no plugin instance for this element, create a new one, calling its "init" method, if it exists.
            if (!instance) {
                instance = $.data(element, pluginKey, new BreadCrumb(element, options));
                if (instance && typeof BreadCrumb.prototype['_init'] === 'function')
                    BreadCrumb.prototype['_init'].apply(instance, [element, options]);
            }

            // if we have an instance, and as long as the first argument (options) is a valid string value, tries to call a method from this instance.
            if (instance && typeof options === 'string' && options[0] !== '_' && options !== 'init') {

                var methodName = (options == 'destroy' ? '_destroy' : options);
                if (typeof BreadCrumb.prototype[methodName] === 'function')
                    results = BreadCrumb.prototype[methodName].apply(instance, args);

                // Allow instances to be destroyed via the 'destroy' method
                if (options === 'destroy') {
                    $.data(element, pluginKey, null);
                }
            }
        });

        // If the earlier cached method gives a value back, return the resulting value, otherwise return this to preserve chainability.
        return results !== undefined ? results : this;
    };

    $.fn.breadcrumb.Constructor = BreadCrumb;


    /* BREADCRUMB NO CONFLICT
     * ================= */

    $.fn.breadcrumb.noConflict = function() {
        $.fn.breadcrumb = old;
        return this;
    };

    $.fn.extend({
        pushBreadcrumb: function(page) {
            var $target = $(this),
                $breadcrumb = ($target.attr('data-target') && $($target.attr('data-target'))) || $(document.body).find('.breadcrumb:first'), //breadcrumb id
                option = $.extend({}, $breadcrumb.data(), $target.data(), ((typeof page !== 'undefined') && {
                    'page': page
                }) || {});

            var page = option.page;
            if ($.isFunction(page)) {
                page = utils.executeFunction(page, $target);
            }

            page = (page && page.replace(/.*(?=#[^\s]+$)/, '')); // strip for ie7

            if (page) {
                $breadcrumb
                    .breadcrumb(option)
                    .breadcrumb("push", option.label, page);
            }
        },
        popBreadcrumb: function() {
            var $target = $(this),
                $breadcrumb = ($target.attr('data-target') && $($target.attr('data-target'))) || $(document.body).find('.breadcrumb:first'), //breadcrumb id
                option = $.extend({}, $breadcrumb.data(), $target.data());

            $breadcrumb
                .breadcrumb(option)
                .breadcrumb("pop", 1);
        }
    });

    /* BREADCRUMB DATA-API
     * ============== */
    $(document)
        .on(BreadCrumb.DEFAULTS.events.push, 'a,button,input[type="button"]', function(event) {
            $(this).pushBreadcrumb(event.page);
        })
        .on('click.mu.breadcrumb.data-api', '[data-toggle^="pushBreadcrumb"]', function(event) {
            var $this = $(this);
            if ($this.is('a')) event.preventDefault();

            var e = $.Event(BreadCrumb.DEFAULTS.events.push);
            $this.trigger(e);
        })
        .on(BreadCrumb.DEFAULTS.events.pop, 'a,button,input[type="button"]', function(event) {
            $(this).popBreadcrumb();
        })
        .on('click.mu.breadcrumb.data-api', '[data-toggle^="popBreadcrumb"]', function(event) {
            var $this = $(this);
            if ($this.is('a')) event.preventDefault();

            var e = $.Event(BreadCrumb.DEFAULTS.events.pop);
            $this.trigger(e);
        });

})(JSON || {}, Utils || {}, jQuery, window, document);
