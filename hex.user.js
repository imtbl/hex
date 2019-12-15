// ==UserScript==
// @name hex
// @match *://exhentai.org/*
// ==/UserScript==

const hexBaseUrl = 'http://localhost:8000'
const hexAccessKey = ''

const elementFromHtml = html => {
  const template = document.createElement('template')
  html = html.trim()
  template.innerHTML = html

  return template.content.firstChild
}

const sendToHex = () => {
  return fetch(`${hexBaseUrl}/import`, {
    method: 'post',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      accessKey: hexAccessKey,
      cookies: document.cookie,
      url: window.location.href
    })
  })
}

const start = () => {
  const actions = document.getElementById('gd5')

  if (actions) {
    const archiveDownloadButton = actions.querySelector('.g2.gsp')

    if (archiveDownloadButton) {
      const hexDownloadButton = elementFromHtml(
        `<p class="g2">
          <img src="https://exhentai.org/img/mr.gif">
          <a id="send-to-hex" href="#">hex Download</a>
        </p>`
      )

      archiveDownloadButton.insertAdjacentElement(
        'afterend', hexDownloadButton
      )

      const hexDownloadButtonA = document.getElementById('send-to-hex')

      hexDownloadButtonA.addEventListener(
        'click', event => {
          event.preventDefault()

          sendToHex()
            .then(response => Promise.all([response.ok, response.json()]))
            .then(([responseOk, body]) => {
              if (!responseOk) {
                throw new Error(body.error)
              }

              hexDownloadButtonA.textContent = 'hex Download (started)'
            })
            .catch(err => {
              console.error('Error trying to send this gallery to hex:\n', err)

              hexDownloadButtonA.textContent = 'hex Download (Error)'
            })
        }
      )
    }
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
