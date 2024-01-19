const apiUrl = "https://api.github.com";
let currentPage = 1;

document.getElementById("perPage").value = 10;

document.addEventListener("DOMContentLoaded", function () {
  // Remove the view state from localStorage on page load
  localStorage.removeItem("viewState");

  // Check localStorage for the viewState
  const viewState = localStorage.getItem("viewState");

  // If the viewState is set to "result," hide input-container and show result-container
  if (viewState === "result") {
    document.getElementById("input-container").style.display = "none";
    document.getElementById("result-container").style.display = "block";
  } else {
    // If the viewState is not set or is not "result," show the input-container
    document.getElementById("input-container").style.display = "block";
    document.getElementById("result-container").style.display = "none";
  }
});

async function displayUserDetails(username) {
  const profileDetails = document.getElementById("profile-details");
  const profileImage = document.getElementById("profile");
  const githubLink = document.getElementById("github_link");

  try {
    // Fetch user details from GitHub API
    const response = await fetch(`${apiUrl}/users/${username}`);
    const userData = await response.json();
    console.log(userData);

    const location = userData.location
      ? `<p class="d-flex align-items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-geo-alt-fill" viewBox="0 0 16 16">
                  <path d="M8 16s6-5.686 6-10A6 6 0 0 0 2 6c0 4.314 6 10 6 10m0-7a3 3 0 1 1 0-6 3 3 0 0 1 0 6"/>
                  </svg>
                  <span>${userData.location}</span>
              </p>`
      : "";

    const twitter = userData.twitter_username
      ? `<p>Twitter: ${userData.twitter_username}</p>`
      : "";

    // Display user details
    profileDetails.innerHTML = `
            <h3>${userData.name || userData.login}</h3>
            <p>${userData.bio || ""}</p>
            <div class="d-flex align-items-center gap-3">
                <p>Followers: ${userData.followers || 0}</p>
                <p>Following: ${userData.following || 0}</p>
            </div>
            ${location}
            `;

    // Display profile image
    profileImage.src = userData.avatar_url;
    console.log(userData.html_url);
    profileImage.alt = "Profile Image";

    // Display github link

    githubLink.innerHTML = `<a class="d-flex align-items-center gap-2" href=${userData.html_url} target="_blank">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-link" viewBox="0 0 16 16">
                <path d="M6.354 5.5H4a3 3 0 0 0 0 6h3a3 3 0 0 0 2.83-4H9q-.13 0-.25.031A2 2 0 0 1 7 10.5H4a2 2 0 1 1 0-4h1.535c.218-.376.495-.714.82-1z"/>
                <path d="M9 5.5a3 3 0 0 0-2.83 4h1.098A2 2 0 0 1 9 6.5h3a2 2 0 1 1 0 4h-1.535a4 4 0 0 1-.82 1H12a3 3 0 1 0 0-6z"/>
                </svg>
                <span>${userData.html_url}</span>
            </a>`;
  } catch (error) {
    console.error(`Error fetching user details: ${error.message}`);
  }
}

