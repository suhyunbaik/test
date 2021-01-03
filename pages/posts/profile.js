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

            <article className={styles.profile}>
                이리보고 저리보고의 소개글이 없습니다.

                <h3>데이블</h3>
                <a href="https://www.notion.so/dableglobal/a68730ed6d574516b3931fe2530c5747" className={styles.externalLink}>파이선 개발을 도와주는 도구들</a><br/>
                <a href="https://www.notion.so/dableglobal/onion-architecture-465bd647c99f4a0d8b9bf8d71f6b41ce" className={styles.externalLink}>파이썬, 장고로 제프리 팔레르모의 'onion architecture' 구현해보기</a><br/>
                <a href="https://www.notion.so/dableglobal/Github-Action-ECS-Fargate-0dbd288a69524e46a4f7923578477ba2" className={styles.externalLink}>Github Action으로 ECS Fargate 배포하기</a><br/>
                <a href="https://www.notion.so/dableglobal/5-29e9d83ea9ac4da491d8a3e95938d276" className={styles.externalLink}>개발자가 회사에 지원할 때 점검해야 할 것 5가지</a>
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