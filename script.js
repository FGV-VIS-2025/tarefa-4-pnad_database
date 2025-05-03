// Variáveis globais
let mapaGeoJSON;

// Carrega o mapa imediatamente
document.addEventListener('DOMContentLoaded', function() {
  // carregarMapaBasico();
  
  // Depois carrega o mapa completo
  carregarMapa();
});

async function carregarMapa() {
  try {
    const width = 900;
    const height = 600;
    const svg = d3.select("#mapa");

    // Carrega o GeoJSON
    mapaGeoJSON = await d3.json("data/brazil-states.geojson");
    
    // Verifica os limites do GeoJSON
    const bounds = d3.geoBounds(mapaGeoJSON);
    console.log("Limites do GeoJSON:", bounds);

    // Configura projeção otimizada
    const projection = d3.geoMercator()
      .center([-54, -15])  // Centro do Brasil
      .scale(850)         // Ajuste este valor
      .translate([width/2, height/2]);

    const path = d3.geoPath().projection(projection);

    // Desenha o mapa com tratamento para buracos
    svg.selectAll("path")
      .data(mapaGeoJSON.features)
      .enter()
      .append("path")
      .attr("d", path)
      .attr("fill", "#6baed6")
      .attr("stroke", "#fff")
      .attr("stroke-width", 1)
      .attr("stroke-linejoin", "round");  // Suaviza bordas

    // Adiciona fundo para áreas vazias
    svg.insert("rect", ":first-child")
      .attr("width", width)
      .attr("height", height)
      .attr("fill", "#f0f0f0");

  } catch (error) {
    console.error("Erro:", error);
  }
}

// Carrega dados da região selecionada
async function carregarDadosRegionais(regiao) {
  try {
    const arquivo = `data/Brasil_e_${regiao}.csv`;
    const response = await fetch(arquivo);
    
    if (!response.ok) throw new Error(`Erro ${response.status} ao carregar arquivo`);
    
    const text = await response.text();
    const linhas = text.split('\n').filter(l => l.trim() !== '');
    
    if (linhas.length < 2) throw new Error('Arquivo CSV vazio ou mal formatado');
    
    const headers = linhas[0].split(',');
    
    dadosCSV[regiao] = linhas.slice(1).map(linha => {
      const valores = linha.split(',');
      const obj = {};
      headers.forEach((h, i) => obj[h.trim()] = valores[i]?.trim());
      return obj;
    });
    
    console.log(`Dados de ${regiao} carregados com sucesso`);
    
  } catch (error) {
    console.error('Erro ao carregar dados:', error);
    alert(`Erro ao carregar dados: ${error.message}`);
  }
}

// Atualiza a visualização com base nos filtros selecionados
function atualizarVisualizacao() {
  const indicador = document.getElementById('indicador').value;
  
  if (!indicador) {
    // Se nenhum indicador selecionado, mostra mapa padrão
    d3.selectAll(".estado")
      .style("fill", "#6baed6")
      .classed("ativo", false);
    
    d3.select("#grafico-barras").selectAll("*").remove();
    return;
  }
  
  // Atualiza os estados selecionados com o indicador atual
  estadosSelecionados.forEach((filtros, estado) => {
    filtros.indicador = indicador;
  });
  
  // Filtra os dados
  const dadosFiltrados = filtrarDados(indicador);
  
  // Atualiza o mapa
  atualizarCoresMapa(dadosFiltrados);
  
  // Atualiza o gráfico
  atualizarGrafico(dadosFiltrados);
}

// Filtra os dados com base no indicador selecionado
function filtrarDados(indicador) {
  const resultados = [];
  
  for (const regiao in dadosCSV) {
    estadosSelecionados.forEach((filtros, estado) => {
      const dadosEstado = dadosCSV[regiao].filter(item => 
        item['Unidade da Federação'] === estado &&
        item['Indicador'] === indicador
      );
      
      if (dadosEstado.length > 0) {
        const valores = {
          2016: parseFloat(dadosEstado[0]['2016']) || 0,
          2017: parseFloat(dadosEstado[0]['2017']) || 0,
          2018: parseFloat(dadosEstado[0]['2018']) || 0
        };
        
        resultados.push({
          estado,
          indicador,
          valores: [valores[2016], valores[2017], valores[2018]],
          media: (valores[2016] + valores[2017] + valores[2018]) / 3
        });
      }
    });
  }
  
  return resultados;
}

// Atualiza as cores do mapa com base nos dados filtrados
function atualizarCoresMapa(dados) {
  if (dados.length === 0) {
    d3.selectAll(".estado").style("fill", "#ccc");
    return;
  }
  
  // Calcula escala de cores
  const valores = dados.flatMap(d => d.valores);
  const minValor = Math.min(...valores);
  const maxValor = Math.max(...valores);
  
  const colorScale = d3.scaleSequential()
    .domain([minValor, maxValor])
    .interpolator(d3.interpolateBlues);
  
  // Aplica cores
  d3.selectAll(".estado").style("fill", "#ccc");
  
  dados.forEach(dado => {
    d3.select(`#estado-${dado.estado.replace(/\s+/g, '-')}`)
      .style("fill", colorScale(dado.media));
  });
  
  // Atualiza legenda
  atualizarLegendaCores(minValor, maxValor);
}

