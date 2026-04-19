const profileStatus = document.getElementById("profileStatus");
const breedProfile = document.getElementById("breedProfile");

function getBreedIdFromURL() {
  const params = new URLSearchParams(window.location.search);
  return params.get("id");
}

async function loadBreedProfile() {
  const breedId = getBreedIdFromURL();

  if (!breedId) {
    profileStatus.textContent = "No breed ID was found in the URL.";
    profileStatus.classList.add("error");
    return;
  }

  try {
    const response = await fetch("https://dogapi.dog/api/v2/breeds");

    if (!response.ok) {
      throw new Error("Failed to fetch breed data.");
    }

    const data = await response.json();
    const breeds = data.data;

    let selectedBreed = null;

    for (const breed of breeds) {
      if (breed.id === breedId) {
        selectedBreed = breed;
        break;
      }
    }

    if (!selectedBreed) {
      profileStatus.textContent = "Breed not found.";
      profileStatus.classList.add("error");
      return;
    }

    profileStatus.style.display = "none";

    const attributes = selectedBreed.attributes;

    breedProfile.innerHTML = `
      <div class="profile-box">
        <h2>${attributes.name || "Unknown Breed"}</h2>

        <div class="profile-grid">
          <div class="profile-field">
            <strong>ID</strong>
            <span>${selectedBreed.id}</span>
          </div>

          <div class="profile-field">
            <strong>Name</strong>
            <span>${attributes.name || "N/A"}</span>
          </div>

          <div class="profile-field">
            <strong>Description</strong>
            <span>${attributes.description || "No description available."}</span>
          </div>

          <div class="profile-field">
            <strong>Life</strong>
            <span>${attributes.life ? `${attributes.life.min} - ${attributes.life.max} years` : "N/A"}</span>
          </div>

          <div class="profile-field">
            <strong>Male Weight</strong>
            <span>${attributes.male_weight ? `${attributes.male_weight.min} - ${attributes.male_weight.max}` : "N/A"}</span>
          </div>

          <div class="profile-field">
            <strong>Female Weight</strong>
            <span>${attributes.female_weight ? `${attributes.female_weight.min} - ${attributes.female_weight.max}` : "N/A"}</span>
          </div>

          <div class="profile-field">
            <strong>Hypoallergenic</strong>
            <span>${attributes.hypoallergenic !== undefined ? attributes.hypoallergenic : "N/A"}</span>
          </div>
        </div>
      </div>
    `;
  } catch (error) {
    profileStatus.textContent = "Error loading breed profile.";
    profileStatus.classList.add("error");
    console.error(error);
  }
}

loadBreedProfile();