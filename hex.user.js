// ==UserScript==
// @name hex
// @version 1.5.1
// @author Michael Serajnik
// @description Userscript for hex, a hydrus API plugin to download ExH archives
// @website https://github.com/mserajnik/hex
// @updateURL https://github.com/mserajnik/hex/raw/master/hex.user.js
// @downloadURL https://github.com/mserajnik/hex/raw/master/hex.user.js
// @supportURL https://github.com/mserajnik/hex/issues/new
// @match *://exhentai.org/*
// @grant GM_setValue
// @grant GM_getValue
// @grant GM_registerMenuCommand
// ==/UserScript==

let hexBaseUrl = GM_getValue('hexBaseUrl', '')
let hexAccessKey = GM_getValue('hexAccessKey', '')

const fetchOrPrompt = (value, prompt, key, defaultValue = '') => {
  if (!value) {
    value = window.prompt(`${prompt} not set, please enter it:`, defaultValue)

    GM_setValue(key, value)
  }

  return value
}

const promptAndChangeStoredValue = (value, prompt, key) => {
  value = window.prompt(`Change ${prompt}:`, value)

  GM_setValue(key, value)
}

const changeBaseUrl = () => {
  promptAndChangeStoredValue(hexBaseUrl, 'hex base URL', 'hexBaseUrl')
}

const changeAccessKey = () => {
  promptAndChangeStoredValue(hexAccessKey, 'hex access key', 'hexAccessKey')
}

GM_registerMenuCommand('Change hex base URL', changeBaseUrl)
GM_registerMenuCommand('Change hex access key', changeAccessKey)

hexBaseUrl = fetchOrPrompt(
  hexBaseUrl, 'hex base URL', 'hexBaseUrl', 'http://localhost:8000'
)
hexAccessKey = fetchOrPrompt(hexAccessKey, 'hex access key', 'hexAccessKey')

const elementFromHtml = html => {
  const template = document.createElement('template')
  html = html.trim()
  template.innerHTML = html

  return template.content.firstChild
}

const getHexInfo = () => {
  return fetch(`${hexBaseUrl}`)
}

const getHexSettings = () => {
  return fetch(`${hexBaseUrl}/settings`, {
    headers: {
      Authorization: `Bearer ${hexAccessKey}`
    }
  })
}

