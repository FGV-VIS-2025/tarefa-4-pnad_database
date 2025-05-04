// Variáveis globais
let mapaGeoJSON;
let dadosEducacao = [];
let estadosSelecionados = new Map();
const svgWidth = 280;
const svgHeight = 150;
const margin = {top: 20, right: 20, bottom: 30, left: 40};
const regioes = ['Centro-Oeste', 'Nordeste', 'Norte', 'Sudeste', 'Sul'];
// Lista de indicadores a serem excluídos
const INDICADORES_BLOQUEADOS = [
  "População (mil pessoas)",
  "Distribuição da população (%)",
  "Pessoas de 14 anos ou mais de idade (mil pessoas)",
  "Distribuição das pessoas de 14 anos ou mais de idade (%)",
  "Pessoas de 25 anos ou mais de idade (mil pessoas)",
  "Distribuição das pessoas de 25 anos ou mais de idade (%)",
  "Pessoas de 15 a 29 anos (mil pessoas)",
  "Distribuição das pessoas de 15 a 29 anos (%)"
];

// Função auxiliar para verificar indicadores permitidos
function isIndicadorPermitido(indicador) {
  return indicador && 
         !indicador.startsWith('CV - ') && 
         !INDICADORES_BLOQUEADOS.includes(indicador);
}

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
    const width = 700;
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
      
        // Desmarcar todos os estados visualmente
        d3.selectAll("path").classed("estado-selecionado", false);
      
        // Verifica se o estado já está selecionado
        if (estadosSelecionados.has(estado)) {
          estadosSelecionados.delete(estado);
          d3.select(this).classed("selecionado", false);
          document.getElementById('graficos-container').style.display = 'none';
        } else {
          estadosSelecionados.clear(); // Se quiser permitir só um estado de cada vez
          estadosSelecionados.set(estado, {});
          d3.select(this).classed("estado-selecionado", true);
          criarGraficos(estado); // Cria os gráficos
          document.getElementById('graficos-container').style.display = 'flex';
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
    dadosEducacao = []; // Resetar os dados
    
    for (const regiao of regioes) {
      const response = await fetch(`data/Brasil_e_${regiao}.csv`);
      if (!response.ok) continue;
      
      const text = await response.text();
      const linhas = text.split('\n').filter(l => l.trim() !== '');
      const headers = linhas[0].split(',');
      
      const dadosRegiao = linhas.slice(1).map(linha => {
        const valores = linha.split(',');
        const obj = {};
        headers.forEach((h, i) => obj[h.trim()] = valores[i]?.trim());
        return obj;
      });
      
      // Filtra combinando as condições
      dadosEducacao = dadosEducacao.concat(
        dadosRegiao.filter(item => 
          item['Nível Territorial'] === 'Unidade da Federação' &&
          isIndicadorPermitido(item['Indicador']))
      );
    }
    
    console.log("Dados carregados com filtros aplicados:", dadosEducacao);
  } catch (error) {
    console.error("Erro ao carregar dados:", error);
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
  // Coletar todos os indicadores permitidos
  const indicadorSet = new Set(
    dadosEducacao
      .map(item => item['Indicador'])
      .filter(indicador => isIndicadorPermitido(indicador))
  );

  // Preencher o select de indicadores
  preencherSelect('indicador', indicadorSet, document.getElementById('indicador').value);

  // Atualizar outros filtros
  const currentValues = {
    variavelAbertura: document.getElementById('variavelAbertura').value,
    categoria: document.getElementById('categoria').value,
    variavelAbertura1: document.getElementById('variavelAbertura1').value,
    categoria1: document.getElementById('categoria1').value
  };

  // Coletar opções para outros filtros
  const variavelAberturaSet = new Set();
  const categoriaSet = new Set();
  const variavelAbertura1Set = new Set();
  const categoria1Set = new Set();
  
  dadosEducacao.forEach(item => {
    if (item['Variável de abertura']) variavelAberturaSet.add(item['Variável de abertura']);
    if (item['Categoria']) categoriaSet.add(item['Categoria']);
    if (item['Variável de abertura .1']) variavelAbertura1Set.add(item['Variável de abertura .1']);
    if (item['Categoria .1']) categoria1Set.add(item['Categoria .1']);
  });

  preencherSelect('variavelAbertura', variavelAberturaSet, currentValues.variavelAbertura);
  preencherSelect('categoria', categoriaSet, currentValues.categoria);
  preencherSelect('variavelAbertura1', variavelAbertura1Set, currentValues.variavelAbertura1);
  preencherSelect('categoria1', categoria1Set, currentValues.categoria1);
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

// Função para criar os gráficos
function criarGraficos(estadoSelecionado) {
  const indicador = document.getElementById('indicador').value;
  if (!indicador) return;

  // Filtra os dados para o estado selecionado
  const dadosEstado = dadosEducacao.filter(item => 
    item['Abertura Territorial'] === estadoSelecionado &&
    item['Indicador'] === indicador
  );

  // Gráfico 1: Gênero (Homem vs Mulher)
  const dadosGenero = [
    {genero: 'Homem', valor: parseFloat(dadosEstado.find(d => d['Variável de abertura'] === 'Sexo' && d['Categoria'] === 'Homem')?.['2018'] || 0)},
    {genero: 'Mulher', valor: parseFloat(dadosEstado.find(d => d['Variável de abertura'] === 'Sexo' && d['Categoria'] === 'Mulher')?.['2018'] || 0)}
  ];

  // Gráfico 2: Raça (Branca vs Preta/Parda)
  const dadosRaca = [
    {raca: 'Branca', valor: parseFloat(dadosEstado.find(d => d['Variável de abertura'] === 'Cor ou raça' && d['Categoria'] === 'Branca')?.['2018'] || 0)},
    {raca: 'Preta ou parda', valor: parseFloat(dadosEstado.find(d => d['Variável de abertura'] === 'Cor ou raça' && (d['Categoria'] === 'Preta ou parda'))?.['2018'] || 0)}
  ];

  // Limpa gráficos anteriores
  d3.select('#grafico-genero').selectAll('*').remove();
  d3.select('#grafico-raca').selectAll('*').remove();

  // Cria os gráficos
  criarGraficoGenero(dadosGenero, indicador);
  criarGraficoRaca(dadosRaca, indicador);

  // Mostra o container
  document.getElementById('graficos-container').style.display = 'block';
}

function criarGraficoGenero(dados, indicador) {
  const container = d3.select('#grafico-genero');
  container.selectAll('*').remove();

  const width = 300;
  const height = 220;
  const margin = {top: 40, right: 20, bottom: 50, left: 50};

  const svg = container.append('svg')
    .attr('width', width + margin.left + margin.right)
    .attr('height', height + margin.top + margin.bottom)
    .append('g')
    .attr('transform', `translate(${margin.left},${margin.top})`);

  // Escalas
  const x = d3.scaleBand()
    .domain(dados.map(d => d.genero))
    .range([0, width])
    .padding(0.4);

  const y = d3.scaleLinear()
    .domain([0, d3.max(dados, d => d.valor)])
    .nice()
    .range([height, 0]);

  // Eixo X
  svg.append('g')
    .attr('class', 'axis axis-x')
    .attr('transform', `translate(0,${height})`)
    .call(d3.axisBottom(x).tickSizeOuter(0));

  // Eixo Y
  svg.append('g')
    .attr('class', 'axis axis-y')
    .call(d3.axisLeft(y).tickSizeOuter(0));

  // Barras
  svg.selectAll('.bar')
    .data(dados)
    .enter().append('rect')
    .attr('class', d => d.genero === 'Homem' ? 'bar-masculino' : 'bar-feminino')
    .attr('x', d => x(d.genero))
    .attr('y', d => y(d.valor))
    .attr('width', x.bandwidth())
    .attr('height', d => height - y(d.valor))
    .attr('rx', 3) // Bordas arredondadas
    .attr('ry', 3);

  // Rótulo eixo Y
  svg.append('text')
    .attr('class', 'axis-label')
    .attr('transform', 'rotate(-90)')
    .attr('y', -margin.left + 15)
    .attr('x', -height / 2)
    .text('Valor');

  // Rótulo eixo X
  svg.append('text')
    .attr('class', 'axis-label')
    .attr('x', width / 2)
    .attr('y', height + margin.bottom - 10)
    .text('Sexo');

  // Título
  svg.append('text')
    .attr('class', 'chart-title')
    .attr('x', width / 3)
    .attr('y', -margin.top / 2)
    .text('Distribuição por Gênero');
}

function criarGraficoRaca(dados, indicador) {
  const container = d3.select('#grafico-raca');
  container.selectAll('*').remove();

  const width = 300;
  const height = 220;
  const margin = {top: 40, right: 20, bottom: 50, left: 50};

  const svg = container.append('svg')
    .attr('width', width + margin.left + margin.right)
    .attr('height', height + margin.top + margin.bottom)
    .append('g')
    .attr('transform', `translate(${margin.left},${margin.top})`);

  // Escalas
  const x = d3.scaleBand()
    .domain(dados.map(d => d.raca))
    .range([0, width])
    .padding(0.4);

  const y = d3.scaleLinear()
    .domain([0, d3.max(dados, d => d.valor)])
    .nice()
    .range([height, 0]);

  // Eixo X
  svg.append('g')
    .attr('class', 'axis axis-x')
    .attr('transform', `translate(0,${height})`)
    .call(d3.axisBottom(x).tickSizeOuter(0));

  // Eixo Y
  svg.append('g')
    .attr('class', 'axis axis-y')
    .call(d3.axisLeft(y).tickSizeOuter(0));

  // Barras
  svg.selectAll('.bar')
    .data(dados)
    .enter().append('rect')
    .attr('class', d => d.raca === 'Branca' ? 'bar-branca' : 'bar-preta-parda')
    .attr('x', d => x(d.raca))
    .attr('y', d => y(d.valor))
    .attr('width', x.bandwidth())
    .attr('height', d => height - y(d.valor))
    .attr('rx', 3)
    .attr('ry', 3);

  // Rótulo eixo Y
  svg.append('text')
    .attr('class', 'axis-label')
    .attr('transform', 'rotate(-90)')
    .attr('y', -margin.left + 15)
    .attr('x', -height / 2)
    .text('Valor');

  // Rótulo eixo X
  svg.append('text')
    .attr('class', 'axis-label')
    .attr('x', width / 2)
    .attr('y', height + margin.bottom - 10)
    .text('Cor ou Raça');

  // Título
  svg.append('text')
    .attr('class', 'chart-title')
    .attr('x', width / 3)
    .attr('y', -margin.top / 2)
    .text('Distribuição por Raça');
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
    if (isIndicadorPermitido(item['Indicador']) &&
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