const handleProcessState = (elements, value, previousValue, i18nInstance) => {
  if (previousValue === 'invalid') {
    elements.feedback.classList.remove('text-danger');
    elements.input.classList.remove('is-invalid');
  }

  if (value === 'valid') {
    elements.feedback.classList.add('text-success');
    elements.feedback.textContent = i18nInstance.t('validation.successMessage');
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
    elements.feedback.textContent = i18nInstance.t(`validation.errors.${value}`);
  }
};

export default (elements, i18nInstance) => (path, value, previousValue) => {
  switch (path) {
    case 'formState':
      handleProcessState(elements, value, previousValue, i18nInstance);
      break;

    case 'error':
      handleProcessError(elements, value, i18nInstance);
      break;

    default:
      break;
  }
};
