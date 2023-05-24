const BASE_SERVER_PATH = 'https://academy.directlinedev.com';

(function() {
    const btnSignOut = document.querySelector('.signOut-btn_js');
    const btnBurgerSignOut = document.querySelector('.burger-signOut_js');

    if (btnSignOut) {
        btnSignOut.addEventListener('click', () => {
            localStorage.removeItem('token');
            rerenderMenu();
            location.pathname = '/';
        });
    }
    if (btnBurgerSignOut) {
        btnBurgerSignOut.addEventListener('click', () => {
            localStorage.removeItem('token');
            rerenderMenu();
            location.pathname = '/';
        });
    }
})();

// Функция для работы с модалками - переключение их состояний.

function interactionModal(modal) {
    modal.classList.toggle('open');
}

function sendRequest({url, method = 'GET', headers, body = null}) {
    return fetch(BASE_SERVER_PATH + url, {
        method,
        headers,
        body,
    })
}

function clearErrors(element) {
    const messages = element.querySelectorAll('.invalid-feedback');
    const invalids = element.querySelectorAll('.is-invalid');
    messages.forEach(message => message.remove());
    invalids.forEach(invalid => invalid.classList.remove('is-invalid'));
}

function clearSuccess(element) {
    const messagesSuccess = element.querySelectorAll('.success-feedback');
    const valids = element.querySelectorAll('.is-valid');
    messagesSuccess.forEach(messagesSuccess => messagesSuccess.remove());
    valids.forEach(valid => valid.classList.remove('is-valid'));
}

function rerenderMenu() {
    const defaultMenu = document.querySelector('.header__list_js');
    const profileMenu = document.querySelector('.header__list-profile_js');
    const defaultBurgerMenu = document.querySelector('.burger__list_js');
    const profileBurgerMenu = document.querySelector('.burger__list-sign_js');

    const isLogin = localStorage.getItem('token');

    if(isLogin) {
        // Токен присутствует
        defaultMenu.classList.add('hidden');
        profileMenu.classList.remove('hidden');
        defaultBurgerMenu.classList.add('hidden');
        profileBurgerMenu.classList.remove('hidden');
    } else {
        // Токен отсутствует
        defaultMenu.classList.remove('hidden');
        profileMenu.classList.add('hidden');
        defaultBurgerMenu.classList.remove('hidden');
        profileBurgerMenu.classList.add('hidden');
    }
  }

function errorTextFromServer(element, error) {
    const errorBox = element.querySelector('.modal__message-unsuccess_js');
    errorBox.innerText = '';
    errorBox.innerText = `The form was sent but the server transmits an error:'${error}'`;
}

// ВАЛИДАЦИЯ ФОРМ

// Собираем все данные из формы и возвращаем в качестве единого объекта.

function getAll(form) {
    const inputs = form.querySelectorAll('input');
    const textareas = form.querySelectorAll('textarea');

    let result = {};

    for ( let input of inputs ) {

        switch (input.type) {
            case 'radio': {
                if ( input.checked) {
                    result[input.name] = input.value;
                }
                break;
            }
            case 'checkbox': {
                if ( !result[input.name] ) result[input.name] = [];
                if ( input.checked ) result[input.name].push(input.value);
                break;
            }
            case 'file': { 
                result[input.name] = input.files; 
                break;
            }
            default: { 
                result[input.name] = input.value; 
            }
        }
    }

    for (let textarea of textareas) { 
        result[textarea.name] = textarea.value; 
    }

    return result;
}

// Проверка почты на правильность, согласно регулярному выражению

function isEmailCorrect(email) {
    return email.match(/^[0-9a-z-\.]+\@[0-9a-z-]{2,}\.[a-z]{2,}$/i);
};

// Проверяка номера телефона на правильность, согласно регулярному выражению

function isPhoneCorrect(phone) {
    return phone.match(/^(\s*)?(\+)?([- _():=+]?\d[- _():=+]?){10,14}(\s*)?$/);
};

// Проверка полного имени на правильность, согласно регулярному выражению

