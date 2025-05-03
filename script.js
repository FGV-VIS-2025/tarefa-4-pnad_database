// Variáveis globais
let mapaGeoJSON;
let dadosEducacao = {};
let estadosSelecionados = new Map();

// Inicialização
document.addEventListener('DOMContentLoaded', async function() {
  await carregarMapa();
  adicionarListeners();
});

// Carrega o mapa do Brasil
async function carregarMapa() {
  try {
    const width = 900;
    const height = 600;
    
    const svg = d3.select("#mapa")
      .attr("width", width)
      .attr("height", height);

    // Carrega o GeoJSON
    mapaGeoJSON = await d3.json("data/brazil-states.geojson");
    
    const projection = d3.geoMercator()
      .fitSize([width, height], mapaGeoJSON);
    
    const path = d3.geoPath().projection(projection);
    
    // Desenha os estados
    svg.selectAll("path")
      .data(mapaGeoJSON.features)
      .enter()
      .append("path")
      .attr("d", path)
      .attr("class", "estado")
      .attr("id", d => `estado-${d.properties.name.replace(/\s+/g, '-')}`)
      .attr("data-estado", d => d.properties.name)
      .attr("fill", "#6baed6")
      .attr("stroke", "#fff")
      .attr("stroke-width", 1)
      .on("click", function(event, d) {
        const estado = d.properties.name;
        if (estadosSelecionados.has(estado)) {
          estadosSelecionados.delete(estado);
          d3.select(this).classed("selecionado", false);
        } else {
          estadosSelecionados.set(estado, {});
          d3.select(this).classed("selecionado", true);
        }
        atualizarVisualizacao();
      });
    
    console.log("Mapa carregado com sucesso!");
    
  } catch (error) {
    console.error("Erro ao carregar o mapa:", error);
  }
}

// Adiciona listeners para os filtros
function adicionarListeners() {
  document.getElementById('regiao').addEventListener('change', async function() {
    const regiao = this.value;
    if (regiao) {
      await carregarDadosRegionais(regiao);
      popularFiltros();
    } else {
      resetarMapa();
    }
  });

  document.getElementById('indicador').addEventListener('change', atualizarFiltros);
  document.getElementById('variavelAbertura').addEventListener('change', atualizarFiltros);
  document.getElementById('categoria').addEventListener('change', atualizarFiltros);
  document.getElementById('variavelAbertura1').addEventListener('change', atualizarFiltros);
  document.getElementById('categoria1').addEventListener('change', atualizarFiltros);
}

// Carrega dados da região selecionada
async function carregarDadosRegionais(regiao) {
  try {
    const response = await fetch(`data/Brasil_e_${regiao}.csv`);
    if (!response.ok) throw new Error("Erro ao carregar dados");
    
    const text = await response.text();
    const linhas = text.split('\n').filter(l => l.trim() !== '');
    const headers = linhas[0].split(',');
    
    dadosEducacao[regiao] = linhas.slice(1).map(linha => {
      const valores = linha.split(',');
      const obj = {};
      headers.forEach((h, i) => obj[h.trim()] = valores[i]?.trim());
      return obj;
    });
    
    console.log(`Dados de ${regiao} carregados:`, dadosEducacao[regiao]);
    
  } catch (error) {
    console.error("Erro ao carregar dados:", error);
  }
}

// Atualiza os filtros disponíveis
function atualizarFiltros() {
  const regiao = document.getElementById('regiao').value;
  if (!regiao || !dadosEducacao[regiao]) return;
  
  const indicador = document.getElementById('indicador').value;
  const variavelAbertura = document.getElementById('variavelAbertura').value;
  const categoria = document.getElementById('categoria').value;
  const variavelAbertura1 = document.getElementById('variavelAbertura1').value;
  
  const filtrado = dadosEducacao[regiao].filter(item => 
    item['Nível Territorial'] === 'Unidade da Federação' &&
    (indicador === '' || item['Indicador'] === indicador) &&
    (variavelAbertura === '' || item['Variável de abertura'] === variavelAbertura) &&
    (categoria === '' || item['Categoria'] === categoria) &&
    (variavelAbertura1 === '' || item['Variável de abertura .1'] === variavelAbertura1)
  );
  
  popularFiltros(filtrado);
  atualizarVisualizacao();
}

