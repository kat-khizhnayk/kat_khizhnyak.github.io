// функция выделения текущей страницы как активной

(function() {
  const currentPages = document.querySelectorAll('.header__link-blog_js');
  const currentBurgerPages = document.querySelectorAll('.burger__link-blog_js');
  currentBurgerPages.forEach(page => {
    page.classList.add('burger__link_active');
  })
  currentPages.forEach(page => {
    page.classList.add('header__link_active');
  })
})();

// ПРЕЛОАДЕР, ЗАГРУЗКА И ОТРИСОВКА ТЕГОВ И ПОСТОВ 

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

(function() {
    const form = document.forms.filterForm;
    const resetBtn = form.querySelector('.filter__reset-btn_js');
    const backBtn = document.querySelector('.blog__button-back_js');
    const nextBtn = document.querySelector('.blog__button-next_js');
    const defaultLimit = 5; 

    form.addEventListener('submit', (e) => {
        e.preventDefault();

        let data = {
          page:0,
        };

        data.name = form.elements.name.value;

        data.tags = [...form.elements.tags]
        .filter(checkbox => checkbox.checked)
        .map(checkbox => checkbox.value);

        data.comments = [...form.elements.comments]
        .filter(checkbox => checkbox.checked)
        .map(checkbox => checkbox.value);

        data.sort = ([...form.elements.sort]
        .find(radio => radio.checked) || {value: null}).value;

        data.show = ([...form.elements.show]
        .find(radio => radio.checked) || {value: null}).value;

        data.views = ([...form.elements.views]
        .find(radio => radio.checked) || {value: null}).value;

        console.log(data);
        
        getData(data);    // формирует посты по данным с сервера
        setSearchParams(data);      // устанавливает параметры фильтра в адресной строке
    })

    let xhr = new XMLHttpRequest();
    xhr.open('GET', BASE_SERVER_PATH + '/api/tags');
    xhr.send();
    showLoader();
    xhr.onload = () => {
        const tags = JSON.parse(xhr.response).data; 
        renderCheckbox(tags);       
        const params = getParamsFromLocation();
        setDataToFilter(params);
        getData(params);
        hideLoader();
    }

  resetBtn.addEventListener('click', () => {
    if(location.search.length) {
      history.replaceState(null, null, window.location.pathname);
    };
  });

  backBtn.addEventListener('click', () => {
    setActivePage(getParamsFromLocation().page - 1);
  })

  nextBtn.addEventListener('click', () => {
    setActivePage(getParamsFromLocation().page + 1);
  })

  const createCheckbox = (check) => {
    return `
    <label class="checkbox">
        <input class="checkbox__input" id="${check.id}" type="checkbox" name="tags" value="${check.id}">
        <span class="checkbox__mark" style="border-color: ${check.color}"></span>
    </label>
    `
  }

  // Данная функция нужна для того, чтобы перебрать полученные от сервера результаты и отрисовать каждый чекбокс.
  const renderCheckbox = (data) => {
    for (let check of data) {
        document.querySelector('.filter__tags-inner_js').insertAdjacentHTML('beforeend', createCheckbox(check));
    }
  }

  function getParamsFromLocation() {   //  возвращает текущие данные фильтра
    let searchParams = new URLSearchParams(location.search);
    return {
      name: searchParams.get('name') || '',
      tags: searchParams.getAll('tags'),
      views: searchParams.get('views'),
      comments: searchParams.getAll('comments'),
      show: searchParams.get('show'),
      sort: searchParams.get('sort'),
      page: +searchParams.get('page') || 0,
    }
  }

  function setSearchParams(data) {
    let searchParams = new URLSearchParams();
    searchParams.set('name', data.name);
    data.tags.forEach(tag => {
      searchParams.append('tags', tag);
    });
    if(data.page) {
      searchParams.append('page', data.page);
    } else {
      searchParams.set('page', 0);
    }
    if(data.sort) {
      searchParams.set('sort', data.sort);
    }
    if(data.views) {
      searchParams.set('views', data.views);
    }
    if(data.comments) {
        data.comments.forEach(comment => {
            searchParams.append('comments', comment);
        });
    }
    if(data.show) {
        searchParams.set('show', data.show);
    } 

    history.replaceState(null, document.title, '?' + searchParams.toString());
  }

  function getData(params) {
    const result = document.querySelector('.result_js');

    let xhr = new XMLHttpRequest();
    let searchParams = new URLSearchParams();
    searchParams.set('v', '1.0.0');

    if(params.tags && Array.isArray(params.tags) && params.tags.length) {
      searchParams.set('tags', JSON.stringify(params.tags));
    };

    let filter = {};

    if(params.name) {
      filter.title = params.name;
    }

    if(params.views) {
      const choisedCountOfViews = (params.views).split('-');
      filter.views = {"$between": choisedCountOfViews};
    }

    if(params.comments.length) {
      const array = (params.comments).join('-').split('-');
      let choisedCountOfComments = [array[0], array[array.length-1]];
      filter.commentsCount = {"$between": choisedCountOfComments};
    }

    searchParams.set('filter', JSON.stringify(filter));

    let LIMIT = defaultLimit;
    if(+params.show) {
      LIMIT = +params.show;
      console.log(+params.show);
    }
    searchParams.set('limit', LIMIT);

    if(+params.page) {
      searchParams.set('offset', (+params.page) * LIMIT);
    }

    if(params.sort) {
      searchParams.set('sorts', JSON.stringify([params.sort, 'DESC']));
    }

    xhr.open('GET', BASE_SERVER_PATH + '/api/posts?' + searchParams.toString());
    xhr.send();
    showLoader();
    result.innerHTML = '';
    const links = document.querySelector('.pagination_js');
    links.innerHTML = '';
    xhr.onload = () => {
      const response = JSON.parse(xhr.response);
      let dataPosts = '' ;
      response.data.forEach(post => {
        dataPosts  += cardCreate({
          title: post.title,
          text: post.text,
          comments: post.commentsCount,
          date: typeOfDate(post.date),  // вызвать функцию, в нее передать post.date
          views: post.views, 
          photo: post.photo, 
          tags: post.tags
        });
      })
      result.innerHTML = dataPosts;

      const pageCount = Math.ceil(response.count / LIMIT);
      for(let i = 0; i < pageCount; i++) {
        const link = linkElementCreate(i);
        links.insertAdjacentElement('beforeend', link);
      }

      backBtn.removeAttribute('disabled');
      nextBtn.removeAttribute('disabled');

      let currentParams = getParamsFromLocation();
      if(currentParams.page === 0 || pageCount === 0) {
        backBtn.setAttribute('disabled', 'disabled');
      };
      
      if(pageCount === 0 || currentParams.page === (pageCount - 1)) {
        nextBtn.setAttribute('disabled', 'disabled');
      }

      hideLoader();
    }
  }

  function linkElementCreate(page) {
    const link = document.createElement('a');
    link.href = '?page=' + page;
    link.innerText = `${page + 1}`;
    link.classList.add('link_js');
    link.classList.add('blog__pagination-link');

    let params = getParamsFromLocation();
    if (page === +params.page) {
      link.classList.add('pagination-link_active');
    }

    link.addEventListener('click', (e) => {
      e.preventDefault();
      setActivePage(page);
    });

    return link;
  }

  function setActivePage(page) {
    const links = document.querySelectorAll('.link_js');
      let searchParams = new URLSearchParams(location.search);
      let params = getParamsFromLocation();

      links[params.page].classList.remove('pagination-link_active');
      searchParams.set('page', page);
      links[page].classList.add('pagination-link_active');

      history.replaceState(null, document.title, '?' + searchParams.toString());
      getData(getParamsFromLocation());
  }

  function cardCreate({title, text, comments, date, views, photo, tags}) {
    return `
    <div class="blog">
      <picture class="blog__img">
        <source class="blog__img" srcset="${BASE_SERVER_PATH}${photo.desktopPhotoUrl}, ${BASE_SERVER_PATH}${photo.desktop2xPhotoUrl} 2x" media="(max-width: 1440px)">
        <source class="blog__img" srcset="${BASE_SERVER_PATH}${photo.tabletPhotoUrl}, ${BASE_SERVER_PATH}${photo.tablet2xPhotoUrl} 2x" media="(max-width: 768px)">
        <source class="blog__img" srcset="${BASE_SERVER_PATH}${photo.mobilePhotoUrl}, ${BASE_SERVER_PATH}${photo.mobile2xPhotoUrl} 2x" media="(max-width: 320px)">
        <img class="blog__img" src="${BASE_SERVER_PATH}${photo.desktopPhotoUrl}" alt="${title}">
      </picture>  
      <div class="blog__wrapper">
        <div class="blog__tags">
            ${tags.map(tag => `<span class="blog__tag" style="background-color: ${tag.color}"></span>`).join('')}
        </div>
        <div class="blog__inner">
          <p class="blog__date">${date}</p>
          <p class="blog__views">${views} views</p>
          <p class="blog__comments">${comments} comments</p>
        </div>
        <h2 class="blog__title">${title}</h2>
        <p class="blog__text">${text}</p>
        <a class="blog__link" href="#">Go to this post</a>
      </div>
    </div>`
  }

  function setDataToFilter(data) {
    const form = document.forms.filterForm;
    form.elements.name.value = data.name;

    form.elements.tags.forEach(checkbox => {
      checkbox.checked = data.tags.includes(checkbox.value);
    });
    form.elements.sort.forEach(radio => {
        radio.checked = data.sort === radio.value;
    });
    form.elements.views.forEach(views => {
        views.checked = data.views === views.value;
    });
    form.elements.comments.forEach(checkbox => {
        checkbox.checked = data.comments.includes(checkbox.value);
    });
    form.elements.show.forEach(item => {
        item.checked = data.show === item.value;
    });
  }

  function typeOfDate(dateFromServer) {
    let date = new Date(dateFromServer);

    let year = date.getFullYear();
    let month = date.getMonth() + 1;
    let day = date.getDate();

    if (month < 10) {
        month = '0' + month;
    }
    if(day < 10) {
        day = '0' + day;
    }
    const finalDate = `${day}.${month}.${year}`;
    return finalDate;
  }
})();