function isFullNameCorrect(fullName) {
    return fullName.match(/^[a-zA-Z]{2,}\s[a-zA-Z]{1,}'?-?[a-zA-Z]{2,}\s?([a-zA-Z]{1,})?$/);
};

// Проверка возраста на правильность, согласно регулярному выражению

function isAgeCorrect(age) {
    return (!isNaN(age) && age !== null && age >= 18);
};

// Эта функция нужна для работы не с итерабельными элементами.
function setErrorText(input, messageError) { 
    const error = errorCreator(messageError); // Получаем готовый div с ошибкой.
    input.classList.add('is-invalid'); // Вешаем класс ошибки. Border для input'a (красный)
    input.insertAdjacentElement('afterend', error); // Добавляем элемент в вёрстку.
    input.addEventListener('input', () => { // Вешаем слушатель инпут, который отработает тогда, когда пользователь начнет что-то снова вводить.
        error.remove(); // Удаляем ошибку.
        input.classList.remove('is-invalid'); // Удаляем класс ошибки.
    }, {once: true}); // В качестве объекта параметров делаем выполнение этого события одноразовым.
}

// Функция создания элемента ошибки.
function errorCreator(message) {
    let messageError = document.createElement('div'); // Создаем div.
    messageError.classList.add('invalid-feedback'); // Вешаем ему класс. Стили div'a, содержащего сообщение об ошибке (шрифт, цвет)
    messageError.innerText = message; // Кладём в него текст нашей ошибки.
    return messageError; // Возвращаем подготовленный div как результат выполнения нашей функции.
    // ВАЖНОЕ УТОЧНЕНИЕ!!! На момент завершения этой функции div не находится в вёрстке для того, чтобы он там появился мы его потом добавляем в него при помощи insertAdjacentElement.
}

// Функция создания элемента сообщения об успехе.
function successCreator() {
    let messageSuccess = document.createElement('div'); // Создаем div.
    messageSuccess.classList.add('success-feedback'); // Вешаем ему класс. Стили div'a, содержащего сообщение об успехе (шрифт, цвет)
    messageSuccess.innerText = 'All right'; // Кладём в него текст нашей успеха.
    return messageSuccess; // Возвращаем подготовленный div как результат выполнения нашей функции.
    // ВАЖНОЕ УТОЧНЕНИЕ!!! На момент завершения этой функции div не находится в вёрстке для того, чтобы он там появился мы его потом добавляем в него при помощи insertAdjacentElement.
}

// Функция создания элемента успеха.
function setSuccessText(input) { 
    const message = successCreator(); // Получаем готовый div.
    input.classList.add('is-valid'); // Вешаем класс об успехе. Border для input'a (зелёный)
    input.insertAdjacentElement('afterend', message); // Добавляем элемент в вёрстку.
    input.addEventListener('input', () => { // Вешаем слушатель инпут, который отработает тогда, когда пользователь начнет что-то снова вводить.
        message.remove(); // Удаляем div.
        input.classList.remove('is-valid'); // Удаляем класс об успехе.
    }, {once: true}); // В качестве объекта параметров делаем выполнение этого события одноразовым.
}

// Кнопка Button-to-top

(function() {
    const btnToTop = document.querySelector('.button-to-top_js');
  
    if ( !btnToTop ) return;
  
    window.addEventListener('scroll', () => {
        const scrollTop = window.scrollY;
  
        if ( scrollTop >= 1500 ) {
            visuallyBtn();
        } else {
            notVisuallyBtn();
        }
        btnToTop.addEventListener('click', scrollToTop);
    })
  
    function visuallyBtn() {
        btnToTop.classList.remove('button-to-top_hidden');
    }
  
    function notVisuallyBtn() {
        btnToTop.classList.add('button-to-top_hidden');
    }
  
    function scrollToTop() {
        console.log('scroll');
        window.scrollTo({
            top: 0,
            behavior: 'smooth',
        })
    }
  })();

// ОТКРЫТИЕ, ЗАКРЫТИЕ БУРГЕР-МЕНЮ

(function() {
    const burgerBtn = document.querySelector('.header__burger-btn_js');
    const mobileMenu = document.querySelector('.burger');
    const closeMenu = document.querySelector('.burger__close');

    if ( !burgerBtn ) return;
    if ( !mobileMenu ) return;

    burgerBtn.addEventListener('click', openBurger);

    function openBurger() {
        mobileMenu.classList.add('burger__open');
        if ( closeMenu ) {
            closeMenu.addEventListener('click', closeBurger);
            window.addEventListener('keydown', escHandler);
        };
    };

    function escHandler(event) {
        if(event.keyCode === 27) {
            closeBurger();
        };
    };

    function closeBurger() {
        mobileMenu.classList.remove('burger__open');
        window.removeEventListener('keydown', escHandler);
        closeMenu.removeEventListener('click', closeBurger);
    };

})();

// форма Sign in

(function() {
    const popup = document.querySelector('.popup-sign_js');
    const btnOpen = document.querySelector('.burger-sign_js');
    const closePopupBtn = document.querySelector('.popup__close-sign_js');
    const input = document.querySelector('.sign__input--email');
    const popup__overlay = document.querySelector('.popup__overlay-sign_js');

    if ( !popup && !btnOpen ) return;

    btnOpen.addEventListener('click', openPopup);

    function openPopup() {
        popup.classList.add('open');
        input.focus();
        window.addEventListener('keydown', escHandler);
        if ( closePopupBtn ) {
            closePopupBtn.addEventListener('click', closePopup );
        }
        if ( popup__overlay ) {
            popup__overlay.addEventListener('click', closePopup );
        };
    };

    function closePopup() {
        popup.classList.remove('open');
        if ( closePopupBtn ) {
            closePopupBtn.removeEventListener('click', closePopup );
        };
        if ( popup__overlay ) {
            popup__overlay.removeEventListener('click', closePopup );
        };
        window.removeEventListener('keydown', escHandler);
    };
    
    function escHandler(event) {
        if(event.keyCode === 27) {
            closePopup();
        };
    };

})();

// форма Register

(function() {
    const popup = document.querySelector('.popup-register_js');
    const btnOpen = document.querySelector('.burger-register_js');
    const closePopupBtn = document.querySelector('.popup__close-register_js');
    const input = document.querySelector('.register__input--email');
    const popup__overlay = document.querySelector('.popup__overlay-register_js');

    if ( !popup && !btnOpen ) return;

    btnOpen.addEventListener('click', openPopup);

    function openPopup() {
        popup.classList.add('open');
        input.focus();
        window.addEventListener('keydown', escHandler);
        if ( closePopupBtn ) {
            closePopupBtn.addEventListener('click', closePopup );
        };
        if ( popup__overlay ) {
            popup__overlay.addEventListener('click', closePopup );
        };
    };

    function closePopup() {
        popup.classList.remove('open');
        if ( closePopupBtn ) {
            closePopupBtn.removeEventListener('click', closePopup );
        };
        if ( popup__overlay ) {
            popup__overlay.removeEventListener('click', closePopup );
        };
        window.removeEventListener('keydown', escHandler);
    };
    
    function escHandler(event) {
        if(event.keyCode === 27) {
            closePopup();
        };
    };
})();

(function() {
    const closedUnsuccessMessageBtn = document.querySelector('.modal__close-unsuccess_js');
    const unsuccessMessagePopup = document.querySelector('.modal-unsuccess_js');
    const unsuccessMessageOverlay = document.querySelector('.modal-unsuccess__overlay_js');

    window.addEventListener('keydown', escHandlerUnsuccess);
    if (closedUnsuccessMessageBtn) {
        closedUnsuccessMessageBtn.addEventListener('click', closeUnsuccessPopup);
    }
    if ( unsuccessMessageOverlay ) {
        unsuccessMessageOverlay.addEventListener('click', closeUnsuccessPopup );
    }

    function closeUnsuccessPopup() {
        unsuccessMessagePopup.classList.remove('open');
    }

    function escHandlerUnsuccess(event) {
        if(event.keyCode === 27 && unsuccessMessagePopup.classList.contains('open')) {
            closeUnsuccessPopup();
        };
    };

})();

(function() {
    const closedSuccessMessageBtn = document.querySelector('.modal__close-success_js');
    const successMessagePopup = document.querySelector('.modal-success_js');
    const successMessageOverlay = document.querySelector('.modal-success__overlay_js');
    
    window.addEventListener('keydown', escHandlerSuccess);
    if (closedSuccessMessageBtn) {
        closedSuccessMessageBtn.addEventListener('click', closeSuccessPopup);
    }
    if ( successMessageOverlay ) {
        successMessageOverlay.addEventListener('click', closeSuccessPopup );
    }

    function closeSuccessPopup() {
        successMessagePopup.classList.remove('open');
    }

    function escHandlerSuccess(event) {
        if(event.keyCode === 27 && successMessagePopup.classList.contains('open')) {
            closeSuccessPopup();
        };
    };

})();