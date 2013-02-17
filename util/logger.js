/*
* Write logs with timestamp to file or console
*
* Stefan Wehner (2012)
*/

var util = require('util');
var Settings = require('../settings').getSettings;

var last_timestamp = undefined;
var beyond_timstamp = 0;
var collection = undefined;

exports.TestInterface = {
    overrideLogToStderr: function(toStderr) {logToStderr = toStderr},
    toMessageObject: toMessageObject,
    getId: getId
}


function getId(level) {
    var t = new Date();

    if (t == last_timestamp) {
        // gives some extra precision if time has not changed
        beyond_timestamp++;
    } else {
        last_timestamp = t;
        beyond_timestamp = 0;
    }
    return {'t': t, 'b': beyond_timestamp, 'level': level};
}

function toMessageObject(level, msg, obj) {
    // timestamp is id
    var out = {'_id': getId(level)};
    out.message = msg;
    if (obj) {
        for (o in obj) {
            if (obj.hasOwnProperty(o)) {
                if (typeof obj[o] == 'object' && obj[o] != null) {
                    out[o] = obj[o].toString();
                } else {
                    out[o] = obj[o]
                }
            }
        }
    }
    return out;
}

var Level = ['TRACE', 'DEBUG', 'INFO', 'WARNING', 'ERROR'];

logToStderr = function(level, msg, obj) {
    if (obj) {
        console.warn("%s %s %s %s", new Date(), Level[level], msg, util.inspect(obj, false, Settings().LOGGER_OBJECT_DEPTH, true));
    } else {
        console.warn("%s %s %s", new Date(), Level[level], msg);
    }
}

var LogBuffer = [];

// log to file (if defined)
// log to stderr (if level > configured level)
function write(level, msg, obj) {
    if (Settings().LOGGER_FILE) {
        // TODO implement file logger
        throw "Logging to file currently not supported";
    }
    var user_level = Settings().LOGGER_CONSOLE_LEVEL == undefined ? 3 : Settings().LOGGER_CONSOLE_LEVEL;
    if (level >= user_level) {
        logToStderr(level, msg, obj);
    }
}

// log levels take a string or an object
exports.trace = function(msg, obj) {
    write(0, msg, obj);
}

exports.debug = function(msg, obj) {
    write(1, msg, obj);
}

exports.info = function(msg, obj) {
    write(2, msg, obj);
}

exports.warning = function(msg, obj) {
    write(3, msg, obj);
}

exports.error = function(msg, obj) {
    write(4, msg, obj);
}

