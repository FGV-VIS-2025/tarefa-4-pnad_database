// Variáveis globais
let mapaGeoJSON;
let dadosEducacao = {};
let estadosSelecionados = new Map();

// Filtros disponíveis
const filtrosDisponiveis = {
  indicador: ["Taxa de Analfabetismo (%)", "Número médio de anos de estudo"],
  sexo: ["Homem", "Mulher", "Total"],
  idade: ["0 a 5 anos", "6 a 14 anos", "15 a 17 anos", "18 a 24 anos", "25 anos ou mais"],
  cor: ["Branca", "Preta ou parda"]
};

// Inicialização
document.addEventListener('DOMContentLoaded', async function() {
  await carregarMapa();
  inicializarFiltros();
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

// Inicializa os filtros
function inicializarFiltros() {
  // Preenche os selects com opções disponíveis
  for (const [filtro, opcoes] of Object.entries(filtrosDisponiveis)) {
    const select = document.getElementById(filtro);
    if (select) {
      select.innerHTML = '<option value="">--Selecione--</option>';
      opcoes.forEach(opcao => {
        const option = document.createElement('option');
        option.value = opcao;
        option.textContent = opcao;
        select.appendChild(option);
      });
      
      // Adiciona listener para atualização
      select.addEventListener('change', atualizarVisualizacao);
    }
  }
  
  // Listener especial para a região (carrega dados)
  document.getElementById('regiao').addEventListener('change', async function() {
    const regiao = this.value;
    if (regiao) {
      await carregarDadosRegionais(regiao);
    }
    atualizarVisualizacao();
  });
}

// Carrega dados da região selecionada
async function carregarDadosRegionais(regiao) {
  try {
    const response = await fetch(`data/Brasil_e_${regiao}.csv`);
    if (!response.ok) throw new Error("Erro ao carregar dados");
    
    const text = await response.text();
    const linhas = text.split('\n').filter(l => l.trim() !== '');
    const headers = linhas[0].split(',');
    
    dadosEducacao[regiao] = {};
    
    linhas.slice(1).forEach(linha => {
      const valores = linha.split(',');
      const estado = valores[headers.indexOf('Unidade da Federação')];
      const indicador = valores[headers.indexOf('Indicador')];
      const sexo = valores[headers.indexOf('Sexo')];
      const idade = valores[headers.indexOf('Grupos de idade')];
      const cor = valores[headers.indexOf('Cor ou raça')];
      const valor = parseFloat(valores[headers.length - 1]); // Última coluna
      
      if (!dadosEducacao[regiao][estado]) {
        dadosEducacao[regiao][estado] = {};
      }
      
      // Estrutura hierárquica: indicador > sexo > idade > cor
      if (!dadosEducacao[regiao][estado][indicador]) {
        dadosEducacao[regiao][estado][indicador] = {};
      }
      if (!dadosEducacao[regiao][estado][indicador][sexo]) {
        dadosEducacao[regiao][estado][indicador][sexo] = {};
      }
      if (!dadosEducacao[regiao][estado][indicador][sexo][idade]) {
        dadosEducacao[regiao][estado][indicador][sexo][idade] = {};
      }
      
      dadosEducacao[regiao][estado][indicador][sexo][idade][cor] = valor;
    });
    
    console.log(`Dados de ${regiao} carregados:`, dadosEducacao[regiao]);
    
  } catch (error) {
    console.error("Erro ao carregar dados:", error);
  }
}

// Atualiza a visualização com base nos filtros
function atualizarVisualizacao() {
  const regiao = document.getElementById('regiao').value;
  const indicador = document.getElementById('indicador').value;
  const sexo = document.getElementById('sexo').value;
  const idade = document.getElementById('idade').value;
  const cor = document.getElementById('cor').value;
  
  // Se não tem região ou indicador selecionado, reseta o mapa
  if (!regiao || !indicador) {
    d3.selectAll(".estado")
      .attr("fill", "#6baed6")
      .classed("selecionado", false);
    return;
  }
  
  // Obtém os dados filtrados
  const dadosFiltrados = filtrarDados(regiao, indicador, sexo, idade, cor);
  
  // Atualiza as cores do mapa
  atualizarCoresMapa(dadosFiltrados);
  
  // Atualiza estados selecionados
  estadosSelecionados.forEach((_, estado) => {
    d3.select(`#estado-${estado.replace(/\s+/g, '-')}`)
      .classed("selecionado", true);
  });
}

// Filtra os dados com base nos critérios selecionados
function filtrarDados(regiao, indicador, sexo, idade, cor) {
  const resultados = {};
  
  if (!dadosEducacao[regiao]) return resultados;
  
  // Para cada estado na região
  for (const [estado, dadosEstado] of Object.entries(dadosEducacao[regiao])) {
    // Verifica se há dados para os filtros selecionados
    if (dadosEstado[indicador]) {
      let valores = dadosEstado[indicador];
      
      if (sexo) valores = valores[sexo] || {};
      if (idade) valores = valores[idade] || {};
      if (cor) valores = valores[cor] !== undefined ? {[cor]: valores[cor]} : {};
      
      // Se encontrou algum valor, adiciona aos resultados
      if (Object.values(valores).length > 0) {
        resultados[estado] = Object.values(valores)[0]; // Pega o primeiro valor encontrado
      }
    }
  }
  
  return resultados;
}

// Atualiza as cores do mapa com base nos dados filtrados
function atualizarCoresMapa(dados) {
  // Se não há dados, reseta as cores
  if (Object.keys(dados).length === 0) {
    d3.selectAll(".estado")
      .attr("fill", "#6baed6");
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
      return dados[estado] ? colorScale(dados[estado]) : "#ccc";
    });
}