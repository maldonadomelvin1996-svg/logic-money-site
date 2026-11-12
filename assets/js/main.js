// Logic Money — sitio de la compañía
// JS plano, sin dependencias. Scroll-reveal, nav móvil, acordeones,
// tabs y calculadoras financieras (todo client-side, sin backend).

(function () {
  "use strict";

  /* ---------- Scroll reveal ---------- */
  var revealEls = document.querySelectorAll(".ls-reveal");
  if ("IntersectionObserver" in window && revealEls.length) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("ls-in");
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -40px 0px" });
    revealEls.forEach(function (el) { io.observe(el); });
  } else {
    revealEls.forEach(function (el) { el.classList.add("ls-in"); });
  }

  /* ---------- Mobile nav ---------- */
  var menuBtn = document.getElementById("ls-menu-btn");
  var mobileNav = document.getElementById("ls-mobile-nav");
  if (menuBtn && mobileNav) {
    menuBtn.addEventListener("click", function () {
      var open = mobileNav.classList.toggle("ls-open");
      menuBtn.textContent = open ? "✕" : "☰";
      menuBtn.setAttribute("aria-expanded", open ? "true" : "false");
    });
    mobileNav.querySelectorAll("a").forEach(function (a) {
      a.addEventListener("click", function () {
        mobileNav.classList.remove("ls-open");
        menuBtn.textContent = "☰";
      });
    });
  }

  /* ---------- Generic accordion (FAQ / currículo) ---------- */
  document.querySelectorAll("[data-accordion-btn]").forEach(function (btn) {
    btn.addEventListener("click", function () {
      var item = btn.closest("[data-accordion-item]");
      if (!item) return;
      var wasOpen = item.classList.contains("ls-open");
      var group = item.closest("[data-accordion-group]");
      if (group && group.dataset.accordionGroup === "single") {
        group.querySelectorAll("[data-accordion-item]").forEach(function (i) {
          i.classList.remove("ls-open");
        });
      }
      item.classList.toggle("ls-open", !wasOpen);
    });
  });

  /* ---------- Tabs ---------- */
  document.querySelectorAll("[data-tabs]").forEach(function (group) {
    var btns = group.querySelectorAll("[data-tab-btn]");
    var panels = group.querySelectorAll("[data-tab-panel]");
    btns.forEach(function (btn) {
      btn.addEventListener("click", function () {
        var target = btn.getAttribute("data-tab-btn");
        btns.forEach(function (b) { b.classList.toggle("ls-tab-active", b === btn); });
        panels.forEach(function (p) {
          p.classList.toggle("ls-tab-panel-active", p.getAttribute("data-tab-panel") === target);
        });
      });
    });
  });

  /* ---------- Formato de moneda ---------- */
  function money(n) {
    if (!isFinite(n)) return "—";
    return "$" + n.toLocaleString("es-PR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }
  function num(id) {
    var el = document.getElementById(id);
    var v = parseFloat(el && el.value);
    return isFinite(v) && v >= 0 ? v : 0;
  }

  /* ---------- Calculadora: Fondo de emergencia ---------- */
  function calcFondoEmergencia() {
    var gasto = num("fe-gasto");
    var meses = num("fe-meses") || 3;
    var ahorroActual = num("fe-actual");
    var meta = gasto * meses;
    var faltante = Math.max(meta - ahorroActual, 0);
    var plazoMeses = num("fe-plazo") || 12;
    var ahorroMensual = plazoMeses > 0 ? faltante / plazoMeses : 0;
    setText("fe-out-meta", money(meta));
    setText("fe-out-faltante", money(faltante));
    setText("fe-out-mensual", money(ahorroMensual));
  }

  /* ---------- Calculadora: Interés compuesto / ahorro ---------- */
  function calcInteresCompuesto() {
    var inicial = num("ic-inicial");
    var mensual = num("ic-mensual");
    var tasaAnual = num("ic-tasa") / 100;
    var anos = num("ic-anos") || 1;
    var meses = anos * 12;
    var tasaMensual = tasaAnual / 12;
    var valor = inicial;
    var aportado = inicial;
    for (var i = 0; i < meses; i++) {
      valor = valor * (1 + tasaMensual) + mensual;
      aportado += mensual;
    }
    var intereses = valor - aportado;
    setText("ic-out-valor", money(valor));
    setText("ic-out-aportado", money(aportado));
    setText("ic-out-intereses", money(Math.max(intereses, 0)));
  }

  /* ---------- Calculadora: reducción de deuda (estimado simple) ---------- */
  function calcDeuda() {
    var balance = num("dd-balance");
    var pago = num("dd-pago");
    var tasaAnual = num("dd-tasa") / 100;
    var tasaMensual = tasaAnual / 12;
    var restante = balance;
    var meses = 0;
    var totalInteres = 0;
    var maxMeses = 600;
    if (pago > 0 && pago > restante * tasaMensual) {
      while (restante > 0 && meses < maxMeses) {
        var interes = restante * tasaMensual;
        var abono = Math.min(pago - interes, restante);
        restante -= abono;
        totalInteres += interes;
        meses++;
      }
    } else {
      meses = NaN;
    }
    setText("dd-out-meses", isFinite(meses) ? meses + (meses === 1 ? " mes" : " meses") : "El pago no cubre el interés");
    setText("dd-out-interes", isFinite(meses) ? money(totalInteres) : "—");
    setText("dd-out-total", isFinite(meses) ? money(balance + totalInteres) : "—");
  }

  function setText(id, value) {
    var el = document.getElementById(id);
    if (el) el.textContent = value;
  }

  function bindCalc(ids, fn) {
    ids.forEach(function (id) {
      var el = document.getElementById(id);
      if (el) el.addEventListener("input", fn);
    });
    fn();
  }

  if (document.getElementById("fe-gasto")) {
    bindCalc(["fe-gasto", "fe-meses", "fe-actual", "fe-plazo"], calcFondoEmergencia);
  }
  if (document.getElementById("ic-inicial")) {
    bindCalc(["ic-inicial", "ic-mensual", "ic-tasa", "ic-anos"], calcInteresCompuesto);
  }
  if (document.getElementById("dd-balance")) {
    bindCalc(["dd-balance", "dd-pago", "dd-tasa"], calcDeuda);
  }

  /* ---------- Newsletter (placeholder — sin backend aún) ---------- */
  var newsletterForm = document.getElementById("ls-newsletter-form");
  if (newsletterForm) {
    newsletterForm.addEventListener("submit", function (e) {
      e.preventDefault();
      // TODO: conectar a un servicio real (Mailchimp, ConvertKit, Brevo, etc.)
      // En lo que se integra, solo confirmamos visualmente el envío.
      newsletterForm.querySelector(".ls-form-success").style.display = "block";
      newsletterForm.querySelector("button[type=submit]").disabled = true;
    });
  }
})();
