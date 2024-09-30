const handleProcessState = (elements, value, previousValue) => {
  if (previousValue === 'invalid') {
    elements.feedback.classList.remove('text-danger');
    elements.input.classList.remove('is-invalid');
  }

  if (value === 'valid') {
    elements.feedback.classList.add('text-success');
    elements.feedback.textContent = 'RSS успешно загружен';
    elements.form.reset();
    elements.input.focus();
  }

  if (value === 'invalid') {
    elements.input.classList.add('is-invalid');
    elements.feedback.classList.add('text-danger');
  }
};

const handleProcessError = (elements, value) => {
  if (value !== null) {
    elements.feedback.textContent = value;
  }
};

export default (elements) => (path, value, previousValue) => {
  switch (path) {
    case 'formState':
      handleProcessState(elements, value, previousValue);
      break;

    case 'error':
      handleProcessError(elements, value);
      break;

    default:
      break;
  }
};
