const mySwiper = new Swiper('.swiper-container', {
	loop: true,

	// Navigation arrows
	navigation: {
		nextEl: '.slider-button-next',
		prevEl: '.slider-button-prev',
	},
});

//открытие и закрытие модалки

const buttonCart = document.querySelector('.button-cart');
const modalCart = document.querySelector('#modal-cart');
const modalClose = document.querySelector('.modal-close');

const checkGoods = () => { //отправка запросов на сервер
	const data = [];
	return async () => {
	if (data.length) return data;
	const result = await fetch('db/db.json');
	if (!result.ok) {
		throw 'Ошибочка: ' + result.status
	}
	data.push(...(await result.json()));
	return data
	};
};

const getGoods = checkGoods()

const openModal = () => {
	cart.renderCart(); //добавление в корзину
	modalCart.classList.add('show');
};

const closeModal = () => {
	modalCart.classList.remove('show');
};

buttonCart.addEventListener('click', openModal);

modalClose.addEventListener('click', closeModal);

//плавный скролл

(function() {
	const scrollLinks = document.querySelectorAll('a.scroll-link');

for (let i = 0; i < scrollLinks.length; i++) {
	scrollLinks[i].addEventListener('click', event => {
		event.preventDefault(); //запрет на автомат обработку браузером
		const id = scrollLinks[i].getAttribute('href');
		document.querySelector(id).scrollIntoView({
			behavior: 'smooth',
			block: 'start',
		})
	});
}
})()

//товары, получение данных с адреса на прмере json

const showAll = document.querySelectorAll('.show-all');
const navigationLink = document.querySelectorAll('.navigation-link:not(.show-all)');
const longGoodsList = document.querySelector('.long-goods-list');
const showAccessories = document.querySelectorAll('.show-accessories');
const showClothing = document.querySelectorAll('.show-clothing');

const createCard = function ({ label, name, img, description, id, price }) { //добавление карточки
	const card = document.createElement('div');
	card.className = 'col-lg-3 col-sm-6';

	card.innerHTML = `
		<div class="goods-card">
		${label ? 
			`<span class="label">${label}</span>` : ''}
						<img src="db/${img}" alt="${name}" class="goods-image">
						<h3 class="goods-title">${name}</h3>
						<p class="goods-description">${description}</p>
						<button class="button goods-card-btn add-to-cart" data-id="${id}">
							<span class="button-price">$${price}</span>
						</button>
		</div>
	`;

		return card;
}

const renderCards = function(data) { //получение данных с сервера о товаре
	longGoodsList.textContent = ''; //очищает внутри див
	const cards = data.map(createCard) //передача данных из массива товаров, перебор данных
		longGoodsList.append(...cards)
	document.body.classList.add('show-goods') //добавление класса из css 
};

const viewAll = function(event) { //открытие всех товаров
	event.preventDefault(); //защита от перезагрузки
	getGoods().then(renderCards)
}

showAll.forEach(function(elem) {
	elem.addEventListener('click', viewAll);
});

//фильтрация карточек

const filterCards = function(field, value) {
	getGoods()
		.then(data => data.filter(good => good[field] === value))
		.then(renderCards);
};

navigationLink.forEach(function (link) {
	link.addEventListener('click', event => {
		event.preventDefault();
		const field = link.dataset.field;
		const value = link.textContent;
		filterCards(field, value);
	})
});

//после слайдера, на кнопки вешаем категории

showAccessories.forEach(item => {
	item.addEventListener('click', event => {
	event.preventDefault();
	filterCards('category', 'Accessories');
	});
});

showClothing.forEach(item => {
	item.addEventListener('click', event => {
	event.preventDefault();
	filterCards('category', 'Clothing');
	});
});

//работа с корзиной

const cartTableGoods = document.querySelector('.cart-table__goods');
const cardTableTotal = document.querySelector('.card-table__total');
const cartCount = document.querySelector('.cart-count');
const btnDanger = document.querySelector('.btn-danger');

