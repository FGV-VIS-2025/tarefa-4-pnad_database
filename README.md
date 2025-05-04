# Panorama da Educação Brasileira - Dados da PNAD de 2018

### Base de dados

Nossa base de dados é sobre Educação e foi obtida no [site da PNAD](https://www.ibge.gov.br/estatisticas/sociais/educacao/9173-pesquisa-nacional-por-amostra-de-domicilios-continua-trimestral.html?=&t=downloads), na pasta "Educacao_2018" dentro da pasta "Anual".
Utilizamos código python para tranformar o arquivo excel em CSVs, sendo cada aba do excel um CSV, para então analisar os dados de cada região brasileira.

### Visualização Interativa

Após as sugestões dadas pelos colegas e pelo professor, decidimos mudar o gráfico principal que antes era um gráfico de barras simples para um mapa interativo. Retiramos as opções de indicadores que não eram relacionados à educação como "Distribuição da população" e outros que haviam em nossa base de dados. Agora, só temos análises voltadas de fato para o cenário educacional brasileiro. Uma das sugestões dadas foi o fato de haver apenas dados de 3 anos (2016, 2017 e 2018) de modo que uma série temporal nesse caso poderia não ser muito útil. Assim, decidimos padronizar o uso dos dados mais recentes que haviam, ou seja, aqueles referentes ao ano de 2018. 
Na primeira entrega não tínhamos mais de uma visualização, agora temos um mapa que é coloridos conforme os filtros são selecionados pelo usuário representando os dados da PNAD em cada estado do país. Além disso, ao clicar em um estado do mapa, temos dois gráficos de barras que são ajustados sempre que clicar em um novo estado, representando os dados do indicador selecionado tanto por raça quanto por sexo, o que oferece ao usuário uma análise mais profunda e detalhada. 
Optamos por estudar e detalhar melhor sobre as taxas de escolarização e analfabetismo no Brasil em 2018, como tínhamos feito anteriormente, o que foi descrito na própria página web que contém a [visualização interativa](https://fgv-vis-2025.github.io/tarefa-4-pnad_database/).

### Alunas

- Ana Júlia Amaro Pereira Rocha
- Maria Eduarda Mesquita Magalhães

Curso: Ciência de Dados e Inteligência Artificial