// ОТКРЫТИЕ, ЗАКРЫТИЕ, ВАЛИДАЦИЯ, ОТПРАВКА ФОРМ

// Работа с формой регистрации.

(function() {
  const form = document.forms.register;
  const inputs = [...form.querySelectorAll('input')];
  const checkboxInput = form.querySelector('.register__checkbox--input');
  const btnSubmit = form.querySelector('.register__button');

  const popup = document.querySelector('.popup-register_js');
  const loaderReg = document.querySelector('.loader_js');
  const unsuccessServerMessage  = document.querySelector('.modal-unsuccess_js');
  const successServerMessage = document.querySelector('.modal-success_js');

  const btnOpen = document.querySelector('.register-btn_js');
  const closePopupBtn = document.querySelector('.popup__close-register_js');
  const input = document.querySelector('.register__input--email');
  const popup__overlay = document.querySelector('.popup__overlay-register_js');

  console.log(closePopupBtn)

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
      }
  }

  function closePopup() {
      popup.classList.remove('open');
      if ( closePopupBtn ) {
          closePopupBtn.removeEventListener('click', closePopup );
      }
      if ( popup__overlay ) {
          popup__overlay.removeEventListener('click', closePopup );
      }
      window.removeEventListener('keydown', escHandler);
  }

  function escHandler(event) {
      if(event.keyCode === 27) {
          closePopup();
      };
  };

  console.log(unsuccessServerMessage);

  checkboxInput.addEventListener('click', function() {   
          if ( !checkboxInput.checked ) {
              btnSubmit.setAttribute('disabled', 'disabled');    
          } else btnSubmit.removeAttribute('disabled');
  });

  form.addEventListener('submit', (e) => {
      e.preventDefault(); // ломаем стандартное поведение события.

      clearErrors(form);
      clearSuccess(form);

      const userData = getAll(form); // Получаем все данные формы и кладём их в переменную userData.
      console.log(userData);

      let errors = {}; // объект под ошибки.

      console.log(inputs);

      inputs.forEach(input => {
          if ( input.hasAttribute('required') ) {
              if ( input.name === 'email' ) {
                  if ( !isEmailCorrect(userData.email) ) {
                      errors.email = 'Please enter a valid email address (your entry is not in the format "somebody@example.com")';
                  } else {setSuccessText(input);}
              }
              if ( input.name === 'repeatPassword' ) {
                  if ( userData.repeatPassword !== userData.password || userData.repeatPassword.length === 0 ) {
                      errors.repeatPassword = 'Your password does not match the password you entered!';
                  } else {setSuccessText(input);}
              } 
              if ( input.name === 'password' ) {
                  if ( userData.password.length === 0 ) {
                      errors.password = 'This field is required';
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
                 if ( !isAgeCorrect(userData.age) ) {
                          errors.age = 'Your age is not 18!';
                      } else if ( userData.age.length === 0 ) {
                      errors.age = 'This field is required'; 
                 } else {setSuccessText(input);} 
              }           
          }
      })
      console.log(errors);

      Object.keys(errors) // получает все ключи нашего объекта, а свойство length подсчитывает их длину.
      if ( Object.keys(errors).length ) {
          // Дальше мы перебираем все наши свойства.
          Object.keys(errors).forEach((key) => {
              // 1-ый аргумент наш инпут, 2-ой текст ошибки
              setErrorText(form.elements[key], errors[key]); // функция, которая вешает ошибку
          })
          return; // Делаем выход из функции для того, чтобы данные не отправились, потому что у нас есть ошибки.
      }

      // Объект data, который в последующем будет отправляться на сервер.
      const data = {
          email: userData.email,
          password: userData.password,
          name: userData.name,
          surname: userData.surname,
          location: userData.location,
          age: +userData.age,
      };

      // Якобы отправка данных
      console.log(data);

      loaderReg.classList.remove('hidden');

      sendRequest({
          url: '/api/users',
          method: 'POST',
          headers: {
              'Content-Type': 'application/json',
          },
          body: JSON.stringify(data),
      })
      .then(res => {
          return res.json();
      })
      .then(res => {
          if ( res.success ) {
              interactionModal(successServerMessage);
              console.log(`Пользователь с id ${res.data.id} & email ${res.data.email} зарегистрирован!`);
              interactionModal(popup);
              form.reset();
              clearSuccess(form);
              setTimeout(() => { 
                  interactionModal(successServerMessage);                 
               }, 2000)
          } else {
              throw res;
          }
      })
      .catch(err => {
          if (err.errors) {
              errorTextFromServer(unsuccessServerMessage, err.errors.email);
              interactionModal(unsuccessServerMessage);
          }
          if (err._message) {
              errorTextFromServer(unsuccessServerMessage, err._message);
              interactionModal(unsuccessServerMessage);
          }
          setTimeout(() => { 
              interactionModal(popup); 
              interactionModal(unsuccessServerMessage);                
          }, 2000)
          form.reset();
          clearErrors(form);
          clearSuccess(form);
      })
      .finally(() => {
          loaderReg.classList.add('hidden');
      });
  })
})();

