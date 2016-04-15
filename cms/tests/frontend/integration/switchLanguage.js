'use strict';

// #############################################################################
// Switch language via the admin panel

var globals = require('./settings/globals');
var randomString = require('./helpers/randomString').randomString;
var cms = require('./helpers/cms')();
// random text string for filtering and content purposes
var randomText = randomString({ length: 50, withWhitespaces: false });
// No Preview Template text
var noPreviewText = 'This page has no preview';

casper.test.setUp(function (done) {
    casper.start()
        .then(cms.login())
        .then(cms.addPage({ title: 'First page' }))
        .run(done);
});

casper.test.tearDown(function (done) {
    casper.start()
        .then(cms.removePage())
        .then(cms.logout())
        .run(done);
});

casper.test.begin('Switch language', function (test) {
    casper
        .start(globals.editUrl)
        // click on language bar
        .waitForSelector('.cms-toolbar-expanded', function () {
            this.click('.cms-toolbar-item-navigation > li:nth-child(4) > a');
        })
        // select german language
        .waitUntilVisible('.cms-toolbar-item-navigation > li:nth-child(4) > ul', function () {
            this.click('.cms-toolbar-item-navigation-hover a[href="/de/"]');
        })
        // no page should be here (warning message instead)
        .wait(300)
        .waitForSelector('.cms-toolbar-expanded', function () {
            test.assertSelectorHasText(
                '.cms-screenblock-inner h1',
                noPreviewText,
                'This page isn\'t available'
            );
            this.click('.cms-toolbar-item-navigation > li:nth-child(4) > a');
        })
        // add german translation
        .waitUntilVisible('.cms-toolbar-item-navigation > li:nth-child(4) > ul', function () {
            this.click('.cms-toolbar-item-navigation-hover a[href*="?language=de"]');
        })
        // open Change pane modal and fill with data
        .waitUntilVisible('.cms-modal-open')
        .withFrame(0, function () {
            this.fill('#page_form', {
                'title': randomText,
                'slug': randomText
            });
        })
        // submit Change pane modal
        .then(function () {
            this.click('.cms-modal-open .cms-modal-item-buttons .cms-btn-action');
        })
        // check if german version appears
        .waitWhileVisible('.cms-modal-open', function () {
            test.assertSelectorHasText('ul.nav > .child > a[href="/de/"]', randomText, 'New translation page appears');
        })
        // click on language bar
        .waitForSelector('.cms-toolbar-expanded', function () {
            this.click('.cms-toolbar-item-navigation > li:nth-child(4) > a');
        })
        // delete german translation
        .waitUntilVisible('.cms-toolbar-item-navigation > li:nth-child(4) > ul', function () {
            this.click('.cms-toolbar-item-navigation-hover a[href*="delete-translation/?language=de"]');
        })
        // submit translation deletion
        .waitUntilVisible('.cms-modal-open', function () {
            this.click('.cms-modal-open .cms-modal-item-buttons .cms-btn.deletelink');
        })
        // make sure translation has been deleted
        .waitWhileVisible('.cms-modal-open', function () {
            test.assertSelectorHasText(
                '.cms-screenblock-inner h1',
                noPreviewText,
                'This page isn\'t available'
            );
        })
        .run(function () {
            test.done();
        });
});
