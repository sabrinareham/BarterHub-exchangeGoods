/* =========================================================
   Barter Hub - front-end behaviour (plain JavaScript)
   This file only makes the pages FEEL alive for the demo.
   Nothing is saved on a server. In the backend step, PHP will
   do the real work and most of these demo parts get replaced.
   ========================================================= */
(function () {
  'use strict';

  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var params = new URLSearchParams(window.location.search);

  /* 1. Show alerts that depend on the URL, e.g. ?added=1 ------------- */
  $$('[data-show-param]').forEach(function (el) {
    if (params.has(el.getAttribute('data-show-param'))) el.classList.remove('d-none');
  });

  /* 2. Bootstrap form validation ------------------------------------ */
  $$('form.needs-validation').forEach(function (form) {
    form.addEventListener('submit', function (e) {
      if (!form.checkValidity()) { e.preventDefault(); e.stopPropagation(); }
      form.classList.add('was-validated');
    });
  });

  /* 3. Browse filters (search + category + condition + city) -------- */
  var filterForm = $('#filterForm');
  if (filterForm) {
    var cols = $$('.item-col');
    var apply = function () {
      var q = ($('#fSearch').value || '').toLowerCase().trim();
      var cat = $('#fCategory').value, cond = $('#fCondition').value, city = $('#fCity').value;
      var shown = 0;
      cols.forEach(function (c) {
        var ok = (!q || c.dataset.title.toLowerCase().indexOf(q) > -1 || c.dataset.wants.toLowerCase().indexOf(q) > -1) &&
                 (!cat || c.dataset.cat === cat) && (!cond || c.dataset.cond === cond) && (!city || c.dataset.city === city);
        c.classList.toggle('d-none', !ok);
        if (ok) shown++;
      });
      $('#resultCount').textContent = shown;
      $('#noResults').classList.toggle('d-none', shown !== 0);
    };
    if (params.get('q')) $('#fSearch').value = params.get('q');
    if (params.get('cat')) $('#fCategory').value = params.get('cat');
    filterForm.addEventListener('input', apply);
    filterForm.addEventListener('change', apply);
    filterForm.addEventListener('reset', function () { setTimeout(apply, 0); });
    apply();
  }

  /* 4. Item details page: fill from data.js using ?id=... ----------- */
  var detail = $('#itemDetail');
  if (detail && window.BH_ITEMS) {
    var id = parseInt(params.get('id') || '1', 10);
    var item = window.BH_ITEMS.filter(function (i) { return i.id === id; })[0] || window.BH_ITEMS[0];
    $$('[data-f]').forEach(function (el) {
      var key = el.getAttribute('data-f');
      if (item[key] !== undefined) el.textContent = item[key];
    });
    var thumb = $('#detailThumb');
    thumb.className = 'item-thumb lg cat-' + item.cat.toLowerCase();
    thumb.innerHTML = '<i class="bi bi-' + item.icon + '"></i>';
    document.title = item.title + ' - Barter Hub';
    var loginLinks = $$('[data-next-link]');
    loginLinks.forEach(function (a) { a.href = a.getAttribute('data-next-link') + encodeURIComponent('item.html?id=' + item.id); });
    var reqFor = $('#requestedItemName');
    if (reqFor) reqFor.textContent = item.title;
  }

  /* 5. Login / register (demo only: no real check) ------------------ */
  var loginForm = $('#loginForm');
  if (loginForm) {
    loginForm.addEventListener('submit', function (e) {
      e.preventDefault();
      if (!loginForm.checkValidity()) { loginForm.classList.add('was-validated'); return; }
      var next = params.get('next') || '';
      var safe = /^[a-z0-9\-_\/\.\?=&]+$/i.test(next) ? next : '';
      // a guest who was sent to login from an item page returns to that same item (now the user version)
      window.location.href = safe.indexOf('item.html') === 0 ? '../user/' + safe : '../user/dashboard.html';
    });
  }
  var registerForm = $('#registerForm');
  if (registerForm) {
    registerForm.addEventListener('submit', function (e) {
      e.preventDefault();
      var p1 = $('#regPass'), p2 = $('#regPass2');
      p2.setCustomValidity(p1.value === p2.value ? '' : 'Passwords do not match');
      if (!registerForm.checkValidity()) { registerForm.classList.add('was-validated'); return; }
      window.location.href = 'login.html?registered=1';
    });
  }
  var adminLogin = $('#adminLoginForm');
  if (adminLogin) {
    adminLogin.addEventListener('submit', function (e) {
      e.preventDefault();
      if (!adminLogin.checkValidity()) { adminLogin.classList.add('was-validated'); return; }
      window.location.href = 'dashboard.html';
    });
  }

  /* 6. Add item: image preview + save a demo copy in the browser ---- */
  var imgInput = $('#imgInput');
  if (imgInput) {
    imgInput.addEventListener('change', function () {
      var box = $('#previewGrid'); box.innerHTML = '';
      Array.prototype.slice.call(imgInput.files, 0, 4).forEach(function (f) {
        var r = new FileReader();
        r.onload = function (ev) { var im = document.createElement('img'); im.src = ev.target.result; box.appendChild(im); };
        r.readAsDataURL(f);
      });
    });
  }
  var addForm = $('#addItemForm');
  if (addForm) {
    addForm.addEventListener('submit', function (e) {
      e.preventDefault();
      if (!addForm.checkValidity()) { addForm.classList.add('was-validated'); return; }
      var newItem = {
        title: $('#iTitle').value, cat: $('#iCategory').value, cond: $('#iCondition').value,
        city: $('#iLocation').value, wantsCat: $('#iWantCat').value, wants: $('#iWantDesc').value
      };
      try {
        var list = JSON.parse(localStorage.getItem('bh_new_items') || '[]');
        list.unshift(newItem);
        localStorage.setItem('bh_new_items', JSON.stringify(list));
      } catch (err) { /* storage blocked: ignore */ }
      window.location.href = 'my-items.html?added=1';
    });
  }

  /* 7. Show items added in this browser (My items + Latest items) --- */
  var iconFor = { Books: 'book', Electronics: 'laptop', Furniture: 'lamp', Clothing: 'handbag', Sports: 'trophy', Kitchen: 'cup-hot', Toys: 'controller', Mobiles: 'phone' };
  $$('[data-new-items]').forEach(function (host) {
    var list = [];
    try { list = JSON.parse(localStorage.getItem('bh_new_items') || '[]'); } catch (err) {}
    var mode = host.getAttribute('data-new-items'); // 'mine' or 'latest'
    list.forEach(function (it) {
      var col = document.createElement('div');
      col.className = 'col-sm-6 col-lg-4';
      col.innerHTML =
        '<div class="card item-card h-100 shadow-sm"><div class="item-thumb cat-' + it.cat.toLowerCase() + '"><i class="bi bi-' + (iconFor[it.cat] || 'box') + '"></i></div>' +
        '<div class="card-body"><span class="badge text-bg-warning mb-1">NEW - just added</span><br>' +
        '<span class="badge text-bg-light border">' + it.cat + '</span> <span class="badge text-bg-light border">' + it.cond + '</span>' +
        '<h6 class="mt-2 mb-1"></h6><p class="small text-muted mb-2"><i class="bi bi-geo-alt"></i> ' + '<span class="c"></span>' + '</p>' +
        '<div class="swap-box small"><i class="bi bi-arrow-left-right"></i> Wants: <strong class="w"></strong></div></div>' +
        (mode === 'mine' ? '<div class="card-footer bg-white border-0 d-flex gap-2"><button class="btn btn-sm btn-outline-secondary flex-fill" disabled>Edit</button><button class="btn btn-sm btn-outline-danger flex-fill" disabled>Delete</button></div>' : '') +
        '</div>';
      col.querySelector('h6').textContent = it.title;      // textContent keeps user text safe
      col.querySelector('.c').textContent = it.city;
      col.querySelector('.w').textContent = it.wants + ' (' + it.wantsCat + ')';
      host.insertBefore(col, host.firstChild);
    });
  });

  /* 8. Exchange requests: accept / reject / counter / complete ------ */
  function setBadge(card, text, cls) {
    var b = $('.status-badge', card);
    if (b) { b.textContent = text; b.className = 'badge status-badge ' + cls; }
  }
  $$('[data-req-action]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var card = btn.closest('.req-card');
      if (!card) { // the counter-offer popup lives outside the card: find the card from the popup id
        var modalEl = btn.closest('.modal');
        card = $('[data-counter-modal="' + modalEl.id + '"]');
      }
      var act = btn.getAttribute('data-req-action');
      var actions = $('.req-actions', card);
      if (act === 'accept') {
        setBadge(card, 'Accepted', 'text-bg-success');
        actions.classList.add('d-none');
        $('.after-accept', card).classList.remove('d-none');
        $$('.item-status', card).forEach(function (s) { s.textContent = 'Reserved'; s.className = 'badge item-status text-bg-warning'; });
      } else if (act === 'reject') {
        setBadge(card, 'Rejected', 'text-bg-danger');
        actions.classList.add('d-none');
      } else if (act === 'complete') {
        if (!window.confirm('Confirm that the exchange is done? (In the real system both users must confirm.)')) return;
        setBadge(card, 'Completed', 'text-bg-primary');
        $('.after-accept', card).classList.add('d-none');
        $('.after-complete', card).classList.remove('d-none');
        $$('.item-status', card).forEach(function (s) { s.textContent = 'Exchanged'; s.className = 'badge item-status text-bg-secondary'; });
      } else if (act === 'counter-send') {
        setBadge(card, 'Countered', 'text-bg-info');
        actions.classList.add('d-none');
        var m = bootstrap.Modal.getInstance(btn.closest('.modal')); if (m) m.hide();
      }
    });
  });

  /* 9. Chat: switch conversation + send message --------------------- */
  $$('[data-chat-target]').forEach(function (item) {
    item.addEventListener('click', function () {
      $$('[data-chat-target]').forEach(function (i) { i.classList.remove('active'); });
      item.classList.add('active');
      $$('.chat-panel').forEach(function (p) { p.classList.add('d-none'); });
      $(item.getAttribute('data-chat-target')).classList.remove('d-none');
    });
  });
  var chatForm = $('#chatForm');
  if (chatForm) {
    chatForm.addEventListener('submit', function (e) {
      e.preventDefault();
      var input = $('#chatInput'); var text = input.value.trim(); if (!text) return;
      var panel = $('.chat-panel:not(.d-none) .chat-messages');
      var b = document.createElement('div'); b.className = 'bubble me';
      b.textContent = text;
      var t = document.createElement('small'); t.textContent = 'You - just now'; b.appendChild(t);
      panel.appendChild(b); panel.scrollTop = panel.scrollHeight; input.value = '';
    });
    $$('.chat-messages').forEach(function (p) { p.scrollTop = p.scrollHeight; });
  }

  /* 10. Star rating --------------------------------------------------- */
  $$('.star-rating').forEach(function (wrap) {
    var buttons = $$('button', wrap), hidden = $('input[type=hidden]', wrap);
    buttons.forEach(function (b, idx) {
      b.addEventListener('click', function () {
        hidden.value = idx + 1;
        buttons.forEach(function (x, j) { x.classList.toggle('on', j <= idx); });
      });
    });
  });
  var rateForm = $('#rateForm');
  if (rateForm) {
    rateForm.addEventListener('submit', function (e) {
      e.preventDefault();
      if (!$('#ratingValue').value) { $('#starError').classList.remove('d-none'); return; }
      $('#rateFormBox').classList.add('d-none'); $('#rateDone').classList.remove('d-none');
    });
  }

  /* 11. Modals on the item page: request + report -------------------- */
  var reqForm = $('#sendRequestForm');
  if (reqForm) {
    reqForm.addEventListener('submit', function (e) {
      e.preventDefault();
      if (!reqForm.checkValidity()) { reqForm.classList.add('was-validated'); return; }
      window.location.href = 'requests.html?sent=1';
    });
  }
  var reportForm = $('#reportForm');
  if (reportForm) {
    reportForm.addEventListener('submit', function (e) {
      e.preventDefault();
      if (!reportForm.checkValidity()) { reportForm.classList.add('was-validated'); return; }
      $('#reportFields').classList.add('d-none'); $('#reportThanks').classList.remove('d-none');
    });
  }

  /* 12. Profile save --------------------------------------------------- */
  var profileForm = $('#profileForm');
  if (profileForm) {
    profileForm.addEventListener('submit', function (e) {
      e.preventDefault();
      if (!profileForm.checkValidity()) { profileForm.classList.add('was-validated'); return; }
      $('#profileSaved').classList.remove('d-none');
    });
  }

  /* 13. My items: delete (demo) --------------------------------------- */
  $$('[data-delete-card]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      if (window.confirm('Delete this item?')) btn.closest('.col-sm-6').remove();
    });
  });

  /* 14. Admin: block / verify / remove / resolve / hide --------------- */
  $$('[data-admin-action]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var row = btn.closest('tr'), act = btn.getAttribute('data-admin-action');
      var badge = $('.row-status', row);
      var set = function (t, c) { if (badge) { badge.textContent = t; badge.className = 'badge row-status ' + c; } };
      if (act === 'block') { set('Blocked', 'text-bg-danger'); btn.textContent = 'Unblock'; btn.setAttribute('data-admin-action', 'unblock'); }
      else if (act === 'unblock') { set('Active', 'text-bg-success'); btn.textContent = 'Block'; btn.setAttribute('data-admin-action', 'block'); }
      else if (act === 'verify') { set('Verified', 'text-bg-primary'); btn.remove(); }
      else if (act === 'resolve') { set('Resolved', 'text-bg-success'); btn.remove(); }
      else if (act === 'approve') { set('Approved', 'text-bg-success'); btn.remove(); }
      else if (act === 'feature') { set('Featured', 'text-bg-warning'); btn.remove(); }
      else if (act === 'hide') { set('Hidden', 'text-bg-secondary'); btn.textContent = 'Show'; btn.setAttribute('data-admin-action', 'show'); }
      else if (act === 'show') { set('Visible', 'text-bg-success'); btn.textContent = 'Hide'; btn.setAttribute('data-admin-action', 'hide'); }
      else if (act === 'remove' || act === 'delete') {
        if (!window.confirm('Are you sure? (demo only, nothing is really deleted)')) return;
        row.style.transition = 'opacity .3s'; row.style.opacity = '0';
        setTimeout(function () { row.remove(); }, 300);
      }
    });
  });

  /* 15. Admin: add category -------------------------------------------- */
  var catForm = $('#catForm');
  if (catForm) {
    catForm.addEventListener('submit', function (e) {
      e.preventDefault();
      var name = $('#catName').value.trim(); if (!name) return;
      var tr = document.createElement('tr');
      tr.innerHTML = '<td>new</td><td class="n"></td><td>0</td><td><span class="badge row-status text-bg-success">Visible</span></td>' +
        '<td class="text-end"><button class="btn btn-sm btn-outline-secondary me-1" data-admin-action="hide">Hide</button></td>';
      tr.querySelector('.n').textContent = name;
      $('#catBody').appendChild(tr);
      var hideBtn = tr.querySelector('button');
      hideBtn.addEventListener('click', function () {
        var hidden = hideBtn.getAttribute('data-admin-action') === 'hide';
        var b = tr.querySelector('.row-status');
        b.textContent = hidden ? 'Hidden' : 'Visible'; b.className = 'badge row-status ' + (hidden ? 'text-bg-secondary' : 'text-bg-success');
        hideBtn.textContent = hidden ? 'Show' : 'Hide'; hideBtn.setAttribute('data-admin-action', hidden ? 'show' : 'hide');
      });
      catForm.reset();
    });
  }

  /* 16. Admin: quick text filter for tables ---------------------------- */
  $$('[data-table-filter]').forEach(function (input) {
    input.addEventListener('input', function () {
      var q = input.value.toLowerCase();
      $$('#' + input.getAttribute('data-table-filter') + ' tbody tr').forEach(function (tr) {
        tr.classList.toggle('d-none', tr.textContent.toLowerCase().indexOf(q) === -1);
      });
    });
  });

  /* 17. Admin chat monitor: pick a conversation (read only) ------------ */
  $$('[data-monitor-target]').forEach(function (a) {
    a.addEventListener('click', function () {
      $$('[data-monitor-target]').forEach(function (i) { i.classList.remove('active'); });
      a.classList.add('active');
      $$('.monitor-panel').forEach(function (p) { p.classList.add('d-none'); });
      $(a.getAttribute('data-monitor-target')).classList.remove('d-none');
    });
  });
})();
