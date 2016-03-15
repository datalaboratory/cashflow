createPreloader();

// Переменные для этого проекта
var form = d3.select("body")
	.append("form");


//  Общая основа
var width = 1350;
var height = 510;
var margin = {
	top: 65,
	right: 20,
	bottom: 20,
	left: 0
};

var svg = d3.select('body')
	.append('svg')
	.attr("id", "main")
	.attr('width', width + margin.left + margin.right)
	.attr('height', height + margin.top + margin.bottom)
	.append('g')
	.attr("class", "workgroup")
	.attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');
//  /Основа

var barWidth = 35,
	transitionTime = 500,
	mapOffsetW = 0.65,
	mapOffsetH = 0.59;

// Про ресайз
var wrapper = d3.select('.workgroup')

// Ширину SVG делаешь по размеру экрана (или меньше, с учётом отступов).
d3.select('svg').attr('width', '100%')

// Дальше мы определяем поведение на ресайзе.
window.onresize = function() {
	// Посчитаем во сколько раз надо увеличить содержимое SVG.
	var scale = document.body.clientWidth / width
		// Применим масштаб.
	wrapper.attr('transform', 'scale(' + scale + ')')
	// Укажем высоту.
	d3.select('svg').attr('height', height * scale);
};
// Выполним изначальную настройку полотна.
window.onresize();
// /Про ресайз


// Градиенты
var defs = d3.select("svg").append("defs");

var gradients = defs.selectAll("linearGradient")
	.data([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12])
	.enter().append("linearGradient")
	.attr("gradientTransform", "rotate(90)")
	.attr("id", function(d, i) {
		return "gradient" + i
	});

gradients.append("stop")
	.attr("offset", "5%")
	.attr("stop-color", function(d) {
		return "rgb(255, " + (d * 10) + ", " + (d * 10) + ")"
	})
	.attr("id", "endcolor")

gradients.append("stop")
	.attr("offset", "100%")
	.attr("stop-color", "#ebe7e0")
	.attr("id", "startcolor")
// /Градиенты


// // Вспомогательные элементы
// d3.select('svg').append("rect")
// 	.attr("width",width + margin.left +margin.right)
// 	.attr("height",height + margin.top + margin.bottom)
// 	.style("fill","none")
// 	.style("stroke","red"); // Красный - граница svg
// svg.append("rect")
// 	.attr("width",width)
// 	.attr("height",height)
// 	.style("fill","none")
// 	.style("stroke","steelblue"); // Синий - граница рабочей группы в svg
// // /Вспомогательные элементы

//---------------------------Serg's code for Map---------

var criteria = ['d.Money_jn', 'd.Money_fb'];
var crit = criteria[0];

var ext_color_domain = [0, 1000000, 2000000, 3000000, 4000000, 5000000, 6000000, 7000000, 8000000, 9000000, 10000000];
var color_domain = ext_color_domain.slice(1);
var color = d3.scale.threshold()
	.range(["#ebe7e0"])
	.domain(color_domain);

queue()
	.defer(d3.json, 'http://nemetz.devg.ru/d3/russia_1e-7sr.json')
	.defer(d3.csv, 'colors.csv')
	.defer(d3.tsv, 'http://nemetz.devg.ru/d3/cities.tsv')
	.await(ready);


function drawMap(workgroup, map, cities, rateById, projection) {
	var path = d3.geo.path().projection(projection);

	workgroup.append('g')
		.attr('class', 'region')
		.selectAll('path')
		.data(topojson.feature(map, map.objects.russia).features)
		.enter().append('path')
		.attr('d', path)
		.attr("id", function(d) {
			return d.properties.region
		})
		.style('fill', function(d) {
			return color(rateById[d.properties.region])
		});

	var city = workgroup.selectAll('g.city')
		.data(cities)
		.enter()
		.append('g')
		.attr('class', 'city')
		.attr('transform', function(d) {
			return 'translate(' + projection([d.lon, d.lat]) + ')'
		});

	city.append('circle')
		.attr('r', 1.5)
		.style('fill', 'white');

	city.append('text').attr('class', 'shade');
	city.append('text');
	city.selectAll('text')
		.text(function(d) {
			return d.City
		});
}