// Preenche os filtros com opções disponíveis
function popularFiltros(dadosFiltrados = null) {
  const regiao = document.getElementById('regiao').value;
  if (!regiao || !dadosEducacao[regiao]) return;
  
  const dataToUse = dadosFiltrados || dadosEducacao[regiao];
  
  const indicadorSet = new Set();
  const variavelAberturaSet = new Set();
  const categoriaSet = new Set();
  const variavelAbertura1Set = new Set();
  const categoria1Set = new Set();
  
  dataToUse.forEach(item => {
    if(item['Nível Territorial'] === 'Unidade da Federação') {
      indicadorSet.add(item['Indicador']);
      variavelAberturaSet.add(item['Variável de abertura']);
      categoriaSet.add(item['Categoria']);
      variavelAbertura1Set.add(item['Variável de abertura .1']);
      categoria1Set.add(item['Categoria .1']);
    }
  });
  
  preencherSelect('indicador', indicadorSet, document.getElementById('indicador').value);
  preencherSelect('variavelAbertura', variavelAberturaSet, document.getElementById('variavelAbertura').value);
  preencherSelect('categoria', categoriaSet, document.getElementById('categoria').value);
  preencherSelect('variavelAbertura1', variavelAbertura1Set, document.getElementById('variavelAbertura1').value);
  preencherSelect('categoria1', categoria1Set, document.getElementById('categoria1').value);
}

// Preenche um select com opções
function preencherSelect(id, valores, valorAtual) {
  const select = document.getElementById(id);
  select.innerHTML = '<option value="">--Todos--</option>';
  valores.forEach(valor => {
    if (valor) { // Só adiciona se o valor não for nulo/undefined
      const option = document.createElement('option');
      option.value = valor;
      option.textContent = valor;
      select.appendChild(option);
    }
  });
  select.value = valorAtual;
}

// Atualiza a visualização do mapa com base nos filtros
function atualizarVisualizacao() {
  const regiao = document.getElementById('regiao').value;
  if (!regiao || !dadosEducacao[regiao]) {
    resetarMapa();
    return;
  }
  
  const indicador = document.getElementById('indicador').value;
  const variavelAbertura = document.getElementById('variavelAbertura').value;
  const categoria = document.getElementById('categoria').value;
  const variavelAbertura1 = document.getElementById('variavelAbertura1').value;
  const categoria1 = document.getElementById('categoria1').value;
  
  const dadosFiltrados = filtrarDados(regiao, indicador, variavelAbertura, categoria, variavelAbertura1, categoria1);
  
  // Atualiza as cores do mapa
  atualizarCoresMapa(dadosFiltrados);
  
  // Mantém estados selecionados destacados
  estadosSelecionados.forEach((_, estado) => {
    d3.select(`#estado-${estado.replace(/\s+/g, '-')}`)
      .classed("selecionado", true);
  });
}

// Filtra os dados com base nos critérios selecionados
function filtrarDados(regiao, indicador, variavelAbertura, categoria, variavelAbertura1, categoria1) {
  const resultados = {};
  
  if (!dadosEducacao[regiao]) return resultados;
  
  dadosEducacao[regiao].forEach(item => {
    if (item['Nível Territorial'] === 'Unidade da Federação' &&
        (indicador === '' || item['Indicador'] === indicador) &&
        (variavelAbertura === '' || item['Variável de abertura'] === variavelAbertura) &&
        (categoria === '' || item['Categoria'] === categoria) &&
        (variavelAbertura1 === '' || item['Variável de abertura .1'] === variavelAbertura1) &&
        (categoria1 === '' || item['Categoria .1'] === categoria1)) {
      
      const estado = item['Abertura Territorial'];
      // Usa o valor de 2018 como padrão
      resultados[estado] = parseFloat(item['2018']) || 0;
    }
  });
  
  return resultados;
}

// Atualiza as cores do mapa com base nos dados filtrados
function atualizarCoresMapa(dados) {
  // Se não há dados, reseta as cores
  if (Object.keys(dados).length === 0) {
    resetarMapa();
    return;
  }
  
  // Calcula escala de cores
  const valores = Object.values(dados);
  const maxValor = Math.max(...valores);
  const minValor = Math.min(...valores);
  
  const colorScale = d3.scaleSequential()
    .domain([minValor, maxValor])
    .interpolator(d3.interpolateBlues);
  
  // Aplica cores aos estados
  d3.selectAll(".estado")
    .attr("fill", d => {
      const estado = d.properties.name;
      return dados[estado] !== undefined ? colorScale(dados[estado]) : "#6baed6";
    });
}

// Reseta o mapa para o estado inicial
function resetarMapa() {
  d3.selectAll(".estado")
    .attr("fill", "#6baed6")
    .classed("selecionado", false);
}

// Reseta todos os filtros
function resetarFiltros() {
  document.getElementById('regiao').value = '';
  document.getElementById('indicador').value = '';
  document.getElementById('variavelAbertura').value = '';
  document.getElementById('categoria').value = '';
  document.getElementById('variavelAbertura1').value = '';
  document.getElementById('categoria1').value = '';
  resetarMapa();
}