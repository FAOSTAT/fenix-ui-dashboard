/*global define, amplify, console*/
define([
    "jquery",
    "underscore",
    'fx-ds/itemFactory',
    'fx-ds/bridgeFactory',
    'fx-ds/layoutManager',
    "text!fx-ds/templates/dashboard.hbs",
    "text!fx-ds/templates/item.hbs",
    "handlebars",
    "amplify",
    "bootstrap"
], function ($, _, ItemFactory, BridgeFactory, Layout, template, itemTemplate, Handlebars) {

    'use strict';

    var defaultOptions = {

        layout: "fluid",

        lang: 'en',

        render: false,

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

        this.o = $.extend(true, {}, defaultOptions, o);

        this.items = [];

        return this;
    }

    DS.prototype._initVariables = function () {

    };

    DS.prototype._bindEventListeners = function () {

    };

    DS.prototype._initComponents = function () {

        this.layout = new Layout(this.o);

        this.itemFactory = new ItemFactory(this.o);

        this.bridgeFactory = new BridgeFactory(this.o);

    };


    DS.prototype.render = function (o) {

        this.o = $.extend(true, {}, this.o, o);

        //Init auxiliary variables
        this._initVariables();

        this._bindEventListeners();

        this._initComponents();

        this._applyDefaultFilter(this.o.filter || {});

        if (this.o.render === true) {
            this.render();
        }

    };


    DS.prototype.filter = function (filter) {

        //update base filter and render items
        //this.o.filter = filter;

        this._destroyItems();

        this._renderItems(filter);
    };

    DS.prototype._applyDefaultFilter = function (filter) {

        if (this.o.items && Array.isArray(this.o.items)) {

            _.each(this.o.items, _.bind(function (item) {

                // add lang to the item if exists
                if (this.o.lang) {
                    item.lang = this.o.lang;
                }
                if (this.o.labels) {
                    item.labels = $.extend(true, {}, this.o.labels, item.labels);
                }

                item.filter = $.extend(true, {}, item.filter, filter);

            }, this));
        }

    };

    DS.prototype._renderItems = function (filter) {

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
                deniedTemplateFilter = item.deniedTemplateFilter || [];


            _.each(labels, function(label, key) {

                if ( typeof label === 'object') {
                    // TODO: what happens if the lang is not set properly?
                    labels[key] = labels[key][lang] || '';
                }

            });

            _.each(filter, function (f) {
                var filterKey = f.id,
                // TODO: check if label is string or array
                    label = f.labels;

                if (deniedTemplateFilter.indexOf(filterKey) < 0) {
                    if (label) {
                        labels[filterKey] = label;
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
            allowedFilter = item.allowedFilter;

        if (!allowedFilter) {
            return originalFilter;
        }

        _.each(filter, function (f) {
            var filterKey = f.id,
                parameter = f.parameter,
                codes = f.codes;
            if (allowedFilter.indexOf(filterKey) >= 0) {
                originalFilter[parameter] = codes;
            }
        });

        return originalFilter;
    };

    DS.prototype._addItem = function (item) {

        var itemTmpl = this._compileItemTemplate(item);

        //Add item template to dashboard
        this.layout.addItem(itemTmpl, item);

        //Get bridge
        var bridge = this.bridgeFactory.getBridge(this.o, item);

        //Get item render
        var renderer = this.itemFactory.getItemRender(item);

        //inject bridge and template within render
        $.extend(true, renderer, {
            bridge: bridge,
            el: itemTmpl,
            $el: $(itemTmpl)
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

        //Destroy items
        _.each(this.items, function (item) {
            if (item.destroy) {
                item.destroy();
            }
        });

    };

    DS.prototype.clear = function () {

        this.layout.clear();
    };

    DS.prototype.destroy = function () {

        this._unbindEventListeners();

        if (this.layout && this.layout.destroy) {
            this.layout.destroy();
        }

        this._destroyItems();

    };

    return DS;
});