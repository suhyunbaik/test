import Head from 'next/head'
import Link from 'next/link'
import styles from "../../styles/Home.module.css";

export default function Profile() {
    return (
        <div className={styles.container}>
            <Head>
                <title>dev</title>
                <link rel="icon" href="/favicon.ico"/>
                <meta name="viewport" content="initial-scale=1.0, width=device-width"/>
                <meta property="og:title" content="dev" key="title"/>
            </Head>

            <section className={styles.navigation}>
                <div><Link href="/posts/profile">😋</Link></div>
                <div><Link href="/">🔥</Link></div>
                <div><Link href="/">🚀</Link></div>
            </section>

            <article>
                소개글이 아직 없습니다.
            </article>
            <small className={styles.tmi}>이 사이트는 <Link href="https://nextjs.org/">Next.js</Link>, Github action 으로 제작됐습니다.</small>
            <section>
            </section>
        </div>
    )
}