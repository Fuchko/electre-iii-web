function createForm(config = null) {
    const numAlternatives = config ? config.alternatives.length : parseInt(document.getElementById('numAlternatives').value);
    const numCriteria = config ? config.criteria.length : parseInt(document.getElementById('numCriteria').value);
    const container = document.getElementById('formContainer');
    container.innerHTML = '';

    const altDiv = document.createElement('div');
    altDiv.innerHTML = '<h3>Альтернативи</h3>';
    for (let i = 0; i < numAlternatives; i++) {
        const altValue = config ? config.alternatives[i] : `A${i + 1}`;
        altDiv.innerHTML += `
            <div class="mb-2">
                Альтернатива ${i + 1}: <input type="text" class="form-control d-inline-block" id="alt_${i}" value="${altValue}" oninput="updateAltName(${i})">
            </div>
        `;
    }
    container.appendChild(altDiv);

    const critDiv = document.createElement('div');
    critDiv.innerHTML = '<h3>Критерії</h3>';
    for (let j = 0; j < numCriteria; j++) {
        const crit = config ? config.criteria[j] : null;
        critDiv.innerHTML += `
            <div class="mb-2">
                Критерій ${j + 1}: 
                <input type="text" class="form-control d-inline-block mb-1" id="crit_${j}" value="${crit ? crit.name : 'Критерій' + (j + 1)}">
                Вага: <input type="number" class="form-control d-inline-block mb-1" id="weight_${j}" step="0.01" value="${crit ? crit.weight : 0.5}">
                q: <input type="number" class="form-control d-inline-block mb-1" id="q_${j}" value="${crit ? crit.q : 1}">
                p: <input type="number" class="form-control d-inline-block mb-1" id="p_${j}" value="${crit ? crit.p : 5}">
                v: <input type="number" class="form-control d-inline-block mb-1" id="v_${j}" value="${crit ? crit.v : 10}">
            </div>
        `;
    }
    container.appendChild(critDiv);

    const evalDiv = document.createElement('div');
    evalDiv.innerHTML = '<h3>Оцінки</h3>';
    const table = document.createElement('table');
    table.className = 'table table-bordered table-hover mt-3';
    let headerRow = '<tr><th>Альтернатива \\\\ Критерій</th>';
    for (let j = 0; j < numCriteria; j++) {
        headerRow += `<th>${j + 1}</th>`;
    }
    headerRow += '</tr>';
    table.innerHTML += headerRow;

    for (let i = 0; i < numAlternatives; i++) {
        let row = `<tr><td id="altNameCell_${i}">${config ? config.alternatives[i] : 'A' + (i + 1)}</td>`;
        for (let j = 0; j < numCriteria; j++) {
            const evalValue = config ? config.evaluations[i][j] : 0;
            row += `<td><input type="number" class="form-control" id="eval_${i}_${j}" value="${evalValue}"></td>`;
        }
        row += '</tr>';
        table.innerHTML += row;
    }

    const wrapper = document.createElement('div');
    wrapper.className = 'table-responsive';
    wrapper.appendChild(table);
    evalDiv.appendChild(wrapper);
    container.appendChild(evalDiv);

    document.getElementById('runButton').style.display = 'inline';
    document.getElementById('saveButton').style.display = 'inline';
    document.getElementById('loadLabel').style.display = 'inline';
}

function updateAltName(index) {
    const name = document.getElementById(`alt_${index}`).value;
    const cell = document.getElementById(`altNameCell_${index}`);
    if (cell) {
        cell.textContent = name;
    }
}

function showMessage(message, type = 'success') {
    const resultContainer = document.getElementById('result');
    const alertClass = type === 'success' ? 'alert-success' : 'alert-danger';
    resultContainer.innerHTML = `<div class="alert ${alertClass}" role="alert">${message}</div>`;
}

