export function createAccordion(topOwners, satelliteCount) {
  const dataCardButton = document.getElementById("dataCardButton");
  const accordionContent = document.getElementById("accordionContent");
  const ownerList = document.getElementById("ownerList");
  const satelliteCountDiv = document.getElementById("satelliteCount");

  if (
    !dataCardButton ||
    !accordionContent ||
    !ownerList ||
    !satelliteCountDiv
  ) {
    console.error("Accordion elements not found");
    return;
  }

  // Populate the owner list
  ownerList.innerHTML = "";
  topOwners.forEach(([owner, count]) => {
    const listItem = document.createElement("li");
    listItem.innerText = `${owner}: ${count.toLocaleString()}`;
    ownerList.appendChild(listItem);
  });

  // Update satellite count
  satelliteCountDiv.innerText = `Satellites Rendered: ${satelliteCount.toLocaleString()}`;

  // Remove previous event listener to prevent multiple attachments
  const newButton = dataCardButton.cloneNode(true);
  dataCardButton.parentNode.replaceChild(newButton, dataCardButton);

  // Add click event to toggle accordion content
  newButton.addEventListener("click", () => {
    const isOpen = accordionContent.style.display === "block";
    accordionContent.style.display = isOpen ? "none" : "block";
    newButton.innerHTML = isOpen ? "Satellite Data ▶" : "Satellite Data ▼";
  });
}
