import { useState } from 'react'

const ImgFallback = ({ src, alt, fallback, style={} }) => {
	const [imgSrc, setImgSrc] = useState(src);

	return (
		<img
			src={imgSrc}
			alt={alt}
			onError={() => setImgSrc(fallback)} // Fallback image if the original fails
			style={style}
		/>
	);
};

export default ImgFallback