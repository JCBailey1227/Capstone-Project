document.addEventListener("DOMContentLoaded", function () {
  const form = document.getElementById("upload-form");
  const overlay = document.getElementById("loading-overlay");
  const fileInput = document.getElementById("file-input");
  const fileList = document.getElementById("file-list");

  // Show loading overlay immediately on form submit
  form.addEventListener("submit", function (e) {
    if (fileInput.files.length === 0) {
      e.preventDefault(); // Prevent submit if no files selected
      alert("Please select at least one file.");
      return;
    }

    overlay.style.display = "flex";
  });

  // Display selected files with "X" buttons
  fileInput.addEventListener("change", function () {
    fileList.innerHTML = "";

    if (fileInput.files.length > 2) {
      alert("Please select a maximum of 2 files.");
      fileInput.value = "";
      return;
    }

    for (const file of fileInput.files) {
      const li = document.createElement("li");

      const nameSpan = document.createElement("span");
      nameSpan.textContent = file.name;
      nameSpan.style.flex = "1";

      const removeBtn = document.createElement("button");
      removeBtn.textContent = "X";
      removeBtn.type = "button";
      removeBtn.classList.add("remove-file-btn");

      removeBtn.addEventListener("click", function () {
        fileInput.value = "";
        fileList.innerHTML = "";
      });

      li.appendChild(nameSpan);
      li.appendChild(removeBtn);
      fileList.appendChild(li);
    }
  });
});
