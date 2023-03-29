import Container from "@components/container";
import Code from "@components/code";
import ExternalLink from "@components/link";
import styles from "./page.module.scss";
import Schema from "@components/schema";
import { seo } from "./head";

export default async function Page() {
	return (
		<>
			<Schema
				siteName={seo.siteName}
				siteDescription={seo.description}
				inLanguage="en"
				title={seo.title}
				origin={process.env.NEXT_PUBLIC_ORIGIN}
				href={`${process.env.NEXT_PUBLIC_ORIGIN}/`}
			/>
			<Container size="small">
				<h1 className={styles.title}>
					Rodeo
				</h1>
				<p className={styles.description}>
					TKTK
				</p>
			</Container>
		</>
	);
}
