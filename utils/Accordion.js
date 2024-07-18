// utils/Accordion.js

export function createAccordion(topOwners, satelliteCount) {
  const accordionContainer = document.createElement("div");
  accordionContainer.style.position = "absolute";
  accordionContainer.style.left = "10px";
  accordionContainer.style.top = "120px";
  accordionContainer.style.backgroundColor = "rgba(255, 255, 255, 1)";
  accordionContainer.style.padding = "10px";
  accordionContainer.style.border = "1px solid #ccc";
  accordionContainer.style.zIndex = 1000;

  const header = document.createElement("h3");
  header.style.cursor = "pointer";
  header.style.display = "flex";
  header.style.alignItems = "center";
  header.style.backgroundColor = "rgba(255, 255, 255, 1)";
  header.innerHTML = `Satellite Data <span style="margin-left: 5px;">&#9654;</span>`; // Right-pointing caret

  const caret = header.querySelector("span");

  accordionContainer.appendChild(header);

  const content = document.createElement("div");
  content.style.display = "none";
  content.style.marginTop = "10px";

  const title = document.createElement("h4");
  title.innerText = "Top 10 Satellite Owners";
  content.appendChild(title);

  const list = document.createElement("ul");
  topOwners.forEach(([owner, count]) => {
    const listItem = document.createElement("li");
    listItem.innerText = `${owner}: ${count.toLocaleString()}`;
    list.appendChild(listItem);
  });
  content.appendChild(list);

  // Add satellite count to the content
  const countDiv = document.createElement("div");
  countDiv.innerText = `Satellites Rendered: ${satelliteCount.toLocaleString()}`;
  content.appendChild(countDiv);

  accordionContainer.appendChild(content);

  // Add click event to toggle accordion content
  header.addEventListener("click", () => {
    const isOpen = content.style.display === "block";
    content.style.display = isOpen ? "none" : "block";
    caret.innerHTML = isOpen ? "&#9654;" : "&#9660;"; // Right-pointing or down-pointing caret
  });

  document.body.appendChild(accordionContainer);
}
