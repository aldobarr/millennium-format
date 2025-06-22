import stylistic from '@stylistic/eslint-plugin';
import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';

export default tseslint.config(
	eslint.configs.recommended,
	tseslint.configs.recommended,
	stylistic.configs.customize({
		indent: 'tab',
		semi: true,
		braceStyle: '1tbs'
	})
);