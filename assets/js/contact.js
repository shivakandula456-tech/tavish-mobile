/*!
 * TAVISH & CO. — contact form (composes a WhatsApp hand-off; no server)
 */
(function (window, document) {
  'use strict';

  var store = window.TavishStore;
  var T = window.Tavish;
  var H = store.helpers;

  var form = T.qs('[data-contact-form]');
  if (!form) return;

  var wrapForm = T.qs('[data-contact-form-wrap]');
  var wrapSuccess = T.qs('[data-contact-success]');
  var errorBox = T.qs('[data-contact-error]');
  var thanks = T.qs('[data-contact-thanks]');
  var waBtn = T.qs('[data-contact-wa]');
  var resetBtn = T.qs('[data-contact-reset]');

  function fieldOf(input) { return input ? (input.closest('.field') || input.closest('label')) : null; }

  function mark(input, ok) {
    if (!input) return false;
    var f = fieldOf(input);
    if (f) {
      if (ok) f.classList.remove('is-invalid');
      else f.classList.add('is-invalid');
    }
    return ok;
  }

  function showError(msg) {
    if (!errorBox) return;
    if (msg) { errorBox.textContent = msg; errorBox.hidden = false; }
    else { errorBox.textContent = ''; errorBox.hidden = true; }
  }

  function val(name) {
    var el = form.querySelector('[name="' + name + '"]');
    return el ? String(el.value || '').trim() : '';
  }

  function validate() {
    var issues = [];
    var firstBad = null;
    var data = {
      name: val('name'),
      email: val('email'),
      mobile: val('mobile'),
      subject: val('subject'),
      message: val('message')
    };

    var nameEl = form.querySelector('[name="name"]');
    if (!mark(nameEl, data.name.length >= 2)) { issues.push('name'); firstBad = firstBad || nameEl; }

    var emailEl = form.querySelector('[name="email"]');
    if (!mark(emailEl, /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(data.email))) { issues.push('email'); firstBad = firstBad || emailEl; }

    var mobileEl = form.querySelector('[name="mobile"]');
    var mobOk = !data.mobile || /^[6-9]\d{9}$/.test(data.mobile.replace(/\D/g, ''));
    if (!mark(mobileEl, mobOk)) { issues.push('mobile'); firstBad = firstBad || mobileEl; }

    var subjectEl = form.querySelector('[name="subject"]');
    if (!mark(subjectEl, !!data.subject)) { issues.push('topic'); firstBad = firstBad || subjectEl; }

    var messageEl = form.querySelector('[name="message"]');
    if (!mark(messageEl, data.message.length >= 10)) { issues.push('message'); firstBad = firstBad || messageEl; }

    var consentEl = form.querySelector('[name="consent"]');
    var consentOk = !!(consentEl && consentEl.checked);
    if (consentEl) mark(consentEl, consentOk);
    if (!consentOk) { issues.push('confirmation'); firstBad = firstBad || consentEl; }

    if (issues.length) {
      showError('Please correct: ' + issues.join(', ') + '.');
      if (firstBad && firstBad.focus) firstBad.focus();
      return null;
    }
    showError('');
    return data;
  }

  function compose(data) {
    if (thanks) thanks.textContent = 'Thanks, ' + data.name + ' — your ' + data.subject.toLowerCase() + ' message is ready.';
    if (waBtn) {
      var msg = 'Hello TAVISH & CO., I am ' + data.name + '.\n' +
        'Topic: ' + data.subject + '\n' +
        data.message +
        (data.mobile ? '\nMobile: ' + data.mobile : '') +
        (data.email ? '\nEmail: ' + data.email : '');
      waBtn.href = H.whatsappLink(msg);
      waBtn.target = '_blank';
      waBtn.rel = 'noopener';
    }
    if (wrapForm) wrapForm.hidden = true;
    if (wrapSuccess) wrapSuccess.hidden = false;
  }

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var data = validate();
    if (!data) return;
    compose(data);
    T.toast('Message composed — continue on WhatsApp', 'success');
  });

  if (resetBtn) {
    resetBtn.addEventListener('click', function () {
      form.reset();
      T.qsa('.field.is-invalid', form).forEach(function (f) { f.classList.remove('is-invalid'); });
      showError('');
      if (wrapSuccess) wrapSuccess.hidden = true;
      if (wrapForm) wrapForm.hidden = false;
      var first = form.querySelector('input');
      if (first) first.focus();
    });
  }
})(window, document);
