for (const link of document.querySelectorAll('a[href="/improve-focus.zip"]')) {
  link.addEventListener("click", () => {
    link.dataset.downloadStarted = "true";
  });
}

const demoVideo = document.querySelector("#demoVideo");
const demoFrame = document.querySelector("#demoFrame");

demoVideo?.addEventListener("loadeddata", () => {
  demoFrame?.classList.add("has-video");
});
