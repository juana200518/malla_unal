
document.addEventListener("DOMContentLoaded", () => {
  const mallaContainer = document.getElementById("mallaContainer");
  const papaTableBody = document.querySelector("#papaTable tbody");
  const papaResult = document.getElementById("papaResult");

  function getCompletedCodes() {
    return JSON.parse(localStorage.getItem("completedCodes") || "[]");
  }

  function setCompletedCodes(codes) {
    localStorage.setItem("completedCodes", JSON.stringify(codes));
  }

  function renderMalla() {
    mallaContainer.innerHTML = "";
    const completed = getCompletedCodes();

    for (let s = 1; s <= 10; s++) {
      const column = document.createElement("div");
      column.className = "semester-column";
      column.innerHTML = `<h3>Semestre ${s}</h3>`;
      const semMaterias = materias.filter(m => m.semestre === s);

      semMaterias.forEach(m => {
        const card = document.createElement("div");
        card.className = "card";
        card.textContent = m.nombre;

        const requisitosOk = (m.prerequisitos || []).every(pr => completed.includes(pr));
        const correquisitosOk = !m.correquisitos || m.correquisitos.every(() => true); // Correquisitos se ignoran como restricción activa

        if (!requisitosOk) card.classList.add("locked");
        if (completed.includes(m.codigo)) card.classList.add("completed");

        card.onclick = () => {
          const index = completed.indexOf(m.codigo);
          if (index >= 0) completed.splice(index, 1);
          else completed.push(m.codigo);
          setCompletedCodes(completed);
          renderMalla();
        };

        column.appendChild(card);
      });

      mallaContainer.appendChild(column);
    }
  }

  function calculatePapa() {
    let totalCreditos = 0;
    let sumaPonderada = 0;

    for (const row of papaTableBody.children) {
      const creditos = parseFloat(row.querySelector(".creditos").value) || 0;
      const notas = Array.from(row.querySelectorAll(".notas input"))
        .map(n => parseFloat(n.value))
        .filter(n => !isNaN(n));
      if (notas.length === 0) continue;
      const notaMax = Math.max(...notas);
      sumaPonderada += notaMax * creditos;
      totalCreditos += creditos;
    }

    const papa = totalCreditos > 0 ? (sumaPonderada / totalCreditos).toFixed(2) : "0.00";
    papaResult.textContent = `P.A.P.A.: ${papa}`;
  }

  window.addRow = () => {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td><input type="text" class="materia" /></td>
      <td><input type="number" class="creditos" min="0" step="1" /></td>
      <td class="notas">
        <input type="number" min="0" max="5" step="0.01" />
        <button onclick="this.parentElement.appendChild(document.createElement('input')).setAttribute('type', 'number'); this.parentElement.lastChild.setAttribute('min', 0); this.parentElement.lastChild.setAttribute('max', 5); this.parentElement.lastChild.setAttribute('step', 0.01);">+</button>
      </td>
      <td><button onclick="this.closest('tr').remove(); calculatePapa()">🗑️</button></td>
    `;
    papaTableBody.appendChild(row);
    row.querySelectorAll("input").forEach(i => i.addEventListener("input", calculatePapa));
  };

  window.exportPapa = () => {
    const data = Array.from(papaTableBody.children).map(row => ({
      materia: row.querySelector(".materia").value,
      creditos: row.querySelector(".creditos").value,
      notas: Array.from(row.querySelectorAll(".notas input")).map(n => n.value),
    }));
    localStorage.setItem("papaData", JSON.stringify(data));
    alert("Datos guardados en el navegador.");
  };

  window.importPapa = (event) => {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const data = JSON.parse(reader.result);
        papaTableBody.innerHTML = "";
        data.forEach(d => {
          const row = document.createElement("tr");
          row.innerHTML = `
            <td><input type="text" class="materia" value="${d.materia}" /></td>
            <td><input type="number" class="creditos" min="0" step="1" value="${d.creditos}" /></td>
            <td class="notas">
              ${d.notas.map(n => `<input type="number" min="0" max="5" step="0.01" value="${n}" />`).join("")}
              <button onclick="this.parentElement.appendChild(document.createElement('input')).setAttribute('type', 'number'); this.parentElement.lastChild.setAttribute('min', 0); this.parentElement.lastChild.setAttribute('max', 5); this.parentElement.lastChild.setAttribute('step', 0.01);">+</button>
            </td>
            <td><button onclick="this.closest('tr').remove(); calculatePapa()">🗑️</button></td>
          `;
          papaTableBody.appendChild(row);
          row.querySelectorAll("input").forEach(i => i.addEventListener("input", calculatePapa));
        });
        calculatePapa();
      } catch (e) {
        alert("Error al importar los datos.");
      }
    };
    reader.readAsText(file);
  };

  window.resetPapa = () => {
    if (confirm("¿Seguro que deseas borrar todo?")) {
      localStorage.removeItem("papaData");
      papaTableBody.innerHTML = "";
      calculatePapa();
    }
  };

  const saved = localStorage.getItem("papaData");
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      parsed.forEach(d => {
        const row = document.createElement("tr");
        row.innerHTML = `
          <td><input type="text" class="materia" value="${d.materia}" /></td>
          <td><input type="number" class="creditos" min="0" step="1" value="${d.creditos}" /></td>
          <td class="notas">
            ${d.notas.map(n => `<input type="number" min="0" max="5" step="0.01" value="${n}" />`).join("")}
            <button onclick="this.parentElement.appendChild(document.createElement('input')).setAttribute('type', 'number'); this.parentElement.lastChild.setAttribute('min', 0); this.parentElement.lastChild.setAttribute('max', 5); this.parentElement.lastChild.setAttribute('step', 0.01);">+</button>
          </td>
          <td><button onclick="this.closest('tr').remove(); calculatePapa()">🗑️</button></td>
        `;
        papaTableBody.appendChild(row);
        row.querySelectorAll("input").forEach(i => i.addEventListener("input", calculatePapa));
      });
      calculatePapa();
    } catch {}
  }

  renderMalla();
});
