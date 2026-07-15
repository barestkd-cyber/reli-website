/* RELI Commercial Cleaning — rebuild JS
 * ----------------------------------------------------------------------------
 * CONFIG: fill these in at DNS cutover. The contact form inserts a lead row
 * directly into a Supabase `leads` table via the REST API using the ANON key.
 *
 * Email notifications are intentionally NOT wired here. At cutover, a Supabase
 * Edge Function (under a separate Resend account) will send the notification.
 * The intended order is: (1) the lead row is inserted first (this file), then
 * (2) the Edge Function sends the email. That ordering guarantees a mail
 * failure can never lose a lead — the row already exists before any email is
 * attempted.
 * ------------------------------------------------------------------------- */
var CONFIG = {
  SUPABASE_URL:      'https://YOUR-PROJECT-REF.supabase.co',   // <-- REPLACE at cutover
  SUPABASE_ANON_KEY: 'YOUR-SUPABASE-ANON-KEY',                 // <-- REPLACE at cutover
  LEADS_TABLE:       'leads'
};

(function () {
  /* ---- Mobile nav toggle ---- */
  var toggle = document.querySelector('.nav__toggle');
  var links = document.querySelector('.nav__links');
  if (toggle && links) {
    toggle.addEventListener('click', function () {
      var open = links.classList.toggle('open');
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
    links.addEventListener('click', function (e) {
      if (e.target.tagName === 'A') {
        links.classList.remove('open');
        toggle.setAttribute('aria-expanded', 'false');
      }
    });
  }

  /* ---- Contact form -> Supabase leads insert ---- */
  var form = document.getElementById('lead-form');
  if (!form) return;
  var statusEl = document.getElementById('form-status');

  function setStatus(msg, type) {
    if (!statusEl) return;
    statusEl.textContent = msg;
    statusEl.className = 'form-status form-status--' + type;
  }

  form.addEventListener('submit', function (e) {
    e.preventDefault();

    if (CONFIG.SUPABASE_URL.indexOf('YOUR-PROJECT-REF') !== -1) {
      setStatus('Form is not yet connected. Add your Supabase credentials in assets/js/main.js.', 'error');
      return;
    }

    var btn = form.querySelector('[type="submit"]');
    var payload = {
      first_name: form.first_name.value.trim(),
      last_name:  form.last_name.value.trim(),
      email:      form.email.value.trim(),
      phone:      form.phone.value.trim(),
      message:    form.message.value.trim()
    };

    if (btn) { btn.disabled = true; }
    setStatus('Sending…', 'pending');

    fetch(CONFIG.SUPABASE_URL + '/rest/v1/' + CONFIG.LEADS_TABLE, {
      method: 'POST',
      headers: {
        'apikey': CONFIG.SUPABASE_ANON_KEY,
        'Authorization': 'Bearer ' + CONFIG.SUPABASE_ANON_KEY,
        'Content-Type': 'application/json',
        'Prefer': 'return=minimal'
      },
      body: JSON.stringify(payload)
    })
      .then(function (res) {
        if (!res.ok) { throw new Error('Insert failed (' + res.status + ')'); }
        form.reset();
        setStatus('Thank you for contacting RELI Commercial Cleaning. We will get back to you as soon as possible.', 'success');
      })
      .catch(function () {
        setStatus('Oops, there was an error sending your message. Please try again, or call us at (903) 350-0345.', 'error');
      })
      .finally(function () {
        if (btn) { btn.disabled = false; }
      });
  });
})();
