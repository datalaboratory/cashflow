// Функция создать прелоадер
// 	Создание дива dl-loader внутри body

// 	Создание 'dl-logo dl-left' и 'dl-logo dl-right' внутри него

function createPreloader() {
	// console.log("LOG:",'Создаём прелоадер!');
	d3.select('body')
		.append('span')
		.classed('dl-loader', true)
		.selectAll('div')
		.data(['Δ','λ'])
		.enter().append('div')
		.attr('class', function(d,i) {
			return i === 0 ? 'dl-logo dl-left' : 'dl-logo dl-right';
		})
		.html(function (d) {
			return '<a href ="http://datalaboratory.ru/">' + d + '</a>';
		});
};

function removePreloader() {
	// console.log("LOG:",'Удаляем прелоадер!');
	d3.select('.dl-loader').remove()
};


// Функция Удалить
// 	Удаление dl-loader
