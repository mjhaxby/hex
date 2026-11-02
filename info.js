const { app } = require('electron')
const fs = require('fs')


const debugMode = !app.isPackaged || app.getVersion().includes('alpha');

const config = {}

const configFilePath = app.getPath('userData') + '/hex_config.json'

const defaultConfig = { userActivitiesDir: app.getPath('documents') + '/Hex/', showAdvancedExport: false, showScormInfo: true }

async function getConfigFromDisk() {
  try {
        const raw = await fs.promises.readFile(configFilePath, 'utf-8');
        const parsed = JSON.parse(raw); // throws on bad JSON, which rejects

        if (debugMode) { console.log('Config loaded from disk:'); } 
        if (debugMode) { console.log(parsed); } // current config

        return { ...defaultConfig, ...parsed } // fills in any missing keys
            ;
    } catch (err) {
        if (debugMode) console.log('Config not loaded, using defaults:', err.message);
        if (err.code === 'ENOENT') { // first run: create the file
            fs.promises.writeFile(configFilePath, JSON.stringify(defaultConfig)).catch(() => { });
        }

        if (debugMode) { console.log('No config file found. Using defaults and making new file.'); } // default config
        if (debugMode) { console.log(defaultConfig); } // default config
        return { ...defaultConfig } // always resolve, so startup never hangs
            ;
    }
}


function setConfig(obj) {
    if (obj === null || typeof obj !== 'object' || Array.isArray(obj)) {
        throw new TypeError('Configuration updates must be an object.')
    }

    for (const [key, value] of Object.entries(obj)) {
        config[key] = value;
    }
}

const saveConfigFile = () => {
  fs.writeFile(configFilePath, JSON.stringify(config), { encoding: 'utf8' }, (err) => {
    if (err) {
      if(debugMode){console.log(err)};
    } else {
      if(debugMode){console.log("Config file updated successfully.")}
      if(debugMode){console.log(config)}
    }
  })
}

module.exports = {
    debugMode,
    config,
    defaultConfig,
    setConfig,
    saveConfigFile,  
    getConfigFromDisk  
}