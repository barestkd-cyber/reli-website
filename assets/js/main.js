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
  SUPABASE_URL:      'https://whduvsgyrbhmknurgkpo.supabase.co',   // <-- REPLACE at cutover
  SUPABASE_ANON_KEY: 'sb_publishable_oFZmZx8-EyJ68d2VtESrMg_EauSabUQ',                 // <-- REPLACE at cutover
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

  /* ---- Services submenu toggle (drawer accordion / dropdown) ---- */
  var subToggles = document.querySelectorAll('.sub-toggle');
  for (var i = 0; i < subToggles.length; i++) {
    subToggles[i].addEventListener('click', function (e) {
      e.preventDefault();
      e.stopPropagation();
      var li = this.closest('.has-sub');
      var open = li.classList.toggle('open');
      this.setAttribute('aria-expanded', open ? 'true' : 'false');
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

    /* Honeypot: humans never see this field; bots fill it. Pretend success
       so the bot moves on, write nothing. */
    if (form.website_url && form.website_url.value !== '') {
      setStatus('Thank you for contacting RELI Commercial Cleaning. We will get back to you as soon as possible.', 'success');
      form.reset();
      return;
    }

    /* Validation (the form uses novalidate, so this is the only gate). */
    if (form.business.value.trim() === '' || form.first_name.value.trim() === '') {
      setStatus('Please fill in your business name and contact name.', 'error');
      return;
    }
    var emailVal = form.email.value.trim();
    var phoneVal = form.phone.value.trim();
    if (emailVal === '' && phoneVal === '') {
      setStatus('Please give us an email or a phone number so we can reach you.', 'error');
      return;
    }
    if (emailVal !== '' && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(emailVal)) {
      setStatus('That email address does not look right. Please check it.', 'error');
      return;
    }

    var btn = form.querySelector('[type="submit"]');
    var payload = {
      business:   form.business.value.trim(),
      contact:    (form.first_name.value.trim() + ' ' + form.last_name.value.trim()).trim(),
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