// Atualiza a legenda de cores
function atualizarLegendaCores(minValor, maxValor) {
  const svg = d3.select("#mapa svg");
  svg.selectAll(".legenda-cores").remove();
  
  const legendWidth = 200;
  const legendHeight = 20;
  const legendMargin = {top: 20, right: 30, bottom: 30, left: 40};
  
  const legendGroup = svg.append("g")
    .attr("class", "legenda-cores")
    .attr("transform", `translate(${legendMargin.left}, ${legendMargin.top})`);
  
  // Cria escala para a legenda
  const colorScale = d3.scaleSequential()
    .domain([minValor, maxValor])
    .interpolator(d3.interpolateBlues);
  
  // Gradiente de cores
  const defs = svg.append("defs");
  const linearGradient = defs.append("linearGradient")
    .attr("id", "gradient")
    .attr("x1", "0%")
    .attr("y1", "0%")
    .attr("x2", "100%")
    .attr("y2", "0%");
  
  linearGradient.selectAll("stop")
    .data(d3.range(0, 1.01, 0.1))
    .enter().append("stop")
    .attr("offset", d => d * 100 + "%")
    .attr("stop-color", d => colorScale(minValor + d * (maxValor - minValor)));
  
  // Retângulo com gradiente
  legendGroup.append("rect")
    .attr("width", legendWidth)
    .attr("height", legendHeight)
    .style("fill", "url(#gradient)");
  
  // Eixo com valores
  const xScale = d3.scaleLinear()
    .domain([minValor, maxValor])
    .range([0, legendWidth]);
  
  const xAxis = d3.axisBottom(xScale).ticks(5);
  
  legendGroup.append("g")
    .attr("transform", `translate(0, ${legendHeight})`)
    .call(xAxis);
  
  // Título da legenda
  legendGroup.append("text")
    .attr("x", legendWidth / 2)
    .attr("y", -5)
    .attr("text-anchor", "middle")
    .text("Valor do Indicador");
}

// Atualiza o gráfico de barras comparativo
function atualizarGrafico(dados) {
  const svg = d3.select("#grafico-barras");
  svg.selectAll("*").remove();
  
  if (dados.length === 0) {
    svg.append("text")
      .attr("x", 450)
      .attr("y", 200)
      .attr("text-anchor", "middle")
      .text("Selecione estados e filtros para visualizar os dados");
    return;
  }
  
  const margin = {top: 40, right: 30, bottom: 100, left: 60};
  const width = +svg.attr("width") - margin.left - margin.right;
  const height = +svg.attr("height") - margin.top - margin.bottom;
  
  // Escalas
  const maxValor = d3.max(dados, d => d3.max(d.valores));
  
  const x = d3.scaleBand()
    .domain(dados.map(d => d.estado))
    .range([margin.left, width + margin.left])
    .padding(0.2);
  
  const y = d3.scaleLinear()
    .domain([0, maxValor * 1.1])
    .nice()
    .range([height + margin.top, margin.top]);
  
  const color = d3.scaleOrdinal()
    .domain(["2016", "2017", "2018"])
    .range(["#1f77b4", "#ff7f0e", "#2ca02c"]);
  
  // Barras agrupadas
  const barWidth = x.bandwidth() / 3;
  
  dados.forEach((estado, i) => {
    estado.valores.forEach((valor, j) => {
      svg.append("rect")
        .attr("x", x(estado.estado) + j * barWidth)
        .attr("y", y(valor))
        .attr("width", barWidth - 2)
        .attr("height", height + margin.top - y(valor))
        .attr("fill", color(`201${6+j}`));
    });
  });
  
  // Eixos
  svg.append("g")
    .attr("transform", `translate(0, ${height + margin.top})`)
    .call(d3.axisBottom(x))
    .selectAll("text")
    .attr("transform", "rotate(-45)")
    .attr("text-anchor", "end")
    .attr("dx", "-.8em")
    .attr("dy", ".15em");
  
  svg.append("g")
    .attr("transform", `translate(${margin.left}, 0)`)
    .call(d3.axisLeft(y));
  
  // Título
  svg.append("text")
    .attr("x", width / 2 + margin.left)
    .attr("y", margin.top / 2)
    .attr("text-anchor", "middle")
    .style("font-size", "16px")
    .text(dados[0].indicador);
  
  // Legenda
  const legend = svg.append("g")
    .attr("transform", `translate(${width - 100}, ${margin.top})`);
  
  ["2016", "2017", "2018"].forEach((d, i) => {
    const legendItem = legend.append("g")
      .attr("transform", `translate(0, ${i * 20})`);
    
    legendItem.append("rect")
      .attr("width", 18)
      .attr("height", 18)
      .attr("fill", color(d));
    
    legendItem.append("text")
      .attr("x", 24)
      .attr("y", 9)
      .attr("dy", ".35em")
      .text(d);
  });
  
  // Informações dos filtros
  svg.append("text")
    .attr("x", margin.left)
    .attr("y", height + margin.top + 40)
    .text(`Sexo: ${dados[0].sexo} | Idade: ${dados[0].idade} | Cor: ${dados[0].cor}`)
    .style("font-size", "12px");
}