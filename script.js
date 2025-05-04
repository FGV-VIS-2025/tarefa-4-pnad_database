// Variáveis globais
let mapaGeoJSON;
let dadosEducacao = [];
let estadosSelecionados = new Map();
const regioes = ['Centro-Oeste', 'Nordeste', 'Norte', 'Sudeste', 'Sul'];

// Inicialização
document.addEventListener('DOMContentLoaded', async function() {
  await carregarMapa();
  await carregarTodosDadosRegionais();
  adicionarListeners();

  //Primeiro popula todos os filtros
  popularFiltros();

  //Depois define o indicador padrão
  definirIndicadorPadrao();
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

// Carrega dados de todas as regiões
async function carregarTodosDadosRegionais() {
  try {
    // Carrega dados de todas as regiões
    for (const regiao of regioes) {
      const response = await fetch(`data/Brasil_e_${regiao}.csv`);
      if (!response.ok) throw new Error(`Erro ao carregar dados da região ${regiao}`);
      
      const text = await response.text();
      const linhas = text.split('\n').filter(l => l.trim() !== '');
      const headers = linhas[0].split(',');
      
      const dadosRegiao = linhas.slice(1).map(linha => {
        const valores = linha.split(',');
        const obj = {};
        headers.forEach((h, i) => obj[h.trim()] = valores[i]?.trim());
        return obj;
      });
      
      // Filtra apenas os dados de Unidade da Federação e adiciona ao array principal
      dadosEducacao = dadosEducacao.concat(
        dadosRegiao.filter(
          item => item['Nível Territorial'] === 'Unidade da Federação' &&
          !item['Indicador']?.startsWith('CV - ')
        )
      );
    }
    
    console.log("Todos os dados regionais carregados:", dadosEducacao);
    
  } catch (error) {
    console.error("Erro ao carregar dados regionais:", error);
  }
}

// Adiciona listeners para os filtros
function adicionarListeners() {
  // Listener para o botão de reset
  document.getElementById('resetButton').addEventListener('click', resetarParaPadrao);

  // Listeners para os filtros
  document.getElementById('indicador').addEventListener('change', atualizarFiltros);
  document.getElementById('variavelAbertura').addEventListener('change', atualizarFiltros);
  document.getElementById('categoria').addEventListener('change', atualizarFiltros);
  document.getElementById('variavelAbertura1').addEventListener('change', atualizarFiltros);
  document.getElementById('categoria1').addEventListener('change', atualizarFiltros);
}

// Define o indicador padrão
function definirIndicadorPadrao() {
  const selectIndicador = document.getElementById('indicador');
  const opcaoPadrao = Array.from(selectIndicador.options).find(
    option => option.text.includes('Taxa de analfabetismo (%)')
  );

  if (opcaoPadrao) {
    selectIndicador.value = opcaoPadrao.value;
    // Força a atualização dos filtros secundários
    atualizarFiltros();
  }
}

// Reseta para o estado padrão (Taxa de analfabetismo)
function resetarParaPadrao() {
  // Reseta todos os filtros exceto o indicador
  document.getElementById('variavelAbertura').value = '';
  document.getElementById('categoria').value = '';
  document.getElementById('variavelAbertura1').value = '';
  document.getElementById('categoria1').value = '';
  
  // Define o indicador padrão
  definirIndicadorPadrao();
}

// Atualiza os filtros disponíveis
function atualizarFiltros() {
  const indicador = document.getElementById('indicador').value;
  const variavelAbertura = document.getElementById('variavelAbertura').value;
  const categoria = document.getElementById('categoria').value;
  const variavelAbertura1 = document.getElementById('variavelAbertura1').value;
  const categoria1 = document.getElementById('categoria1').value;
  
  // Filtra os dados baseado nas seleções atuais
  const dadosFiltrados = dadosEducacao.filter(item => 
    item['Nível Territorial'] === 'Unidade da Federação' &&
    !item['Indicador']?.startsWith('CV - ') &&
    (indicador === '' || item['Indicador'] === indicador) &&
    (variavelAbertura === '' || item['Variável de abertura'] === variavelAbertura) &&
    (categoria === '' || item['Categoria'] === categoria) &&
    (variavelAbertura1 === '' || item['Variável de abertura .1'] === variavelAbertura1) &&
    (categoria1 === '' || item['Categoria .1'] === categoria1)
  );

  // Atualiza os filtros secundários mantendo os valores válidos
  atualizarFiltrosSecundarios(dadosFiltrados, {
    variavelAbertura,
    categoria,
    variavelAbertura1,
    categoria1
  });

  // Atualiza a visualização do mapa
  atualizarVisualizacao();
}

function atualizarFiltrosSecundarios(dadosFiltrados, currentValues) {
  // Coletar opções disponíveis
  const variavelAberturaSet = new Set();
  const categoriaSet = new Set();
  const variavelAbertura1Set = new Set();
  const categoria1Set = new Set();

  dadosFiltrados.forEach(item => {
    if (item['Variável de abertura']) variavelAberturaSet.add(item['Variável de abertura']);
    if (item['Categoria']) categoriaSet.add(item['Categoria']);
    if (item['Variável de abertura .1']) variavelAbertura1Set.add(item['Variável de abertura .1']);
    if (item['Categoria .1']) categoria1Set.add(item['Categoria .1']);
  });

  // Atualizar os selects mantendo valores válidos
  const updateSelect = (id, options, currentValue) => {
    const select = document.getElementById(id);
    const currentOption = select.options[select.selectedIndex];
    
    // Só atualiza se o valor atual não estiver mais nas opções
    if (currentValue && !options.has(currentValue)) {
      select.value = '';
    }
    
    // Mantém o valor atual se ainda for válido
    const newValue = options.has(currentValue) ? currentValue : '';
    preencherSelect(id, options, newValue);
  };

  updateSelect('variavelAbertura', variavelAberturaSet, currentValues.variavelAbertura);
  updateSelect('categoria', categoriaSet, currentValues.categoria);
  updateSelect('variavelAbertura1', variavelAbertura1Set, currentValues.variavelAbertura1);
  updateSelect('categoria1', categoria1Set, currentValues.categoria1);
}

// foca nos indicadores
function popularFiltros() {
  // Coletar todos os indicadores únicos (exceto CV - )
  const indicadorSet = new Set(
    dadosEducacao
      .map(item => item['Indicador'])
      .filter(indicador => indicador && !indicador.startsWith('CV - '))
  );

  // Preencher o select de indicadores
  preencherSelect('indicador', indicadorSet, '');

  // Atualizar outros filtros com todos os dados
  atualizarFiltrosSecundarios(dadosEducacao, {
    variavelAbertura: '',
    categoria: '',
    variavelAbertura1: '',
    categoria1: ''
  });
}

// Preenche um select com opções
function preencherSelect(id, valores, valorAtual) {
  const select = document.getElementById(id);
  const options = Array.from(valores).filter(v => v).sort();
  
  select.innerHTML = '<option value="">--Todos--</option>';
  
  options.forEach(valor => {
    const option = document.createElement('option');
    option.value = valor;
    option.textContent = valor;
    select.appendChild(option);
  });
  
  // Mantém o valor atual se existir nas novas opções
  if (valorAtual && options.includes(valorAtual)) {
    select.value = valorAtual;
  } else {
    select.value = '';
  }
}

// Atualiza a visualização do mapa com base nos filtros
function atualizarVisualizacao() {
  // Se nenhum indicador selecionado, usa o padrão
  if (document.getElementById('indicador').value === '') {
    definirIndicadorPadrao();
    return;
  }
  const indicador = document.getElementById('indicador').value;
  const variavelAbertura = document.getElementById('variavelAbertura').value;
  const categoria = document.getElementById('categoria').value;
  const variavelAbertura1 = document.getElementById('variavelAbertura1').value;
  const categoria1 = document.getElementById('categoria1').value;
  
  const dadosFiltrados = filtrarDados(indicador, variavelAbertura, categoria, variavelAbertura1, categoria1);
  
  // Atualiza as cores do mapa
  atualizarCoresMapa(dadosFiltrados);
  
  // Mantém estados selecionados destacados
  estadosSelecionados.forEach((_, estado) => {
    d3.select(`#estado-${estado.replace(/\s+/g, '-')}`)
      .classed("selecionado", true);
  });
}

// Filtra os dados com base nos critérios selecionados
function filtrarDados(indicador, variavelAbertura, categoria, variavelAbertura1, categoria1) {
  const resultados = {};
  
  dadosEducacao.forEach(item => {
    // Adiciona verificação para excluir indicadores com "CV - "
    if (!item['Indicador']?.startsWith('CV - ') &&
        (indicador === '' || item['Indicador'] === indicador) &&
        (variavelAbertura === '' || item['Variável de abertura'] === variavelAbertura) &&
        (categoria === '' || item['Categoria'] === categoria) &&
        (variavelAbertura1 === '' || item['Variável de abertura .1'] === variavelAbertura1) &&
        (categoria1 === '' || item['Categoria .1'] === categoria1)) {
      
      const estado = item['Abertura Territorial'];
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
  document.getElementById('indicador').value = '';
  document.getElementById('variavelAbertura').value = '';
  document.getElementById('categoria').value = '';
  document.getElementById('variavelAbertura1').value = '';
  document.getElementById('categoria1').value = '';
  resetarMapa();
}