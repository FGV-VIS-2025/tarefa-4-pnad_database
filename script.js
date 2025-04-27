
const regions = [
  { file: "./data/Brasil_e_Centro-Oeste.csv", id: "viz-centro-oeste" },
  { file: "./data/Brasil_e_GR.csv", id: "viz-gr" },
  { file: "./data/Brasil_e_Nordeste_1.csv", id: "viz-nordeste-1" },
  { file: "./data/Brasil_e_Nordeste_2.csv", id: "viz-nordeste-2" },
  { file: "./data/Brasil_e_Norte.csv", id: "viz-norte" },
  { file: "./data/Brasil_e_Sudeste.csv", id: "viz-sudeste" },
  { file: "./data/Brasil_e_Sul.csv", id: "viz-sul" }
];

const yearRange = document.getElementById("yearRange");
const yearValue = document.getElementById("yearValue");
const sexoFilter = document.getElementById("sexoFilter");

regions.forEach(region => {
  createChart(region.file, region.id);
});

function createChart(csvPath, divId) {
  const loadingMessage = document.getElementById("loadingMessage");
  loadingMessage.style.display = "block";  // Exibe a mensagem de carregamento

  d3.csv(csvPath, d3.autoType, { delimiter: ";" }).then(data => {
    loadingMessage.style.display = "none";  // Oculta a mensagem quando os dados são carregados

    const container = d3.select("#" + divId);
    const margin = { top: 20, right: 30, bottom: 40, left: 120 },
          width = 800 - margin.left - margin.right,
          height = 500 - margin.top - margin.bottom;

    const svg = container.append("svg")
      .attr("width", "100%")
      .attr("viewBox", "0 0 800 500")
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    const x = d3.scaleLinear().range([0, width]);
    const y = d3.scaleBand().range([0, height]).padding(0.2);

    const tooltip = container.append("div")
      .attr("class", "tooltip");

    function updateChart() {
      const selectedYear = yearRange.value;
      const selectedSexo = sexoFilter.value;

      yearValue.textContent = selectedYear;

      const filteredData = data.filter(d => d["Categoria"] === selectedSexo && d["Categoria .1"] !== "");

      x.domain([0, d3.max(filteredData, d => +d[selectedYear])]);
      y.domain(filteredData.map(d => d["Categoria .1"]));

      const bars = svg.selectAll("rect")
        .data(filteredData, d => d["Categoria .1"]);

      bars.join(
        enter => enter.append("rect")
          .attr("x", 0)
          .attr("y", d => y(d["Categoria .1"]))
          .attr("height", y.bandwidth())
          .attr("width", 0)
          .attr("fill", "#00bfff")
          .on("mouseover", (event, d) => {
            tooltip.style("opacity", 1)
              .html(`<strong>Sexo:</strong> ${d["Categoria"]}<br>
                     <strong>Idade:</strong> ${d["Categoria .1"]}<br>
                     <strong>População:</strong> ${(+d[selectedYear]).toLocaleString('pt-BR')} pessoas`)
              .style("left", (event.pageX + 10) + "px")
              .style("top", (event.pageY - 20) + "px");
          })
          .on("mouseout", () => tooltip.style("opacity", 0))
          .transition()
          .duration(800)
          .attr("width", d => x(+d[selectedYear])),

        update => update.transition()
          .duration(800)
          .attr("y", d => y(d["Categoria .1"]))
          .attr("height", y.bandwidth())
          .attr("width", d => x(+d[selectedYear]))
      );

      svg.selectAll(".axis").remove();

      svg.append("g")
        .attr("class", "axis")
        .call(d3.axisLeft(y));

      svg.append("g")
        .attr("class", "axis")
        .attr("transform", `translate(0,${height})`)
        .call(d3.axisBottom(x).ticks(5).tickFormat(d3.format(".2s")));
    }

    updateChart();

    yearRange.addEventListener("input", updateChart);
    sexoFilter.addEventListener("change", updateChart);

  }).catch(error => {
    console.log("Erro ao carregar o CSV:", error);
    loadingMessage.style.display = "none";  // Oculta a mensagem em caso de erro
  });
}