// Function to get repositories
async function getRepositories() {
  var usernameInput = document.getElementById("username");
  var username = usernameInput.value;
  const perPage = document.getElementById("perPage").value || 10;
  console.log(perPage);

  if (perPage < 1 || perPage > 100) {
    alert("Please enter a number between 1 and 100");
    return;
  }

  // console.log(username);

  // Show loader
  document.getElementById("loader").style.display = "block";

  // Clear previous results
  document.getElementById("repositories").innerHTML = "";
  document.getElementById("pagination").innerHTML = "";

  if (username.trim() === "") {
    // Add red border to the input field
    usernameInput.style.border = "1px solid red";

    // Hide loader
    document.getElementById("loader").style.display = "none";

    // Display error message
    document.getElementById(
      "repositories"
    ).innerHTML = `<li class="list-group-item text-danger">Username is required</li>`;
    return;
  } else {
    // Reset the border to its default state
    usernameInput.style.border = "";
  }

  try {
    const response = await fetch(
      `${apiUrl}/users/${username}/repos?per_page=${perPage}`
    );
    const data = await response.json();
    console.log(data);

    if (data.message === "Not Found") {
      document.getElementById(
        "error"
      ).innerHTML = `<p class="text-danger text-center">No such GitHub username exists!</p>`;
      document.getElementById("loader").style.display = "none";
      return;
    } else {
      // Display user details
      displayUserDetails(username);

      // Hide loader
      document.getElementById("loader").style.display = "none";

      // Display repositories
      displayRepositories(data);

      // Display pagination
      displayPagination(response.headers.get("Link"));

      localStorage.setItem("viewState", "result");

      document.getElementById("input-container").style.display = "none";
      document.getElementById("result-container").style.display = "block";
    }
  } catch (error) {
    // Hide loader
    document.getElementById("loader").style.display = "none";

    // Display error message
    document.getElementById(
      "repositories"
    ).innerHTML = `<li class="list-group-item text-danger">Error fetching repositories</li>`;
  }
}

async function getLanguages(url) {
  try {
    const response = await fetch(url);
    const data = await response.json();
    console.log(data);
    return data;
  } catch (error) {
    console.log(error);
  }
}

// Function to display repositories
async function displayRepositories(repositories) {
  const repositoriesList = document.getElementById("repositories");
  const noRepo = document.getElementById("no-repo");

  // Define a function to fetch languages
  async function fetchLanguages(repo) {
    const lang_link = repo.languages_url;
    if (lang_link) {
      try {
        const languages = await getLanguages(lang_link);
        return Object.keys(languages); // Return only the language names
      } catch (error) {
        console.error(
          `Error fetching languages for ${repo.name}: ${error.message}`
        );
        return [];
      }
    } else {
      return [];
    }
  }

  const languagesArray = await Promise.all(repositories.map(fetchLanguages));

  console.log(repositories.length);

  noRepo.innerHTML =
    repositories.length === 0
      ? '<p class="text-center">No repositories found!</p>'
      : "";

  repositories.forEach((repo, index) => {
    const languages = languagesArray[index]; // Get the language names for the current repository

    const langs = languages
      .map((language) => `<div class="lang py-1 px-2">${language}</div>`)
      .join(" ");

    const descriptionHtml = repo.description
      ? `<p>${repo.description}</p>`
      : "";

    const listItem = `<div class="repo border border-secondary">
                    <h5>${repo.name}</h5>
                    ${descriptionHtml}
                    <div class="d-flex flex-wrap gap-2">${langs}</div>
                  </div>`;
    repositoriesList.insertAdjacentHTML("beforeend", listItem);
  });
}

function parseLinkHeader(linkHeader) {
  const links = linkHeader.split(", ");
  const linkObject = {};

  links.forEach((link) => {
    const [url, rel] = link.split("; ");
    const cleanUrl = url.trim().slice(1, -1);
    const cleanRel = rel.trim().slice(5);

    linkObject[cleanRel] = cleanUrl;
  });

  return linkObject;
}

function extractLastLink(linkHeader) {
  const regex = /<([^>]+)>;\s*rel="last"/;
  const match = linkHeader.match(regex);

  if (match && match[1]) {
    return match[1];
  }

  return null;
}

function extractLastLink(linkHeader) {
  const regex = /<([^>]+)>;\s*rel="last"/;
  const match = linkHeader.match(regex);

  if (match && match[1]) {
    return match[1];
  }

  return null;
}

function extractPrevLink(linkHeader) {
  const regex = /<([^>]+)>;\s*rel="prev"/;
  const match = linkHeader.match(regex);

  if (match && match[1]) {
    return match[1];
  }

  return null;
}

