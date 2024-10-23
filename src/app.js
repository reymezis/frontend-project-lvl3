import * as yup from 'yup';
import i18next from 'i18next';
import onChange from 'on-change';
import render from './view.js';
import resources from './locales/ru.js';

export default async () => {
  // MODEL
  const initialState = {
    formState: null,
    error: null,
    rssList: [],
  };

  const elements = {
    form: document.querySelector('.rss-form'),
    input: document.getElementById('url-input'),
    feedback: document.querySelector('.feedback'),
  };

  const defaultLanguage = 'ru';

  const i18nInstance = i18next.createInstance();

  i18nInstance
    .init({
      lng: defaultLanguage,
      debug: false,
      resources,
    })
    .then(() => {
      yup.setLocale({
        string: {
          url: () => ({ key: 'url' }),
        },
        mixed: {
          notOneOf: () => ({ key: 'notOneOf' }),
        },
      });
    });

  // VIEW
  const state = onChange(initialState, render(elements, i18nInstance));

  // CONTROLLER
  elements.form.addEventListener('submit', (e) => {
    e.preventDefault();

    const formData = new FormData(e.target);
    const enteredValue = formData.get('url').trim();

    const schema = yup.object().shape({
      url: yup.string()
        .url()
        .notOneOf(Object.values(state.rssList)),
    });

    schema.validate({ url: enteredValue }, { abortEarly: false })
      .then((value) => {
        state.formState = 'valid';
        state.error = null;
        state.rssList.push(value.url);
      })
      .catch((err) => {
        const errObj = err.message;
        state.error = errObj.key;
        state.formState = 'invalid';
      });
  });
};
