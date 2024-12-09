import * as yup from 'yup';
import i18next from 'i18next';
import onChange from 'on-change';
import axios from 'axios';
import _ from 'lodash';
import render from './view.js';
import resources from './locales/ru.js';
import getParsedRssData from './parser.js';

const timeoutRequest = 5000;
axios.defaults.timeout = timeoutRequest;

const getRssData = (url) => {
  const params = new URLSearchParams({ disableCache: 'true', url });
  const urlWithProxy = new URL(`https://allorigins.hexlet.app/get?${params}`);
  return axios.get(urlWithProxy)
    .then((response) => response)
    .catch((err) => {
      throw new Error(err);
    });
};

const getNewPosts = (state, url) => {
  getRssData(url)
    .then((response) => {
      const parsedData = getParsedRssData(response);

      const oldPosts = state.posts.filter(({ source }) => source === url);
      const feed = state.feeds.filter(({ source }) => source === url);
      const [{ feedId }] = feed;

      const newposts = parsedData.posts.map((post) => ({
        ...post, feedId, postId: _.uniqueId(), source: url,
      }));

      const uniq = _.pullAllBy(newposts, oldPosts, 'title');
      if (uniq) {
        uniq.forEach((el) => state.posts.push(el));
      }
    })
    .catch((err) => {
      throw new Error(err);
    });
};

const isRssUrl = (url) => getRssData(url)
  .then((response) => {
    const contentType = response.headers.get('Content-Type');
    if (contentType && (contentType.includes('application/rss+xml') || contentType.includes('application/xml'))) {
      return true;
    }
    const text = response.data.contents;
    if (text.includes('<rss') || text.includes('<feed')) {
      return true;
    }
    return false;
  })
  .catch((err) => {
    throw new Error(err);
  });

export default async () => {
  // MODEL
  const initialState = {
    formState: false,
    error: null,
    rssList: [],
    posts: [],
    feeds: [],
    modal: null,
    readState: {
      posts: [],
    },
    buttonState: 'enabled',
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
          required: () => ({ key: 'required' }),
        },
        mixed: {
          notOneOf: () => ({ key: 'notOneOf' }),
        },
      });
    });

  // VIEW
  const state = onChange(initialState, render(elements, i18nInstance, initialState));

  const checkNewNews = () => {
    if (state.rssList.length !== 0) {
      state.rssList.forEach((url) => {
        getNewPosts(state, url);
      });
    }
    setTimeout(checkNewNews, 5000);
  };
  checkNewNews();

  // CONTROLLER
  elements.form.addEventListener('submit', (e) => {
    e.preventDefault();

    state.buttonState = 'disabled';

    const formData = new FormData(e.target);
    const enteredValue = formData.get('url').trim();

    const schema = yup.object().shape({
      url: yup.string()
        .url()
        .required()
        .test('rss', (url) => {
          let isUrl = false;
          if (url) {
            isUrl = yup.string().url().isValidSync(url);
          }
          return isUrl ? (isRssUrl(url).then((result) => result)) : true;
        })
        .notOneOf(Object.values(state.rssList)),
    });

    schema.validate({ url: enteredValue }, { abortEarly: false })
      .then((value) => {
        state.formState = 'valid';
        state.error = null;
        state.rssList.push(value.url);
        return enteredValue;
      })
      .catch((err) => {
        state.formState = 'invalid';

        if (typeof err.message === 'string' && err.message.includes('AxiosError')) {
          state.error = 'network';
        }

        if (err && err.inner) {
          err.inner.forEach((error) => {
            state.error = error.type;
          });
        }

        state.buttonState = 'enabled';
        throw new Error(err);
      })
      .then((url) => getRssData(url))
      .catch((err) => {
        throw new Error(err);
      })
      .then((response) => {
        const parsedData = getParsedRssData(response);
        const feed = parsedData.feedObj;
        const feedId = _.uniqueId();
        feed.feedId = feedId;
        feed.source = enteredValue;
        state.feeds.push(feed);

        const posts = parsedData.posts
          .map((post) => ({
            ...post, feedId, postId: _.uniqueId(), source: enteredValue,
          }));

        state.posts = [...state.posts, ...posts];

        state.buttonState = 'enabled';
      })
      .catch((err) => {
        throw new Error(err);
      });
  });

  elements.posts.addEventListener('click', (e) => {
    e.preventDefault();
    const element = e.target;

    if (element.matches('button')) {
      const id = element.getAttribute('data-id');
      const postInfo = { id, isRead: 'read' };
      state.modal = id;
      state.readState.posts.push(postInfo);
    }
  });
};
