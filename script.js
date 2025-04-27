// Configurações do gráfico
const margin = {top: 50, right: 30, bottom: 100, left: 60};
const width = 1000 - margin.left - margin.right;
const height = 600 - margin.top - margin.bottom;

// Cores para cada região
const regionColors = {
    "Sul": "#3498db",
    "Sudeste": "#e74c3c",
    "Centro-Oeste": "#2ecc71",
    "Nordeste": "#f39c12",
    "Norte": "#9b59b6"
};

// Criação do SVG
const svg = d3.select("#chart")
    .append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

// Escalas
const x = d3.scaleBand()
    .range([0, width])
    .padding(0.2);

const y = d3.scaleLinear()
    .range([height, 0]);

const color = d3.scaleOrdinal()
    .domain(Object.keys(regionColors))
    .range(Object.values(regionColors));

// Eixos
const xAxis = svg.append("g")
    .attr("class", "axis axis-x")
    .attr("transform", `translate(0,${height})`);

const yAxis = svg.append("g")
    .attr("class", "axis axis-y");

// Labels dos eixos
svg.append("text")
    .attr("class", "axis-label")
    .attr("x", width / 2)
    .attr("y", height + margin.bottom - 20)
    .text("Grupos de Idade");

svg.append("text")
    .attr("class", "axis-label")
    .attr("transform", "rotate(-90)")
    .attr("x", -height / 2)
    .attr("y", -margin.left + 15)
    .text("População");

// Tooltip
const tooltip = d3.select("#tooltip");

// Legenda
const legend = d3.select(".container")
    .append("div")
    .attr("class", "region-legend");

// Carregar todos os dados
async function loadAllData() {
    const regions = ["Sul", "Sudeste", "Centro-Oeste", "Nordeste", "Norte"];
    const allData = {};
    
    for (const region of regions) {
        const filename = `data/Brasil_e_${region.replace("-", "_")}.csv`;
        try {
            const data = await d3.csv(filename);
            allData[region] = processRegionData(data);
        } catch (error) {
            console.error(`Erro ao carregar dados da região ${region}:`, error);
        }
    }
    
    return allData;
}

// Processar dados de uma região
function processRegionData(data) {
    return data.map(d => ({
        ageGroup: d["Categoria .1"].trim(),
        Total2016: +d["2016"],
        Total2017: +d["2017"],
        Total2018: +d["2018"],
        Homem2016: d["Sexo"] === "Homem" ? +d["2016"] : 0,
        Homem2017: d["Sexo"] === "Homem" ? +d["2017"] : 0,
        Homem2018: d["Sexo"] === "Homem" ? +d["2018"] : 0
    }));
}

// Atualizar gráfico
function updateChart(data, year, category = "Total", region = "all") {
    // Limpar gráfico
    svg.selectAll(".bar").remove();
    
    // Criar legenda
    updateLegend(region);
    
    // Preparar dados
    let chartData = [];
    if (region === "all") {
        for (const [reg, regData] of Object.entries(data)) {
            regData.forEach(d => {
                chartData.push({
                    ageGroup: d.ageGroup,
                    value: d[`${category}${year}`],
                    region: reg
                });
            });
        }
    } else {
        chartData = data[region].map(d => ({
            ageGroup: d.ageGroup,
            value: d[`${category}${year}`],
            region: region
        }));
    }
    
    // Agrupar por faixa etária se mostrando todas as regiões
    if (region === "all") {
        const ageGroups = [...new Set(chartData.map(d => d.ageGroup))];
        const nestedData = ageGroups.map(age => ({
            ageGroup: age,
            regions: chartData.filter(d => d.ageGroup === age)
        }));
        
        // Atualizar escalas para agrupamento
        x.domain(ageGroups);
        y.domain([0, d3.max(chartData, d => d.value)]);
        
        // Desenhar barras agrupadas
        const barGroups = svg.selectAll(".bar-group")
            .data(nestedData)
            .enter()
            .append("g")
            .attr("class", "bar-group")
            .attr("transform", d => `translate(${x(d.ageGroup)},0)`);
        
        barGroups.selectAll(".bar")
            .data(d => d.regions)
            .enter()
            .append("rect")
            .attr("class", "bar")
            .attr("x", (d, i) => i * (x.bandwidth() / d.regions.length))
            .attr("width", x.bandwidth() / d.regions.length - 2)
            .attr("y", d => y(d.value))
            .attr("height", d => height - y(d.value))
            .attr("fill", d => regionColors[d.region])
            .on("mouseover", showTooltip)
            .on("mouseout", hideTooltip);
    } else {
        // Atualizar escalas para uma única região
        x.domain(chartData.map(d => d.ageGroup));
        y.domain([0, d3.max(chartData, d => d.value)]);
        
        // Desenhar barras simples
        svg.selectAll(".bar")
            .data(chartData)
            .enter()
            .append("rect")
            .attr("class", "bar")
            .attr("x", d => x(d.ageGroup))
            .attr("width", x.bandwidth())
            .attr("y", d => y(d.value))
            .attr("height", d => height - y(d.value))
            .attr("fill", regionColors[region])
            .on("mouseover", showTooltip)
            .on("mouseout", hideTooltip);
    }
    
    // Atualizar eixos
    xAxis.transition().duration(500).call(d3.axisBottom(x));
    yAxis.transition().duration(500).call(d3.axisLeft(y));
}

// Atualizar legenda
function updateLegend(selectedRegion) {
    legend.selectAll("*").remove();
    
    const items = selectedRegion === "all" 
        ? Object.keys(regionColors) 
        : [selectedRegion];
    
    items.forEach(region => {
        legend.append("div")
            .attr("class", "legend-item")
            .html(`
                <div class="legend-color" style="background-color:${regionColors[region]}"></div>
                <span>${region}</span>
            `);
    });
}

// Tooltip functions
function showTooltip(event, d) {
    tooltip.transition()
        .duration(200)
        .style("opacity", .9);
    tooltip.html(`
        <strong>${d.region} - ${d.ageGroup}</strong><br/>
        População: ${d.value.toLocaleString('pt-BR')}<br/>
        Ano: ${document.getElementById("year-select").value}
    `)
    .style("left", (event.pageX + 5) + "px")
    .style("top", (event.pageY - 28) + "px");
}

function hideTooltip() {
    tooltip.transition()
        .duration(500)
        .style("opacity", 0);
}

// Controles interativos
let currentYear = "2016";
let animationInterval;

document.getElementById("region-select").addEventListener("change", updateAll);
document.getElementById("category-select").addEventListener("change", updateAll);
document.getElementById("year-select").addEventListener("change", function() {
    currentYear = this.value;
    updateAll();
});

document.getElementById("play-button").addEventListener("click", function() {
    if (animationInterval) {
        clearInterval(animationInterval);
        animationInterval = null;
        this.textContent = "Play Animação";
    } else {
        this.textContent = "Parar Animação";
        animationInterval = setInterval(() => {
            const years = ["2016", "2017", "2018"];
            const currentIndex = years.indexOf(currentYear);
            currentYear = years[(currentIndex + 1) % years.length];
            document.getElementById("year-select").value = currentYear;
            updateAll();
        }, 1500);
    }
});

// Função para atualizar tudo
function updateAll() {
    const region = document.getElementById("region-select").value;
    const category = document.getElementById("category-select").value;
    const year = document.getElementById("year-select").value;
    
    loadAllData().then(allData => {
        updateChart(allData, year, category, region);
    });
}

// Inicializar
loadAllData().then(allData => {
    updateChart(allData, "2016", "Total", "all");
});