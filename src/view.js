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

const createNewElement = (tagname, attributes, text = null) => {
  const element = document.createElement(tagname);
  attributes.forEach(({ name, value }) => {
    element.setAttribute(name, value);
  });
  if (text) {
    element.append(text);
  }
  return element;
};

const buildCard = (title) => {
  const divCard = createNewElement('div', [{ name: 'class', value: 'card border-0' }]);
  const divBody = createNewElement('div', [{ name: 'class', value: 'card-body' }]);
  const h2 = createNewElement('h2', [{ name: 'class', value: 'card-title h4' }], title);
  const ul = createNewElement('ul', [{ name: 'class', value: 'list-group border-0 rounded-0 list-unstyled' }]);
  divBody.append(h2);
  divCard.append(divBody, ul);
  return divCard;
};

const handleProcessFeeds = (elements, initialState) => {
  elements.feeds.replaceChildren();
  const feedsCard = buildCard('Фиды');
  const ul = feedsCard.querySelector('ul');

  initialState.feeds.forEach(({ title, description }) => {
    const li = createNewElement('li', [{ name: 'class', value: 'list-group-item border-0 border-end-0' }]);
    const h3 = createNewElement('h3', [{ name: 'class', value: 'h6 m-0' }], title);
    const p = createNewElement('p', [{ name: 'class', value: 'm-0 small text-black-50' }], description);
    li.append(h3, p);
    ul.append(li);
  });
  elements.feeds.append(feedsCard);
  elements.form.reset();
  elements.input.focus();
};

const handleProcessPosts = (elements, initialState, i18nInstance) => {
  elements.posts.replaceChildren();
  const postsCard = buildCard('Посты');
  const ul = postsCard.querySelector('ul');

  initialState.posts.forEach(({
    postId, title, link,
  }) => {
    const li = createNewElement('li', [{ name: 'class', value: 'list-group-item d-flex justify-content-between align-items-start border-0 border-end-0' }]);
    const linkAttributes = [{ name: 'class', value: 'fw-bold' }, { name: 'href', value: link }, { name: 'data-id', value: postId }, { name: 'target', value: '_blank' }, { name: 'rel', value: 'noopener noreferrer' }];
    const a = createNewElement('a', linkAttributes, title);
    const btnAttributes = [{ name: 'class', value: 'btn btn-outline-primary btn-sm' }, { name: 'type', value: 'button' }, { name: 'data-id', value: postId }, { name: 'data-bs-toggle', value: 'modal' }, { name: 'data-bs-target', value: '#modal' }];
    const button = createNewElement('button', btnAttributes, i18nInstance.t('buttons'));
    li.append(a, button);
    ul.append(li);
  });
  elements.posts.append(postsCard);
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

const handleProcessReadPosts = (initialState) => {
  initialState.readState.posts.forEach((id) => {
    const title = document.querySelector(`a[data-id="${id}"]`);
    title.classList.remove('fw-bold');
    title.classList.add('fw-normal');
  });
};

const handleSubmitButton = (value, elements) => {
  const button = elements.form.querySelector('button');
  const span = elements.form.querySelector('span');
  if (value === 'processing') {
    button.disabled = true;
    span.classList.remove('d-none');
  }

  if (value === 'filling') {
    button.disabled = false;
    span.classList.add('d-none');
  }
};

export default (elements, i18nInstance, initialState) => (path, value, previousValue) => {
  switch (path) {
    case 'form.state':
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
      handleProcessReadPosts(initialState);
      break;

    case 'modal':
      handleProcessModal(value, initialState);
      break;

    case 'readState.posts':
      handleProcessReadPosts(initialState);
      break;

    case 'form.validationState':
      handleSubmitButton(value, elements);
      break;

    default:
      break;
  }
};
