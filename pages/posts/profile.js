import Head from 'next/head'
import Link from 'next/link'
import styles from "../../styles/Home.module.css";

export default function Profile() {
    return (
        <div className={styles.container}>
            <Head>
                <title>이리보고 저리보고</title>
                {/*<link rel="icon" href="/favicon.ico"/>*/}
                <meta name="viewport" content="initial-scale=1.0, width=device-width"/>
                <meta property="og:title" content="dev" key="title"/>
            </Head>

            <section className={styles.navigation}>
                <div><Link href="/posts/profile">소개</Link></div>
                <div><Link href="/">모든 글</Link></div>
            </section>

            <article>
                이리보고 저리보고의 소개글이 없습니다.
            </article>
            <small className={styles.tmi}>
                이 사이트는 <Link href="https://nextjs.org/">Next.js</Link>로 제작했고 Github Action 으로 배포했습니다.
                <br/>
                <br/>
                백수현 Suhyun Baik © 2021
            </small>
        </div>
    )
}