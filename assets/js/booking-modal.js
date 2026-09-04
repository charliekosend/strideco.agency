/*
  Shared booking-modal behavior for static (non-homepage) pages.
  The homepage's dialog is driven by its own bundler component state and
  isn't touched by this file — this exists so any other static page (like
  the Retention System landing page) can open/close the same MailerLite
  form (data-form="A0w2VT") without re-implementing the wiring each time.

  Usage on a page:
    <div id="booking-dialog" data-hide-interest-field="true" hidden> ... </div>
    <button data-open-book-a-call>Book a call</button>
  Any element with [data-open-book-a-call] opens #booking-dialog. Any
  element with [data-close-book-a-call], plus the overlay backdrop itself
  and the Escape key, closes it.

  data-hide-interest-field="true" on #booking-dialog means: once MailerLite
  renders its "Interest" dropdown into this form, hide it from the visitor
  and pre-set its value instead of asking them to choose (used on pages
  where the visitor already self-selected by clicking through to a specific
  offer). Confirmed live against the real form: field name is
  fields[interest], with options "Participant Acquisition", "Retention",
  "Brand Infrastructure" (no "not sure yet" option exists on the field yet).
*/
(function () {
  // TODO: fill in once the "Interest" field is added to the MailerLite
  // form and its real generated field name + option values are known.
  var INTEREST_FIELD_SELECT_NAME = 'fields[interest]';
  var INTEREST_FIELD_PRESET_VALUE = 'Retention';

  var dialog = document.getElementById('booking-dialog');
  if (!dialog) return;

  function openDialog() {
    dialog.hidden = false;
    document.body.style.overflow = 'hidden';
  }
  function closeDialog() {
    dialog.hidden = true;
    document.body.style.overflow = '';
  }

  document.addEventListener('click', function (e) {
    if (e.target.closest('[data-open-book-a-call]')) {
      e.preventDefault();
      openDialog();
      return;
    }
    if (e.target.closest('[data-close-book-a-call]')) {
      closeDialog();
      return;
    }
    if (e.target === dialog) {
      closeDialog();
    }
  });

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && !dialog.hidden) closeDialog();
  });

  // MailerLite renders its form asynchronously into #booking-form — poll
  // briefly to force our styling once it appears (same pattern the
  // homepage uses), and to hide/preset the Interest field if configured.
  var tries = 0;
  var btnDone = false;
  var interestDone = false;
  var iv = setInterval(function () {
    tries++;
    var wrap = document.querySelector('#booking-form .ml-form-embedWrapper');
    if (wrap) wrap.style.setProperty('background', 'transparent', 'important');

    if (!btnDone) {
      var btn = document.querySelector('#booking-form button.primary');
      if (btn) {
        btn.style.setProperty('background', '#22c997', 'important');
        btn.style.setProperty('color', '#080808', 'important');
        btn.style.setProperty('border', 'none', 'important');
        btn.style.setProperty('border-radius', '4px', 'important');
        btn.style.setProperty('width', '100%', 'important');
        btn.style.setProperty('font-weight', '700', 'important');
        btn.style.setProperty('padding', '14px', 'important');
        btn.style.setProperty('cursor', 'pointer', 'important');
        btnDone = true;
      }
    }

    if (!interestDone && dialog.dataset.hideInterestField === 'true' && INTEREST_FIELD_SELECT_NAME) {
      var select = document.querySelector('#booking-form select[name="' + INTEREST_FIELD_SELECT_NAME + '"]');
      if (select) {
        var row = select.closest('.ml-form-fieldRow') || select;
        row.style.setProperty('display', 'none', 'important');
        var match = Array.prototype.find.call(select.options, function (o) {
          return o.textContent.trim() === INTEREST_FIELD_PRESET_VALUE;
        });
        if (match) select.value = match.value;
        interestDone = true;
      }
    }

    var successBody = document.querySelector('#booking-form .ml-form-successBody');
    if (successBody && !successBody.dataset.styled) {
      successBody.dataset.styled = '1';
      successBody.style.setProperty('background', 'transparent', 'important');
      successBody.style.setProperty('border', 'none', 'important');
      successBody.style.setProperty('padding', '0', 'important');
    }

    if (btnDone && tries > 5 && (interestDone || !INTEREST_FIELD_SELECT_NAME)) clearInterval(iv);
    if (tries > 150) clearInterval(iv);
  }, 200);
})();
