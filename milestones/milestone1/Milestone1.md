# Milestone 1 (20th March, 5pm)

<!-- TODO: delete -->
**10% of the final grade**

This is a preliminary milestone to let you set up goals for your final project and assess the feasibility of your ideas.
Please, fill the following sections about your project.

*(max. 2000 characters per section)*


## Dataset

The project combines several publicly available datasets to build a unified dataset for analysis and visualization.

The main dataset comes from the [120 years of Olympic history: athletes and results](https://www.kaggle.com/datasets/heesoo37/120-years-of-olympic-history-athletes-and-results?select=athlete_events.csv) dataset on **Kaggle**, covering Olympic events from 1896 to 2016. Two files are used: `athlete_events.csv`, which contains athlete-level information such as name, gender, age, sport, event, and medal results, and `noc_regions.csv`, which maps National Olympic Committee (NOC) codes to country names.

To add socioeconomic context, two **World Bank** datasets were included: [GDP per capita (current US$)](https://data.worldbank.org/indicator/NY.GDP.PCAP.CD) (`gdp_per_capita.csv`) and [Population by country (1960–2020)](https://www.kaggle.com/datasets/aliaamiri/historical-worldwide-countries-population) (`pop_count.csv`). These allow analysis of the relationship between economic development, population size, and Olympic participation or performance.

A dataset on the [history of large international conflicts](https://www.kaggle.com/datasets/nikolaosroufas/history-of-large-conflicts-between-1800-2024) (`conflicts.csv`) was also included, containing conflict names, participating countries, time periods, and contextual information.

### Data preprocessing and quality assessment

Since the datasets come from different sources, several preprocessing steps were required. Column names were standardized and country names normalized to remove formatting differences.

The GDP and population datasets were converted from wide to long format to produce one row per country and year. Country identifiers were harmonized by mapping Olympic NOC codes to World Bank ISO codes, with a fallback merge using cleaned country names.

For the conflict dataset, countries listed as text were parsed and expanded so conflicts could be matched with Olympic records by country and year.

Remaining data challenges include differences in country naming, geopolitical changes (e.g., USSR, Yugoslavia), missing socioeconomic data before 1960, and text-based conflict records. 

The final dataset (`olympics.csv`) combines Olympic results with GDP, population, and conflict information for each country and year.

## Problematic
<!-- 1365 characters -->

Since the revival of the Olympic Games in 1894, these sporting events have mirrored global changes. 
The athletes who participate and win medals are influenced by social, economic, cultural, and geopolitical contexts. 
The recent 2026 Winter Olympics in Milan motivated us to study this subject. 
Winners such as [Lucas Pinheiro Braathen](https://www.olympics.com/en/milano-cortina-2026/news/lucas-pinheiro-braathen-wins-giant-slalom-gold-brazil-s-first-ever-winter-olympics-medal), who won gold in the giant slalom, led us to ask:
> **How have social, economic, cultural, and geopolitical contexts been reflected in the Olympics over time?**

To address this question, we will investigate the following topics in relation to the Olympics over time:
- inequalities in gender;
- inequalities in wealth and population (GDP);
- inequalities in disciplines (insertion, removal, and winners);
- the reflection of geopolitical conflicts.

Our website will be structured into several tabs:
- a global analysis of the aforementioned inequalities;
- visualisations of statistics per country;
- visualisations of statistics per discipline;
- geopolitical conflicts reflected through the Games;
- surprising facts and winners.

Our project is intended for people who are interested in Olympic statistics. 
It is also aimed at those who are eager to discover surprising facts and winners of the Games. 
Additionally, it is designed for those interested in how the sociological, economic, cultural and geopolitical contexts are reflected in participation and medals.


## Exploratory Data Analysis

<!-- TODO: delete -->
> Pre-processing of the data set you chose
> - Show some basic statistics and get insights about the data


## Related work

Several projects and visualizations have explored Olympic Games data in different ways. We can find among them:

- [120 Years of Olympic History - Summer Olympics & Weightlifting](https://public.tableau.com/app/profile/kia.prescott/viz/120YearsofOlympicHistory-SummerOlympicsWeightlifting/SummerOlympicGames): Many visualisations focus on Summer Olympics data. Across the different tabs, we can find gender performance comparisons and many visualisations dedicated to weightlifting.
- [120 Years of Olympic History: Athletes and Results](https://public.tableau.com/app/profile/fifi5043/viz/120YearsOfOlympicHistoryAthletesAndResults/Dashboard2): General interactive visualizations of the dataset at a global scale.
- [120 years of Olympics History Athletes and Results MS Excel Dashboard: Project Overview](https://github.com/Harshit0512/Harshit0512-120-years-of-Olympics-History-Athletes-and-Results---MS-Excel-Dashboard): A GitHub project providing a general analysis and some visualisations of the dataset.
- `TODO`

These projects and visualizations typically rely on a single dataset (our main one) and either provide a general analysis or focus on a specific aspect of the data, as in the first example. In contrast, our approach differs by combining the Olympic dataset with additional datasets, allowing us to enrich the data and explore various types of inequalities at a global scale.

Our visualizations aim to be dynamic and interactive while guiding the user through the platform. We combine multiple dimensions, including gender, GDP per capita, population, discipline trends, and historical conflicts, to build a narrative showing how social, economic, cultural, and geopolitical contexts are reflected in Olympic participation and medal outcomes. 

While studies of Olympic performance are not entirely new, our approach differentiates itself by providing a multi-perspective, exploratory, and interactive experience that allows users to uncover surprising patterns and insights.