function ready(error, map, data, cities) {
	var workgroup = d3.select('.workgroup')
		.append("g")
		.attr("class", "map")
		.attr("transform", "translate(" + width * mapOffsetW + "," + height * mapOffsetH + ")");

	var projection = d3.geo.albers()
		.rotate([-105, 0])
		.center([-10, 65])
		.parallels([52, 64])
		.scale(610)
		.translate([0, 0]);

	var rateById = {};
	data.forEach(function(d) {
		rateById[d.RegionCode] = +eval(criteria[0])
	});

	drawMap(workgroup, map, cities, rateById, projection);
}

//-----------------------/Serg's code-------------

var regioncodes = {}; // Связка Имя Региона-Код Региона
var regionnames = {}; // Связка Код Региона-Имя Региона
var regionareas = {}; // Связка Имя Региона-ФО
var areasregion; // Связка ФО-[Имена Регионов]

d3.csv("regioncodes.csv", function(data) {
	areasregion = d3.nest()
		.key(function(d) {
			return d.Okrug
		})
		.entries(data);

	// console.log("areasregion - ", areasregion);

	data.forEach(function(d) {
		regioncodes[d.RegionName] = d.RegionCode;
		regionnames[d.RegionCode] = d.RegionName;
		regionareas[d.RegionName] = d.Okrug;

	});
	// console.log(regioncodes);

})



