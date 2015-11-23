/*global define, amplify */
define([
    'jquery',
    'loglevel',
    'underscore',
    'fs-t-c/table',
    'fx-ds/config/events',
    'amplify'
], function ($, log, _, TableCreator, E) {

    'use strict';

    var defaultOptions = {

        };

    var s = {

        EXPORT: '[data-role="export"]'

    };

    function TableItem(options) {

        this.o = $.extend(true, {}, defaultOptions, options);

        this._bindEventListeners();

        this.tableCreator = new TableCreator();

    }

    TableItem.prototype._bindEventListeners = function () {

    };

    TableItem.prototype._getProcess = function () {

        return this.o.filter || [];
    };

    TableItem.prototype.render = function () {

        var process = this._getProcess();

        amplify.publish(E.LOADING_SHOW, {container: this.o.config.container});

        this.bridge.query(process).then(
            _.bind(this._onQuerySuccess, this),
            _.bind(this._onQueryError, this)
        );

    };

    TableItem.prototype._onQuerySuccess = function (model) {

        amplify.publish(E.LOADING_HIDE, {container: this.o.config.container});

        //log.info(this.o)

        this.tableCreator.render($.extend(true, {},
            this.o.config, {
            model: model
        }));

        this.enableExport();

    };

    TableItem.prototype.enableExport = function () {

        var self = this;

        $(this.o.config.container).find(s.EXPORT).on('click', function(e){
            self.export();
        });

    };

    TableItem.prototype.export = function () {

        var process = this._getProcess();

        amplify.publish(E.EXPORT_DATA, process);

    };

    TableItem.prototype._onQueryError = function () {

        log.error("Query error");

    };

    TableItem.prototype._unbindEventListeners = function () {

    };

    TableItem.prototype.destroy = function () {

       this._unbindEventListeners();

        this.$el.remove();
    };

    return TableItem;
});