function runElectre() {
    const numAlternativesInput = document.getElementById('numAlternatives');
    const numCriteriaInput = document.getElementById('numCriteria');

    if (!numAlternativesInput || !numCriteriaInput) {
        showMessage('Будь ласка, створіть форму та введіть дані перед розрахунком.', 'error');
        return;
    }

    const numAlternatives = parseInt(numAlternativesInput.value);
    const numCriteria = parseInt(numCriteriaInput.value);

    if (!numAlternatives || !numCriteria || isNaN(numAlternatives) || isNaN(numCriteria)) {
        showMessage('Будь ласка, створіть форму та введіть дані перед розрахунком.', 'error');
        return;
    }

    const alternatives = [];
    for (let i = 0; i < numAlternatives; i++) {
        const altInput = document.getElementById(`alt_${i}`);
        if (!altInput) {
            showMessage('Будь ласка, створіть форму та введіть дані перед розрахунком.', 'error');
            return;
        }
        const val = altInput.value.trim();
        if (!val) {
            showMessage(`Альтернатива ${i + 1} не заповнена.`, 'error');
            return;
        }
        alternatives.push(val);
    }

    const criteria = [];
    let weightSum = 0;
    for (let j = 0; j < numCriteria; j++) {
        const name = document.getElementById(`crit_${j}`).value.trim();
        const weight = parseFloat(document.getElementById(`weight_${j}`).value);
        const q = parseFloat(document.getElementById(`q_${j}`).value);
        const p = parseFloat(document.getElementById(`p_${j}`).value);
        const v = parseFloat(document.getElementById(`v_${j}`).value);

        if (!name || isNaN(weight) || isNaN(q) || isNaN(p) || isNaN(v)) {
            showMessage(`Заповніть всі поля для критерію ${j + 1}.`, 'error');
            return;
        }

        weightSum += weight;
        criteria.push({ name, weight, q, p, v });
    }

    if (Math.abs(weightSum - 1) > 0.01) {
        showMessage(`❗ Сума ваг критеріїв повинна дорівнювати 1 (зараз ${weightSum.toFixed(2)}).`, 'error');
        return;
    }

    const evaluations = [];
    for (let i = 0; i < numAlternatives; i++) {
        const row = [];
        for (let j = 0; j < numCriteria; j++) {
            const val = parseFloat(document.getElementById(`eval_${i}_${j}`).value);
            if (isNaN(val)) {
                showMessage(`Оцінка для Альтернатива ${i + 1}, Критерій ${j + 1} не заповнена або некоректна.`, 'error');
                return;
            }
            row.push(val);
        }
        evaluations.push(row);
    }

    const data = { alternatives, criteria, evaluations };

    showMessage('Обробка запиту...', 'success');

    fetch('https://electre-iii-backend.onrender.com/api/run-electre', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    })
    .then(response => {
        if (!response.ok) {
            throw new Error(`Сервер відповів з помилкою: ${response.status}`);
        }
        return response.json();
    })
    .then(result => {
        const resultContainer = document.getElementById('result');
        resultContainer.innerHTML = '';

        const conclusionDiv = document.createElement('div');
        conclusionDiv.className = 'alert alert-success';
        conclusionDiv.innerHTML = `<strong>Висновок:</strong> ${result.conclusion}`;
        resultContainer.appendChild(conclusionDiv);

        resultContainer.appendChild(renderMatrix(result.alternatives, result.concordance_matrix, 'Матриця згоди (Concordance)'));
        resultContainer.appendChild(renderMatrix(result.alternatives, result.discordance_matrix, 'Матриця незгоди (Discordance)'));
        resultContainer.appendChild(renderMatrix(result.alternatives, result.outranking_matrix, 'Матриця домінування (Outranking)'));
    })
    .catch(error => {
        showMessage(`Помилка: ${error.message}`, 'error');
    });
}

function renderMatrix(alternatives, matrix, title) {
    const container = document.createElement('div');
    container.innerHTML = `<h3 class="mt-4">${title}</h3>`;

    const table = document.createElement('table');
    table.className = 'table table-bordered table-hover';
    let headerRow = '<tr><th></th>';
    for (let j = 0; j < alternatives.length; j++) {
        headerRow += `<th>${alternatives[j]}</th>`;
    }
    headerRow += '</tr>';
    table.innerHTML += headerRow;

    for (let i = 0; i < alternatives.length; i++) {
        let row = `<tr><th>${alternatives[i]}</th>`;
        for (let j = 0; j < alternatives.length; j++) {
            let value = matrix[i][j];
            if (value === null) {
                value = '-';
            }
            row += `<td>${value}</td>`;
        }
        row += '</tr>';
        table.innerHTML += row;
    }

    const wrapper = document.createElement('div');
    wrapper.className = 'table-responsive';
    wrapper.appendChild(table);
    container.appendChild(wrapper);
    return container;
}
