const body = document.body;
const header = document.querySelector("[data-header]");
const menuButton = document.querySelector(".menu-toggle");
const primaryNav = document.querySelector(".primary-nav");

function closeMenu() {
  menuButton.setAttribute("aria-expanded", "false");
  menuButton.setAttribute("aria-label", "Open navigation menu");
  primaryNav.classList.remove("is-open");
  body.classList.remove("nav-open");
}

menuButton.addEventListener("click", () => {
  const willOpen = menuButton.getAttribute("aria-expanded") === "false";
  menuButton.setAttribute("aria-expanded", String(willOpen));
  menuButton.setAttribute("aria-label", willOpen ? "Close navigation menu" : "Open navigation menu");
  primaryNav.classList.toggle("is-open", willOpen);
  body.classList.toggle("nav-open", willOpen);
});

primaryNav.querySelectorAll("a").forEach((link) => link.addEventListener("click", closeMenu));

window.addEventListener("resize", () => {
  if (window.innerWidth > 960) closeMenu();
});

function updateHeader() {
  header.classList.toggle("scrolled", window.scrollY > 20);
}

updateHeader();
window.addEventListener("scroll", updateHeader, { passive: true });

document.querySelectorAll(".faq-item button").forEach((button) => {
  button.addEventListener("click", () => {
    const isOpen = button.getAttribute("aria-expanded") === "true";
    const panel = document.getElementById(button.getAttribute("aria-controls"));
    button.setAttribute("aria-expanded", String(!isOpen));
    panel.hidden = isOpen;
  });
});

const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const revealItems = document.querySelectorAll(".reveal");

if (reducedMotion || !("IntersectionObserver" in window)) {
  revealItems.forEach((item) => item.classList.add("is-visible"));
} else {
  const revealObserver = new IntersectionObserver(
    (entries, observer) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.12 }
  );
  revealItems.forEach((item) => revealObserver.observe(item));
}

const dialog = document.getElementById("entry-dialog");
const openDialogButtons = document.querySelectorAll(".open-entry-modal");
const closeDialogButton = dialog.querySelector(".dialog-close");
const statusBox = document.getElementById("dialog-status");

function openEntryDialog() {
  closeMenu();
  statusBox.hidden = true;
  dialog.showModal();
  body.classList.add("dialog-open");
}

function closeEntryDialog() {
  dialog.close();
}

openDialogButtons.forEach((button) => button.addEventListener("click", openEntryDialog));
closeDialogButton.addEventListener("click", closeEntryDialog);

dialog.addEventListener("click", (event) => {
  const bounds = dialog.getBoundingClientRect();
  const clickedBackdrop =
    event.clientX < bounds.left || event.clientX > bounds.right ||
    event.clientY < bounds.top || event.clientY > bounds.bottom;
  if (clickedBackdrop) closeEntryDialog();
});

dialog.addEventListener("close", () => body.classList.remove("dialog-open"));

const tabs = Array.from(dialog.querySelectorAll('[role="tab"]'));
const tabPanels = Array.from(dialog.querySelectorAll('[role="tabpanel"]'));

function activateTab(tab) {
  tabs.forEach((candidate) => {
    const active = candidate === tab;
    candidate.setAttribute("aria-selected", String(active));
    candidate.tabIndex = active ? 0 : -1;
  });
  tabPanels.forEach((panel) => {
    panel.hidden = panel.id !== tab.getAttribute("aria-controls");
  });
  statusBox.hidden = true;
}

tabs.forEach((tab, index) => {
  tab.addEventListener("click", () => activateTab(tab));
  tab.addEventListener("keydown", (event) => {
    if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;
    event.preventDefault();
    let nextIndex = index;
    if (event.key === "ArrowLeft") nextIndex = (index - 1 + tabs.length) % tabs.length;
    if (event.key === "ArrowRight") nextIndex = (index + 1) % tabs.length;
    if (event.key === "Home") nextIndex = 0;
    if (event.key === "End") nextIndex = tabs.length - 1;
    activateTab(tabs[nextIndex]);
    tabs[nextIndex].focus();
  });
});

const entryForm = document.getElementById("entry-form");

entryForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const formData = new FormData(entryForm);
  const entry = {
    title: String(formData.get("title") || ""),
    type: String(formData.get("type") || ""),
    date: String(formData.get("date") || ""),
    time: String(formData.get("time") || ""),
    note: String(formData.get("note") || ""),
    createdAt: new Date().toISOString()
  };

  try {
    const savedEntries = JSON.parse(localStorage.getItem("panosphere-demo-entries") || "[]");
    savedEntries.push(entry);
    localStorage.setItem("panosphere-demo-entries", JSON.stringify(savedEntries));
    statusBox.textContent = `Saved “${entry.title}” in this browser. Your demo entry is ready.`;
  } catch {
    statusBox.textContent = "Your entry is ready for this session. Browser storage is unavailable, so it was not saved.";
  }

  statusBox.hidden = false;
  entryForm.reset();
  statusBox.focus?.();
});

const uploadInput = document.getElementById("image-upload");
const dropZone = dialog.querySelector(".drop-zone");
const preview = document.getElementById("image-preview");
const previewImage = preview.querySelector("img");
const imageName = document.getElementById("image-name");
const imageAction = dialog.querySelector(".image-action");
const removeImageButton = dialog.querySelector(".remove-image");
let imageUrl = "";

function clearImage() {
  if (imageUrl) URL.revokeObjectURL(imageUrl);
  imageUrl = "";
  uploadInput.value = "";
  previewImage.src = "";
  imageName.textContent = "";
  preview.hidden = true;
  imageAction.disabled = true;
  statusBox.hidden = true;
}

function useImage(file) {
  if (!file || !file.type.startsWith("image/")) {
    statusBox.textContent = "Please choose a PNG, JPG, or WebP image.";
    statusBox.hidden = false;
    return;
  }
  if (imageUrl) URL.revokeObjectURL(imageUrl);
  imageUrl = URL.createObjectURL(file);
  previewImage.src = imageUrl;
  imageName.textContent = file.name;
  preview.hidden = false;
  imageAction.disabled = false;
  statusBox.hidden = true;
}

uploadInput.addEventListener("change", () => useImage(uploadInput.files[0]));
removeImageButton.addEventListener("click", clearImage);

dropZone.addEventListener("keydown", (event) => {
  if (event.key === "Enter" || event.key === " ") {
    event.preventDefault();
    uploadInput.click();
  }
});

["dragenter", "dragover"].forEach((eventName) => {
  dropZone.addEventListener(eventName, (event) => {
    event.preventDefault();
    dropZone.classList.add("is-dragging");
  });
});

["dragleave", "drop"].forEach((eventName) => {
  dropZone.addEventListener(eventName, (event) => {
    event.preventDefault();
    dropZone.classList.remove("is-dragging");
  });
});

dropZone.addEventListener("drop", (event) => useImage(event.dataTransfer.files[0]));

imageAction.addEventListener("click", () => {
  statusBox.textContent = "Image preview ready. Date reading and calendar sync are intentionally not simulated in this website demo.";
  statusBox.hidden = false;
});

document.getElementById("current-year").textContent = new Date().getFullYear();
