import Head from 'next/head'
import {getAllPostIds, getPostData} from "../../lib/posts";
import utilStyles from '../../styles/utils.module.css'
import styles from "../../styles/Home.module.css";
import Link from 'next/link'


export default function Post({postData}) {
    return (
        <div className={styles.container}>
            <Head>
                <title>{postData.title}</title>
                {/*<link rel="icon" href="/favicon.ico"/>*/}
                <meta name="viewport" content="initial-scale=1.0, width=device-width"/>
                <meta property="og:title" content={postData.title} key="title"/>
            </Head>

            <section className={styles.navigation}>
                <div><Link href="/posts/profile">소개</Link></div>
                <div><Link href="/">모든 글</Link></div>
            </section>

            <section>
                <article>
                    <h1 className={utilStyles.headingXl}>{postData.title}</h1>
                    <div className={utilStyles.lightText}>
                        {postData.date}
                    </div>
                    <div dangerouslySetInnerHTML={{__html: postData.contentHtml}} className={utilStyles.post}/>
                </article>
            </section>
        </div>
    )
}

export async function getStaticPaths() {
    const paths = getAllPostIds()
    return {
        paths,
        fallback: false
    }
}

export async function getStaticProps({params}) {
    const postData = await getPostData(params.id)
    return {
        props: {
            postData
        }
    }
}