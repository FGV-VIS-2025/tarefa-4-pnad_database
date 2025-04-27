// Configurações do gráfico
const margin = {top: 50, right: 30, bottom: 120, left: 60};
const width = 900 - margin.left - margin.right;
const height = 500 - margin.top - margin.bottom;

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
    .attr("y", height + margin.bottom - 50)
    .text("Grupos de Idade");

svg.append("text")
    .attr("class", "axis-label")
    .attr("transform", "rotate(-90)")
    .attr("x", -height / 2)
    .attr("y", -margin.left + 20)
    .text("População");

// Tooltip
const tooltip = d3.select("#tooltip");

// Variáveis de controle
let allData = {};
let currentYear = "2016";
let animationInterval = null;
const years = ["2016", "2017", "2018"];

// Carregar dados
async function loadData() {
    const regions = ["Sul", "Sudeste", "Centro-Oeste", "Nordeste", "Norte"];
    
    for (const region of regions) {
        const filename = `data/Brasil_e_${region.replace("-", "_")}.csv`;
        try {
            const data = await d3.csv(filename);
            allData[region] = processData(data);
        } catch (error) {
            console.error(`Erro ao carregar ${region}:`, error);
        }
    }
    
    updateChart();
}

// Processar dados
function processData(data) {
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
function updateChart() {
    const region = document.getElementById("region-select").value;
    const category = document.getElementById("category-select").value;
    const year = document.getElementById("year-select").value;
    
    // Limpar gráfico
    svg.selectAll(".bar").remove();
    
    // Preparar dados
    let chartData = [];
    if (region === "all") {
        for (const [reg, regData] of Object.entries(allData)) {
            regData.forEach(d => {
                chartData.push({
                    ageGroup: d.ageGroup,
                    value: d[`${category}${year}`],
                    region: reg
                });
            });
        }
    } else {
        chartData = allData[region].map(d => ({
            ageGroup: d.ageGroup,
            value: d[`${category}${year}`],
            region: region
        }));
    }
    
    // Atualizar escalas
    x.domain(chartData.map(d => d.ageGroup));
    y.domain([0, d3.max(chartData, d => d.value) * 1.1]);
    
    // Desenhar barras
    svg.selectAll(".bar")
        .data(chartData)
        .enter()
        .append("rect")
        .attr("class", "bar")
        .attr("x", d => x(d.ageGroup))
        .attr("width", x.bandwidth())
        .attr("y", d => y(d.value))
        .attr("height", d => height - y(d.value))
        .attr("fill", d => regionColors[d.region])
        .on("mouseover", showTooltip)
        .on("mouseout", hideTooltip);
    
    // Atualizar eixos
    xAxis.call(d3.axisBottom(x))
        .selectAll("text")
        .attr("transform", "rotate(-45)")
        .attr("text-anchor", "end")
        .attr("dx", "-0.5em")
        .attr("dy", "0.5em");
    
    yAxis.call(d3.axisLeft(y));
    
    // Atualizar legenda
    updateLegend(region);
}

// Funções de tooltip
function showTooltip(event, d) {
    tooltip.transition().duration(200).style("opacity", 0.9);
    tooltip.html(`
        <strong>${d.region} - ${d.ageGroup}</strong><br>
        População: ${d.value.toLocaleString('pt-BR')}<br>
        Ano: ${document.getElementById("year-select").value}
    `)
    .style("left", (event.pageX + 10) + "px")
    .style("top", (event.pageY - 30) + "px");
}

function hideTooltip() {
    tooltip.transition().duration(500).style("opacity", 0);
}

// Atualizar legenda
function updateLegend(region) {
    const legend = d3.select("#legend");
    legend.selectAll("*").remove();
    
    const items = region === "all" ? Object.keys(regionColors) : [region];
    
    items.forEach(reg => {
        legend.append("div")
            .attr("class", "legend-item")
            .html(`
                <div class="legend-color" style="background:${regionColors[reg]}"></div>
                <span>${reg}</span>
            `);
    });
}

// Controles de animação
function toggleAnimation() {
    const button = document.getElementById("play-button");
    
    if (animationInterval) {
        clearInterval(animationInterval);
        animationInterval = null;
        button.textContent = "▶ Play";
        button.classList.remove("active");
    } else {
        button.textContent = "⏸ Pausar";
        button.classList.add("active");
        animateStep();
        animationInterval = setInterval(animateStep, 1500);
    }
}

function animateStep() {
    const yearSelect = document.getElementById("year-select");
    const currentIndex = years.indexOf(yearSelect.value);
    const nextIndex = (currentIndex + 1) % years.length;
    yearSelect.value = years[nextIndex];
    updateChart();
}

// Event listeners
document.getElementById("region-select").addEventListener("change", updateChart);
document.getElementById("category-select").addEventListener("change", updateChart);
document.getElementById("year-select").addEventListener("change", updateChart);
document.getElementById("play-button").addEventListener("click", toggleAnimation);

// Inicializar
loadData();