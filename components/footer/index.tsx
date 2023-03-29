import Github from "@public/icons/github.svg";
import Npm from "@public/icons/npm.svg";
import Vercel from "@public/icons/vercel.svg";
import Nextjs from "@public/icons/nextjs.svg";
import ExternalLink from "@components/link";
import styles from "./index.module.scss"

const links = {
	"GitHub": {
		"href": "https://github.com/buley/rodeo",
		"icon": <Github width={30} height={30}/>
	}
};

export default function Footer() {
	return (
		<footer className={styles.footer}>
			{Object.entries(links).map((value, index) => (
				<ExternalLink
					key={`footerIcon_${index}`}
					href={value[1].href}
					target="_blank"
					rel="noreferrer"
					title={value[0]}
					className={styles.footer__link}
				>
					{value[1].icon}
				</ExternalLink>
			))}
		</footer>
	);
}
