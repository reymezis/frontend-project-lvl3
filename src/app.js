import * as yup from 'yup';
import onChange from 'on-change';
import render from './view.js';

export default () => {
  const elements = {
    form: document.querySelector('.rss-form'),
    input: document.getElementById('url-input'),
    feedback: document.querySelector('.feedback'),
  };

  // MODEL
  const initialState = {
    formState: null,
    error: null,
    rssList: [],
  };

  // VIEW
  const state = onChange(initialState, render(elements));

  // CONTROLLER
  elements.form.addEventListener('submit', (e) => {
    e.preventDefault();

    const formData = new FormData(e.target);
    const enteredValue = formData.get('url');

    const schema = yup.object().shape({
      url: yup.string()
        .url('Ссылка должна быть валидным URL')
        .trim()
        .notOneOf(Object.values(state.rssList), 'RSS уже существует')
        .required(),
    });

    schema.validate({ url: enteredValue })
      .then((value) => {
        state.formState = 'valid';
        state.error = null;
        state.rssList.push(value.url);
      })
      .catch((err) => {
        state.formState = 'invalid';
        state.error = err.message;
      });
  });
};
