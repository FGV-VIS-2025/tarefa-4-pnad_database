// Carrega os dados da PNAD (formato CSV como exemplo)
d3.csv("data/pnad_data.csv").then(data => {
    // Processa e plota os dados aqui
    console.log("Dados carregados:", data);
  
    // Exemplo: cria um SVG vazio
    const svg = d3.select("#viz")
      .append("svg")
      .attr("width", 800)
      .attr("height", 600);
  
    // Exemplo de círculo
    svg.append("circle")
      .attr("cx", 100)
      .attr("cy", 100)
      .attr("r", 40)
      .style("fill", "steelblue");
  });
  