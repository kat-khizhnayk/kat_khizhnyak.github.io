// функция выделения текущей страницы как активной

(function() {
    const currentPage = document.querySelector('.header__link-profile_js');
    const currentBurgerPage = document.querySelector('.burger__link-profile_js');
    const isLogin = localStorage.getItem('token');
    if(!isLogin)  location.pathname = '/';
    currentPage.classList.add('header__link_active');
    currentBurgerPage.classList.add('burger__link_active');
})();

rerenderMenu();

// Прелоадер

const loader = document.querySelector('.loader_js');

let loaderCount = 0;

const showLoader = () => {
  loaderCount++;
  loader.classList.remove('hidden');
}

const hideLoader = () => {
  loaderCount--;
  if(loaderCount <=0) {
    loader.classList.add('hidden');
    loaderCount = 0;
  }
}

// ОТКРЫТИЕ, ЗАКРЫТИЕ, ВАЛИДАЦИЯ, ОТПРАВКА ФОРМ

// Работа с формой изменения Данных Form-Data.

(function() {
    const form = document.forms.data;
    const inputs = [...form.querySelectorAll('input')];

    const popup = document.querySelector('.popup-data_js');
    const btnOpen = document.querySelector('.data-btn_js');
    const closePopupBtn = document.querySelector('.popup__close-data_js');
    const input = document.querySelector('.data__input--email');
    const popup__overlay = document.querySelector('.popup__overlay-data_js');

    const loaderReg = document.querySelector('.loader_js');
    const unsuccessServerMessage  = document.querySelector('.modal-unsuccess_js');
    const successServerMessage = document.querySelector('.modal-success_js');

    const profileImg = document.querySelector('.profile__img-wrapper_js');
    const profileName = document.querySelector('.profile__name_js');
    const profileSurname = document.querySelector('.profile__surname_js');
    const profileEmail = document.querySelector('.profile__email_js');
    const profileLocation = document.querySelector('.profile__location_js');
    const profileAge = document.querySelector('.profile__age_js');

    const inputFile = form.querySelector('.data__input-file_js');
    const nameFile = form.querySelector('.data__label-text_js');

    let profile = null;

    if ( !popup && !btnOpen ) return;

    btnOpen.addEventListener('click', openPopup);

    function openPopup() {
        popup.classList.add('open');
        input.focus();
        window.addEventListener('keydown', escHandler);

        form.name.value = profile.name;
        form.surname.value = profile.surname;
        form.email.value = profile.email;
        form.location.value = profile.location;
        form.age.value = profile.age;

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

    loaderReg.classList.remove('hidden');

    getProfile();

    form.addEventListener('submit', changeData);

    function changeData(e) {
        e.preventDefault();

        clearErrors(form);
        clearSuccess(form);

        const userData = getAll(form); 
        console.log(userData);

        let errors = {};

        console.log(inputs);

        inputs.forEach(input => {
                if ( input.name === 'email' ) {
                    if ( !isEmailCorrect(userData.email) ) {
                        errors.email = 'Please enter a valid email address (your entry is not in the format "somebody@example.com")';
                    } else {setSuccessText(input);}
                }
                if ( input.name === 'name' ) {
                    if ( userData.name.length === 0 ) {
                        errors.name = 'This field is required';
                    } else {setSuccessText(input);}
                }
                if ( input.name === 'surname' ) {
                    if ( userData.surname.length === 0 ) { 
                        errors.surname = 'This field is required';
                    } else {setSuccessText(input);}
                }
                if ( input.name === 'location' ) {
                    if ( userData.location.length === 0 ) {
                        errors.location = 'This field is required';
                    } else {setSuccessText(input);}
                }
                if ( input.name === 'age' ) {
                    if ( userData.age.length === 0 ) {
                        errors.age = 'This field is required'; 
                   } else {setSuccessText(input);}  
                }                      
            }
        )
        console.log(errors);

        Object.keys(errors)
        if ( Object.keys(errors).length ) {
            Object.keys(errors).forEach((key) => {
                setErrorText(form.elements[key], errors[key]); 
            })
            return; 
        }

        const data = new FormData(form);

        loaderReg.classList.remove('hidden');

        sendRequest({
            method: 'PUT',
            url: '/api/users',
            body: data,
            headers: {
                'x-access-token': localStorage.getItem('token'),
            }
        })
        .then(res => {
            if(res.status === 401 || res.status === 403) {
                errorTextFromServer(unsuccessServerMessage, res._message);
                interactionModal(unsuccessServerMessage);
                localStorage.removeItem('token');
                localStorage.removeItem('userId');
                setTimeout(() => { 
                    interactionModal(unsuccessServerMessage);   
                    location.pathname = '/';              
                }, 2000)
                return;
            }
            return res.json();
        })
        .then(res => {
            if (res.success) {           
                interactionModal(successServerMessage);
                clearSuccess(form);   
                interactionModal(popup);    
                console.log('Данные успешно изменены');  
                profile = res.data;
                renderProfile();
                setTimeout(() => { 
                    interactionModal(successServerMessage); 
                }, 2000)
            } else {
                throw res;
            }
        })
        .catch(err => {
            if (err._message) {
                errorTextFromServer(unsuccessServerMessage, err._message);
                interactionModal(unsuccessServerMessage);
                localStorage.removeItem('token');
                localStorage.removeItem('userId');
                setTimeout(() => { 
                    interactionModal(unsuccessServerMessage);   
                    location.pathname = '/';              
                }, 2000)
            }
        })
        .finally(() => {
            loaderReg.classList.add('hidden');
        })
    }

    function renderProfile() {
        profileImg.innerHTML = `<img src="${BASE_SERVER_PATH + profile.photoUrl}" class="profile__img" alt="photo">`;
        profileName.innerText = profile.name;
        profileSurname.innerText = profile.surname;
        profileEmail.innerText = profile.email;
        profileLocation.innerText = profile.location;
        profileAge.innerText = profile.age;
    }

    inputFile.addEventListener('change', () => {
        if (inputFile.value) {
            nameFile.innerText = `${inputFile.files.item(0).name}`;
        } else {
            nameFile.innerText = "Choose a file...";
        }
    });

    function getProfile() {
        sendRequest({
            method: 'GET',
            url: `/api/users/${localStorage.getItem('userId')}`,
        })
        .then(res => {
            return res.json();
        })
        .then((res) => {
            if (res.success) {
                profile = res.data;
                renderProfile(profile);
            } else {
                throw new Error(`${res.status} ${res.message}`);
            }
        })
        .catch(err => {
            console.error(err);
        })
        .finally(() => {
            loaderReg.classList.add('hidden');
        });
    }
})();

// / Работа с формой изменения пароля Form-password.

(function() {
    const form = document.forms.password;
    const inputs = [...form.querySelectorAll('input')];

    const popup = document.querySelector('.popup-password_js');
    const btnOpen = document.querySelector('.password-btn_js');
    const closePopupBtn = document.querySelector('.popup__close-password_js');
    const input = document.querySelector('.password__input');
    const popup__overlay = document.querySelector('.popup__overlay-password_js');

    const loaderReg = document.querySelector('.loader_js');
    const unsuccessServerMessage  = document.querySelector('.modal-unsuccess_js');
    const successServerMessage = document.querySelector('.modal-success_js');

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

    form.addEventListener('submit', changePassword);

    function changePassword(e) {
        e.preventDefault();

        clearErrors(form);
        clearSuccess(form);

        const userData = getAll(form);
        console.log(userData);

        let errors = {}; 

        console.log(inputs);

        inputs.forEach(input => {
            if ( input.hasAttribute('required') ) {
                if ( input.name === 'oldPassword' ) {
                    if ( userData.oldPassword.length === 0 ) {
                        errors.oldPassword = 'This field is required';
                    } else {setSuccessText(input);}
                }
                if ( input.name === 'newPassword' ) {
                    if ( userData.newPassword.length === 0 ) {
                        errors.newPassword = 'This field is required';
                    } else {setSuccessText(input);}
                }
                if ( input.name === 'repeatPassword' ) {
                    if ( userData.repeatPassword !== userData.newPassword || userData.repeatPassword.length === 0 ) {
                        errors.repeatPassword = 'Your password does not match the password you entered!';
                    } else {setSuccessText(input);}
                }            
            }
        })

        console.log(errors);

        Object.keys(errors) 
        if ( Object.keys(errors).length ) {
            Object.keys(errors).forEach((key) => {
                setErrorText(form.elements[key], errors[key]); 
            })
            return; 
        }

        loaderReg.classList.remove('hidden');

        const data = new FormData(form);

        sendRequest({
            url: '/api/users',
            method: 'PUT',
            body: data,
            headers: {
                'x-access-token': localStorage.getItem('token'),
            }
        })
        .then(res => {
            if(res.status === 401 || res.status === 403) {
                errorTextFromServer(unsuccessServerMessage, res._message);
                interactionModal(unsuccessServerMessage);
                localStorage.removeItem('token');
                localStorage.removeItem('userId');
                setTimeout(() => { 
                    interactionModal(unsuccessServerMessage);   
                    location.pathname = '/';              
                }, 2000)
                return;
            }
            return res.json();
        })
        .then(res => {
            if (res.success) {           
                interactionModal(successServerMessage);
                form.reset();
                clearSuccess(form); 
                interactionModal(popup);      
                console.log('Пароль успешно изменен!');  
                setTimeout(() => { 
                    interactionModal(successServerMessage); 
                }, 2000)
            } else {
                throw res;
            }
        })
        .catch(err => {
            if (err) {
                errorTextFromServer(unsuccessServerMessage, 'Неизвестная ошибка сервера');
                interactionModal(unsuccessServerMessage);
                clearSuccess(form);
                clearErrors(form);
                interactionModal(popup); 
                form.reset();
                setTimeout(() => { 
                    interactionModal(unsuccessServerMessage);              
                }, 2000)
            }
        })
        .finally(() => {
            loaderReg.classList.add('hidden');
        })
    }
})();

(function() {
    const deleteBtn = document.querySelector('.delete-btn_js');
    const loaderReg = document.querySelector('.loader_js');
    const unsuccessServerMessage  = document.querySelector('.modal-unsuccess_js');
    const successServerMessage = document.querySelector('.modal-success_js');

    deleteBtn.addEventListener('click', e => {
        e.preventDefault();

        loaderReg.classList.remove('hidden');

        sendRequest({
            url: '/api/users/'+ localStorage.getItem('userId'),
            method: 'DELETE',
            headers: {
                'x-access-token': localStorage.getItem('token'),
            }
        })
        .then(res => {
            if(res.status === 401 || res.status === 403) {
                errorTextFromServer(unsuccessServerMessage, res._message);
                interactionModal(unsuccessServerMessage);
                localStorage.removeItem('token');
                localStorage.removeItem('userId');
                setTimeout(() => { 
                    interactionModal(unsuccessServerMessage);   
                    location.pathname = '/';              
                }, 2000)
                return;
            }
            return res.json();
        })
        .then(res => {
            if (res.success) {           
                interactionModal(successServerMessage);     
                console.log('Аккаунт успешно удалён!');  
                localStorage.removeItem('token');
                localStorage.removeItem('userId');
                setTimeout(() => { 
                    interactionModal(successServerMessage); 
                    location.pathname = '/'; 
                }, 2000)
            } else {
                throw res;
            }
        })
        .catch(err => {
            if (err) {
                errorTextFromServer(unsuccessServerMessage, 'Неизвестная ошибка сервера');
                interactionModal(unsuccessServerMessage);
                setTimeout(() => { 
                    interactionModal(unsuccessServerMessage);   
                    location.pathname = '/'; 
                }, 2000)
            }
        })
        .finally(() => {
            loaderReg.classList.add('hidden');
        })
    })
})();