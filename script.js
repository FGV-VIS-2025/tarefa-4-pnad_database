// Variáveis globais
let rawData = [];
let filteredData = [];
const colorScheme = d3.scaleOrdinal(d3.schemeTableau10);

// Inicializar aplicação
document.addEventListener('DOMContentLoaded', function() {
    // Event listener para seleção de região
    document.getElementById('region-select').addEventListener('change', function() {
        const region = this.value;
        if (region) {
            loadRegionData(region);
        }
    });

    // Event listeners para os botões
    document.getElementById('next-phase1').addEventListener('click', setupPhase2Filters);
    document.getElementById('generate-analysis').addEventListener('click', generateFilteredTable);
});

// Carregar dados da região selecionada
async function loadRegionData(region) {
    try {
        const filename = `data/Brasil_e_${region}.csv`;
        const response = await fetch(filename);
        const csvData = await response.text();
        rawData = d3.csvParse(csvData);
        
        // Inicializar primeira fase de filtros
        setupPhase1Filters();
        document.getElementById('filter-panel').classList.remove('hidden');
        document.getElementById('results').classList.add('hidden');
    } catch (error) {
        console.error('Erro ao carregar dados:', error);
        alert('Erro ao carregar dados da região selecionada.');
    }
}

// Configurar primeira fase de filtros
function setupPhase1Filters() {
    // Resetar fases
    document.getElementById('phase1').classList.remove('hidden');
    document.getElementById('phase2').classList.add('hidden');
    
    // Popular filtro de Indicador
    const indicadorFilter = document.getElementById('indicador-filter');
    const indicadores = [...new Set(rawData.map(d => d.Indicador))].filter(Boolean);
    
    indicadorFilter.innerHTML = '<option value="">-- Todos --</option>' +
        indicadores.map(ind => `<option value="${ind}">${ind}</option>`).join('');
    
    // Popular filtro de Variável de Abertura
    const varAberturaFilter = document.getElementById('var-abertura-filter');
    const varAberturas = [...new Set(rawData.map(d => d['Variável de abertura']))].filter(Boolean);
    
    varAberturaFilter.innerHTML = '<option value="">-- Todos --</option>' +
        varAberturas.map(varAb => `<option value="${varAb}">${varAb}</option>`).join('');
}

// Configurar segunda fase de filtros
function setupPhase2Filters() {
    // Obter filtros da fase 1
    const indicador = document.getElementById('indicador-filter').value;
    const varAbertura = document.getElementById('var-abertura-filter').value;
    
    // Filtrar dados baseados na fase 1
    filteredData = [...rawData];
    
    if (indicador) {
        filteredData = filteredData.filter(d => d.Indicador === indicador);
    }
    
    if (varAbertura) {
        filteredData = filteredData.filter(d => d['Variável de abertura'] === varAbertura);
    }
    
    // Filtrar sempre por Unidade da Federação
    filteredData = filteredData.filter(d => d['Nível Territorial'] === 'Unidade da Federação');
    
    // Mostrar fase 2
    document.getElementById('phase1').classList.add('hidden');
    document.getElementById('phase2').classList.remove('hidden');
    
    // Popular filtro de Variável de Abertura .1
    const varAbertura1Filter = document.getElementById('var-abertura1-filter');
    const varAberturas1 = [...new Set(filteredData.map(d => d['Variável de abertura .1']))].filter(Boolean);
    
    varAbertura1Filter.innerHTML = '<option value="">-- Todos --</option>' +
        varAberturas1.map(varAb => `<option value="${varAb}">${varAb}</option>`).join('');
    
    // Popular filtro de Categoria .1
    const categoria1Filter = document.getElementById('categoria1-filter');
    const categorias1 = [...new Set(filteredData.map(d => d['Categoria .1']))].filter(Boolean);
    
    categoria1Filter.innerHTML = '<option value="">-- Todos --</option>' +
        categorias1.map(cat => `<option value="${cat}">${cat}</option>`).join('');
}

// Gerar tabela com dados filtrados
function generateFilteredTable() {
    // Obter filtros da fase 2
    const varAbertura1 = document.getElementById('var-abertura1-filter').value;
    const categoria1 = document.getElementById('categoria1-filter').value;
    
    // Aplicar filtros adicionais
    if (varAbertura1) {
        filteredData = filteredData.filter(d => d['Variável de abertura .1'] === varAbertura1);
    }
    
    if (categoria1) {
        filteredData = filteredData.filter(d => d['Categoria .1'] === categoria1);
    }
    
    // Exibir resultados
    renderDataTable();
    document.getElementById('results').classList.remove('hidden');
}

// Renderizar tabela com dados filtrados
function renderDataTable() {
    const container = document.getElementById('table-container');
    container.innerHTML = '';

    if (filteredData.length === 0) {
        container.innerHTML = '<p class="no-data">Nenhum dado encontrado com os filtros selecionados.</p>';
        return;
    }

    const table = document.createElement('table');
    const thead = document.createElement('thead');
    const tbody = document.createElement('tbody');

    // Cabeçalho (mostrar apenas colunas relevantes)
    const relevantColumns = [
        'Indicador', 'Nível Territorial', 'Variável de abertura', 
        'Categoria', 'Variável de abertura .1', 'Categoria .1',
        '2016', '2017', '2018'  // Adicionando anos como exemplo
    ];

    const headerRow = document.createElement('tr');
    relevantColumns.forEach(col => {
        const th = document.createElement('th');
        th.textContent = col;
        headerRow.appendChild(th);
    });
    thead.appendChild(headerRow);
    table.appendChild(thead);

    // Dados
    filteredData.forEach(row => {
        const tr = document.createElement('tr');
        relevantColumns.forEach(col => {
            const td = document.createElement('td');
            td.textContent = row[col] || '-';
            tr.appendChild(td);
        });
        tbody.appendChild(tr);
    });
    table.appendChild(tbody);
    container.appendChild(table);

    // Adicionar contagem de resultados
    const countInfo = document.createElement('p');
    countInfo.className = 'result-count';
    countInfo.textContent = `${filteredData.length} registros encontrados`;
    container.insertBefore(countInfo, container.firstChild);
}