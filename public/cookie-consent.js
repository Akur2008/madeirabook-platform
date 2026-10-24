/* Cookie consent banner for the static landing pages in public/.
   Shares the 'mb_cookie_consent' key with the Next.js app banner
   (src/components/CookieConsent.tsx) so the choice persists site-wide. */
(function () {
  var KEY = 'mb_cookie_consent'
  try {
    if (localStorage.getItem(KEY)) return
  } catch (e) {
    /* storage unavailable — still show the banner once */
  }

  var wrap = document.createElement('div')
  wrap.setAttribute('role', 'dialog')
  wrap.setAttribute('aria-live', 'polite')
  wrap.setAttribute('aria-label', 'Cookie consent')
  wrap.style.cssText =
    'position:fixed;left:12px;right:12px;bottom:12px;z-index:99999;' +
    'max-width:36rem;margin:0 auto;padding:16px 20px;border-radius:14px;' +
    'background:rgba(10,20,32,.96);color:#fff;border:1px solid rgba(255,255,255,.15);' +
    'box-shadow:0 12px 40px rgba(0,0,0,.45);backdrop-filter:blur(8px);' +
    'font-family:system-ui,-apple-system,sans-serif;font-size:14px;line-height:1.5;'

  var text = document.createElement('p')
  text.style.cssText = 'margin:0 0 12px;color:rgba(255,255,255,.85)'
  text.innerHTML =
    'We use cookies for analytics and to remember your preferences. Details in our ' +
    '<a href="/legal/cookies" style="color:#fff;text-decoration:underline">Cookie Policy</a> and ' +
    '<a href="/legal/privacy" style="color:#fff;text-decoration:underline">Privacy Policy</a>.'
  wrap.appendChild(text)

  var row = document.createElement('div')
  row.style.cssText = 'display:flex;gap:8px'

  function btn(label, primary) {
    var b = document.createElement('button')
    b.type = 'button'
    b.textContent = label
    b.style.cssText =
      'flex:1;padding:10px 16px;border-radius:8px;font-size:14px;font-weight:600;cursor:pointer;' +
      (primary
        ? 'background:#10b981;color:#0a1420;border:none'
        : 'background:transparent;color:#fff;border:1px solid rgba(255,255,255,.25)')
    return b
  }

  function decide(value) {
    try {
      localStorage.setItem(KEY, value)
    } catch (e) {}
    wrap.remove()
  }

  var accept = btn('Accept', true)
  accept.addEventListener('click', function () {
    decide('accepted')
  })
  var decline = btn('Decline', false)
  decline.addEventListener('click', function () {
    decide('declined')
  })

  row.appendChild(accept)
  row.appendChild(decline)
  wrap.appendChild(row)
  document.body.appendChild(wrap)
})()
