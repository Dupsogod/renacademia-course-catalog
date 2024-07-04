;(function ($) {
  "use strict";

  // Инициализация переменных
  let user = '';
  let activeApplication = [];
  let currentItems = [];
  let activeCategories = {};

  // Кэширование jQuery селекторов для повышения производительности
  const $targetInput = $('.search_leader_main');
  const $targetSelect = $('#search_box_item');
  const $mainWrapper = $('.table__item__wrapper');
  const $filterItems = $('.filter__item');
  const $filterHeadCountFilter = $('.filter__head__count-filter');
  const $filterHeadCountProg = $('.filter__head__count-prog');
  const $readingMode = $('#reading-mode');
  const $readingModeContent = $('#reading-mode-content');
  const $increaseFont = $('#increase-font');
  const $decreaseFont = $('#decrease-font');
  const $bgColorButtons = $('.bg-color-btn');
  const $exitReadingMode = $('#exit-reading-mode');
  const $fontFamilySelector = $('#font-family-selector');

  // Функция рендеринга элементов
  function renderItems(items) {
    const html = items.map(item => createProgramHTML(item)).join('');
    $mainWrapper.html(html);
    updateCounts(items.length);
  }

  // Функция создания HTML для элемента программы
  function createProgramHTML(item) {
    const itemData = JSON.stringify(item).replace(/'/g, "\\'");
    const itemtrainingFormatClass = item.trainingFormat ? item.trainingFormat.results.join(' ') : '';
    return `
      <div class="table__item ${itemtrainingFormatClass}" data-id="${item.ID}" data-item='${itemData}'>
        <span class="table__item__title">${item.highlightedTitle || item.Title || 'Не указано'}</span>
        <div class="table__item__filter__wrapper">
          <div class="table__item__filter">
            <img src="https://intranet.rencredit.ru/Departments/TD/Pages/courses-catalog/images/idea-m.png" alt="compet" class="table__item__filter__img">
            <span class="table__item__filter__title">${item.tags ? item.tags.results.join('<br/>') : 'Не указано'}</span>
          </div>
          <div class="table__item__filter">
            <img src="https://intranet.rencredit.ru/Departments/TD/Pages/courses-catalog/images/frame-m.png" alt="targetAudience" class="table__item__filter__img">
            <span class="table__item__filter__title">${item.trainingFormat ? item.trainingFormat.results.join('<br/>') : 'Не указано'}</span>
          </div>
          <div class="table__item__filter">
            <img src="https://intranet.rencredit.ru/Departments/TD/Pages/courses-catalog/images/time.png" alt="category" class="table__item__filter__img">
            <span class="table__item__filter__title">${item.courseDuration ? item.courseDuration.results.join('<br/>') : 'Не указано'}</span>
          </div>
          <div class="table__item__filter">
            <img src="https://intranet.rencredit.ru/Departments/TD/Pages/courses-catalog/images/team-m.png" alt="exp" class="table__item__filter__img">
            <span class="table__item__filter__title">${item.Audience ? item.Audience.results.join('<br/>') : 'Не указано'}</span>
          </div>
          <div class="table__item__filter">
            <img src="https://intranet.rencredit.ru/Departments/TD/Pages/courses-catalog/images/iconoir_m.png" alt="duration" class="table__item__filter__img">
            <span class="table__item__filter__title">${item.source ? item.source.results.join('<br/>') : 'Не указано'}</span>
          </div>
        </div>
      </div>
    `;
  }

  // Функция обновления счетчиков
  function updateCounts(progCount) {
    $filterHeadCountFilter.text(Object.values(activeCategories).flat().length);
    $filterHeadCountProg.text(progCount);
  }

  // Функция фильтрации и рендеринга элементов
  function filterAndRenderItems() {
    const searchValue = $targetInput.val().toLowerCase();
    const sortValue = $targetSelect.val();

    let filteredItems = currentItems;

    // Применение фильтров по категориям
    Object.keys(activeCategories).forEach(block => {
      const categories = activeCategories[block];
      if (categories.length > 0) {
        filteredItems = filteredItems.filter(item => {
          return categories.some(category => {
            return [
              ...(item.ManagementExperience && item.ManagementExperience.results ? item.ManagementExperience.results : []),
              ...(item.trainingFormat && item.trainingFormat.results ? item.trainingFormat.results : []),
              ...(item.source && item.source.results ? item.source.results : []),
              ...(item.courseDuration && item.courseDuration.results ? item.courseDuration.results : []),
              ...(item.Audience && item.Audience.results ? item.Audience.results : []),
              ...(item.tags && item.tags.results ? item.tags.results : []),
            ].includes(category);
          });
        });
      }
    });

    // Применение поиска и подсветка найденного текста
    if (searchValue.length > 0) {
      filteredItems = filteredItems.filter(item => item.Title.toLowerCase().includes(searchValue))
        .map(item => {
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

    // Применение сортировки
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
    'Сначала старые': (a, b) => new Date(a.Created) - new Date(b.Created),
    'Последовательность': (a, b) => a.sequence - b.sequence
  };

  // Функция получения данных программ
  function getProgramData() {
    const requestUri = `https://intranet.rencredit.ru/Departments/TD/_api/web/lists/getByTitle('coursecatalog')/items?$top=5000&$orderby=Created desc`;
    const requestHeaders = { "accept": "application/json;odata=verbose" };

    $.ajax({
      url: requestUri,
      contentType: "application/json;odata=verbose",
      headers: requestHeaders
    }).done(function (data) {
      console.log(data);
      currentItems = data.d.results.filter(item => item.draft === false).map(item => {
        return {
          Title: item.Title,
          Audience: item.targetAudience,
          Format: item.format,
          trainingFormat: item.trainingFormat,
          courseDuration: item.durationCourse,
          date: item.date,
          tags: item.tags,
          source: item.source,
          willGet: item.willGet,
          Link: item.Link,
          new: ((Date.now() - Date.parse(item.Created)) / 3600000 / 24) < 14,
          ID: item.ID,
          Created: item.Created,
          sequence: item.sequence
        };
      });
      getUser();
    }).fail(function (error) {
      console.log(JSON.stringify(error));
    });
  }

  // Функция получения текущего пользователя
  function getUser() {
    const requestUri = _spPageContextInfo.webServerRelativeUrl + '/_api/SP.UserProfiles.PeopleManager/GetMyProperties';
    const requestHeaders = { "accept": "application/json;odata=verbose" };

    $.ajax({
      url: `${requestUri}?$orderby=Created desc`,
      contentType: "application/json;odata=verbose",
      headers: requestHeaders
    }).done(function (data) {
      user = data.d.Email.split('@')[0];
      $targetSelect.val('Последовательность'); // Устанавливаем значение сортировки по умолчанию
      filterAndRenderItems();
    }).fail(function (error) {
      console.log(JSON.stringify(error));
    });
  }

  // Функция получения активных заявок пользователя
  function getActiveApplications(itemId) {
    const requestUri = _spPageContextInfo.webServerRelativeUrl + `/_api/web/lists/getbytitle('coursecatalogmembers')/items?$filter=(userLogin eq '${user}') and (courseID eq '${itemId}') and (status eq 'Активна')'`;
    return $.ajax({
      url: requestUri,
      type: "GET",
      async: false,
      dataType: 'json',
      headers: {
        Accept: "application/json;odata=verbose",
        "X-RequestDigest": $("#__REQUESTDIGEST").val()
      }
    });
  }

  // Функция форматирования даты
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

  // Функция настройки кнопок модального окна
  function buttonModal(dataApplications) {
    console.log(dataApplications);
    $('.modal__join__link').css({ 'display': 'none' });
    if (dataApplications[0] !== '') {
      $('.modal__join__btn').css({ 'display': 'none' });
      $('.modal__cancel__btn').css({ 'display': 'flex' });
      $('.modal__cancel__btn').attr('data-id', dataApplications[0]);
    } else {
      $('.modal__cancel__btn').css({ 'display': 'none' });
      $('.modal__join__btn').css({ 'display': 'flex' });
      $('.modal__cancel__btn').attr('data-id', '');
    }

    if (dataApplications[1] !== '') {
      $('.modal__join__btn__manager').css({ 'display': 'none' });
      $('.modal__cancel__btn__manager').css({ 'display': 'flex' });
      $('.modal__cancel__btn__manager').attr('data-id', dataApplications[1]);
    } else {
      $('.modal__cancel__btn__manager').css({ 'display': 'none' });
      $('.modal__join__btn__manager').css({ 'display': 'flex' });
      $('.modal__cancel__btn__manager').attr('data-id', '');
    }
  }

  // Функция открытия модального окна с заполненными данными
  function openModal(item) {
    // Если это smart-статья, скрываем все кнопки
    const isSmartArticle = item.trainingFormat && item.trainingFormat.results.includes('Smart-статья');
    
    if (isSmartArticle) {
      $('.modal__join__btn').css({ 'display': 'none' });
      $('.modal__cancel__btn').css({ 'display': 'none' });
      $('.modal__join__btn__manager').css({ 'display': 'none' });
      $('.modal__cancel__btn__manager').css({ 'display': 'none' });
      $('.modal__join__link').css({ 'display': 'none' });
      $('.reading-mode-btn').css({ 'display': 'block' });
    } else {
      if (item.Link) {
        $('.reading-mode-btn').css({ 'display': 'none' });
        $('.modal__join__btn').css({ 'display': 'none' });
        $('.modal__cancel__btn').css({ 'display': 'none' });
        $('.modal__join__btn__manager').css({ 'display': 'none' });
        $('.modal__cancel__btn__manager').css({ 'display': 'none' });
        $('.modal__join__link').attr("href", item.Link);
        if (item.Link.endsWith('.mp4')) {
          $('.modal__join__link').text('Смотреть');
        } else {
          $('.modal__join__link').text('Пройти');
        }
        $('.modal__join__link').css({ 'display': 'flex' });
      } else {
        getActiveApplications(item.ID).done(function(data) {
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
        }).fail(function (error) {
          console.error("Ошибка при загрузке активных заявок:", error);
        });
      }
    }

    $('#prog').attr('data-id', item.ID);
    $('#prog .modal__title').text(item.Title || 'Не указано');
    $('#prog .modal__format__item').text(`${item.trainingFormat || 'Не указано'}: ${item.courseDuration || 'Не указано'}`);
    $('#prog .modal__format__item-audience').text(`${item.Audience ? item.Audience.results.join(' ') : 'Не указано'}`);
    $('#prog .modal__format__item-format').text(item.Format || 'Не указано');
    $('#prog .modal__date__item').text(item.date || 'Не указано');
    $('.modal__filter[data-filter="tags"] .modal__filter__text').text(item.tags ? item.tags.results.join(' ') : 'Не указано');
    $('.modal__filter[data-filter="courseDuration"] .modal__filter__text').text(item.courseDuration ? item.courseDuration.results.join(' ') : 'Не указано');
    $('.modal__filter[data-filter="trainingFormat"] .modal__filter__text').text(item.trainingFormat ? item.trainingFormat.results.join(' ') : 'Не указано');
    $('.modal__filter[data-filter="Audience"] .modal__filter__text').text(item.Audience ? item.Audience.results.join(' ') : 'Не указано');
    $('.modal__filter[data-filter="source"] .modal__filter__text').text(item.source ? item.source.results.join(' ') : 'Не указано');

    // Обработка div с классом "wrapper__format-date"
    const trainingFormat = item.trainingFormat ? item.trainingFormat.results : [];
    if (trainingFormat.includes('Вебинар') || trainingFormat.includes('Лекция')) {
      $('.wrapper__format-date').css({ 'display': 'block' });
    } else {
      $('.wrapper__format-date').css({ 'display': 'none' });
    }

    // Добавление кнопки "Режим чтения" для smart-статей
    /* if (isSmartArticle) {
      $('.modal__body').append('<button class="reading-mode-btn">Режим чтения</button>');
    } */

    // Обработка списков
    const willGetList = item.willGet ? item.willGet.split(';').map(get => `${get.trim()}`).join('') : 'Не указано';
    $('#prog .modal__topic-get').html(willGetList);

    // Обработка ссылки
    if (item.Link) {
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
    const itemData = $(this).attr('data-item');
    try {
      const parsedItem = JSON.parse(itemData);
      openModal(parsedItem);
    } catch (error) {
      console.error("Ошибка при парсинге JSON:", error);
      console.error("JSON Data:", itemData);
    }
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
    const block = $this.closest('.filter__item__wrapper').data('blockname');

    if (!activeCategories[block]) {
      activeCategories[block] = [];
    }

    if ($this.hasClass('filter__item-active')) {
      $this.removeClass('filter__item-active');
      activeCategories[block] = activeCategories[block].filter(c => c !== category);
    } else {
      $this.addClass('filter__item-active');
      activeCategories[block].push(category);
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

  // Обработчик клика по кнопке "Сбросить фильтры"
  $(document).on('click', '.filter_buttons_cancel', function () {
    activeCategories = {};
    $('.filter__item-active').removeClass('filter__item-active');
    filterAndRenderItems();
  });

  // Обработчик клика по ссылке "Показать все"/"Скрыть" для фильтров
  $(document).on('click', '.filter__item__show-more', function () {
    const $this = $(this);
    const $filterBody = $this.closest('.filter__item__body');
    const isExpanded = $filterBody.hasClass('expanded');

    if (isExpanded) {
      $filterBody.removeClass('expanded').find('.filter__item:gt(2)').hide();
      $this.text('Показать все');
    } else {
      $filterBody.addClass('expanded').find('.filter__item').show();
      $this.text('Скрыть');
    }
  });

  // Инициализация фильтров
  function initializeFilters() {
    $('.filter__item__body').each(function () {
      const $filterBody = $(this);
      const $filterItems = $filterBody.find('.filter__item');

      if ($filterItems.length > 3) {
        $filterItems.slice(3).hide();
        $filterBody.append('<div class="filter__item__show-more">Показать все</div>');
      }
    });
  }

  // Функция для отправки данных в список SharePoint
  function submitApplication(itemId, title, forTeam = false) {
    const requestUri = `https://intranet.rencredit.ru/Departments/TD/_api/web/lists/getByTitle('coursecatalogmembers')/items`;
    const requestHeaders = {
      "accept": "application/json;odata=verbose",
      "content-type": "application/json;odata=verbose",
      "X-RequestDigest": $("#__REQUESTDIGEST").val()
    };

    const itemData = {
      '__metadata': { 'type': 'SP.Data.CoursecatalogmembersListItem' },
      'Title': title,
      'courseID': parseInt(itemId),
      'forTeam': forTeam,
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
        alert("Заявка отправлена. В ближайшие дни ты получишь уведомление по почте");
        getActiveApplications(itemId).done(function(data) {
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
        }).fail(function (error) {
          console.error("Ошибка при загрузке активных заявок:", error);
        });
      },
      error: function (error) {
        console.error("Ошибка при отправке заявки: ", JSON.stringify(error));
        alert("Ошибка при отправке заявки. Пожалуйста, попробуйте еще раз.");
      }
    });
  }

  // Функция для редактирования данных в списоке SharePoint
  function editApplication(itemId) {
    const requestUri = `https://intranet.rencredit.ru/Departments/TD/_api/web/lists/getByTitle('coursecatalogmembers')/items(${itemId})`;

    const itemData = {
      '__metadata': { 'type': 'SP.Data.CoursecatalogmembersListItem' },
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
        getActiveApplications(itemId).done(function(data) {
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
        }).fail(function (error) {
          console.error("Ошибка при загрузке активных заявок:", error);
        });
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
    const title = $(this).closest('.modal').find('.modal__title').text();
    submitApplication(itemId, title);
  });

  // Обработчик клика по кнопке "Заказать для команды"
  $(document).on('click', '.modal__join__btn__manager', function () {
    const itemId = $('#prog').data('id');
    const title = $(this).closest('.modal').find('.modal__title').text();
    submitApplication(itemId, title, true);
  });

  // Обработчик клика по кнопкам отменить заявку
  $(document).on('click', '.modal__btn__cancel', function () {
    const itemId = $(this).data('id');
    editApplication(itemId);
  });

  // Обработчик клика по кнопке "Режим чтения"
  $(document).on('click', '.reading-mode-btn', function () {
    const $modal = $(this).closest('.modal');
    const content = $modal.find('.modal__topic-get').html();
    $readingModeContent.html(content);
    $readingMode.show();
  });

  // Обработчик для выхода из режима чтения
  $exitReadingMode.on('click', function () {
    $readingMode.hide();
  });

  // Обработчики для изменения стилей в режиме чтения
  $increaseFont.on('click', function () {
    const currentFontSize = parseInt($readingModeContent.css('font-size'));
    $readingModeContent.css('font-size', `${currentFontSize + 2}px`);
  });

  $decreaseFont.on('click', function () {
    const currentFontSize = parseInt($readingModeContent.css('font-size'));
    $readingModeContent.css('font-size', `${currentFontSize - 2}px`);
  });

  $bgColorButtons.on('click', function () {
    const color = $(this).data('color');
    $bgColorButtons.removeClass('active');
    $(this).addClass('active');
    $readingModeContent.css('background-color', color);
    if (color === 'rgb(44, 43, 40)') {
      $readingModeContent.css('color', 'white');
    } else {
      $readingModeContent.css('color', 'black');
    }
  });

  $fontFamilySelector.on('change', function () {
    $readingModeContent.css('font-family', $(this).val());
  });

  // Инициализация
  $(document).ready(() => {
    getProgramData();
    initializeFilters();
  });

  // Обработчик клика по кнопке "open-filter"
  $('#open-filter').on('click', function () {
    $('#fixedBlock').addClass('open');
    $('#tableBody').addClass('close');
  });

  // Обработчик клика по кнопке "close-filter"
  $('#close-filter').on('click', function () {
    $('#fixedBlock').removeClass('open');
    $('#tableBody').removeClass('close');
  });

})(jQuery);
