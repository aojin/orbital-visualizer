export function showErrorPage(errorMessage) {
  const canvasContainer = document.getElementById("canvasContainer");
  canvasContainer.innerHTML = ""; // Clear the existing content

  const errorDiv = document.createElement("div");
  errorDiv.style.position = "absolute";
  errorDiv.style.top = "50%";
  errorDiv.style.left = "50%";
  errorDiv.style.transform = "translate(-50%, -50%)";
  errorDiv.style.textAlign = "center";
  errorDiv.style.color = "red";
  errorDiv.style.fontSize = "20px";
  errorDiv.style.padding = "20px";
  errorDiv.style.border = "1px solid red";
  errorDiv.style.backgroundColor = "white";
  errorDiv.innerText = "An error occurred:\n" + errorMessage;

  canvasContainer.appendChild(errorDiv);
  // Hide spinner if there's an error
  const spinner = document.getElementById("spinner");
  spinner.style.display = "none";
}
