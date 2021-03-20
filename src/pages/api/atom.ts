import { IncomingMessage, ServerResponse } from 'http'
import getBlogIndex from '../../lib/notion/getBlogIndex'
import { postIsPublished, getArticleLink } from '../../lib/article-helpers'

function decode(string) {
  return string
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

function mapToEntry(post) {
  return `
    <entry>
      <title>${decode(post.Page)}</title>
      <link href="https://blog.oskamathis.dev${post.Link}" rel="alternate" type="text/html"/>
      <id>https://blog.oskamathis.dev${post.Link}</id>
      <updated>${new Date(post.Date).toJSON()}</updated>
      <published>${new Date(post.Date).toJSON()}</published>
    </entry>`
}

function concat(total, item) {
  return total + item
}

function createRSS(posts = []) {
  const postsString = posts.map(mapToEntry).reduce(concat, '')

  return `<?xml version="1.0" encoding="us-ascii"?>
  <feed xmlns="http://www.w3.org/2005/Atom">
    <title>My Notion Blog: 更新情報</title>
    <subtitle>My Notion Blogの記事更新情報</subtitle>
    <link href="https://blog.oskamathis.dev" rel="alternate" type="text/html"/>
    <link href="https://blog.oskamathis.dev/atom" rel="self" type="application/atom+xml"/>
    <updated>${new Date(posts[0].Date).toJSON()}</updated>
    <author><name>Yushi Sako</name></author>
    <id>https://blog.oskamathis.dev/atom</id>
    ${postsString}
  </feed>`
}

export default async function(req: IncomingMessage, res: ServerResponse) {
  res.setHeader('Content-Type', 'text/xml')
  try {
    const postsTable = await getBlogIndex()

    const posts = Object.keys(postsTable)
      .map(slug => {
        const post = postsTable[slug]
        if (postIsPublished(post)) {
          post.Link = getArticleLink(post.Slug)
          return post
        }
      })
      .filter(Boolean)
      .sort((a, b) => (b.Date || 0) - (a.Date || 0))

    res.write(createRSS(posts))
    res.end()
  } catch (e) {
    console.log(e)
    res.statusCode = 500
    res.end()
  }
}
