
function createInteractiveChart(csvFilePath, divId) {
    d3.csv(csvFilePath).then(function(data) {
        const margin = {top: 20, right: 30, bottom: 40, left: 90},
              width = 800 - margin.left - margin.right,
              height = 400 - margin.top - margin.bottom;

        const svg = d3.select("#" + divId)
          .append("svg")
          .attr("width", width + margin.left + margin.right)
          .attr("height", height + margin.top + margin.bottom)
          .append("g")
          .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

        // X scale
        const x = d3.scaleLinear()
          .domain([0, d3.max(data, d => +d["2018"] || 0)])
          .range([0, width]);

        // Y scale
        const y = d3.scaleBand()
          .domain(data.map(d => d["Categoria .1"]))
          .range([0, height])
          .padding(0.1);

        svg.append("g")
          .call(d3.axisLeft(y));

        svg.selectAll(".bar")
          .data(data)
          .enter()
          .append("rect")
          .attr("class", "bar")
          .attr("y", d => y(d["Categoria .1"]))
          .attr("width", d => x(+d["2018"] || 0))
          .attr("height", y.bandwidth())
          .attr("fill", "#00bfff");

        // Tooltip
        const tooltip = d3.select("body").append("div")
          .style("position", "absolute")
          .style("background", "#222")
          .style("color", "#fff")
          .style("padding", "5px 10px")
          .style("border-radius", "5px")
          .style("opacity", 0);

        svg.selectAll("rect")
          .on("mouseover", function(event, d) {
            tooltip.transition().duration(200).style("opacity", .9);
            tooltip.html(d["Categoria .1"] + "<br/>" + d["2018"])
              .style("left", (event.pageX + 5) + "px")
              .style("top", (event.pageY - 28) + "px");
          })
          .on("mouseout", function(d) {
            tooltip.transition().duration(500).style("opacity", 0);
          });

    }).catch(function(error){
        console.log("Erro ao carregar ou processar CSV: " + csvFilePath, error);
    });
}

// Chamadas para cada gráfico
createInteractiveChart("data/Brasil_e_Centro-Oeste.csv", "viz-centro-oeste");
createInteractiveChart("data/Brasil_e_GR.csv", "viz-gr");
createInteractiveChart("data/Brasil_e_Nordeste_1.csv", "viz-nordeste-1");
createInteractiveChart("data/Brasil_e_Nordeste_2.csv", "viz-nordeste-2");
createInteractiveChart("data/Brasil_e_Norte.csv", "viz-norte");
createInteractiveChart("data/Brasil_e_Sudeste.csv", "viz-sudeste");
createInteractiveChart("data/Brasil_e_Sul.csv", "viz-sul");
