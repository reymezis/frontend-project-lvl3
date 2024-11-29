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

const buildPosts = (items, feedId, url) => {
  const posts = [];
  items.forEach((item) => {
    const post = {
      feedId,
      postId: _.uniqueId(),
      title: '',
      link: '',
      description: '',
      source: url,
      isRead: 'unread',
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

const getRssData = (url, state) => axios.get(`https://allorigins.hexlet.app/get?disableCache=true&url=${encodeURIComponent(url)}`, { timeout: 5000 })
  .then((response) => {
    const parsed = getParsedData(response);
    const content = parsed.querySelector('channel').children;
    return content;
  })
  .catch((err) => {
    state.network = err.code;
    throw new Error(err);
  });

const getNewPosts = (state, url) => {
  getRssData(url, state).then((newContent) => {
    const [, ...items] = newContent;
    const postsItems = items.filter((el) => el.tagName === 'item');
    const oldPosts = state.posts.filter(({ source }) => source === url);
    const feed = state.feeds.filter(({ source }) => source === url);
    const [{ feedId }] = feed;
    const posts = buildPosts(postsItems, feedId, url);
    const uniq = _.pullAllBy(posts, oldPosts, 'title');
    state.posts = [...state.posts, ...uniq];
  }).catch((err) => {
    throw new Error(err);
  });
};

const isUrl = (str) => {
  const regex = /^(http(s):\/\/.)[-a-zA-Z0-9@:%._+~#=]{2,256}\.[a-z]{2,6}\b([-a-zA-Z0-9@:%_+.~#?&//=]*)$/;
  const checkUrl = new RegExp(regex);
  return checkUrl.test(str);
};

const isRssUrl = (url) => axios.get(`https://allorigins.hexlet.app/get?disableCache=true&url=${encodeURIComponent(url)}`)
  .then((data) => {
    const contentType = data.headers.get('Content-Type');
    if (contentType && (contentType.includes('application/rss+xml') || contentType.includes('application/xml'))) {
      return true;
    }
    const text = data.data.contents;
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
    formState: null,
    error: null,
    rssList: [],
    posts: [],
    feeds: [],
    modal: null,
    readState: {
      posts: [],
    },
    network: null,
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

    const formData = new FormData(e.target);
    const enteredValue = formData.get('url').trim();

    const schema = yup.object().shape({
      url: yup.string()
        .test('rss', (url) => (isUrl(url) ? (isRssUrl(url).then((answer) => (answer))) : true))
        .url()
        .notOneOf(Object.values(state.rssList))
        .required(),
    });

    schema.validate({ url: enteredValue }, { abortEarly: false })
      .then((value) => {
        state.formState = 'valid';
        state.error = null;
        state.rssList.push(value.url);
        getRssData(enteredValue, state)
          .then((content) => {
            const [title, description, ...items] = content;
            const feedId = _.uniqueId();
            const feedObj = {
              feedId,
              title: getTagContent(title),
              description: getTagContent(description),
              source: enteredValue,
            };
            state.feeds.push(feedObj);
            const postsItems = items.filter((el) => el.tagName === 'item');
            const posts = buildPosts(postsItems, feedId, enteredValue);
            state.posts = [...state.posts, ...posts];
          })
          .catch((err) => {
            throw new Error(err);
          });
      })
      .catch((err) => {
        if (err && err.inner) {
          err.inner.forEach((error) => {
            state.error = error.type;
          });
        }
        state.formState = 'invalid';
      });
  });

  elements.posts.addEventListener('click', (e) => {
    e.preventDefault();
    const element = e.target;

    if (element.matches('button')) {
      const id = element.getAttribute('data-id');
      const currentPost = state.posts.filter(({ postId }) => postId === id);
      const [postObj] = currentPost;
      postObj.isRead = 'read';

      const postInfo = { id, isRead: 'read' };

      state.modal = id;
      state.readState.posts.push(postInfo);
    }
  });
};