d3.csv("data.csv", function(data) {

	// console.log(data)
	//Подготавливаем данные
	data.forEach(function(d) {
		d.amount = +d.amount.replace(/\s+/g, "")
	});

	var dataByMonths = d3.nest()
		.key(function(d) {
			return d.month
		}).entries(data);

	var dataByRegion = d3.nest()
		.key(function(d) {
			return d.region
		})
		.key(function(d) {
			return d.month
		})
		.entries(data);

	var yscale = d3.scale.linear().range([0, height * 0.6]);
	var colorscale = d3.scale.linear().range(["#ebe7e0", "#e85749"]).domain([0, 1]).clamp(true);


	// Смотрим какие есть параметры, чтобы создать селекторы
	var parameters = Object.keys(data[0]);

	// Убираем значение "amount"
	parameters.splice(parameters.indexOf("amount"), 1);

	// console.log("parameters — ", parameters)
	// Создаем селекторы для каждого столбца
	var selectors = form.selectAll("select")
		.data(parameters)
		.enter().append("select")
		.attr("id", function(d) {
			return d
		});

	var rules = {}; // Значения селекторов

	// В каждом селекторе создаем опции, подходящие для этого столбца
	selectors.selectAll("option")
		.data(function() {
			var name = d3.select(this.parentNode).attr("id")
			var opts = d3.nest()
				.key(function(d) {
					return d[name]
				}) // Собираем опции для текущего селектора
				.entries(data)
				.sort(function(a, b) { // Сортируем по ключу
					if (a.key > b.key) {
						return 1
					} else if (a.key < b.key) {
						return -1
					} else {
						return 0
					};
				});
			return opts

		})
		.enter().append("option")
		.attr("value", function(d, i) {
			return d.key
		})
		.text(function(d, i) {
			return d.key
		});

	//Создаем опции для состояния "Все"
	selectors.append("option")
		.attr("value", "all")
		.text(function() {
			if (d3.select(this.parentNode).attr("id") == "FO")
				return "Все округа"
			else if (d3.select(this.parentNode).attr("id") == "person")
				return "Все получатели"
			else if (d3.select(this.parentNode).attr("id") == "type")
				return "Все типы"
			else if (d3.select(this.parentNode).attr("id") == "operation")
				return "Все операции"
			else if (d3.select(this.parentNode).attr("id") == "region")
				return "Все регионы"
			else if (d3.select(this.parentNode).attr("id") == "month")
				return "Все месяцы"
			else
				return "Все"

		})
		.attr("selected", "true");

	// Добавляем «сбросить регионы»
	form.append("a")
		.html("×")
		.attr("id", "dropRegionsButton")
		.attr("href", "#")
		.on("pointerdown", function () {
			document.getElementById("region").value = "all";
			updateAll();
		});

	var dataForBars; // Данные для столбиковой диаграммы
	var allAmounts; // Значения в столбиковой диаграмме
	var mean; // среднее значения для столбиковой диаграммы

	var dataForMap;
	var baseRules = {}; // Запоминаем селекторы до наведения мыши
	var sum;
	var t = {};

	//смотрим на селекторы и собираем из них объект rules
	var createRules = function() {

		// Зависимость фильтров Лицо-Тип
		// Фильтр резидент-нерезидент активен только когда выбраны ФЛ. Для ЮЛ фильтр задисейблен в состоянии «Все типы».
		if (document.getElementById('person').value === "ЮЛ") {
			document.getElementById('type').value = "all";
			document.getElementById('type').disabled = true
		} else {
			document.getElementById('type').disabled = false
		};


		parameters.forEach(function(option) {
			var currentSelector = document.getElementById(option);


			rules[option] = currentSelector.options[currentSelector.selectedIndex].value;

			// Версия ниже не работает под ИЕ из-за "selectedOptions"
			// rules[option]=document.getElementById(option)
			// .selectedOptions[0]
			// .value;
		});

		// console.log("rules — ", rules);
	}


	// Готовим массив данных dataForBars для диаграммы
	var prepareDataForBar = function() {
		dataForBars = [];
		allAmounts = [];
		mean = 0;


		// console.log("preparing data FOR BARS started")
		createRules();

		// Пробегаемся по месяцам, готовим dataForBars для столбиковой диаграммы
		dataByMonths.forEach(function(month) {
			sum = 0;
			t = {};
			//заходим в каждую операцию за месяц
			month.values.forEach(function(payment) {

				//проверяем ее на Условия
				// console.log(payment)
				// console.log(rules)
				checker = true;
				d3.keys(payment).forEach(function(parameter) {
					// Если параметр НЕ "amount", НЕ подходит условию и селектор НЕ "all", то нам не подходит
					if ((parameter !== 'amount') && (payment[parameter] !== rules[parameter] && rules[parameter] !== "all")) {
						checker = false
					};
					// console.log(parameter)
				})
				// console.log(checker);
				//прибавляем, если подходит
				if (checker) {
					sum += payment.amount
				};
				// console.log(sum)


			})
			t['key'] = month.key;
			t['value'] = sum;

			dataForBars.push(t);
			//Запоминаем все значения для выбора границ для scale
			allAmounts.push(sum);
		})

		//Подготавливаем scale для масштабирования столбиковой диаграммы
		// yscale = yscale.domain(d3.extent(allAmounts))
		yscale = yscale.domain([0, d3.extent(allAmounts)[1]])

		mean = d3.median(allAmounts)

		// Обновляем градиенты
		allAmounts.forEach(function(d, i) {
			var index = d / mean - 1
			// Проверка на Infinity
			if (index === Infinity) {
				index = 1
			};
			var color = colorscale(index);
			d3.select("#gradient" + i)
				.select("#endcolor")
				.attr("stop-color", color)
		})

		// console.log("dataForBars — ", dataForBars)

	}

	// Готовим массив данных dataForMap карты
	var prepareDataForMap = function() {
		dataForMap = {};
		// console.log("preparing data FOR MAP started")

		createRules();

		// Пробегаемся по округам, готовим dataForMap для карты
		dataByRegion.forEach(function(region) {

			tempM = 0;
			tempAmounts = {};
			tempMean = 0;
			dispersion = 0;


			// По месяцам
			region.values.forEach(function(month) {
				sum = 0;

				month.values.forEach(function(payment) {
					// Считаем оборот за каждый месяц на основе фильтра
					checker = true;
					d3.keys(payment).forEach(function(parameter) {
						// Если параметр НЕ "amount", НЕ подходит условию и селектор НЕ "all", то нам не подходит
						if ((parameter !== 'amount') && (parameter !== 'month') && (payment[parameter] !== rules[parameter] && rules[parameter] !== "all")) {
							checker = false
						};
						// console.log(parameter)
					})
					// console.log(checker);
					//прибавляем, если подходит
					if (checker) {
						sum += payment.amount
					};

				})
				// Добавляем сумму за месяц во временный массив
				tempAmounts[month.key] = sum;

			})
			// на этом уровне в tempAmounts лежат обороты по месяцам для текущего ФО на основе фильтров
			// Считаем среднее по всем значениям
			tempMean = d3.median(d3.values(tempAmounts))


			// Разная логика при выборе селектора и наведении на диаграмму(выборе месяца)
			if (document.getElementById('month').value === 'all') {
				// Проходим по каждому значению
				var counter=0;
				d3.values(tempAmounts).forEach(function(value, i) {
					// Считаем отклонение от среднего для каждого И Суммируем положительные отклонения (возможно делим на 12)
					if (value / tempMean > 1) {
						tempM = tempM + (value / tempMean);
						++counter;
					}
					// console.log("value - ",value)
				})

				// console.log("tempM - ",tempM)
				// Нормируем. Увеличиваем контраст
				tempM = tempM / counter;


			} else {
				// Находим Отклонение выбранного month от этого среднего
				tempM = tempAmounts[document.getElementById('month').value] / tempMean

				// tempM = tempM / 3; // Нормируем. Увеличиваем контраст
			};

			// Проверка для случая с выбором ФО.
			// Тогда все регионы не в ФО получают значение Nan —> заливаются чернотой
			if (isNaN(tempM)) {
				tempM = 0
			};

			// console.log(region.key,tempM,tempMean,tempAmounts)
			// Запоминаем итоговое значение — dataForMap = [{key: 'region', value: 'dispersion'}]
			dataForMap[regioncodes[region.key]] = tempM

		})
		console.log("dataForMap — ", dataForMap)

	};



	var drawBar = function () {
		// Рисуем диаграмму
		bars = svg.append("g").attr("class", "chart")
			.selectAll("bars")
			.data(dataForBars)
			.enter().append("g")
			.attr("transform", function(d, i) {
				return "translate(" + i * barWidth + ", 0)";
			});

		// Рисуем столбик
		bars.append("rect")
			.attr("class", "bar")
			.attr("y", function(d) {
				return height - yscale(d.value)
			})
			.attr("width", barWidth - 1)
			.attr("height", function(d) {
				return yscale(d.value)
			});

		// Добавляем подпись
		bars.append("text")
			.attr("class", "values")
			.text(function(d) {
				var v = d.value / 1000000;
				return v.toFixed(1)
			})
			.attr("y", function(d) {
				return height - yscale(d.value)
			})
			.attr("dx", "1.6em")
			.attr("dy", "-.2em");

		// Добавляем подпись месяцев
		var monthnames = ["янв", "фев", "мар", "апр", "май", "июн", "июл", "авг", "сен", "окт", "ноя", "дек"];
		d3.selectAll(".chart g").append("text")
			.attr("class", "monthnames")
			.text(function(d, i) {
				// console.log(d);
				return monthnames[i];
			})
		// .attr("fill","#ebe7e0")
		.attr("y", height)
			.attr("dx", "1.6em")
			.attr("dy", "1.0em");

		//рисуем градиент
		bars.append("rect")
			.attr("class", "gradient")
			.attr("y", function(d) {
				return height - yscale(d.value)
			})
			.attr("width", barWidth - 1)
			.style("fill", function(d, i) {
				return "url(#gradient" + i + ")"
			})
			.attr("height", function(d) {
				t = yscale(d.value) - yscale(mean);
				if (t > 0) {
					return t
				} else {
					return 0
				};
			});

		// Добавляем подпись
		d3.select(".chart")
			.append("text")
			.attr("x", 50)
			.attr("y", 120)
			.attr("class", "legend")
			.text("Сумма, млрд. руб.");

		// Двигаем диаграмму
		svg.select(".chart")
			.attr("transform", "translate(0," + -height * 0.1 + ")")
	};


	//Обновляем барчарт
	var updateBar = function() {
		console.log("Graphic update for BARS started");

		// Обновляем данные
		prepareDataForBar();

		//Обновляем график
		svg.selectAll(".bar")
			.data(dataForBars)
			.transition().duration(transitionTime)
			.attr("y", function(d) {
				return height - yscale(d.value)
			})
			.attr("height", function(d) {
				return yscale(d.value)
			});

		// Обновляем подписи
		svg.select(".chart")
			.selectAll(".values")
			.data(dataForBars)
			.transition().duration(transitionTime)
			.text(function(d) {
				var v = d.value / 1000000;
				if (v < 10) {
					return v.toFixed(2)
				} else {
					return v.toFixed(1)
				};
			})
			.attr("y", function(d) {
				return height - yscale(d.value)
			});

		//Обновляем градиент
		svg.selectAll(".gradient")
			.data(dataForBars)
			.transition().duration(transitionTime)
			.attr("y", function(d) {
				return height - yscale(d.value)
			})
			.attr("height", function(d) {
				t = yscale(d.value) - yscale(mean);
				if (t > 0) {
					return t
				} else {
					return 0
				};
			});
		console.log("Graphic update for BARS complete!")
	};

	var updateMap = function() {
		mapBehavior();

		console.log("Graphic update for MAP started")


		// Управление кнопкой «сбросить регионы»
		var dropRegionsButton = document.getElementById("dropRegionsButton");
		document.getElementById("region").value !== "all" ? dropRegionsButton.style.display = 'inline' : dropRegionsButton.style.display = 'none';

		// Обновляем данные
		prepareDataForMap();

		d3.select(".region")
			.selectAll("path")
			.transition().duration(transitionTime)
			.style('fill', function() {
				return colorscale(dataForMap[this.id]-1)
			})

		console.log("Graphic update for MAP complete!")
	};

	var	updateBaseRules = function () {
		//Запоминаем текущее положение селекторов
		d3.keys(rules).forEach(function(rul) {
			baseRules[rul] = rules[rul];
		})
	};

	//Обновляем все
	var updateAll = function() {
		console.log("---------\n", "global update started\n")

		updateBar();
		updateMap();
		updateBaseRules();

		// console.log("baseRules - ", baseRules)
		console.log("\nglobal update completed\n", "---------\n")
	}

	// Функция возврата к базовому положению селекторов
	var returnToBaseRules = function() {
		// console.log("rules - ", rules)
		// console.log("baseRules - ", baseRules)
		d3.keys(baseRules).forEach(function(sel) {
			// console.log(sel)
			document.getElementById(sel).value = baseRules[sel];
		})
		// console.log("rules - ", rules)
	}

	// Поведение карты.
	var mapBehavior = function() {
		var currentRegion = document.getElementById('region').value;
		var currentFO = document.getElementById('FO').value;

		// если ФО = all ИЛИ регион в ФО
			// если Регион = all ИЛИ Регион = регион
			// включаем поведение при наведении
		var inSelectedRegions = function (region) {
			if (currentFO === 'all' || currentFO === regionareas[regionnames[region]]) {
				if (currentRegion === 'all' || currentRegion === regionnames[region]) {
					return true;
				};
			};
			return false;
		};
		var inSelectedFO = function (region) {
			if (currentFO === 'all' || currentFO === regionareas[regionnames[region]]) {
				return true;
			};
			return false;
		};

		// Зум карты
		var scales = {
			"all": [1, mapOffsetW, mapOffsetH],
			"ДФО": [1, mapOffsetW*0.7, mapOffsetH*0.85],
			"ПФО": [3.2, mapOffsetW*1.9, mapOffsetH*0.8],
			"СЗФО": [2.6, mapOffsetW*1.55, mapOffsetH*1.9],
			"СКФО": [5.3, mapOffsetW*3.2, mapOffsetH*0.3],
			"СФО": [1.4, mapOffsetW*1, mapOffsetH*0.85],
			"УФО": [2.5, mapOffsetW*1.3, mapOffsetH*1],
			"ЦФО": [4.8, mapOffsetW*2.6, mapOffsetH*2],
			"ЮФО": [5, mapOffsetW*3, mapOffsetH*0.7],
		};
		d3.select(".map")
			.transition()
			.duration(1000)
			.attr("transform","translate("+ width * scales[currentFO][1] + ","+ height * scales[currentFO][2] + ")scale("+ scales[currentFO][0]+")")

		// поведение карты при наведении и клике
		d3.select(".map")
			.selectAll("path")
			// pointerover в данном случае почему-то не работает в IE
			.on({
				"mouseover": function(d) {

					if (inSelectedRegions(d.properties.region)) {
						d3.event.preventDefault();

						// Меняем Регион соответственно указателю курсора
						document.getElementById('region').value = regionnames[d.properties.region];

						// // Меняем ФО соответственно региону
						// document.getElementById('FO').value = regionareas[regionnames[d.properties.region]];


						prepareDataForBar();
						updateBar();
						// console.log("LOG:",rules);
					};

				},

				// по клику выделяем неактивный регион
				"pointerdown": function (d) {
					// console.log("LOG:",d.properties.region,inSelectedFO(d.properties.region));
					if (inSelectedFO(d.properties.region)) {
						// Меняем Регион соответственно указателю курсора
						document.getElementById('region').value = regionnames[d.properties.region];
						updateAll();
					};

				},
				"mouseout": function(d) {
					if (inSelectedRegions(d.properties.region)) {
						d3.event.preventDefault();
						returnToBaseRules();
						prepareDataForBar();
						updateBar();

					};
				}
			})
			.style("opacity",function(d){
				return inSelectedFO(d.properties.region) ? 1 : 0 ;
			});




		// Поведение городов при зуме
		var mainCities = document.getElementsByClassName("city");
		if (currentFO !== 'all' || currentRegion !== 'all') {
			d3.range(mainCities.length).forEach(function(i) {
				mainCities[i].style.display = 'none'
			})
		} else {
			d3.range(mainCities.length).forEach(function(i) {
				mainCities[i].style.display = 'inline'
			})
		};
	}

	// Поведение диаграммы при наведении
	var barBehavior = function() {
		d3.select(".chart")
			.selectAll(".bar")
			.on("pointerover", function(d) {
				d3.event.preventDefault();

				document.getElementById('month').value = d.key;
				prepareDataForMap();
				updateMap();

				d3.select("#date")
					.text(function() {
						return document.getElementById('month').value.toLowerCase() + " 2013 года";
					});
			})
			.on("pointerout", function() {
				d3.event.preventDefault();

				document.getElementById('month').value = 'all';
				prepareDataForMap();
				updateMap();

				d3.select("#date")
					.text("2013 год");
			})

		d3.select(".chart")
			.selectAll(".gradient")
			.on("pointerover", function(d) {
				d3.event.preventDefault();

				document.getElementById('month').value = d.key;
				prepareDataForMap();
				updateMap();

				d3.select("#date")
					.text(function() {
						return document.getElementById('month').value.toLowerCase() + " 2013 года";
					});

			})
			.on("pointerout", function() {
				d3.event.preventDefault();

				document.getElementById('month').value = 'all';
				prepareDataForMap();
				updateMap();

				d3.select("#date")
					.text("2013 год");
			})
	}

	// Готовим данные для начального состояния диаграммы
	prepareDataForBar();

	// Рисуем диаграмму
	drawBar();
	barBehavior();

	// Обновляем всё
	window.setTimeout(updateAll, 1000); // задержка, т.к. карта грузится

	// и удаляем прелоадер
	window.setTimeout(removePreloader, 1000);


	var updateAll_FO = function() {
		// console.log("updateAll_FO started")
		var regionSelect = d3.select("select#region")
		var regionList = [];

		// Если в селекте не "Все округа", то собираем массив Регионов для этого округа
		if (document.getElementById('FO').value !== 'all') {

			// Можно вынести в начало подготовку объекта {ФО:[{key: Регион},{key: Регион}...],ФО:[{key: Регион},{key: Регион}...]...}
			areasregion.forEach(function(area) {
				if (area.key === document.getElementById('FO').value) {
					area.values.forEach(function(region) {
						regionList.push({
							"key": region.RegionName
						})
					})
				};
			})
			// Если "Все округа", то в массиве все округа
		} else {
			d3.values(regionnames).forEach(function(region) {
				regionList.push({
					"key": region
				})
			})

		};

		// console.log("regionList - ", regionList)


		// Удаляем все лишние Регионы
		regionSelect.selectAll("option")
			.data(regionList, function(d) {
				return d.key
			})
			.exit()
			.remove();

		// Добавляем новые Регионы, если есть
		regionSelect.selectAll("option")
			.data(regionList, function(d) {
				return d.key
			})
			.enter()
			.append("option")
			.attr("value", function(d, i) {
				return d.key
			})
			.text(function(d, i) {
				return d.key
			});

		// Добавляем опцию "Все"
		regionSelect.append("option")
			.attr("value", "all")
			.text(function() {
				var title = "Все регионы";
				if (document.getElementById('FO').value !== 'all') {
					title = title + ' ' + document.getElementById('FO').value;
				}
				return title;
			})
			.attr("selected", "true");


		// Дальше обновляем все как обычно
		updateAll();
	};

	d3.select("form")
		.select("#month")
		.attr("disabled", "true")
		.attr("hidden", "true")

	d3.selectAll("select").on("change", updateAll); // При изменении любого селектора запускаем обновление всего
	d3.select("#FO").on("change", updateAll_FO); // Спецлогика при изменении ФО



});
