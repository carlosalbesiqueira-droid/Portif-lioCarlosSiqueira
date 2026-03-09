window.addEventListener("DOMContentLoaded", () => {
  const aboutSection = document.querySelector(".section-about");
  const navLinks = Array.from(document.querySelectorAll(".menu-links a"));
  const navTargets = navLinks
    .map((link) => {
      const href = link.getAttribute("href");
      if (!href || !href.startsWith("#")) return null;

      const section = document.querySelector(href);
      if (!section) return null;

      return {
        link,
        id: href.slice(1),
        section,
        title: link.dataset.title ? link.dataset.title.trim() : link.textContent.trim(),
      };
    })
    .filter(Boolean)
    .sort((left, right) => left.section.offsetTop - right.section.offsetTop);

  const welcomeText = document.querySelector(".welcome-text");
  const defaultWelcomeText = welcomeText ? welcomeText.textContent.trim() : "";

  const setActiveTab = (id) => {
    navLinks.forEach((link) => {
      const isActive = link.getAttribute("href") === `#${id}`;
      link.classList.toggle("is-active", isActive);
    });
  };

  const setPageTitle = (label, isCompact) => {
    if (!welcomeText) return;
    welcomeText.textContent = isCompact ? label : defaultWelcomeText;
  };

  if (navTargets.length > 0) {
    setActiveTab(navTargets[0].id);
  }

  const projectDialogs = Array.from(document.querySelectorAll(".project-modal"));
  const projectOpenButtons = Array.from(
    document.querySelectorAll("[data-project-open]")
  );

  const syncProjectModalState = () => {
    const hasOpenModal = projectDialogs.some((dialog) => dialog.hasAttribute("open"));
    document.body.classList.toggle("project-modal-open", hasOpenModal);
  };

  const openProjectModal = (dialog) => {
    if (!dialog || dialog.hasAttribute("open")) return;

    if (typeof dialog.showModal === "function") {
      dialog.showModal();
    } else {
      dialog.setAttribute("open", "");
    }

    syncProjectModalState();
  };

  const closeProjectModal = (dialog) => {
    if (!dialog || !dialog.hasAttribute("open")) return;

    if (typeof dialog.close === "function") {
      dialog.close();
    } else {
      dialog.removeAttribute("open");
    }

    syncProjectModalState();
  };

  if (projectDialogs.length > 0) {
    projectOpenButtons.forEach((button) => {
      const targetId = button.getAttribute("data-project-open");
      const dialog = targetId ? document.getElementById(targetId) : null;
      if (!dialog) return;

      button.addEventListener("click", () => {
        openProjectModal(dialog);
      });
    });

    projectDialogs.forEach((dialog) => {
      const closeButtons = Array.from(
        dialog.querySelectorAll("[data-project-close]")
      );

      closeButtons.forEach((button) => {
        button.addEventListener("click", () => {
          closeProjectModal(dialog);
        });
      });

      dialog.addEventListener("close", syncProjectModalState);
      dialog.addEventListener("cancel", syncProjectModalState);

      dialog.addEventListener("click", (event) => {
        if (event.target === dialog) {
          closeProjectModal(dialog);
        }
      });
    });
  }

  const shareToggleButton = document.querySelector("[data-share-toggle]");
  const sharePanel = document.getElementById("contact-share-panel");
  const copyLinkButton = document.querySelector("[data-copy-link]");
  const copyFeedback = document.querySelector("[data-copy-feedback]");

  const setSharePanelState = (isOpen) => {
    if (!shareToggleButton || !sharePanel) return;
    sharePanel.hidden = !isOpen;
    shareToggleButton.setAttribute("aria-expanded", String(isOpen));
    shareToggleButton.classList.toggle("is-open", isOpen);
  };

  if (shareToggleButton && sharePanel) {
    setSharePanelState(false);

    shareToggleButton.addEventListener("click", () => {
      setSharePanelState(sharePanel.hidden);
    });

    document.addEventListener("click", (event) => {
      if (sharePanel.hidden) return;

      const target = event.target;
      if (
        target instanceof Node &&
        (sharePanel.contains(target) || shareToggleButton.contains(target))
      ) {
        return;
      }

      setSharePanelState(false);
    });
  }

  if (copyLinkButton) {
    let copyFeedbackTimer = null;

    const writeClipboardText = async (text) => {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
        return;
      }

      const helperInput = document.createElement("input");
      helperInput.value = text;
      document.body.appendChild(helperInput);
      helperInput.select();
      document.execCommand("copy");
      helperInput.remove();
    };

    copyLinkButton.addEventListener("click", async () => {
      try {
        await writeClipboardText(window.location.href);
        if (copyFeedback) {
          copyFeedback.textContent = "Link da pagina copiado.";
        }
      } catch (error) {
        if (copyFeedback) {
          copyFeedback.textContent = "Nao foi possivel copiar o link automaticamente.";
        }
      }

      if (copyFeedbackTimer) {
        window.clearTimeout(copyFeedbackTimer);
      }

      copyFeedbackTimer = window.setTimeout(() => {
        if (copyFeedback) {
          copyFeedback.textContent = "";
        }
      }, 2400);
    });
  }

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && sharePanel && !sharePanel.hidden) {
      setSharePanelState(false);
    }
  });

  const revealSections = Array.from(
    document.querySelectorAll(
      ".section-about, .section-experience, .section-projects, .section-contact, .section-certs"
    )
  );

  if (revealSections.length > 0) {
    const sectionObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          entry.target.classList.toggle("in-view", entry.isIntersecting);
        });
      },
      { threshold: 0.2 }
    );

    revealSections.forEach((section) => {
      sectionObserver.observe(section);
    });
  }

  const updateScrollState = () => {
    const compactTrigger = window.innerHeight * 0.38;
    const isCompact = window.scrollY > compactTrigger;
    document.body.classList.toggle("nav-compact", isCompact);

    if (navTargets.length > 0) {
      const marker = window.scrollY + window.innerHeight * (isCompact ? 0.5 : 0.25);
      let activeTarget = navTargets[0];

      navTargets.forEach((target) => {
        if (marker >= target.section.offsetTop) {
          activeTarget = target;
        }
      });

      setActiveTab(activeTarget.id);
      setPageTitle(activeTarget.title, isCompact);
      document.body.dataset.activeSection = activeTarget.id;
    } else {
      setPageTitle(defaultWelcomeText, false);
      delete document.body.dataset.activeSection;
    }

    const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
    if (maxScroll <= 0) {
      document.body.style.setProperty("--scroll-dim", "0");
    } else {
      const progress = Math.min(window.scrollY / maxScroll, 1);
      const opacity = (progress * 0.72).toFixed(3);
      document.body.style.setProperty("--scroll-dim", opacity);
    }

    const heroFadeDistance = Math.max(window.innerHeight * 0.92, 1);
    const heroFade = Math.min(window.scrollY / heroFadeDistance, 1);
    document.body.style.setProperty("--hero-fade", heroFade.toFixed(3));

    if (aboutSection) {
      const aboutTop = aboutSection.offsetTop;
      const start = aboutTop - window.innerHeight * 0.9;
      const end = aboutTop + window.innerHeight * 0.2;
      const aboutProgress = Math.min(
        Math.max((window.scrollY - start) / (end - start), 0),
        1
      );

      document.body.style.setProperty("--about-progress", aboutProgress.toFixed(3));
    }
  };

  let ticking = false;
  const onScroll = () => {
    if (ticking) return;
    ticking = true;

    window.requestAnimationFrame(() => {
      updateScrollState();
      ticking = false;
    });
  };

  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", updateScrollState);
  updateScrollState();

  window.setTimeout(() => {
    document.body.classList.add("show-ui");
  }, 3000);
});
