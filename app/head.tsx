import React from "react";
import Meta from "@components/meta";

export const seo = {
	title: "Next.js Skeleton: ESLint, Husky, Prettier, Sass, TypeScript and much more!",
	description: "A simple and highly customizable skeleton build with Turborepo and Next.js. Featuring ESLint, Husky, Prettier, Sass, TypeScript and much more!",
	siteName: "Next.js Skeleton",
};

export default async function Head() {
	return (
		<>
			<title>{seo.title}</title>
			<meta name="viewport" content="width=device-width, initial-scale=1.0" />
			<Meta
				title={seo.title}
				keywords="zed.run data science"
				description={seo.description}
				type="website"
				siteName={seo.siteName}
				twitterCard="summary_large_image"
				author="Rodeo"
				href={`${process.env.NEXT_PUBLIC_ORIGIN}/`}
			/>
		</>
	);
}
