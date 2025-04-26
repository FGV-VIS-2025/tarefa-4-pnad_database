function createInteractiveChart(csvPath, containerId) {
  d3.csv(csvPath).then(data => {
    const width = 700;
    const height = 450;
    const margin = {top: 50, right: 30, bottom: 70, left: 70};

    const svg = d3.select(`#${containerId}`)
      .append("svg")
      .attr("width", width)
      .attr("height", height);

    const g = svg.append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    const x = d3.scaleBand().padding(0.2).range([0, width - margin.left - margin.right]);
    const y = d3.scaleLinear().range([height - margin.top - margin.bottom, 0]);

    const xAxis = g.append("g").attr("transform", `translate(0,${height - margin.top - margin.bottom})`);
    const yAxis = g.append("g");

    // Criar Dropdown de Sexo
    const sexOptions = Array.from(new Set(data.map(d => d["Categoria"])));
    const sexSelector = d3.select(`#${containerId}`)
      .append("select")
      .attr("id", `sexo-${containerId}`)
      .on("change", updateChart);

    sexSelector.selectAll("option")
      .data(sexOptions)
      .enter()
      .append("option")
      .attr("value", d => d)
      .text(d => d);

    // Criar Slider de Ano
    const years = ["2016", "2017", "2018"]; // ou pegar programaticamente se quiser
    const yearSelector = d3.select(`#${containerId}`)
      .append("input")
      .attr("type", "range")
      .attr("min", 0)
      .attr("max", years.length - 1)
      .attr("value", 0)
      .attr("step", 1)
      .attr("id", `ano-${containerId}`)
      .on("input", updateChart);

    d3.select(`#${containerId}`)
      .append("div")
      .attr("id", `label-ano-${containerId}`)
      .style("margin-bottom", "20px")
      .style("font-weight", "bold");

    function updateChart() {
      const selectedSexo = d3.select(`#sexo-${containerId}`).property("value");
      const selectedYearIndex = +d3.select(`#ano-${containerId}`).property("value");
      const selectedYear = years[selectedYearIndex];

      d3.select(`#label-ano-${containerId}`).text(`Ano: ${selectedYear}`);

      const filteredData = data.filter(d => d["Categoria"] === selectedSexo && d["Categoria .1"] !== "Total");

      x.domain(filteredData.map(d => d["Categoria .1"]));
      y.domain([0, d3.max(filteredData, d => +d[selectedYear])]);

      xAxis.transition().duration(750).call(d3.axisBottom(x)).selectAll("text")
        .attr("transform", "rotate(-45)")
        .style("text-anchor", "end");

      yAxis.transition().duration(750).call(d3.axisLeft(y));

      const bars = g.selectAll("rect").data(filteredData, d => d["Categoria .1"]);

      bars.enter()
        .append("rect")
        .attr("x", d => x(d["Categoria .1"]))
        .attr("y", y(0))
        .attr("width", x.bandwidth())
        .attr("height", 0)
        .attr("fill", "#69b3a2")
        .merge(bars)
        .transition()
        .duration(750)
        .attr("x", d => x(d["Categoria .1"]))
        .attr("y", d => y(+d[selectedYear]))
        .attr("width", x.bandwidth())
        .attr("height", d => height - margin.top - margin.bottom - y(+d[selectedYear]));

      bars.exit().remove();
    }

    updateChart();
  });
}

// Agora chame para cada gráfico:

createInteractiveChart("data/Brasil_e_Centro-Oeste.csv", "viz-centro-oeste");
createInteractiveChart("data/Brasil_e_GR.csv", "viz-gr");
createInteractiveChart("data/Brasil_e_Nordeste_1.csv", "viz-nordeste-1");
createInteractiveChart("data/Brasil_e_Nordeste_2.csv", "viz-nordeste-2");
createInteractiveChart("data/Brasil_e_Norte.csv", "viz-norte");
createInteractiveChart("data/Brasil_e_Sudeste.csv", "viz-sudeste");
createInteractiveChart("data/Brasil_e_Sul.csv", "viz-sul");
