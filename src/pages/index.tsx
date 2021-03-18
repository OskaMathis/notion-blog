import Header from '../components/header'
import ExtLink from '../components/ext-link'
import Features from '../components/features'
import sharedStyles from '../styles/shared.module.css'

export default function Index() {
  return (
    <>
      <Header titlePre="Home" />
      <div className={sharedStyles.layout}>
        <img
          src="/vercel-and-notion.png"
          height="85"
          width="250"
          alt="Vercel + Notion"
        />
        <h1>Tech Blog</h1>
        <h2>
          このブログは
          <ExtLink href="https://github.com/ijjk/notion-blog">Notion Blog</ExtLink>
          で出来ています
        </h2>

        <Features />

        <div className="explanation">
          <p>
            適当にナレッジを書き溜めていきます
          </p>
        </div>
      </div>
    </>
  )
}
