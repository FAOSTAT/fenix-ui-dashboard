/*global define, amplify, console*/
define([
    "jquery",
    "loglevel",
    "underscore",
    'fx-ds/itemFactory',
    'fx-ds/bridgeFactory',
    'fx-ds/layoutManager',
    "text!fx-ds/templates/dashboard.hbs",
    "text!fx-ds/templates/item.hbs",
    "handlebars",
    "amplify",
    "bootstrap"
], function ($, log, _, ItemFactory, BridgeFactory, Layout, template, itemTemplate, Handlebars) {

    'use strict';

    var defaultOptions = {

        layout: "fluid",

        lang: 'en',

        render: false,

        isOnload: false,

        grid: {
            container: '[data-role="grid-container"]',

            config: {
                //itemSelector: '.fx-ds-item',
                percentPosition: true,
                //rowHeight: '.fx-ds-item',
                transitionDuration: 0
            }
        },

        bridge: {

            type: "faostat"

        }

    };

    function DS(o) {

        log.info("DS(); config", o);

        this.o = $.extend(true, {}, defaultOptions, o);

        this.items = [];

        return this;
    }

    DS.prototype._initVariables = function () {

    };

    DS.prototype._bindEventListeners = function () {

    };

    DS.prototype._initComponents = function () {

        log.info("DS._initComponents;");

        this.layout = new Layout(this.o);

        this.itemFactory = new ItemFactory(this.o);

        this.bridgeFactory = new BridgeFactory(this.o);

    };


    DS.prototype.render = function (o) {

        log.info("DS.render; config", o);

        this.o = $.extend(true, {}, this.o, o);

        //Init auxiliary variables
        this._initVariables();

        this._bindEventListeners();

        this._initComponents();

        this._applyDefaultFilter(this.o.defaultFilter || {});

        if (this.o.render === true) {
            this._renderItems();
        }

    };


    DS.prototype.filter = function (filter, isOnLoad) {

        log.info("DS.filter; filter", isOnLoad, filter);

        if (isOnLoad !== undefined && isOnLoad !== null) {
            this.o.isOnLoad = isOnLoad;
        }

        this._destroyItems();

        this._renderItems(filter);
    };

    DS.prototype._applyDefaultFilter = function (filter) {

        var self = this;

        log.info("DS._applyDefaultFilter; filter", filter);
        log.info("DS._applyDefaultFilter; items", this.o.items);

        if (self.o.items && Array.isArray(self.o.items)) {

            _.each(self.o.items, function (item) {

                log.info("DS._applyDefaultFilter; item", item);

                // add lang to the item if exists
                if (self.o.lang) {
                    item.lang = self.o.lang;
                }

                if (self.o.labels) {
                    item.labels = $.extend(true, {}, self.o.labels, item.labels);
                }

                if (self.o.bridge) {
                    item.bridge = $.extend(true, {}, self.o.bridge, item.bridge);
                }

                log.info("DS._applyDefaultFilter; item.filter", item.filter);
                item.filter = $.extend(true, {}, filter, item.filter || {});

            });
        }

    };

    DS.prototype._renderItems = function (filter) {

        log.info("DS._renderItems; filter", filter);

        if (this.o.items && Array.isArray(this.o.items)) {

            _.each(this.o.items, _.bind(function (item) {

                item.filter = this._prepareFilter(item, filter);

                item.config.template = this._prepareLabels(item, filter);

                this._addItem(item);

            }, this));
        }

    };


    DS.prototype._prepareLabels = function (item, filter) {

        // TODO: check if exists
        if (item.hasOwnProperty('labels')) {
            var originalTemplate = $.extend(true, {}, item.labels.template) || {},
                labels = $.extend(true, {}, item.labels.default) || {},
                lang = item.lang,
                isOnLoad = this.o.isOnLoad,
                deniedTemplateFilter = item.deniedTemplateFilter || [],
                deniedOnLoadFilter = item.deniedOnLoadFilter || [];

            //log.info(labels)

            _.each(labels, function(label, key) {

                if ( typeof label === 'object') {
                    //log.info(labels, key, lang)
                    // TODO: what happens if the lang is not set properly?
                    labels[key] = labels[key][lang] || '';
                }

            });

            _.each(filter, function (f) {
                var filterKey = f.id,
                // TODO: check if label is string or array
                    label = f.labels;

                if (deniedTemplateFilter.indexOf(filterKey) < 0 || (isOnLoad && deniedOnLoadFilter.indexOf(filterKey) < 0)) {
                    // TODO: NOT TESTED properly
                    if (label) {
                        //log.info(label, filterKey, lang)
                        if (!isOnLoad) {
                            labels[filterKey] = label;
                        }
                        else if(isOnLoad && deniedOnLoadFilter.indexOf(filterKey) < 0) {
                            labels[filterKey] = label;
                        }
                    }
                }
            });

            // overwriting otiginal template
            _.each(originalTemplate, function(template, key) {

                var t = Handlebars.compile(template[lang] || template);
                originalTemplate[key] = t(labels);

            });

            return $.extend(true, {}, item.config.template, originalTemplate || {});

        }else {
            return item.config.template;
        }

    };


    DS.prototype._prepareFilter = function (item, filter) {

        var originalFilter = item.filter || [],
            allowedFilter = item.allowedFilter,
            isOnLoad = this.o.isOnLoad,
            deniedOnLoadFilter = item.deniedOnLoadFilter || [];

        if (!allowedFilter) {
            return originalFilter;
        }

        _.each(filter, function (f) {
            var filterKey = f.id,
                parameter = f.parameter,
                codes = f.codes;

            if (allowedFilter.indexOf(filterKey) >= 0) {
                if (!isOnLoad) {
                    originalFilter[parameter] = codes;
                }
                else if(isOnLoad && deniedOnLoadFilter.indexOf(filterKey) < 0) {
                    originalFilter[parameter] = codes;
                }
            }
        });

        return originalFilter;
    };

    DS.prototype._addItem = function (item) {

        var itemTmpl = this._compileItemTemplate(item);

        //Add item template to dashboard
        this.layout.addItem(itemTmpl, item);

        //Get bridge
        var bridge = this.bridgeFactory.getBridge(item);

        //Get item render
        //var renderer = this.itemFactory.getItemRender(this.o item);
        var renderer = this.itemFactory.getItemRender(item);

        //inject bridge and template within render
        $.extend(true, renderer, {
            bridge: bridge,
            el: itemTmpl,
            $el: $(itemTmpl),
            _name: this.o._name
        });

        //take track of displayed item
        this.items.push(renderer);

        renderer.render();

    };

    DS.prototype._compileItemTemplate = function (item) {

        // TODO: remove it from here. Quick fix for the fluid layout
        item.id = item.id || Math.round((Math.pow(36, 10 + 1) - Math.random() * Math.pow(36, 10))).toString(36).slice(1);
        item.container = item.container || "#" + item.id;
        item.config.container = item.container;

        var template = Handlebars.compile(itemTemplate);

        return $(template(item))[0];
    };

    DS.prototype._unbindEventListeners = function () {

    };

    DS.prototype._destroyItems = function () {

        log.info("DS._destroyItems;");

        //log.warn('TODO Dashboard: handle items destroy', this.o._name);

        //Destroy items
        _.each(this.items, function (item) {

            if (item.destroy) {
                // TODO: handle item destroy
                item.destroy();
            }

        });

        this.items = [];

    };

/*    DS.prototype.clear = function () {

        this.layout.clear();

    };*/

    DS.prototype.destroy = function () {

        this._unbindEventListeners();

        if (this.layout) {
            this.layout.destroy();
        }

        this._destroyItems();

    };

    return DS;
});