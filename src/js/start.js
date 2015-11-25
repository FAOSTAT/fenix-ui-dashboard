/*global define, amplify, console*/
define([
    "jquery",
    "underscore",
    'fx-ds/config/errors',
    'fx-ds/itemFactory',
    'fx-ds/bridgeFactory',
    'fx-ds/layoutManager',
    "text!fx-ds/templates/dashboard.hbs",
    "text!fx-ds/templates/item.hbs",
    "handlebars",
    "amplify",
    "bootstrap"
], function ($, _, E, ItemFactory, BridgeFactory, Layout, template, itemTemplate, Handlebars) {

    'use strict';

    var defaultOptions = {

        layout: "fluid",

        grid: {
            container: '[data-role="grid-container"]',

            config: {
                itemSelector: '.fx-ds-item',
                percentPosition: true,
                rowHeight: '.fx-ds-item',
                transitionDuration: 0
            }
        },

        bridge: {

            type: "d3p"

        }

    };

    function DS(o) {

        this.o = $.extend(true, {}, defaultOptions, o);

        this.items = {};

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


        if (this._isValidConfiguration(o)) {

            $.extend(true, this.o, o);

            //Init auxiliary variables
            this._initVariables();

            this._bindEventListeners();

            this._initComponents();

            this._renderItems();
        }

    };

    DS.prototype.filter = function (filter) {

        //update base filter and render items
        //this.o.filter = filter;

        this._destroyItems();

        this._renderItems(filter);
    };

    DS.prototype._renderItems = function (filter) {

        if (this.o.items && Array.isArray(this.o.items)) {

            _.each(this.o.items, _.bind(function (item) {

                item.filter = this._prepareFilter(item, filter);

                this._addItem(item);

            }, this));
        }

    };

    DS.prototype._prepareFilter = function (item, filter) {

        var originalFilter = item.filter || [],
            allowedFilter = item.allowedFilter;


        if (!allowedFilter) {
            return originalFilter;
        }

        _.each(filter, function (f) {
            _.each(f, function (filterValue, filterKey) {
                if (allowedFilter.indexOf(filterKey) >= 0) {
                    _.each(originalFilter, function (of) {
                        if (of.hasOwnProperty("parameters")
                            && of.parameters.hasOwnProperty("rows")) {
                            // checks if the filter has to be removed
                            if (filterValue.hasOwnProperty("removeFilter")) {
                                delete of.parameters.rows[filterKey];
                            }
                            // else add the filter
                            else {
                                of.parameters.rows[filterKey] = filterValue;
                            }
                        }
                    });

                }
            });

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
        this.items[renderer.o.id] = renderer;

        renderer.render();

    };

    DS.prototype._compileItemTemplate = function (item) {

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

        this.items = {};

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

    DS.prototype._isValidConfiguration = function (conf) {
        return this._checkItems(conf.items);
    }

    DS.prototype._checkItems = function (items) {

        // check  id of every item is unique
        var ids = []
        if (items && items != null) {
            for (var i = 0; i < items.length; i++) {
                if (ids.indexOf(items[i].id) != -1) {
                    throw new Error(E.INVALID_ID_ITEM)
                }
            }
        }
        return true;
    };

    DS.prototype.getModel = function (id) {
        if (this.items[id]) {
            return this.items[id].getModel();
        }
        return null;
    };


    return DS;
});