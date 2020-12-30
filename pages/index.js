import Head from 'next/head'
import styles from '../styles/Home.module.css'
import {getSortedPostsData} from "../lib/posts";
import Link from 'next/link'

export default function Home({allPostsData}) {
    return (
        <div className={styles.container}>
            <Head>
                <title>이리보고 저리보고</title>
                {/*<link rel="icon" href="/favicon.ico"/>*/}
                <meta name="viewport" content="initial-scale=1.0, width=device-width"/>
                <meta property="og:title" content="Dev" key="title"/>
            </Head>

            <section className={styles.navigation}>
                <div><Link href="/posts/profile">소개</Link></div>
                <div><Link href="/">모든 글</Link></div>
            </section>

            <section>
                <ul className={styles.list}>
                    {allPostsData.map(({id, date, title}) => (
                        <li key={id} className={styles.listItem}>
                            <Link href={`/posts/${id}`}>
                                <a className={styles.postTitle}>{title}</a>
                            </Link>
                            <br/>
                            <small className={styles.postDate}>
                                {date}
                                {/*<Date dateString={date}/>*/}
                            </small>
                        </li>
                    ))}
                </ul>
            </section>
        </div>
    )
}

export async function getStaticProps() {
    const allPostsData = getSortedPostsData()
    return {
        props: {
            allPostsData
        }
    }
}
