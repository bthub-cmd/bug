const fs = require('fs')
const path = require('path')

const configFile = './config.json'

let config = {
  OWNER: null,
  CLAIM_CODE: null,
  CODE_USED: false,
  BOT_NAME: 'WHATSAPP BOT',
  BOT_DESC: 'Bot multifungsi untuk kebutuhan sehari-hari',
  LAST_DISCONNECT: null,
  BROADCASTED_VERSIONS: []
}

function loadConfig() {
  if (fs.existsSync(configFile)) {
    const data = JSON.parse(fs.readFileSync(configFile))
    config = { ...config, ...data }
  }
}

function saveConfig() {
  fs.writeFileSync(configFile, JSON.stringify(config, null, 2))
}

function setOwner(userId) {
  config.OWNER = userId
  config.CODE_USED = true
  saveConfig()
}

function resetClaimCode() {
  const crypto = require('crypto')
  config.CLAIM_CODE = crypto.randomBytes(8).toString('hex').toUpperCase()
  config.CODE_USED = false
  config.OWNER = null
  saveConfig()
}

function setBotName(name) {
  config.BOT_NAME = name
  saveConfig()
}

function setBotDesc(desc) {
  config.BOT_DESC = desc
  saveConfig()
}

function saveLastDisconnect() {
  config.LAST_DISCONNECT = Date.now()
  saveConfig()
}

function addBroadcastedVersion(version) {
  if (!config.BROADCASTED_VERSIONS.includes(version)) {
    config.BROADCASTED_VERSIONS.push(version)
    saveConfig()
  }
}

function isVersionBroadcasted(version) {
  return config.BROADCASTED_VERSIONS.includes(version)
}

module.exports = {
  loadConfig,
  saveConfig,
  getConfig: () => config,
  setOwner,
  resetClaimCode,
  setBotName,
  setBotDesc,
  saveLastDisconnect,
  addBroadcastedVersion,
  isVersionBroadcasted
}