const cart = { //создаем методы для корзины
	cartGoods: [],
	getCountCartGoods() { //чтобы отправка из формы на сервер не была без заказа, получение кол-ва товаров
		return this.cartGoods.length
	},
	countQuantity() { // счетчик на корзине
		cartCount.textContent = this.cartGoods.reduce((sum, item) => {
			return sum +item.count
		}, 0)
	},
	clearCart(){ //очитска всех товаров по кнопке
		this.cartGoods.length = 0;
		this.countQuantity();
		this.renderCart();
	},
	renderCart(){
		cartTableGoods.textContent = ''; //делаем содержимое пустым
		this.cartGoods.forEach(({ id, name, price, count }) => {
			const trGood = document.createElement('tr');
			trGood.className = 'cart-item';
			trGood.dataset.id = id;

			trGood.innerHTML = `
					<td>${name}</td>
					<td>${price}$</td>
					<td><button class="cart-btn-minus">-</button></td>
					<td>${count}</td>
					<td><button class="cart-btn-plus">+</button></td>
					<td>${price * count}$</td>
					<td><button class="cart-btn-delete">x</button></td>
			`;
			cartTableGoods.append(trGood);
		});

		const totalPrice = this.cartGoods.reduce((sum, item) => {
			return sum + item.price * item.count;
		}, 0);

		cardTableTotal.textContent = totalPrice + '$'

	},
	deleteGood(id){
		this.cartGoods = this.cartGoods.filter(item => id !== item.id);
		this.renderCart();
		this.countQuantity();
	},
	minusGood(id){
		for (const item of this.cartGoods) {
			if (item.id === id) {
				if (item.count <= 1) {
					this.deleteGood(id)
				} else {
					item.count--;
				}
				break;
			}
		}
		this.renderCart();
		this.countQuantity();
	},
	plusGood(id){
		for (const item of this.cartGoods) {
			if (item.id === id) {
				item.count++;
				break;
			}
		}
		this.renderCart();
		this.countQuantity();
	},
	addCartGoods(id){
		const goodItem = this.cartGoods.find(item => item.id === id);	
		if (goodItem) {
			this.plusGood(id);
		} else {
			getGoods()
			.then(data => data.find(item => item.id === id))
			.then(({ id, name, price }) => {
				this.cartGoods.push({
					id,
					name,
					price,
					count: 1
				});
				this.countQuantity();
			});
		}
		this.renderCart();
	},
}

btnDanger.addEventListener('click', cart.clearCart.bind(cart)); //кнопка очистки всех товаров в корзине

/*2ой вариант очистки товаров на кнопке
btnDanger.addEventListener('click', () => {
	cart.clearCart()
});*/

document.body.addEventListener('click', event => {
	const addToCart = event.target.closest('.add-to-cart');
	if (addToCart) {
		cart.addCartGoods(addToCart.dataset.id)
	}
});

cartTableGoods.addEventListener('click', event => {
	const target = event.target;

	if(target.tagName === "BUTTON") {
		const id = target.closest('.cart-item').dataset.id;

		if (target.classList.contains('cart-btn-delete')) {
			cart.deleteGood(id);
	};
	if (target.classList.contains('cart-btn-minus')) {
		cart.minusGood(id);
	}
	if (target.classList.contains('cart-btn-plus')) {
		cart.plusGood(id);
		}
	}
});

/*работа с сервером, отправка данных с формы имя, телефон, заказ на сервер

const modalForm = document.querySelector('.modal-form');

const postData = dataUser => fetch('server.php', {
	method: 'POST',
	body: dataUser,
});

const validForm = (formData) => { //проверка, чтобы имя и телефон в форме не были пустыми
	let valid = false;

	for (const [, value] of formData) {
			if (value.trim()) { //trim удаляет пробелы
				valid = true;
			} else {
				valid = false;
				break;
			}
	}
	return valid;
};

modalForm.addEventListener('submit', event => {
	event.preventDefault();
	const formData = new FormData(modalForm);

	if (!validForm(formData) && getCountCartGoods()) {
		formData.append('cart', JSON.stringify(cart.cartGoods))

		postData(formData)
		.then(response => {
			if (!response.ok) {
				throw new Error(response.status);
			}
			alert('Ваш заказ успешно отпрвлен! С Вами свяжутся в ближайшее время!');
		})
		.catch(error => {
			alert('Произошла ошибка! Повторите попытку позже!');
		})
		.finally(() => { //закрытие модалки и очистка корзины после отправки данных на сервер
			closeModal();
			modalForm.reset();
			cart.clearCart();
		});
} else {
	if (getCountCartGoods()) {
		alert('Добавьте товар в корзину!');
	}
	if (validForm(formData)) {
		alert('Заполните все поля правильно!');
	}
}
})*/