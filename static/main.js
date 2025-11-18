document.addEventListener("DOMContentLoaded", function () {
  const form = document.getElementById("upload-form");
  const overlay = document.getElementById("loading-overlay");
  const fileInput = document.getElementById("file-input");
  const fileList = document.getElementById("file-list");

  // Show loading overlay when form is submitted
  form.addEventListener("submit", function () {
    overlay.style.display = "flex";
  });

  // Display selected file with an "X" button
  fileInput.addEventListener("change", function () {
    fileList.innerHTML = ""; // clear previous list
    for (const file of fileInput.files) {
      const li = document.createElement("li");
      li.textContent = file.name;

      const removeBtn = document.createElement("button");
      removeBtn.textContent = "X";
      removeBtn.type = "button";
      removeBtn.classList.add("remove-file-btn");

      removeBtn.addEventListener("click", function () {
        fileInput.value = ""; // clear the file input
        fileList.innerHTML = ""; // remove from list display
      });

      li.appendChild(removeBtn);
      fileList.appendChild(li);
    }
  });
});
