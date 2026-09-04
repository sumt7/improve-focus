for (const link of document.querySelectorAll('a[href="/improve-focus.zip"]')) {
  link.addEventListener("click", () => {
    link.dataset.downloadStarted = "true";
  });
}
