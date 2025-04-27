// Configurações do gráfico
const margin = {top: 50, right: 30, bottom: 70, left: 60};
const width = 800 - margin.left - margin.right;
const height = 500 - margin.top - margin.bottom;

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
    .attr("y", height + margin.bottom - 10)
    .text("Grupos de Idade");

svg.append("text")
    .attr("class", "axis-label")
    .attr("transform", "rotate(-90)")
    .attr("x", -height / 2)
    .attr("y", -margin.left + 15)
    .text("População");

// Tooltip
const tooltip = d3.select("#tooltip");

// Dados (simplificados - você deve carregar seu CSV real aqui)
const data = [
    {ageGroup: "0 a 3 anos", Total2016: 10223.232, Total2017: 10141.908, Total2018: 10171.73},
    {ageGroup: "4 a 5 anos", Total2016: 5262.563, Total2017: 5268.945, Total2018: 5350.824},
    {ageGroup: "6 a 9 anos", Total2016: 11100.37, Total2017: 10962.806, Total2018: 10947.352},
    {ageGroup: "10 a 14 anos", Total2016: 15485.672, Total2017: 15363.81, Total2018: 15023.146},
    {ageGroup: "15 a 17 anos", Total2016: 18617.588, Total2017: 10426.676, Total2018: 9752.471},
    {ageGroup: "18 a 24 anos", Total2016: 22284.286, Total2017: 22727.774, Total2018: 22708.814},
    {ageGroup: "25 a 29 anos", Total2016: 13596.59, Total2017: 15138.452, Total2018: 14590.647},
    {ageGroup: "30 a 39 anos", Total2016: 32134.993, Total2017: 32467.297, Total2018: 32597.356},
    {ageGroup: "40 a 59 anos", Total2016: 52447.78, Total2017: 53172.422, Total2018: 54106.608},
    {ageGroup: "60 anos ou mais", Total2016: 29582.959, Total2017: 30334.56, Total2018: 32114.474}
];

// Função para atualizar o gráfico
function updateChart(year, category = "Total") {
    const yearKey = `${category}${year}`;
    
    // Atualizar escalas
    x.domain(data.map(d => d.ageGroup));
    y.domain([0, d3.max(data, d => d[yearKey])]);
    
    // Atualizar eixos
    xAxis.transition().duration(500).call(d3.axisBottom(x));
    yAxis.transition().duration(500).call(d3.axisLeft(y));
    
    // Atualizar barras
    const bars = svg.selectAll(".bar")
        .data(data, d => d.ageGroup);
    
    // Remover barras antigas
    bars.exit().remove();
    
    // Adicionar novas barras
    bars.enter()
        .append("rect")
        .attr("class", "bar")
        .attr("x", d => x(d.ageGroup))
        .attr("width", x.bandwidth())
        .attr("y", height)
        .attr("height", 0)
        .merge(bars)
        .transition()
        .duration(500)
        .attr("x", d => x(d.ageGroup))
        .attr("width", x.bandwidth())
        .attr("y", d => y(d[yearKey]))
        .attr("height", d => height - y(d[yearKey]));
    
    // Tooltip interativo
    svg.selectAll(".bar")
        .on("mouseover", function(event, d) {
            tooltip.transition()
                .duration(200)
                .style("opacity", .9);
            tooltip.html(`<strong>${d.ageGroup}</strong><br/>${d[yearKey].toLocaleString()} pessoas`)
                .style("left", (event.pageX + 5) + "px")
                .style("top", (event.pageY - 28) + "px");
        })
        .on("mouseout", function() {
            tooltip.transition()
                .duration(500)
                .style("opacity", 0);
        });
}

// Controles interativos
let currentYear = 2016;
let animationInterval;

document.getElementById("category-select").addEventListener("change", function() {
    const category = this.value;
    updateChart(currentYear, category);
});

document.getElementById("play-button").addEventListener("click", function() {
    if (animationInterval) {
        clearInterval(animationInterval);
        animationInterval = null;
        this.textContent = "Play Animação";
    } else {
        this.textContent = "Parar Animação";
        animationInterval = setInterval(() => {
            currentYear = currentYear < 2018 ? currentYear + 1 : 2016;
            const category = document.getElementById("category-select").value;
            updateChart(currentYear, category);
        }, 1000);
    }
});

// Inicializar gráfico
updateChart(2016);