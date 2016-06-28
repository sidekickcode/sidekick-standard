"use strict";

const sidekickAnalyser = require("@sidekick/analyser-common");
const fs = require('fs');
const path = require('path');

const _ = require('lodash');
const Promise = require('bluebird');
const linter = require('standard');
const stripJsonComments = require("strip-json-comments");

const doLinting = Promise.promisify(linter.lintText);

const annotationDefaults = {analyserName: 'sidekick-standard'};
const LOG_FILE = path.join(__dirname, '/debug.log');

//log to file as any stdout will be reported to the analyser runner
function logger(message) {
  fs.appendFile(LOG_FILE, message + '\n');
}

if(require.main === module) {
  execute();
}
module.exports = exports = execute;

function execute() {
  sidekickAnalyser(function(setup) {
    var config;

    var conf = setup.configFiles || {};
    if(conf) {
      try {
        config = JSON.parse(stripJsonComments(conf));
      } catch(e) {
        // FIXME need some way of signalling
        console.error("can't parse config");
        console.error(e);
      }
    }

    if(!config) {
      config = {};
    }

    var results = run(setup.content);
    console.log(JSON.stringify({ meta: results }));
  });
}

module.exports._testRun = run;
function run(content) {
  try {

    var errors = doLinting(content);
    return errors.results.map(format);

  } catch (err) {
    console.error("failed to analyse");
    console.log({ error: err });
    process.exit(1);
  }
}

function format(error) {
  //iterate over error.messages (multiple issues per file)
  return _.map(error.messages, function(error) {
    return {
      analyser: annotationDefaults.analyserName,
      location: {
        startLine: error.message.line,
        endLine: error.message.line,
        startCharacter: error.message.col,
        endCharacter: error.message.col,
      },
      message: error.message,
      kind: error.ruleId,
    };
  });
}
