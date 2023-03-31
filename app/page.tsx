"use client";
import Container from "@components/container";
import Code from "@components/code";
import ExternalLink from "@components/link";
import styles from "./page.module.scss";
import Schema from "@components/schema";
import { seo } from "./head";
import { Canvas } from '@react-three/fiber'
import Floor from "@components/floor";
import LightBulb from "@components/lightbulb";
import Box from "@components/box";
import Ambient from "@components/ambient";


export default function Page() {
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
				<Canvas
					shadows
					className={styles.canvas}
					camera={{
						position: [-6, 7, 7],
					  }}	
				>
        			<Ambient/>
					<Box position={[0, 0, 0]} rotateX={3} rotateY={0.2} />
					<LightBulb position={[10, 10, 10]}/>
					<Floor/>
				</Canvas>
				<h1 className={styles.title}>
					Rodeo
				</h1>
				<p className={styles.description}>
					&nbsp;
				</p>
				
			</Container>
		</>
	);
}
