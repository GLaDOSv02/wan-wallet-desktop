/**
 * This is main process of Electron, started as first thing when your 
 * application starts. It runs through entire life of your application.
 * Although this does not have any windows associated, you can open windows from here
 */

import { app, BrowserWindow } from 'electron'
import installExtension, { REACT_DEVELOPER_TOOLS, REDUX_DEVTOOLS } from 'electron-devtools-installer'
import setting from '~/src/utils/Settings'
import menuFactoryService from '~/src/services/menuFactory'
import i18n, { i18nOptions } from'~/config/i18n'
import Logger from '~/src/utils/Logger'
import windowStateKeeper from 'electron-window-state'
import { walletBackend } from '~/src/modules'

const logger = Logger.getLogger('main')

console.log(app.getPath('exe'))
console.log(app.getVersion())
const isDevelopment = app.getPath('exe').indexOf('electron') !== -1;

console.log(isDevelopment)

logger.warn(setting.isDev)

let mainWindow

async function createWindow () {
  logger.info('creating main window')

  let mainWindowState = windowStateKeeper({
    defaultWidth: 1024 + 208,
    defaultHeight: 720
  });

  mainWindow = new BrowserWindow({
    x: mainWindowState.x,
    y: mainWindowState.y,
    width: mainWindowState.width,
    height: mainWindowState.height,
    show: false,
    webPreferences: {
      nodeIntegration: true, // dev settings to be able to use "require" in main.js, could be set to false in production build
      nativeWindowOpen: false, // needs to be set to "false" otherwise popup will not to able to communicate with index.js (PopupManager)
      // webSecurity: false,
    }
  })

  mainWindowState.manage(mainWindow)

  mainWindow.loadURL(`file://${__dirname}/app/index.html`)
  // mainWindow.loadURL(`file://${__dirname}/../index.html`)

  // Open the DevTools.
  if (process.env.NODE_ENV = 'development') {
    installExtensions()
  }

  const cb = (err) => { 
    if (err) 
      logger.error(err.stack)
  }

  if (!i18n.isIintialized) {
    i18n.init(i18nOptions, cb)
  }

  i18n.on('loaded', (loaded) => {
    i18n.changeLanguage('en')
    i18n.off('loaded')
  })

  i18n.on('languageChanged', (lng) => {
    menuFactoryService.buildMenu(i18n)
  })

  mainWindow.once('ready-to-show', () => {
    mainWindow.show()
    logger.info('finish loading main window')
  })

  mainWindow.on('closed', function () {
    mainWindow = null
  })
}

function installExtensions() {
  mainWindow.webContents.openDevTools()

  // Install extensions
  installExtension(REACT_DEVELOPER_TOOLS)
    .then(name => console.log(`Added Extension:  ${name}`))
    .catch(err => console.log('An error occurred: ', err));

  installExtension(REDUX_DEVTOOLS)
    .then(name => console.log(`Added Extension:  ${name}`))
    .catch(err => console.log('An error occurred: ', err));
}

// prevent crashed and close gracefully
process.on('uncaughtException', (err) => {
  logger.error(`UNCAUGHT EXCEPTION ${err.stack}`)
  app.quit()
})

async function onReady() {
  // windowsManager.init()
  await walletBackend.init()
  // await clientBinaryManager.init()
  await createWindow()
}

// This method will be called when Electron has done everything 
// initialization and ready for creating browser windows
app.on('ready', onReady)

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', function () {
  if (mainWindow === null) {
    createWindow()
  }
})
