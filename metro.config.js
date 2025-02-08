const Module = require('module');
const originalLoad = Module._load;

Module._load = function (request, parent, isMain) {
  if (request === 'os') {
    const os = originalLoad.apply(this, arguments);
    if (typeof os.availableParallelism !== 'function') {
      os.availableParallelism = () => os.cpus().length;
    }
    return os;
  }
  return originalLoad.apply(this, arguments);
};

const { getDefaultConfig } = require('@expo/metro-config');
const defaultConfig = getDefaultConfig(__dirname);

defaultConfig.maxWorkers = 2;

module.exports = defaultConfig;
