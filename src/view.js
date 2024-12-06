const handleProcessState = (elements, value, previousValue, i18nInstance) => {
  if (previousValue === 'invalid') {
    elements.feedback.classList.remove('text-danger');
    elements.input.classList.remove('is-invalid');
  }

  if (value === 'valid') {
    elements.feedback.classList.add('text-success');
    elements.feedback.replaceChildren(i18nInstance.t('validation.successMessage'));
    elements.form.reset();
    elements.input.focus();
  }

  if (value === 'invalid') {
    elements.input.classList.add('is-invalid');
    elements.feedback.classList.add('text-danger');
  }
};

const handleProcessError = (elements, value, i18nInstance) => {
  if (value !== null) {
    elements.feedback.replaceChildren(i18nInstance.t(`validation.errors.${value}`));
  }
};

const handleProcessFeeds = (elements, initialState) => {
  elements.feeds.replaceChildren();
  const feedsContent = document.createElement('div');
  elements.feeds.replaceChildren(feedsContent);
  feedsContent.outerHTML = `<div class="card border-0">
        <div class="card-body">
          <h2 class="card-title h4">Фиды</h2>
        </div>
      <ul class="list-group border-0 rounded-0 list-unstyled"></ul>
    </div>`;
  const ul = document.querySelector('.feeds > div > ul');
  initialState.feeds.forEach(({ title, description }) => {
    const li = document.createElement('li');
    ul.append(li);
    li.outerHTML = `<li class="list-group-item border-0 border-end-0">
          <h3 class="h6 m-0">${title}</h3>
          <p class="m-0 small text-black-50">${description}</p>
        </li>`;
  });
  elements.form.reset();
  elements.input.focus();
};

const handleProcessPosts = (elements, initialState, i18nInstance) => {
  elements.posts.replaceChildren();
  const postsContent = document.createElement('div');
  elements.posts.append(postsContent);
  postsContent.outerHTML = `<div class="card border-0">
    <div class="card-body">
      <h2 class="card-title h4">Посты</h2>
    </div>
    <ul class="list-group border-0 rounded-0 list-unstyled"></ul>
  </div>`;
  const ul = document.querySelector('.posts > div > ul');
  initialState.posts.forEach(({
    postId, title, link, isRead,
  }) => {
    const li = document.createElement('li');
    ul.append(li);
    li.outerHTML = `<li class="list-group-item d-flex justify-content-between align-items-start border-0 border-end-0">
      <a href=${link} class="${isRead === 'read' ? 'fw-normal' : 'fw-bold'}" data-id=${postId} target="_blank" rel="noopener noreferrer">${title}</a>
      <button type="button" class="btn btn-outline-primary btn-sm" data-id=${postId} data-bs-toggle="modal" data-bs-target="#modal">${i18nInstance.t('buttons')}</button>
    </li>`;
  });
  elements.form.reset();
  elements.input.focus();
};

const handleProcessModal = (value, initialState) => {
  const modal = document.querySelector('.modal');
  const currentModalInfo = initialState.posts.filter(({ postId }) => postId === value);
  const [{ title, link, description }] = currentModalInfo;
  const modalTitle = modal.querySelector('.modal-title');
  modalTitle.textContent = title;
  const modalBody = modal.querySelector('.modal-body');
  modalBody.textContent = description;
  const linkModal = modal.querySelector('.modal-footer > a');
  linkModal.setAttribute('href', link);
};

const handleProcessReadPosts = (value) => {
  const [{ id }] = value;
  const title = document.querySelector(`a[data-id="${id}"]`);
  title.classList.remove('fw-bold');
  title.classList.add('fw-normal');
};

const handleSubmitButton = (value, elements) => {
  const button = elements.form.querySelector('button');
  if (value === 'disabled') {
    button.disabled = true;
  }
  if (value === 'enabled') {
    button.disabled = false;
  }
};

export default (elements, i18nInstance, initialState) => (path, value, previousValue) => {
  switch (path) {
    case 'formState':
      handleProcessState(elements, value, previousValue, i18nInstance);
      break;

    case 'error':
      handleProcessError(elements, value, i18nInstance);
      break;

    case 'feeds':
      handleProcessFeeds(elements, initialState);
      break;

    case 'posts':
      handleProcessPosts(elements, initialState, i18nInstance);
      break;

    case 'modal':
      handleProcessModal(value, initialState);
      break;

    case 'readState.posts':
      handleProcessReadPosts(value);
      break;

    case 'buttonState':
      handleSubmitButton(value, elements);
      break;

    default:
      break;
  }
};
