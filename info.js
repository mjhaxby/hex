const { app } = require('electron')

const debugMode = !app.isPackaged || app.getVersion().includes('alpha');

module.exports = {
    debugMode
}