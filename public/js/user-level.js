// script.js

document.addEventListener("DOMContentLoaded", () => {
  fetch("/api/user-info", { credentials: "include" })
    .then((res) => {
      if (!res.ok) {
        // user not logged in => optional
        applyModuleVisibility("notLoggedIn");
        return null;
      }
      return res.json();
    })
    .then((data) => {
      if (!data) return;
      if (!data.isLoggedIn) {
        applyModuleVisibility("notLoggedIn");
        return;
      }
      // Force userLevel to lowercase
      const userLevel = data.userLevel
        ? data.userLevel.toLowerCase()
        : "beginner";
      applyModuleVisibility(userLevel);
    })
    .catch((err) => {
      console.error("Error fetching user info:", err);
      applyModuleVisibility("notLoggedIn");
    });
});

function applyModuleVisibility(userLevel) {
  const linkElems = document.querySelectorAll("[data-level]");

  linkElems.forEach((link) => {
    const requiredLevel = link.getAttribute("data-level").toLowerCase();

    // STRICT: Hide if the level doesn't match EXACTLY
    if (requiredLevel !== userLevel) {
      link.style.setProperty("display", "none", "important");
    } else {
      link.style.removeProperty("display");
    }
  });
}

function levelToNumber(lvl) {
  switch (lvl) {
    case "beginner":
      return 1;
    case "intermediate":
      return 2;
    case "advanced":
      return 3;
    default:
      return 0; // not logged in or unknown
  }
}
