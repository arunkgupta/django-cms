/* global window */
'use strict';

var globals = require('./settings/globals');
var casperjs = require('casper');
var cms = require('./helpers/cms')(casperjs);
var xPath = casperjs.selectXPath;
var createJSTreeXPathFromTree = cms.createJSTreeXPathFromTree;
var getPasteHelpersXPath = cms.getPasteHelpersXPath;

casper.test.setUp(function (done) {
    casper.start()
        .then(cms.login())
        .run(done);
});

casper.test.tearDown(function (done) {
    casper.start()
        .then(cms.logout())
        .run(done);
});

casper.test.begin('Pages can be copied and pasted when CMS_PERMISSION=False', function (test) {
    casper.start()
        .then(cms.addPage({ title: 'Homepage' }))
        .then(cms.addPage({ title: 'Second', parent: 'Homepage' }))
        .thenOpen(globals.baseUrl)
        .then(cms.openSideframe())
        // switch to sideframe
        .withFrame(0, function () {
            var secondPageId;
            casper.waitUntilVisible('.cms-pagetree-jstree')
                .then(cms.expandPageTree())
                .then(function () {
                    test.assertExists(
                        xPath(createJSTreeXPathFromTree([{
                            name: 'Homepage',
                            children: [{
                                name: 'Second'
                            }]
                        }])),
                        'Second page is nested into the Homepage'
                    );

                    secondPageId = cms.getPageId('Second');

                    this.click('.js-cms-tree-item-copy[data-id="' + secondPageId + '"]');
                })
                // wait until paste buttons show up
                .waitUntilVisible('.cms-tree-item-helpers', function () {
                    test.assertElementCount(
                        xPath(getPasteHelpersXPath({
                            visible: true
                        })),
                        3,
                        'Three possible paste targets'
                    );
                })
                // click on it again
                .then(function () {
                    this.click('.js-cms-tree-item-copy[data-id="' + secondPageId + '"]');
                    test.assertElementCount(
                        xPath(getPasteHelpersXPath({
                            visible: true
                        })),
                        0,
                        'Paste buttons hide when clicked on copy again'
                    );
                    // open them again
                    this.click('.js-cms-tree-item-copy[data-id="' + secondPageId + '"]');
                })
                // then try to paste into itself
                .then(function () {
                    this.click('.cms-tree-item-helpers a[data-id="' + secondPageId + '"]');
                })
                .waitForResource(/copy-page/)
                .waitForUrl(/page/) // need to wait for reload
                .wait(1000)
                .waitUntilVisible('.cms-pagetree-jstree')
                .wait(3000)
                .then(cms.waitUntilAllAjaxCallsFinish())
                .then(function () {
                    test.assertExists(
                        xPath(createJSTreeXPathFromTree([{
                            name: 'Homepage',
                            children: [{
                                name: 'Second',
                                children: [{
                                    name: 'Second'
                                }]
                            }]
                        }])),
                        'Second page was copied into itself'
                    );
                })
                .then(cms.expandPageTree())
                // try to copy into parent
                .then(function () {
                    this.click('.js-cms-tree-item-copy[data-id="' + secondPageId + '"]');
                })
                // wait until paste buttons show up
                .waitUntilVisible('.cms-tree-item-helpers', function () {
                    // click on "Paste" to homepage
                    this.click('.cms-tree-item-helpers a[data-id="' + cms.getPageId('Homepage') + '"]');
                })
                .waitForResource(/copy-page/)
                .waitForUrl(/page/) // need to wait for reload
                .wait(1000)
                .waitUntilVisible('.cms-pagetree-jstree', cms.expandPageTree())
                .wait(3000)
                .waitUntilVisible('.cms-pagetree-jstree', function () {
                    test.assertExists(
                        xPath(createJSTreeXPathFromTree([{
                            name: 'Homepage',
                            children: [
                                {
                                    name: 'Second',
                                    children: [{
                                        name: 'Second'
                                    }]
                                },
                                {
                                    name: 'Second',
                                    children: [{
                                        name: 'Second'
                                    }]
                                }
                            ]
                        }])),
                        'Second page was copied into the homepage'
                    );
                })
                .thenEvaluate(function () {
                    window.location.reload();
                })
                .wait(1000)
                .waitUntilVisible('.cms-pagetree-jstree', cms.waitUntilAllAjaxCallsFinish())
                .wait(3000)
                .then(function () {
                    test.assertExists(
                        xPath(createJSTreeXPathFromTree([{
                            name: 'Homepage',
                            children: [
                                {
                                    name: 'Second',
                                    children: [{
                                        name: 'Second'
                                    }]
                                },
                                {
                                    name: 'Second',
                                    children: [{
                                        name: 'Second'
                                    }]
                                }
                            ]
                        }])),
                        'Second page was copied into the homepage'
                    );
                })
                // try to copy into root
                .then(function () {
                    this.click('.js-cms-tree-item-copy[data-id="' + secondPageId + '"]');
                })
                // wait until paste buttons show up
                .waitUntilVisible('.cms-tree-item-helpers', function () {
                    // click on "Paste" to root
                    this.click('.cms-tree-item-helpers a[href="#root"]');
                })
                .waitForResource(/copy-page/)
                .waitForUrl(/page/) // need to wait for reload
                .wait(1000)
                .waitUntilVisible('.cms-pagetree-jstree')
                .then(cms.waitUntilAllAjaxCallsFinish())
                .then(cms.expandPageTree())
                .waitUntilVisible('.cms-pagetree-jstree', function () {
                    test.assertExists(
                        xPath(createJSTreeXPathFromTree([
                            {
                                name: 'Homepage',
                                children: [
                                    {
                                        name: 'Second',
                                        children: [{
                                            name: 'Second'
                                        }]
                                    },
                                    {
                                        name: 'Second',
                                        children: [{
                                            name: 'Second'
                                        }]
                                    }
                                ]
                            },
                            {
                                name: 'Second',
                                children: [{
                                    name: 'Second'
                                }]
                            }
                        ])),
                        'Second page was copied into the root'
                    );
                })
                .thenEvaluate(function () {
                    window.location.reload();
                })
                .wait(1000)
                .waitUntilVisible('.cms-pagetree-jstree')
                .then(cms.waitUntilAllAjaxCallsFinish())
                .then(cms.expandPageTree())
                .then(function () {
                    test.assertExists(
                        xPath(createJSTreeXPathFromTree([
                            {
                                name: 'Homepage',
                                children: [
                                    {
                                        name: 'Second',
                                        children: [{
                                            name: 'Second'
                                        }]
                                    },
                                    {
                                        name: 'Second',
                                        children: [{
                                            name: 'Second'
                                        }]
                                    }
                                ]
                            },
                            {
                                name: 'Second',
                                children: [{
                                    name: 'Second'
                                }]
                            }
                        ])),
                        'Second page was copied into the root'
                    );
                })
                // then try to copy sibling into a sibling (homepage into sibling "second" page)
                .then(function () {
                    this.click('.js-cms-tree-item-copy[data-id="' + cms.getPageId('Homepage') + '"]');
                })
                // wait until paste buttons show up
                .waitUntilVisible('.cms-tree-item-helpers', function () {
                    // click on "Paste" to top level "second" page
                    var pages = cms._getPageIds('Second');
                    this.click('.cms-tree-item-helpers a[data-id="' + pages[pages.length - 2] + '"]');
                })
                .waitForResource(/copy-page/)
                .waitForUrl(/page/) // need to wait for reload
                .wait(1000)
                .waitUntilVisible('.cms-pagetree-jstree', cms.expandPageTree())
                .wait(3000)
                .waitUntilVisible('.cms-pagetree-jstree', function () {
                    test.assertExists(
                        xPath(createJSTreeXPathFromTree([
                            {
                                name: 'Homepage',
                                children: [
                                    {
                                        name: 'Second',
                                        children: [{
                                            name: 'Second'
                                        }]
                                    },
                                    {
                                        name: 'Second',
                                        children: [{
                                            name: 'Second'
                                        }]
                                    }
                                ]
                            },
                            {
                                name: 'Second',
                                children: [
                                    { name: 'Second' },
                                    {
                                        name: 'Homepage',
                                        children: [
                                            {
                                                name: 'Second',
                                                children: [{
                                                    name: 'Second'
                                                }]
                                            },
                                            {
                                                name: 'Second',
                                                children: [{
                                                    name: 'Second'
                                                }]
                                            }
                                        ]
                                    }
                                ]
                            }
                        ])),
                        'Homepage was copied into last "Second" page'
                    );
                })
                .thenEvaluate(function () {
                    window.location.reload();
                })
                .wait(1000)
                .waitUntilVisible('.cms-pagetree-jstree')
                .wait(3000)
                .then(function () {
                    test.assertExists(
                        xPath(createJSTreeXPathFromTree([
                            {
                                name: 'Homepage',
                                children: [
                                    {
                                        name: 'Second',
                                        children: [{
                                            name: 'Second'
                                        }]
                                    },
                                    {
                                        name: 'Second',
                                        children: [{
                                            name: 'Second'
                                        }]
                                    }
                                ]
                            },
                            {
                                name: 'Second',
                                children: [
                                    { name: 'Second' },
                                    {
                                        name: 'Homepage',
                                        children: [
                                            {
                                                name: 'Second',
                                                children: [{
                                                    name: 'Second'
                                                }]
                                            },
                                            {
                                                name: 'Second',
                                                children: [{
                                                    name: 'Second'
                                                }]
                                            }
                                        ]
                                    }
                                ]
                            }
                        ])),
                        'Homepage was copied into last "Second" page'
                    );
                })

                // then try to copy a page into own child
                .then(function () {
                    this.click('.js-cms-tree-item-copy[data-id="' + cms.getPageId('Homepage') + '"]');
                })
                // wait until paste buttons show up
                .waitUntilVisible('.cms-tree-item-helpers', function () {
                    // click on "Paste" to the Direct child of Homepage
                    this.click('.cms-tree-item-helpers a[data-id="' + secondPageId + '"]');
                })
                .waitUntilVisible('.error', function () {
                    test.assertSelectorHasText(
                        '.error',
                        'Error: Moving parent inside child',
                        'Error should show up if you try to paste a page into it\'s child'
                    );
                });
        })
        // remove two top level pages
        .then(cms.removePage())
        .then(cms.removePage())
        .run(function () {
            test.done();
        });
});
