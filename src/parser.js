const getTagContent = (node) => (node.textContent.trim());

const getParsedXmlDoc = (response) => {
  const parser = new DOMParser();
  const xmlString = response.data.contents;
  const xmlDoc = parser.parseFromString(xmlString, 'application/xml');
  const errorNode = xmlDoc.querySelector('parsererror');
  if (errorNode) {
    throw new Error('rss');
  }
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

  const posts = items
    .filter((el) => el.tagName === 'item')
    .map((item) => (Array.from(item.children)))
    .map((elements) => elements.filter((el) => el.tagName === 'title' || el.tagName === 'link' || el.tagName === 'description'))
    .map((filtered) => {
      const post = filtered.reduce((acc, el) => {
        const tag = el.tagName;
        const tagContent = getTagContent(el);
        return { ...acc, [tag]: tagContent };
      }, {});
      return post;
    });

  return { feedObj, posts };
};
