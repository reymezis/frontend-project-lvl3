import * as yup from 'yup';
import i18next from 'i18next';
import onChange from 'on-change';
import axios from 'axios';
import _ from 'lodash';
import render from './view.js';
import resources from './locales/ru.js';

const getParsedData = (response) => {
  const parser = new DOMParser();
  const data = response.data.contents;
  const parsedData = parser.parseFromString(data, 'application/xml');
  return parsedData;
};

const getTagContent = (node) => (node.textContent.trim());

const buildPosts = (items, feedId) => {
  const posts = [];
  items.forEach((item) => {
    const post = {
      feedId,
      postId: _.uniqueId(),
      title: '',
      link: '',
      description: '',
    };
    Array.from(item.children)
      .forEach((el) => {
        if (el.tagName === 'title') {
          post.title = getTagContent(el);
        }
        if (el.tagName === 'link') {
          post.link = getTagContent(el);
        }
        if (el.tagName === 'description') {
          post.description = getTagContent(el);
        }
      });
    posts.push(post);
  });
  return posts;
};

export default async () => {
  // MODEL
  const initialState = {
    formState: null,
    error: null,
    rssList: [],
    posts: [],
    feeds: [],
    modal: null,
  };

  const elements = {
    form: document.querySelector('.rss-form'),
    input: document.getElementById('url-input'),
    feedback: document.querySelector('.feedback'),
    feeds: document.querySelector('.feeds'),
    posts: document.querySelector('.posts'),
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
  const state = onChange(initialState, render(elements, i18nInstance, initialState));

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
        axios.get(`https://allorigins.hexlet.app/get?disableCache=true&url=${encodeURIComponent(enteredValue)}`)
          .then((response) => {
            const parsed = getParsedData(response);
            const content = parsed.querySelector('channel').children;
            const [title, description, ...items] = content;
            const feedId = _.uniqueId();
            const feedObj = {
              feedId,
              title: getTagContent(title),
              description: getTagContent(description),
            };
            state.feeds.push(feedObj);
            const postsItems = items.filter((el) => el.tagName === 'item');
            const posts = buildPosts(postsItems, feedId);
            state.posts = [...state.posts, ...posts];
          })
          .catch((err) => {
            throw new Error(err);
          });
      })
      .catch((err) => {
        const errObj = err.message;
        state.error = errObj.key;
        state.formState = 'invalid';
      });
  });

  elements.posts.addEventListener('click', (e) => {
    e.preventDefault();
    const element = e.target;
    if (element.matches('button')) {
      const id = element.getAttribute('data-id');
      state.modal = id;
    }
  });
};
