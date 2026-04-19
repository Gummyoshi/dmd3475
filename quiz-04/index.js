const breedList = document.getElementById("breedList");
const statusMessage = document.getElementById("statusMessage");

async function loadBreeds() {
  try {
    const response = await fetch("https://dogapi.dog/api/v2/breeds");

    if (!response.ok) {
      throw new Error("Failed to fetch breeds.");
    }

    const data = await response.json();
    const breeds = data.data;

    statusMessage.style.display = "none";

    for (const breed of breeds) {
      const breedCard = document.createElement("div");
      breedCard.className = "breed-item";

      const breedName = document.createElement("h3");
      breedName.textContent = breed.attributes.name;

      const breedLink = document.createElement("a");
      breedLink.href = `profile.html?id=${breed.id}`;
      breedLink.textContent = "View Profile";
      breedLink.className = "breed-link";

      breedCard.appendChild(breedName);
      breedCard.appendChild(breedLink);
      breedList.appendChild(breedCard);
    }
  } catch (error) {
    statusMessage.textContent = "Error loading dog breeds.";
    statusMessage.classList.add("error");
    console.error(error);
  }
}

loadBreeds();