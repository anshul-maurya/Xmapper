let assignments = []; // This will hold our text to clause mappings

function generateClauseInputs() {
  const numOfClauses = document.getElementById("numClauses").value;
  const form = document.getElementById("clauseForm");
  form.innerHTML = ""; // Clear existing inputs if any
  for (let i = 1; i <= numOfClauses; i++) {
    const inputGroup = document.createElement("div");
    inputGroup.innerHTML = `
            <input type="text" placeholder="Description for Clause ${i}" required>
            <input type="color" value="#ff0000">
            <input type="hidden" value="Clause ${i}" disabled>
        `;
    form.appendChild(inputGroup);
  }
}

function displayPDF(file) {
  const fileReader = new FileReader();
  fileReader.onload = function () {
    const typedArray = new Uint8Array(this.result);
    pdfjsLib.getDocument(typedArray).promise.then((pdf) => {
      const maxPages = pdf.numPages;
      const pageTextPromises = [];
      for (let pageNo = 1; pageNo <= maxPages; pageNo++) {
        pageTextPromises.push(
          pdf.getPage(pageNo).then((page) => {
            return page.getTextContent().then((textContent) => {
              return textContent.items.map((token) => token.str).join(" ");
            });
          })
        );
      }
      Promise.all(pageTextPromises).then((pagesText) => {
        document.getElementById("textContent").innerText = pagesText.join("\n");
      });
    });
  };
  fileReader.readAsArrayBuffer(file);
}

function extractText() {
  const fileInput = document.getElementById("fileInput");
  if (fileInput.files.length === 0) {
    alert("Please select a file!");
    return;
  }
  const file = fileInput.files[0];
  if (file.type === "application/pdf") {
    displayPDF(file);
  } else {
    alert("File type not supported.");
  }
}

function handleTextSelect(event) {
  const selectedText = window.getSelection().toString().trim();
  if (selectedText.length > 0) {
    const popup = document.createElement("div");
    popup.id = "popupMenu";
    popup.style.position = "absolute";
    popup.style.left = `${event.pageX}px`;
    popup.style.top = `${event.pageY}px`;
    popup.style.backgroundColor = "#f9f9f9";
    popup.style.border = "1px solid #ccc";
    popup.style.padding = "5px";

    const clauses = document
      .getElementById("clauseForm")
      .querySelectorAll("input[type='hidden']");
    clauses.forEach((input, index) => {
      const button = document.createElement("button");
      button.textContent = input.value; // "Clause N"
      button.style.backgroundColor = input.previousElementSibling.value; // Color
      button.onclick = function () {
        assignTextToClause(
          selectedText,
          input.value,
          input.previousElementSibling.value
        );
        document.body.removeChild(popup);
      };
      popup.appendChild(button);
    });

    document.body.appendChild(popup);
  }
}

function assignTextToClause(text, clauseId, color) {
  // Check if the highlighted text is already assigned to the same clause
  const existingAssignmentIndex = assignments.findIndex(
    (item) => item.clauseId === clauseId
  );

  if (existingAssignmentIndex !== -1) {
    // If the assignment already exists, update the text
    assignments[existingAssignmentIndex].text += " " + text;
    console.log(`Text: "${text}" added to ${clauseId}`); // Log the addition
  } else {
    // Otherwise, create a new assignment
    assignments.push({ text: text, clauseId: clauseId, color: color });
    console.log(`Text: "${text}" assigned to ${clauseId}`);
  }

  // Highlight the selected text with the respective color
  const selection = window.getSelection();
  const range = selection.getRangeAt(0);
  const span = document.createElement("span");
  span.style.backgroundColor = color;
  span.textContent = text;
  range.deleteContents();
  range.insertNode(span);
}

function exportToExcel() {
  const wb = XLSX.utils.book_new();
  const ws_name = "Clause Assignments";
  let data = [["Clause ID", "Clause Description", "Relevant Text", "Color"]];

  assignments.forEach((item) => {
    const description = document.querySelector(
      `#clauseForm input[value="${item.clauseId}"]`
    ).previousElementSibling.previousElementSibling.value;
    data.push([item.clauseId, description, item.text, item.color]);
  });

  const ws = XLSX.utils.aoa_to_sheet(data);
  XLSX.utils.book_append_sheet(wb, ws, ws_name);
  XLSX.writeFile(wb, "clause_assignments.xlsx");
}

document
  .getElementById("textContent")
  .addEventListener("mouseup", handleTextSelect);
