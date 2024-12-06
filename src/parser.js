const getTagContent = (node) => (node.textContent.trim());

const getParsedXmlDoc = (response) => {
  const parser = new DOMParser();
  const xmlString = response.data.contents;
  const xmlDoc = parser.parseFromString(xmlString, 'application/xml');
  return xmlDoc;
};

export default (response) => {
  const data = getParsedXmlDoc(response);
  const content = data.querySelector('channel').children;
  const [title, description, ...items] = content;
  const feedObj = {
    title: getTagContent(title),
    description: getTagContent(description),
  };

  const posts = [];
  items
    .filter((el) => el.tagName === 'item')
    .forEach((item) => {
      const post = {
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
  return { feedObj, posts };
};
