; (function ($) {
  "use strict";

// Инициализация переменных
let user = '';
let activeApplication = [];
let currentItems = [];
let activeCategories = [];

const $targetInput = $('.search_leader_main');
const $targetSelect = $('#search_box_item');
const $mainWrapper = $('.table__item__wrapper');
const $filterItems = $('.filter__item');
const $filterHeadCountFilter = $('.filter__head__count-filter');
const $filterHeadCountProg = $('.filter__head__count-prog');

// Функция рендеринга элементов
function renderItems(items) {
   const html = items.map(item => createProgramHTML(item)).join('');
   $mainWrapper.html(html);
   updateCounts(items.length);
}

// Функция создания HTML для элемента программы
function createProgramHTML(item) {
   return `
       <div class="table__item" data-id="${item.ID}" data-item='${JSON.stringify(item)}'>
           <span class="table__item__title">${item.highlightedTitle || item.Title || 'Не указано'}</span>
           <div class="table__item__filter__wrapper">
               <div class="table__item__filter"><img src="https://intranet.rencredit.ru/Departments/TD/Test/leader_test_2/images/idea-m.png" alt="compet" class="table__item__filter__img"><span class="table__item__filter__title">${item.tags ? item.tags.results.join('<br/>') : 'Не указано'}</span></div>
               <div class="table__item__filter"><img src="https://intranet.rencredit.ru/Departments/TD/Test/leader_test_2/images/frame-m.png" alt="targetAudience" class="table__item__filter__img"><span class="table__item__filter__title">${item.trainingFormat ? item.trainingFormat.results.join('<br/>') : 'Не указано'}</span></div>
               <div class="table__item__filter"><img src="https://intranet.rencredit.ru/Departments/TD/Test/leader_test_2/images/time.png" alt="category" class="table__item__filter__img"><span class="table__item__filter__title">${item.courseDuration ? item.courseDuration.results.join('<br/>') : 'Не указано'}</span></div>
               <div class="table__item__filter"><img src="https://intranet.rencredit.ru/Departments/TD/Test/leader_test_2/images/team-m.png" alt="exp" class="table__item__filter__img"><span class="table__item__filter__title">${item.Audience ? item.Audience.results.join('<br/>') : 'Не указано'}</span></div>
               <div class="table__item__filter"><img src="https://intranet.rencredit.ru/Departments/TD/Test/leader_test_2/images/iconoir_m.png" alt="duration" class="table__item__filter__img"><span class="table__item__filter__title">${item.source ? item.source.results.join('<br/>') : 'Не указано'}</span></div>
           </div>
       </div>
   `;
}

// Функция обновления счетчиков
function updateCounts(progCount) {
   $filterHeadCountFilter.text(activeCategories.length);
   $filterHeadCountProg.text(progCount);
}

// Функция фильтрации и рендеринга элементов
function filterAndRenderItems() {
   const searchValue = $targetInput.val().toLowerCase();
   const sortValue = $targetSelect.val();
   let filteredItems = currentItems.filter(item => {
       const matchesCategory = activeCategories.length === 0 || activeCategories.some(category => {
           return [
               ...(item.ManagementExperience && item.ManagementExperience.results ? item.ManagementExperience.results : []),
               ...(item.trainingFormat && item.trainingFormat.results ? item.trainingFormat.results : []),
               ...(item.source && item.source.results ? item.source.results : []),
               ...(item.courseDuration && item.courseDuration.results ? item.courseDuration.results : []),
               ...(item.Audience && item.Audience.results ? item.Audience.results : []),
               ...(item.tags && item.tags.results ? item.tags.results : []),
           ].includes(category);
       });

       return matchesCategory;
   });

  // Применение поиска и подсветка найденного текста
  if (searchValue.length > 0) {
      filteredItems = filteredItems.filter(item => {
          return item.Title.toLowerCase().includes(searchValue);
      }).map(item => {
          const regex = new RegExp(`(${searchValue})`, 'gi');
          item.highlightedTitle = item.Title.replace(regex, '<span class="highlight">$1</span>');
          return item;
      });
  } else {
      filteredItems = filteredItems.map(item => {
          item.highlightedTitle = item.Title;
          return item;
      });
  }

  if (sortFunctions[sortValue]) {
      filteredItems.sort(sortFunctions[sortValue]);
  }

  renderItems(filteredItems);

}

// Функция сортировки
const sortFunctions = {
   'От А до Я': (a, b) => a.Title.localeCompare(b.Title),
   'От Я до А': (a, b) => b.Title.localeCompare(a.Title),
   'Сначала новые': (a, b) => new Date(b.Created) - new Date(a.Created),
   'Сначала старые': (a, b) => new Date(a.Created) - new Date(b.Created)
};

// Функция получения данных программ
function getProgramData() {
   const requestUri = `https://intranet.rencredit.ru/Departments/TD/_api/web/lists/getByTitle('PROgrams1')/items`;
   const requestHeaders = { "accept": "application/json;odata=verbose" };

   $.ajax({
       url: `${requestUri}?$orderby=Created desc`,
       contentType: "application/json;odata=verbose",
       headers: requestHeaders
   }).done(function (data) {
       console.log(data)
       currentItems = data.d.results.filter(item => !item.draft).map(item => {
           return {
               Title: item.Title,
               Category: item.category,
               Competencies: item.compet,
               ManagementExperience: item.exp,
               Audience: item.targetAudience,
               Duration: item.duration,
               Comments: item.Comments,
               trainingFormat: item.trainingFormat,
               courseDuration: item.durationCourse,
               date: item.date,
               tags: item.tags,
               source: item.source,
               themes: item.themes,
               willGet: item.willGet,
               isLink: item.isLink,
               Link: item.Link,
               new: ((Date.now() - Date.parse(item.Created)) / 3600000 / 24) < 14,
               ID: item.ID,
               Created: item.Created,
           };
       });
       getUser();
   }).fail(function (error) {
       console.log(JSON.stringify(error)); // Логирование ошибок для отладки
   });
}

// Получаем текущего пользователя
function getUser() {
   const requestUri = _spPageContextInfo.webServerRelativeUrl + '/_api/SP.UserProfiles.PeopleManager/GetMyProperties';
   const requestHeaders = { "accept": "application/json;odata=verbose" };

   $.ajax({
       url: `${requestUri}?$orderby=Created desc`,
       contentType: "application/json;odata=verbose",
       headers: requestHeaders
   }).done(function (data) {
       user = data.d.Email.split('@')[0];
       filterAndRenderItems();
   }).fail(function (error) {
       console.log(JSON.stringify(error)); // Логирование ошибок для отладки
   });
}

function getActiveApplications(itemId) {
   const requestUri = _spPageContextInfo.webServerRelativeUrl + `/_api/web/lists/getbytitle('PROgramsMembers')/items?$filter=(userLogin eq '${user}') and (courseID eq '${itemId}') and (status eq 'Активна')'`;
   $.ajax({
       url: requestUri,
       type: "GET",
       async: false,
       dataType: 'json',
       headers: {
           Accept: "application/json;odata=verbose",
           "X-RequestDigest": $("#__REQUESTDIGEST").val()
       },
       success: function (data) {
           let dataApplications = ['', ''];
           data.d.results.forEach(element => {
               if (element.forTeam == true) {
                   dataApplications[1] = element.ID;
               }
               if (element.forTeam == false) {
                   dataApplications[0] = element.ID;
               }
           });
           buttonModal(dataApplications);
       },
       error: function (data) {
           console.error(data);
       }
   });
}

function formatDate(x) {
   let newDate = new Date(x);
   let month = newDate.getMonth() + 1;
   if (month < 10) month = '0' + month;
   let day = newDate.getDate();
   if (day < 10) day = '0' + day;
   let year = newDate.getFullYear();
   let date = day + '.' + month + '.' + year;
   return date == '01.01.1970' ? 'Не указано' : date;
}

  function buttonModal(e) {
console.log(e)
$('.modal__join__link').css({'display' : 'none'});
      if (e[0] !=='') {     
          $('.modal__join__btn').css({'display' : 'none'});
          $('.modal__cancel__btn').css({'display' : 'flex'});
          $('.modal__cancel__btn').attr('data-id', e[0]);
      } else {
          $('.modal__cancel__btn').css({'display' : 'none'});
          $('.modal__join__btn').css({'display' : 'flex'});
          $('.modal__cancel__btn').attr('data-id', '');
      }
      
      if (e[1] !=='') {
          $('.modal__join__btn__manager').css({'display' : 'none'});
          $('.modal__cancel__btn__manager').css({'display' : 'flex'});
          $('.modal__cancel__btn__manager').attr('data-id', e[1]);
      } else {
          $('.modal__cancel__btn__manager').css({'display' : 'none'});
          $('.modal__join__btn__manager').css({'display' : 'flex'});
          $('.modal__cancel__btn__manager').attr('data-id', '');
      }
  }
  // Функция открытия модального окна с заполненными данными
  function openModal(item) {
      
      if(item.Link){
$('.modal__join__btn').css({'display' : 'none'});
      $('.modal__cancel__btn').css({'display' : 'none'});
      $('.modal__join__btn__manager').css({'display' : 'none'});
      $('.modal__cancel__btn__manager').css({'display' : 'none'});
      $('.modal__join__link').attr("href", item.Link);
      $('.modal__join__link').css({'display' : 'flex'});
      }else{
        getActiveApplications(item.ID)  
      }
      $('#prog').attr('data-id', item.ID);
      $('#prog .modal__title').text(item.Title || 'Не указано');
      $('#prog .modal__duration').text(item.Comments || 'Не указано');
      $('#prog .modal__format__item').text(`${item.trainingFormat || 'Не указано'}: ${item.courseDuration || 'Не указано'}`);
      $('#prog .modal__format__item-audience').text(`${item.Audience ? item.Audience.results.join(' ') : 'Не указано'}`);
      $('#prog .modal__format__item-date').text(`${formatDate(item.date)}`);
      $('#prog .modal__date__item').text(item.date || 'Не указано');
      $('.modal__filter[data-filter="tags"] .modal__filter__text').text(item.tags ? item.tags.results.join(' ') : 'Не указано');
      $('.modal__filter[data-filter="courseDuration"] .modal__filter__text').text(item.courseDuration ? item.courseDuration.results.join(' ') : 'Не указано');
      $('.modal__filter[data-filter="trainingFormat"] .modal__filter__text').text(item.trainingFormat ? item.trainingFormat.results.join(' ') : 'Не указано');
      $('.modal__filter[data-filter="Audience"] .modal__filter__text').text(item.Audience ? item.Audience.results.join(' ') : 'Не указано');
      $('.modal__filter[data-filter="source"] .modal__filter__text').text(item.source ? item.source.results.join(' ') : 'Не указано');

      // Обработка списков
      const themesList = item.themes ? item.themes.split(';').map(theme => `<li class="modal__topic__li">${theme.trim()}</li>`).join('') : '<li class="modal__topic__li">Не указано</li>';
      $('#prog .modal__topic-themes .modal__topic__ul').html(themesList);

      const willGetList = item.willGet ? item.willGet.split(';').map(get => `<li class="modal__topic__li">${get.trim()}</li>`).join('') : '<li class="modal__topic__li">Не указано</li>';
      $('#prog .modal__topic-get .modal__topic__ul').html(willGetList);

      // Обработка ссылки
      if (item.isLink && item.Link) {
          const linkList = `<li class="modal__topic__li"><a href="${item.Link}" target="_blank">${item.Link}</a></li>`;
          $('#prog .modal__topic-link .modal__topic__ul').html(linkList);
          $('#prog .modal__topic-link').show();
      } else {
          $('#prog .modal__topic-link').hide();
      }
  
      // Открытие модального окна
      $('#prog').modal('show');
  }

  // Обработчик клика по элементу .table__item для открытия модального окна
  $(document).on('click', '.table__item', function () {
      const itemData = JSON.parse($(this).attr('data-item'));
      openModal(itemData);
  });

  // Инициализация
  $(document).ready(() => {
      getProgramData();
  });

  // Функция сворачивания/разворачивания фильтров
  $(document).on('click', '.filter__item__head', function () {
      $(this).next('.filter__item__body').slideToggle();
      $(this).parent().toggleClass('expanded');
  });

  // Функция для фильтрации по категориям
  $(document).on('click', '.filter__item', function () {
      const $this = $(this);
      const category = $this.data('filtername');

      if ($this.hasClass('filter__item-active')) {
          $this.removeClass('filter__item-active');
          activeCategories = activeCategories.filter(c => c !== category);
      } else {
          $this.addClass('filter__item-active');
          activeCategories.push(category);
      }

      filterAndRenderItems();
  });

  // Обработка ввода текста в поисковую строку
  $targetInput.on('input', function () {
      filterAndRenderItems();
  });

  // Обработка изменения в сортировке
  $targetSelect.on('change', function () {
      filterAndRenderItems();
  });


  // Функция для отправки данных в список SharePoint
  function submitApplication(itemId, title, forTeam) {
      const requestUri = `https://intranet.rencredit.ru/Departments/TD/_api/web/lists/getByTitle('PROgramsMembers')/items`;
      const requestHeaders = {
          "accept": "application/json;odata=verbose",
          "content-type": "application/json;odata=verbose",
          "X-RequestDigest": $("#__REQUESTDIGEST").val() // Динамическое получение значения токена
      };

      const itemData = {
          '__metadata': { 'type': 'SP.Data.PROgramsMembersListItem' },
          'Title': title,
          'courseID': parseInt(itemId),
          'forTeam': forTeam ? true : false,
          'userLogin': user,
          'status': 'Активна'

      };

      $.ajax({
          url: requestUri,
          type: "POST",
          contentType: "application/json;odata=verbose",
          data: JSON.stringify(itemData),
          headers: requestHeaders,
          success: function (data) {
              if(forTeam){
               alert("Заявка отправлена. В ближайшие дни ты получишь уведомление по почте");   
              } else {
               alert("Заявка отправлена. В ближайшие дни ты получишь уведомление по почте");   
              }
              
              getActiveApplications(itemId)

          },
          error: function (error) {
              console.error("Ошибка при отправке заявки: ", JSON.stringify(error));
              alert("Ошибка при отправке заявки. Пожалуйста, попробуйте еще раз.");
          }
      });
  }


// Функция для редактирования данных в списоке SharePoint
function editApplication(itemId) {
  const requestUri = "https://intranet.rencredit.ru/Departments/TD/_api/web/lists/getByTitle('PROgramsMembers')/items(" + itemId + ")";


  const itemData = {
      '__metadata': { 'type': 'SP.Data.PROgramsMembersListItem' },
      'status': 'Отменена'
  };

  $.ajax({
      url: requestUri,
      type: "POST",
      contentType: "application/json;odata=verbose",
      data: JSON.stringify(itemData),
      headers: {
      "Accept": "application/json;odata=verbose",
      "X-RequestDigest": $("#__REQUESTDIGEST").val(),
      "X-HTTP-Method": "MERGE",
      "If-Match": "*"
      },
 success: function (data) {  
  alert("Заявка отменена");
  getActiveApplications(itemId)
 },
      error: function (error) {
          console.error("Ошибка при отправке заявки: ", JSON.stringify(error));
          alert("Ошибка при отправке заявки. Пожалуйста, попробуйте еще раз.");
      }
  });
}

  // Обработчик клика по кнопке "Подать заявку"
  $(document).on('click', '.modal__join__btn', function () {
      const itemId = $('#prog').data('id');
      const $modal = $(this).closest('.modal');
      const title = $modal.find('.modal__title').text();
      
      submitApplication(itemId, title);

      // submitApplication(itemId, title, false);
  });

  // Обработчик клика по кнопке "Заказать для команды"
  $(document).on('click', '.modal__join__btn__manager', function () {
      const itemId = $('#prog').data('id');
      const $modal = $(this).closest('.modal');
      const title = $modal.find('.modal__title').text();
      submitApplication(itemId, title, true);
  });
 // Обработчик клика по кнопкам отменить заявку
  $(document).on('click', '.modal__btn__cancel', function () {
      const itemId = $(this).data('id');
      editApplication(itemId)
  });

})(jQuery);
