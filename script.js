// Configurações dos gráficos
const margin = {top: 30, right: 30, bottom: 70, left: 60};
const chartWidth = 450 - margin.left - margin.right;
const chartHeight = 350 - margin.top - margin.bottom;

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

    // Event listener para aplicar filtros
    document.getElementById('apply-filters').addEventListener('click', applyFilters);
});

// Carregar dados da região selecionada
async function loadRegionData(region) {
    try {
        const filename = `data/Brasil_e_${region}.csv`;
        const response = await fetch(filename);
        const csvData = await response.text();
        rawData = d3.csvParse(csvData);
        
        // Exibir painel de filtros
        setupFilterControls(rawData);
        document.getElementById('filter-panel').classList.remove('hidden');
        document.getElementById('results').classList.add('hidden');
    } catch (error) {
        console.error('Erro ao carregar dados:', error);
        alert('Erro ao carregar dados da região selecionada.');
    }
}

// Configurar controles de filtro dinâmicos
function setupFilterControls(data) {
    const filterContainer = document.getElementById('dynamic-filters');
    filterContainer.innerHTML = '';

    // Colunas para filtrar (ajuste conforme seu CSV)
    const filterColumns = [
        'Indicador', 'Nível Territorial', 'Variável de abertura', 
        'Categoria', 'Variável de abertura .1', 'Categoria .1'
    ];

    filterColumns.forEach(col => {
        if (data[0][col] !== undefined) {
            const uniqueValues = [...new Set(data.map(d => d[col]))].filter(Boolean);
            
            if (uniqueValues.length > 0) {
                const filterItem = document.createElement('div');
                filterItem.className = 'filter-item';
                filterItem.innerHTML = `
                    <label for="filter-${col}">${col}:</label>
                    <select id="filter-${col}" class="form-control" multiple>
                        ${uniqueValues.map(val => `<option value="${val}">${val}</option>`).join('')}
                    </select>
                `;
                filterContainer.appendChild(filterItem);
            }
        }
    });
}

// Aplicar filtros selecionados
function applyFilters() {
    const region = document.getElementById('region-select').value;
    if (!region) return;

    // Iniciar com todos os dados
    filteredData = [...rawData];

    // Aplicar cada filtro
    const filterElements = document.querySelectorAll('#dynamic-filters select');
    filterElements.forEach(select => {
        const column = select.id.replace('filter-', '');
        const selectedOptions = Array.from(select.selectedOptions).map(opt => opt.value);
        
        if (selectedOptions.length > 0) {
            filteredData = filteredData.filter(d => selectedOptions.includes(d[column]));
        }
    });

    // Exibir resultados
    displayResults();
    document.getElementById('results').classList.remove('hidden');
}

// Exibir resultados da análise
function displayResults() {
    if (filteredData.length === 0) {
        alert('Nenhum dado encontrado com os filtros selecionados.');
        return;
    }

    renderPieChart();
    renderBarChart();
    renderDataTable();
}

// Renderizar gráfico de pizza para Categoria
function renderPieChart() {
    const container = d3.select('#pie-chart').html('');
    const svg = container.append('svg')
        .attr('width', chartWidth + margin.left + margin.right)
        .attr('height', chartHeight + margin.top + margin.bottom)
        .append('g')
        .attr('transform', `translate(${chartWidth/2 + margin.left}, ${chartHeight/2 + margin.top})`);

    // Agrupar por Categoria
    const categoryData = d3.rollup(
        filteredData,
        v => v.length,
        d => d['Categoria']
    );

    const pie = d3.pie().value(d => d[1]);
    const arc = d3.arc()
        .innerRadius(0)
        .outerRadius(Math.min(chartWidth, chartHeight) / 2 - 10);

    const arcs = svg.selectAll('.arc')
        .data(pie([...categoryData.entries()]))
        .enter().append('g')
        .attr('class', 'arc');

    arcs.append('path')
        .attr('d', arc)
        .attr('fill', (d, i) => colorScheme(i))
        .attr('stroke', 'white')
        .attr('stroke-width', 1);

    // Adicionar labels
    arcs.append('text')
        .attr('transform', d => `translate(${arc.centroid(d)})`)
        .attr('text-anchor', 'middle')
        .attr('dy', '0.35em')
        .text(d => d.data[0])
        .style('font-size', '10px')
        .style('fill', 'white');
}

// Renderizar gráfico de barras para Nível Territorial
function renderBarChart() {
    const container = d3.select('#bar-chart').html('');
    const svg = container.append('svg')
        .attr('width', chartWidth + margin.left + margin.right)
        .attr('height', chartHeight + margin.top + margin.bottom)
        .append('g')
        .attr('transform', `translate(${margin.left}, ${margin.top})`);

    // Agrupar por Nível Territorial
    const territorialData = d3.rollup(
        filteredData,
        v => v.length,
        d => d['Nível Territorial']
    );

    // Escalas
    const x = d3.scaleBand()
        .domain([...territorialData.keys()])
        .range([0, chartWidth])
        .padding(0.2);

    const y = d3.scaleLinear()
        .domain([0, d3.max([...territorialData.values()])])
        .range([chartHeight, 0]);

    // Barras
    svg.selectAll('.bar')
        .data([...territorialData.entries()])
        .enter().append('rect')
        .attr('class', 'bar')
        .attr('x', d => x(d[0]))
        .attr('y', d => y(d[1]))
        .attr('width', x.bandwidth())
        .attr('height', d => chartHeight - y(d[1]))
        .attr('fill', (d, i) => colorScheme(i));

    // Eixos
    svg.append('g')
        .attr('transform', `translate(0, ${chartHeight})`)
        .call(d3.axisBottom(x))
        .selectAll('text')
        .attr('transform', 'rotate(-45)')
        .attr('text-anchor', 'end')
        .attr('dx', '-0.5em')
        .attr('dy', '0.5em');

    svg.append('g')
        .call(d3.axisLeft(y));
}

// Renderizar tabela com dados filtrados
function renderDataTable() {
    const container = document.getElementById('table-container');
    container.innerHTML = '';

    if (filteredData.length === 0) return;

    // Limitar a 50 linhas para performance
    const displayData = filteredData.length > 50 ? filteredData.slice(0, 50) : filteredData;

    const table = document.createElement('table');
    const thead = document.createElement('thead');
    const tbody = document.createElement('tbody');

    // Cabeçalho
    const headerRow = document.createElement('tr');
    Object.keys(displayData[0]).forEach(key => {
        const th = document.createElement('th');
        th.textContent = key;
        headerRow.appendChild(th);
    });
    thead.appendChild(headerRow);
    table.appendChild(thead);

    // Dados
    displayData.forEach(row => {
        const tr = document.createElement('tr');
        Object.values(row).forEach(val => {
            const td = document.createElement('td');
            td.textContent = val;
            tr.appendChild(td);
        });
        tbody.appendChild(tr);
    });
    table.appendChild(tbody);
    container.appendChild(table);

    if (filteredData.length > 50) {
        const warning = document.createElement('p');
        warning.textContent = `Mostrando 50 de ${filteredData.length} registros. Aplique filtros mais específicos para ver todos os dados.`;
        warning.style.color = '#e74c3c';
        warning.style.marginTop = '10px';
        container.appendChild(warning);
    }
}