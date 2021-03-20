import { IncomingMessage, ServerResponse } from 'http'
import getBlogIndex from '../../lib/notion/getBlogIndex'
import getNotionUsers from '../../lib/notion/getNotionUsers'
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
      <link href="https://blog.oskamathis.dev${post.link}" rel="alternate" type="text/html"/>
      <id>https://blog.oskamathis.dev${post.link}</id>
      <updated>${new Date(post.Date).toJSON()}</updated>
      <published>${new Date(post.Date).toJSON()}</published>
    </entry>`
}

function concat(total, item) {
  return total + item
}

function createRSS(posts = []) {
  const postsString = posts.map(mapToEntry).reduce(concat, '')

  return `
    <?xml version="1.0" encoding="utf-8"?>
    <feed xmlns="http://www.w3.org/2005/Atom">
      <title>My Notion Blog: 更新情報</title>
      <subtitle>My Notion Blogの記事更新情報</subtitle>
      <updated>${new Date(posts[0].Date).toJSON()}</updated>
      <id>blog.oskamathis.dev/atom</id>
      <link href="https://blog.oskamathis.dev" rel="alternate" type="text/html"/>
      <link href="https://blog.oskamathis.dev/atom" rel="self" type="application/atom+xml"/>
      ${postsString}
    </feed>`
}

export default async function(req: IncomingMessage, res: ServerResponse) {
  res.setHeader('Content-Type', 'text/xml')
  try {
    const postsTable = await getBlogIndex()
    const neededAuthors = new Set<string>()

    const posts = Object.keys(postsTable)
      .map(slug => {
        const post = postsTable[slug]
        if (!postIsPublished(post)) return

        post.authors = post.Authors || []

        for (const author of post.authors) {
          neededAuthors.add(author)
        }
        return post
      })
      .filter(Boolean)
      .sort((a, b) => (b.Date || 0) - (a.Date || 0))

    const { users } = await getNotionUsers([...neededAuthors])

    posts.forEach(post => {
      post.authors = post.authors.map(id => users[id])
      post.link = getArticleLink(post.Slug)
    })

    res.write(createRSS(posts))
    res.end()
  } catch (e) {
    console.log(e)
    res.statusCode = 500
    res.end()
  }
}