// Работа с формой входа Sign in.

(function() {
  const form = document.forms.signIn;
  const inputs = [...form.querySelectorAll('input')];

  const popup = document.querySelector('.popup-sign_js');
  const loaderReg = document.querySelector('.loader_js');
  const unsuccessServerMessage  = document.querySelector('.modal-unsuccess_js');
  const successServerMessage = document.querySelector('.modal-success_js');

  const btnOpen = document.querySelector('.sign-btn_js');
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
      }
  }

  function closePopup() {
      popup.classList.remove('open');
      if ( closePopupBtn ) {
          closePopupBtn.removeEventListener('click', closePopup );
      }
      if ( popup__overlay ) {
          popup__overlay.removeEventListener('click', closePopup );
      }
      window.removeEventListener('keydown', escHandler);
  }

  function escHandler(event) {
      if(event.keyCode === 27) {
          closePopup();
      };
  };

  rerenderMenu();

  form.addEventListener('submit', (e) => {
      e.preventDefault(); 

      clearErrors(form);
      clearSuccess(form);

      const userData = getAll(form); 
      console.log(userData);

      let errors = {}; 

      console.log(inputs);

      inputs.forEach(input => {
          if ( input.hasAttribute('required') ) {
              if ( input.name === 'email' ) {
                  if ( !isEmailCorrect(userData.email) ) {
                      errors.email = 'Please enter a valid email address (your entry is not in the format "somebody@example.com")';
                  } else {setSuccessText(input);}
              }
              if ( input.name === 'password' ) {
                  if ( userData.password.length === 0 ) {
                      errors.password = 'This field is required';
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

      const data = {
          email: userData.email,
          password: userData.password,
      };

      console.log(data);

      loaderReg.classList.remove('hidden');

      sendRequest({
          url: '/api/users/login',
          method: 'POST',
          headers: {
              'Content-Type': 'application/json',
          },
          body: JSON.stringify(data),
      })
      .then(res => {
          return res.json();
      })
      .then(res => {
          if ( res.success ) {
              interactionModal(successServerMessage);
              localStorage.setItem('token', res.data.token);
              localStorage.setItem('userId', res.data.userId);
              rerenderMenu();
              console.log(`Вы успешно вошли!`);
              interactionModal(popup);
              form.reset();
              clearSuccess(form);
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
          }
          if (err) {
              errorTextFromServer(unsuccessServerMessage, 'Неизвестная ошибка сервера');
              interactionModal(unsuccessServerMessage);
          }
          setTimeout(() => { 
              interactionModal(popup); 
              interactionModal(unsuccessServerMessage);                
          }, 2000)
          form.reset();
          clearErrors(form);
          clearSuccess(form);
      })
      .finally(() => {
          loaderReg.classList.add('hidden');
      });
  })
})();

// Работа с формой отправки сообщений Send message.

(function() {
  const form = document.forms.send;
  const inputs = [...form.querySelectorAll('input')];
  const checkboxInput = form.querySelector('.send__checkbox--input');
  const btnSubmit = form.querySelector('.send__button');

  const loaderReg = document.querySelector('.loader_js');
  const popup = document.querySelector('.popup-send_js');
  const btnOpen = document.querySelector('.send-btn_js');
  const closePopupBtn = document.querySelector('.popup__close-send_js');
  const input = document.querySelector('.send__input_js');
  const popup__overlay = document.querySelector('.popup__overlay-send_js');

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
      }
      if ( popup__overlay ) {
          popup__overlay.addEventListener('click', closePopup );
      }
  }

  function closePopup() {
      popup.classList.remove('open');
      if ( closePopupBtn ) {
          closePopupBtn.removeEventListener('click', closePopup );
      }
      if ( popup__overlay ) {
          popup__overlay.removeEventListener('click', closePopup );
      }
      window.removeEventListener('keydown', escHandler);
  }
  
  function escHandler(event) {
      if(event.keyCode === 27) {
          closePopup();
      };
  };

  if ( !send ) return;

  checkboxInput.addEventListener('click', function() {   
          if ( !checkboxInput.checked ) {
              btnSubmit.setAttribute('disabled', 'disabled');    
          } else btnSubmit.removeAttribute('disabled');
  });

  form.addEventListener('submit', (e) => {
      e.preventDefault(); 

      clearErrors(form);
      clearSuccess(form);

      const userData = getAll(form); 
      console.log(userData);

      let errors = {}; 

      console.log(inputs);

      inputs.forEach(input => {
          if ( input.hasAttribute('required') ) {
              if ( input.name === 'name') {
                  if ( !isFullNameCorrect(userData.name) ) {
                      errors.name = 'Please enter a valid full name';
                  } else {setSuccessText(input);}
              }
              if ( input.name === 'subjectMessage' ) {
                  if ( userData.subjectMessage.length === 0 ) {
                      errors.subjectMessage = 'This field is required';
                  } else {setSuccessText(input);}
              }
              if ( input.name === 'email' ) {
                  if ( !isEmailCorrect(userData.email) ) {
                      errors.email = 'Please enter a valid email address (your entry is not in the format "somebody@example.com")';
                  } else {setSuccessText(input);}
              }
              if ( input.name === 'phone' ) {
                  if ( !isPhoneCorrect(userData.phone) ) {
                      errors.phone = 'Please enter a valid phone number';
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

      const data = {
            to: userData.email,
          body: JSON.stringify({
              name: userData.name,
              subject: userData.subjectMessage,
              phone: userData.phone,
              message: userData.message,
          })
      };

      console.log(data);

      loaderReg.classList.remove('hidden');

      sendRequest({
          url: '/api/emails',
          method: 'POST',
          headers: {
              'Content-Type': 'application/json',
          },
          body: JSON.stringify(data),
      })
      .then(res => {
          return res.json();
      })
      .then(res => {
          if ( res.success ) {
              interactionModal(successServerMessage);
              interactionModal(popup);
              form.reset();
              clearSuccess(form);
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
          }
          if (err) {
              errorTextFromServer(unsuccessServerMessage, 'Неизвестная ошибка сервера');
              interactionModal(unsuccessServerMessage);
          }
          setTimeout(() => { 
              interactionModal(popup); 
              interactionModal(unsuccessServerMessage);                
          }, 2000)
          form.reset();
          clearErrors(form);
          clearSuccess(form);
      })
      .finally(() => {
          loaderReg.classList.add('hidden');
      });
  })
})();