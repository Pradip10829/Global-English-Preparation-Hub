document.addEventListener("DOMContentLoaded", () => {
  const body = document.body;
  const header = document.querySelector(".site-header");
  const menuToggle = document.querySelector(".menu-toggle");
  const nav = document.querySelector(".site-nav");
  const themeToggle = document.querySelector(".theme-toggle");
  const themeIcon = document.querySelector(".theme-toggle__icon");
  const currentPage = window.location.pathname.split("/").pop() || "index.html";
  const modal = createModal();

  setYear();
  setTheme();
  setupMenu();
  setupNavHighlight();
  setupSmoothScroll();
  setupFilters();
  setupForms();
  setupDates();

  function setYear() {
    document.querySelectorAll("[data-year]").forEach((node) => {
      node.textContent = String(new Date().getFullYear());
    });
  }

  function setTheme(nextTheme) {
    let theme = nextTheme;
    if (!theme) {
      try {
        theme = localStorage.getItem("geh-theme");
      } catch (error) {
        theme = null;
      }
    }

    if (!theme) {
      theme = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
    }

    body.dataset.theme = theme;
    if (themeIcon) {
      themeIcon.textContent = theme === "dark" ? "☼" : "◐";
    }
  }

  if (themeToggle) {
    themeToggle.addEventListener("click", () => {
      const next = body.dataset.theme === "dark" ? "light" : "dark";
      setTheme(next);
      try {
        localStorage.setItem("geh-theme", next);
      } catch (error) {
        // Ignore storage failures.
      }
    });
  }

  function setupMenu() {
    if (!header || !menuToggle || !nav) {
      return;
    }

    menuToggle.addEventListener("click", () => {
      const isOpen = header.classList.toggle("is-open");
      menuToggle.setAttribute("aria-expanded", String(isOpen));
      body.classList.toggle("no-scroll", isOpen && window.innerWidth < 1024);
    });

    nav.querySelectorAll("a").forEach((link) => {
      link.addEventListener("click", closeMenu);
    });

    document.addEventListener("click", (event) => {
      if (!header.classList.contains("is-open")) {
        return;
      }
      if (header.contains(event.target)) {
        return;
      }
      closeMenu();
    });

    window.addEventListener("resize", () => {
      if (window.innerWidth >= 1024) {
        closeMenu();
      }
    });

    function closeMenu() {
      header.classList.remove("is-open");
      menuToggle.setAttribute("aria-expanded", "false");
      body.classList.remove("no-scroll");
    }
  }

  function setupNavHighlight() {
    document.querySelectorAll("[data-nav-link]").forEach((link) => {
      const href = (link.getAttribute("href") || "").split("#")[0] || "index.html";
      if (href === currentPage) {
        link.classList.add("is-active");
        link.setAttribute("aria-current", "page");
      }
    });
  }

  function setupSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach((link) => {
      link.addEventListener("click", (event) => {
        const targetId = link.getAttribute("href");
        if (!targetId || targetId === "#") {
          return;
        }
        const target = document.querySelector(targetId);
        if (!target) {
          return;
        }
        event.preventDefault();
        target.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    });
  }

  function setupFilters() {
    const buttons = Array.from(document.querySelectorAll("[data-filter]"));
    const cards = Array.from(document.querySelectorAll("[data-resource]"));

    if (!buttons.length || !cards.length) {
      return;
    }

    buttons.forEach((button) => {
      button.setAttribute("aria-pressed", String(button.classList.contains("is-active")));
      button.addEventListener("click", () => {
        const filter = button.dataset.filter || "all";
        buttons.forEach((item) => {
          item.classList.remove("is-active");
          item.setAttribute("aria-pressed", "false");
        });
        button.classList.add("is-active");
        button.setAttribute("aria-pressed", "true");

        cards.forEach((card) => {
          const match = filter === "all" || card.dataset.category === filter;
          card.classList.toggle("is-hidden", !match);
        });
      });
    });
  }

  function setupForms() {
    document.querySelectorAll("form[data-form-type]").forEach((form) => {
      form.addEventListener("submit", (event) => {
        event.preventDefault();
        clearErrors(form);

        const errors = validate(form);
        if (errors.length) {
          const firstInvalid = form.querySelector(".has-error input, .has-error select, .has-error textarea");
          const status = form.querySelector(".form-status");
          if (status) {
            status.textContent = errors[0];
          }
          if (firstInvalid) {
            firstInvalid.focus();
          }
          return;
        }

        form.reset();
        modal.show(
          form.dataset.formType === "booking" ? "Booking request received" : "Message received",
          form.dataset.formType === "booking"
            ? "Your booking request was captured successfully. The team can now follow up with your exam and preferred date."
            : "Your message was sent successfully. The team can follow up by email or WhatsApp."
        );
      });
    });
  }

  function clearErrors(form) {
    form.querySelectorAll(".field").forEach((field) => field.classList.remove("has-error"));
    form.querySelectorAll(".field-error").forEach((node) => {
      node.textContent = "";
    });
    const status = form.querySelector(".form-status");
    if (status) {
      status.textContent = "";
    }
  }

  function validate(form) {
    const errors = [];
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    form.querySelectorAll("[required]").forEach((input) => {
      const field = input.closest(".field");
      const errorNode = field ? field.querySelector(".field-error") : null;
      const value = input.value.trim();

      if (!value) {
        if (field) field.classList.add("has-error");
        if (errorNode) errorNode.textContent = "This field is required.";
        errors.push("Please complete all required fields.");
        return;
      }

      if (input.type === "email" && !emailPattern.test(value)) {
        if (field) field.classList.add("has-error");
        if (errorNode) errorNode.textContent = "Enter a valid email address.";
        errors.push("Please enter a valid email address.");
      }

      if (input.type === "date") {
        const chosen = new Date(`${value}T00:00:00`);
        if (chosen < today) {
          if (field) field.classList.add("has-error");
          if (errorNode) errorNode.textContent = "Choose today or a future date.";
          errors.push("Preferred date must be today or later.");
        }
      }
    });

    const requiredMessage = form.querySelector("textarea[required]");
    if (requiredMessage && requiredMessage.value.trim() && requiredMessage.value.trim().length < 12) {
      const field = requiredMessage.closest(".field");
      const errorNode = field ? field.querySelector(".field-error") : null;
      if (field) field.classList.add("has-error");
      if (errorNode) errorNode.textContent = "Add a little more detail.";
      errors.push("Please provide a more detailed message.");
    }

    return errors;
  }

  function setupDates() {
    document.querySelectorAll('input[type="date"]').forEach((input) => {
      const today = new Date();
      const yyyy = today.getFullYear();
      const mm = String(today.getMonth() + 1).padStart(2, "0");
      const dd = String(today.getDate()).padStart(2, "0");
      input.min = `${yyyy}-${mm}-${dd}`;
    });
  }

  function createModal() {
    const wrapper = document.createElement("div");
    wrapper.className = "success-modal";
    wrapper.innerHTML = `
      <div class="success-panel" role="dialog" aria-modal="true" aria-labelledby="success-title">
        <h3 id="success-title">Success</h3>
        <p id="success-copy"></p>
        <div class="actions">
          <button class="btn btn-primary" type="button" data-close-modal>Continue</button>
        </div>
      </div>
    `;

    body.appendChild(wrapper);
    const title = wrapper.querySelector("#success-title");
    const copy = wrapper.querySelector("#success-copy");

    wrapper.addEventListener("click", (event) => {
      if (event.target === wrapper || event.target.closest("[data-close-modal]")) {
        wrapper.classList.remove("is-visible");
        body.classList.remove("no-scroll");
      }
    });

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape") {
        wrapper.classList.remove("is-visible");
        body.classList.remove("no-scroll");
      }
    });

    return {
      show(heading, message) {
        title.textContent = heading;
        copy.textContent = message;
        wrapper.classList.add("is-visible");
        body.classList.add("no-scroll");
      },
    };
  }
});
