const { resolve } = require('node:path')
const { getDefaultConfig } = require('expo/metro-config')
const config = getDefaultConfig(__dirname)

config.watchFolders = [...config.watchFolders, resolve(__dirname, '../../fixtures')]
module.exports = config
