import { useSearchParams } from 'react-router-dom';
import { useContext, useEffect } from 'react';
import AuthContext from '../context/AuthContext';

const Connect42 = () => {
	const [searchParams] = useSearchParams();
	const { loginWith42 } = useContext(AuthContext);

	useEffect(() => {
		const code = searchParams.get('code');
		if (code) {
			loginWith42(code);
		}
	}, [searchParams, loginWith42]);

	return <div>Connecting to 42...</div>;
};

export default Connect42;