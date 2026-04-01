// document.getElementsByClassName(classNames="main-title")[0].style.color = "red";
// При нажатии плавно передвигает к секции с товарами
document.getElementById("main-action-button").onclick = function() {
    document.getElementById("products").scrollIntoView({behavior: "smooth"});
}

//Переход по ссылкам в меню к соответствующим секциям - пдавный скролл, без якорей
let Links = document.querySelectorAll(".menu-item > a");// нашли все ссылки в меню
// обработчик событий через цикл вешаем на каждую ссылку по атрибуту data-link
for(let i = 0; i < Links.length; i++) {
    Links[i].onclick = function () {
        document.getElementById(Links[i].getAttribute("data-link")).scrollIntoView({ behavior: "smooth" });
    }
}


// Кнопка Заказать - отправляет к форме заказа
//Нашли все кнопки
let Buttons = document.getElementsByClassName("product-button");// нашли все кнопки Заказать
//Обработчик событий повесили на них по id 
for (let i = 0; i < Buttons.length; i++) {
    Buttons[i].onclick = function () {
        document.getElementById("order").scrollIntoView({ behavior: "smooth" });
    }
}


//Вадидация формы

let burger = document.getElementById("burger");
let names = document.getElementById("name");
let phone = document.getElementById("phone");

document.getElementById("order-action").onclick = function() {
    let hasError = false;

    [burger,names,phone ].forEach( item => {
        if(!item.value) {
            item.parentElement.style.background = "red";
            hasError = true;
        }else {
            item.parentElement.style.background = "";
        }

    });


    if(!hasError) {
        [burger, names, phone].forEach(item => {
            item.value = "";
        });
        alert("Спасибо за заказ! Мы скоро свяжемся с вами!");
    }
}



//Изменение валют
let prices = document.getElementsByClassName("products-item-price");

document.getElementById("change-currency").onclick = function (e) {
    let currentCurrency = e.target.innerText;
    
    let newCurrency = "$";
    let coefficient = 1;

    if (currentCurrency === "$") {
        newCurrency = "₽";
        coefficient = 80;

    } else if (currentCurrency === "₽") {
        newCurrency = "BYN";
        coefficient = 3;
    }
    else if (currentCurrency === 'BYN') {
        newCurrency = '€';
        coefficient = 0.9;

    } else if (currentCurrency === '€') {
        newCurrency = '¥';
        coefficient = 6.9;
    }

    e.target.innerText = newCurrency;

    for (i=0; i<prices.length; i++) {
        prices[i].innerText = +(prices[i].getAttribute("data-base-price")* coefficient).toFixed(1) + " " + newCurrency;
    }
}