const sendToHex = data => {
  return fetch(`${hexBaseUrl}/import`, {
    method: 'post',
    headers: {
      Authorization: `Bearer ${hexAccessKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(Object.fromEntries(data))
  })
}

const getDelimitedString = arr => {
  return arr.length
    ? arr.join('###')
    : ''
}

const getDelimitedNamespaceReplacements = namespaceReplacements => {
  const delimitedNamespaceReplacements = []

  Object.entries(namespaceReplacements).forEach(([key, value]) => {
    delimitedNamespaceReplacements.push(`${key}|||${value}`)
  })

  return delimitedNamespaceReplacements.join('###')
}

const start = async () => {
  const actions = document.getElementById('gd5')

  if (actions) {
    let info, settings

    try {
      let infoResponse = await getHexInfo()
      infoResponse = await infoResponse.json()
      info = infoResponse.hex
    } catch (err) {
      console.error(err)

      return
    }

    if (info.apiVersion !== 2) {
      alert(
        'This userscript supports API version 2, while your hex ' +
        `installation is using version ${info.apiVersion}. Please adjust ` +
        'your installation or change the userscript manually.'
      )

      return
    }

    try {
      let settingsResponse = await getHexSettings()
      settingsResponse = await settingsResponse.json()
      settings = settingsResponse.settings
    } catch (err) {
      console.error(err)

      return
    }

    const hexBar = elementFromHtml(
      `<div class="hex-bar">
        <style>
          .hex-bar {
            align-items: center;
            background-color: #4f535b;
            border-bottom: 1px solid #000;
            box-sizing: border-box;
            display: flex;
            height: 50px;
            left: 0;
            padding: 0 20px;
            position: fixed;
            top: 0;
            width: 100%;
            z-index: 1000;
          }

          .hex-bar__title {
            font-size: 1rem;
            font-weight: 700;
            margin-right: auto;
          }

          .hex-bar__form,
          .hex-bar__form__settings {
            align-items: center;
            display: flex;
          }

          .hex-bar__form {
            margin-left: 20px;
          }

          .hex-bar__form__settings label {
            margin-left: 10px;
          }

          .hex-bar__form__settings label:first-child {
            margin-left: 0;
          }

          .hex-bar__form__settings input[type="checkbox"] {
            top: 0;
          }

          .hex-bar__form__settings input[type="text"] {
            width: 200px;
          }

          .hex-bar__form__download {
            margin-left: 20px;
          }

          .hex-bar__form__download button {
            -moz-appearance: none;
            -webkit-appearance: none;
            background: #5fa9cf;
            border: 1px solid #5fa9cf;
            border-radius: 5px;
            color: #f1f1f1;
            cursor: pointer;
            outline: 0;
            padding: 8px;
          }

          .hex-bar__form__download button:hover {
            background-color: #32789c;
            border-color: #32789c;
          }
        </style>
        <div class="hex-bar__title">hex</div>
        <form id="hex-form" class="hex-bar__form" action="#">
          <div class="hex-bar__form__settings">
            <label>Skip import <input type="checkbox" name="skipImport"${settings.skipImport ? ' checked' : ''}></label>
            <label>Skip known files <input type="checkbox" name="skipKnownFiles"${settings.skipKnownFiles ? ' checked' : ''}></label>
            <label>Delete archives after import <input type="checkbox" name="deleteArchivesAfterImport"${settings.deleteArchivesAfterImport ? ' checked' : ''}></label>
            <label>Add unique identifier tag <input type="checkbox" name="addUniqueIdentifierTag"${settings.addUniqueIdentifierTag ? ' checked' : ''}></label>
            <label>Skip tags <input type="checkbox" name="skipTags"${settings.skipTags ? ' checked' : ''}></label>
            <label>
              Blacklisted namespaces<br>
              <input type="text" name="blacklistedNamespaces" placeholder="Blacklisted namespaces" value="${getDelimitedString(settings.blacklistedNamespaces)}">
            </label>
            <label>
              Namespace replacements<br>
              <input type="text" name="namespaceReplacements" placeholder="Namespace replacements" value="${getDelimitedNamespaceReplacements(settings.namespaceReplacements)}">
            </label>
            <label>
              Additional tags<br>
              <input type="text" name="additionalTags" placeholder="Additional tags" value="${getDelimitedString(settings.additionalTags)}">
            </label>
          </div>
          <div class="hex-bar__form__download">
            <button id="hex-download-button" type="submit">Download</button>
          </div>
        </form>
      </div>`
    )

    document.getElementById('nb').style.cssText = 'margin-top: 60px;'

    document.body.insertAdjacentElement(
      'afterbegin', hexBar
    )

    const hexForm = document.getElementById('hex-form')
    const hexSubmitButton = document.getElementById('hex-download-button')

    hexForm.addEventListener('submit', event => {
      event.preventDefault()

      const data = new FormData(hexForm)

      data.set('skipImport', data.has('skipImport'))
      data.set('skipKnownFiles', data.has('skipKnownFiles'))
      data.set(
        'deleteArchivesAfterImport',
        data.has('deleteArchivesAfterImport')
      )
      data.set('addUniqueIdentifierTag', data.has('addUniqueIdentifierTag'))
      data.set('skipTags', data.has('skipTags'))

      data.set('cookies', document.cookie)
      data.set('url', window.location.href)

      sendToHex(data)
        .then(response => Promise.all([response.ok, response.json()]))
        .then(([responseOk, body]) => {
          if (!responseOk) {
            throw new Error(body.error)
          }

          hexSubmitButton.textContent = 'Started'
          hexSubmitButton.style.cssText =
            'background: #6a936d; border-color: #617c63;'
        })
        .catch(err => {
          console.error('Error trying to send this gallery to hex:\n', err)

          hexSubmitButton.textContent = 'Error'
          hexSubmitButton.style.cssText =
            'background: #9e2720; border-color: #9e2720;'
        })
    })
  }
}

(() => {
  if (
    document.readyState === 'complete' ||
    document.readyState === 'loaded' ||
    document.readyState === 'interactive'
  ) {
    start()

    return
  }

  window.addEventListener('DOMContentLoaded', () => {
    start()
  })
})()
