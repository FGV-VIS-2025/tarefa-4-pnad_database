let dataCSV;
let chart;

async function carregarCSV() {
    const response = await fetch('data/Brasil_e_Sudeste.csv');
    const text = await response.text();
    const linhas = text.split('\n').filter(l => l.trim() !== '');
    const headers = linhas[0].split(',');
    dataCSV = linhas.slice(1).map(linha => {
        const valores = linha.split(',');
        const obj = {};
        headers.forEach((h, i) => obj[h.trim()] = valores[i]?.trim());
        return obj;
    });

    popularFiltros();
    adicionarListeners();
}

function adicionarListeners() {
    document.getElementById('indicador').addEventListener('change', atualizarFiltros);
    document.getElementById('variavelAbertura').addEventListener('change', atualizarFiltros);
    document.getElementById('categoria').addEventListener('change', atualizarFiltros);
    document.getElementById('variavelAbertura1').addEventListener('change', atualizarFiltros);
    document.getElementById('categoria1').addEventListener('change', atualizarFiltros);
}

function atualizarFiltros() {
    const indicador = document.getElementById('indicador').value;
    const variavelAbertura = document.getElementById('variavelAbertura').value;
    const categoria = document.getElementById('categoria').value;
    const variavelAbertura1 = document.getElementById('variavelAbertura1').value;
    const categoria1 = document.getElementById('categoria1').value;

    const filtrado = dataCSV.filter(item => 
        item['Nível Territorial'] === 'Unidade da Federação' &&
        (indicador === '' || item['Indicador'] === indicador) &&
        (variavelAbertura === '' || item['Variável de abertura'] === variavelAbertura) &&
        (categoria === '' || item['Categoria'] === categoria) &&
        (variavelAbertura1 === '' || item['Variável de abertura .1'] === variavelAbertura1) &&
        (categoria1 === '' || item['Categoria .1'] === categoria1)
    );

    popularFiltros(filtrado);
}

function popularFiltros(dadosFiltrados = null) {
    const dataToUse = dadosFiltrados || dataCSV;

    const indicadorSet = new Set();
    const variavelAberturaSet = new Set();
    const categoriaSet = new Set();
    const variavelAbertura1Set = new Set();
    const categoria1Set = new Set();

    dataToUse.forEach(item => {
        if(item['Nível Territorial'] === 'Unidade da Federação'){
            indicadorSet.add(item['Indicador']);
            variavelAberturaSet.add(item['Variável de abertura']);
            categoriaSet.add(item['Categoria']);
            variavelAbertura1Set.add(item['Variável de abertura .1']);
            categoria1Set.add(item['Categoria .1']);
        }
    });

    preencherSelect('indicador', indicadorSet, document.getElementById('indicador').value);
    preencherSelect('variavelAbertura', variavelAberturaSet, document.getElementById('variavelAbertura').value);
    preencherSelect('categoria', categoriaSet, document.getElementById('categoria').value);
    preencherSelect('variavelAbertura1', variavelAbertura1Set, document.getElementById('variavelAbertura1').value);
    preencherSelect('categoria1', categoria1Set, document.getElementById('categoria1').value);
}

function preencherSelect(id, valores, valorAtual) {
    const select = document.getElementById(id);
    select.innerHTML = '<option value="">--Todos--</option>';
    valores.forEach(valor => {
        const option = document.createElement('option');
        option.value = valor;
        option.textContent = valor;
        select.appendChild(option);
    });
    select.value = valorAtual;
}

function filtrar() {
    const indicador = document.getElementById('indicador').value;
    const variavelAbertura = document.getElementById('variavelAbertura').value;
    const categoria = document.getElementById('categoria').value;
    const variavelAbertura1 = document.getElementById('variavelAbertura1').value;
    const categoria1 = document.getElementById('categoria1').value;

    const filtrado = dataCSV.filter(item => 
        item['Nível Territorial'] === 'Unidade da Federação' &&
        (indicador === '' || item['Indicador'] === indicador) &&
        (variavelAbertura === '' || item['Variável de abertura'] === variavelAbertura) &&
        (categoria === '' || item['Categoria'] === categoria) &&
        (variavelAbertura1 === '' || item['Variável de abertura .1'] === variavelAbertura1) &&
        (categoria1 === '' || item['Categoria .1'] === categoria1)
    );

    desenharGrafico(filtrado);
}

function desenharGrafico(dados) {
    const labels = dados.map(item => item['Abertura Territorial']);
    const dados2016 = dados.map(item => parseFloat(item['2016']) || 0);
    const dados2017 = dados.map(item => parseFloat(item['2017']) || 0);
    const dados2018 = dados.map(item => parseFloat(item['2018']) || 0);
    

    const ctx = document.getElementById('grafico').getContext('2d');

    if(chart) chart.destroy();

    chart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [
                { label: '2016', data: dados2016, backgroundColor: 'rgba(75, 192, 192, 0.6)' },
                { label: '2017', data: dados2017, backgroundColor: 'rgba(255, 99, 132, 0.6)' },
                { label: '2018', data: dados2018, backgroundColor: 'rgba(54, 162, 235, 0.6)' },
                
            ]
        },
        options: {
            responsive: true,
            scales: {
                y: { beginAtZero: true }
            }
        }
    });
}

function resetarFiltros() {
    document.getElementById('indicador').value = '';
    document.getElementById('variavelAbertura').value = '';
    document.getElementById('categoria').value = '';
    document.getElementById('variavelAbertura1').value = '';
    document.getElementById('categoria1').value = '';
    popularFiltros();
    desenharGrafico(dataCSV.filter(item => item['Nível Territorial'] === 'Unidade da Federação'));
}

carregarCSV();