function displayPagination(linkHeader) {
  const pagination = document.getElementById("pagination");
  pagination.innerHTML = "";

  if (!linkHeader) return;

  console.log(linkHeader);

  const links = parseLinkHeader(linkHeader);
  // let maxButtons = 9;
  const lastLink = extractLastLink(linkHeader);

  const prevLink = extractPrevLink(linkHeader);

  let startPage = 1;
  let endPage = lastLink
    ? parseInt(new URL(lastLink).searchParams.get("page"))
    : parseInt(new URL(prevLink).searchParams.get("page")) + 1;
  console.log(endPage);

  console.log(links);

  console.log(lastLink);

  let buttonWidth = 30;
  let numberBtns = document.createElement("div");
  numberBtns.classList.add("num-btns");
  numberBtns.style.maxWidth =
    endPage <= 9 ? `${buttonWidth * endPage}px` : `${buttonWidth * 9}px`;

  for (let i = startPage; i <= endPage; i++) {
    const activeClass = i === startPage ? "active" : "";
    const paginationItem = `<button class="page-btn p-0">
                                      <a class="${activeClass}" href="javascript:void(0);" data-page="${i}" onclick="getRepositoriesPage(${i})">${i}</a>
                                  </button>`;
    numberBtns.insertAdjacentHTML("beforeend", paginationItem);
  }

  const pageBtns = `<button id="prev-btn" onclick="getRepositoriesPage(${
    currentPage === 1 ? currentPage : currentPage - 1
  })">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="10"
                height="10"
                fill="currentColor"
                class="bi bi-caret-left-fill"
                viewBox="0 0 16 16"
              >
                <path
                  d="m3.86 8.753 5.482 4.796c.646.566 1.658.106 1.658-.753V3.204a1 1 0 0 0-1.659-.753l-5.48 4.796a1 1 0 0 0 0 1.506z"
                />
              </svg>
            </button>
            ${numberBtns.outerHTML}
            <button id="next-btn" onclick="getRepositoriesPage(${
              currentPage === endPage ? currentPage : currentPage + 1
            })">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="10"
                height="10"
                fill="currentColor"
                class="bi bi-caret-right-fill"
                viewBox="0 0 16 16"
              >
                <path
                  d="m12.14 8.753-5.482 4.796c-.646.566-1.658.106-1.658-.753V3.204a1 1 0 0 1 1.659-.753l5.48 4.796a1 1 0 0 1 0 1.506z"
                />
              </svg>
            </button>
            `;
  pagination.innerHTML = "";
  pagination.insertAdjacentHTML("beforeend", pageBtns);
}

// Function to handle pagination
async function getRepositoriesPage(page) {
  const username = document.getElementById("username").value;
  const perPage = document.getElementById("perPage").value;

  currentPage = page;

  // Show loader
  document.getElementById("loader").style.display = "block";

  // Clear previous results
  document.getElementById("repositories").innerHTML = "";
  document.getElementById("pagination").innerHTML = "";

  try {
    // Fetch repositories from GitHub API for the specified page
    const response = await fetch(
      `${apiUrl}/users/${username}/repos?per_page=${perPage}&page=${page}`
    );
    const data = await response.json();

    // Hide loader
    document.getElementById("loader").style.display = "none";

    // Display repositories
    displayRepositories(data);

    // Display pagination
    displayPagination(response.headers.get("Link"));

    // Remove active class from all buttons
    const allButtons = document.querySelectorAll(".page-btn a");
    allButtons.forEach((button) => {
      button.classList.remove("active");
    });

    // Set active class for the clicked button
    const clickedButton = document.querySelector(
      `.page-btn a[data-page="${page}"]`
    );
    if (clickedButton) {
      clickedButton.classList.add("active");
    }
  } catch (error) {
    // Hide loader
    document.getElementById("loader").style.display = "none";

    // Display error message
    document.getElementById(
      "repositories"
    ).innerHTML = `<li class="list-group-item text-danger">Error fetching repositories</li>`;
  }
}
